import { File } from '../models/fileModel.js';
import { Directory } from '../models/directoryModel.js';

export const hasAccess = async (
  userId,
  itemId,
  itemType,
  requiredRole = 'viewer',
) => {
  let item;
  if (itemId && typeof itemId === 'object' && itemId._id) {
    item = itemId;
  } else if (itemType === 'file') {
    item = await File.findById(itemId).lean();
  } else {
    item = await Directory.findById(itemId).lean();
  }

  if (!item) return false;

  // 1. Owner access
  if (userId && item.userId && item.userId.toString() === userId.toString()) {
    return true;
  }

  // 2. Direct Share access
  const directShare = item.sharedWith?.find(
    (share) =>
      userId && share.userId && share.userId.toString() === userId.toString(),
  );
  if (directShare) {
    if (requiredRole === 'editor' && directShare.role !== 'editor') {
      // Direct share is only viewer, but editor is required. Keep checking parent.
    } else {
      return true;
    }
  }

  // 3. General access
  if (item.generalAccess === 'anyone_view' && requiredRole === 'viewer') {
    return true;
  }

  // 4. Inherited access (traverse recursively up the directory tree)
  if (item.parentDirId) {
    return await hasAccess(userId, item.parentDirId, 'directory', requiredRole);
  }

  return false;
};

export const checkAccessMiddleware = (requiredRole = 'viewer') => {
  return async (req, res, next) => {
    try {
      const itemId = req.params.id;
      const isFileRoute = req.baseUrl?.includes('file');
      const itemType = isFileRoute ? 'file' : 'directory';

      if (!itemId) {
        return res.status(400).json({ error: 'Item ID is required' });
      }

      const allowed = req.user?._id
        ? await hasAccess(req.user._id, itemId, itemType, requiredRole)
        : false;
      if (!allowed) {
        return res
          .status(403)
          .json({
            error: 'You do not have permission to access this resource',
          });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
