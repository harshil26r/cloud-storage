# Google Drive Share Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, Google-Drive-like sharing system for both local database files/directories and Google Drive-integrated files/directories, featuring user search, access inheritance, custom permission roles, and a "Shared with me" panel.

**Architecture:** We will store permission fields directly on the File and Directory mongoose documents. We will implement helper logic to check permissions recursively up the directory tree and sync sharing actions to Google Drive's Permissions API if the resource is Google Drive-backed. The frontend will feature a Share modal and a special shared-view route.

**Tech Stack:** React, Express, Mongoose/MongoDB, Google APIs (`googleapis`), Tailwind CSS.

## Global Constraints
- Do not import external packages unless specified.
- Ensure proper error checking on all endpoints.
- Return explicit JSON errors when access is denied.

---

### Task 1: Update Mongoose Database Models

**Files:**
- Modify: `server-auth/models/fileModel.js`
- Modify: `server-auth/models/directoryModel.js`

**Interfaces:**
- Produces: `sharedWith`, `generalAccess`, `settings` fields on `File` and `Directory` mongoose models.

- [ ] **Step 1: Modify File Schema**
Add sharing details to `fileModel.js`. Let's read the file and insert the fields:
```javascript
sharedWith: [
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    email: { type: String },
    role: { type: String, enum: ['viewer', 'editor'], default: 'viewer' }
  }
],
generalAccess: {
  type: String,
  enum: ['restricted', 'anyone_view'],
  default: 'restricted'
},
settings: {
  allowEditorShare: { type: Boolean, default: true },
  allowDownload: { type: Boolean, default: true }
}
```

- [ ] **Step 2: Modify Directory Schema**
Add sharing details to `directoryModel.js`:
```javascript
sharedWith: [
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    email: { type: String },
    role: { type: String, enum: ['viewer', 'editor'], default: 'viewer' }
  }
],
generalAccess: {
  type: String,
  enum: ['restricted', 'anyone_view'],
  default: 'restricted'
},
settings: {
  allowEditorShare: { type: Boolean, default: true }
}
```

- [ ] **Step 3: Verify Schemas Compile**
Run: `node -e "import('./server-auth/models/fileModel.js').then(() => console.log('File Model Loaded OK'))"` and `node -e "import('./server-auth/models/directoryModel.js').then(() => console.log('Dir Model Loaded OK'))"`
Expected: Prints loaded messages with no syntax/schema error.

- [ ] **Step 4: Commit**
```bash
git add server-auth/models/fileModel.js server-auth/models/directoryModel.js
git commit -m "feat: add share and permission fields to File and Directory schemas"
```

---

### Task 2: Implement User Search Route & Controller

**Files:**
- Modify: `server-auth/controllers/userController.js`
- Modify: `server-auth/routes/user-routes.js`

**Interfaces:**
- Produces: `GET /user/search` endpoint (returns users matching email or username query).

- [ ] **Step 1: Add Search Controller**
Define `searchUsers` in `server-auth/controllers/userController.js`:
```javascript
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    const users = await User.find({
      _id: { $ne: req.user?._id },
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } }
      ]
    }).select('username email picture').limit(10).lean();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

- [ ] **Step 2: Add Route & Attach Middleware**
Expose route in `server-auth/routes/user-routes.js` (make sure it's protected by `isLogin` middleware, which we can import/apply). Wait, `user-routes.js` handles login/signup and other user details. Let's see if `isLogin` is used on specific routes or globally. Let's read `server-auth/routes/user-routes.js` first.
```javascript
import isLogin from '../middleware/isLogin.js';
// ...
router.get('/search', isLogin, searchUsers);
```

- [ ] **Step 3: Verify Route**
Start the server and test with curl:
`curl -i http://localhost:4000/user/search?query=test` (will return unauthorized/401 since no session cookie, but confirms route exists and auth middleware is invoked).

- [ ] **Step 4: Commit**
```bash
git add server-auth/controllers/userController.js server-auth/routes/user-routes.js
git commit -m "feat: implement user search API for share autocomplete"
```

---

### Task 3: Permission Check Middleware & Verification Logic

**Files:**
- Create: `server-auth/middleware/checkAccess.js`

**Interfaces:**
- Produces: `hasAccess(userId, itemId, itemType, requiredRole)` utility.
- Produces: `checkAccessMiddleware(requiredRole)` middleware.

- [ ] **Step 1: Create `checkAccess.js`**
Write recursive logic to check ownership, direct share, general access, or parent directory sharing.
```javascript
import { File } from '../models/fileModel.js';
import { Directory } from '../models/directoryModel.js';

export const hasAccess = async (userId, itemId, itemType, requiredRole = 'viewer') => {
  let item;
  if (itemType === 'file') {
    item = await File.findById(itemId).lean();
  } else {
    item = await Directory.findById(itemId).lean();
  }

  if (!item) return false;

  // 1. Owner access
  if (item.userId && item.userId.toString() === userId.toString()) {
    return true;
  }

  // 2. Direct Share access
  const directShare = item.sharedWith?.find(
    (share) => share.userId && share.userId.toString() === userId.toString()
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
      const isFileRoute = req.baseUrl.includes('file');
      const itemType = isFileRoute ? 'file' : 'directory';

      if (!itemId) {
        return res.status(400).json({ error: 'Item ID is required' });
      }

      const allowed = await hasAccess(req.user._id, itemId, itemType, requiredRole);
      if (!allowed) {
        return res.status(403).json({ error: 'You do not have permission to access this resource' });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
```

- [ ] **Step 2: Commit**
```bash
git add server-auth/middleware/checkAccess.js
git commit -m "feat: implement access check logic and middleware"
```

---

### Task 4: Share GET/POST Endpoints and Google Drive Permissions Sync

**Files:**
- Modify: `server-auth/controllers/directoryController.js`
- Modify: `server-auth/controllers/fileController.js`
- Modify: `server-auth/routes/directory-routes.js`
- Modify: `server-auth/routes/files-routes.js`
- Modify: `server-auth/services/googleDriveService.js`

**Interfaces:**
- Produces: `GET /directory/:id/share`, `POST /directory/:id/share`
- Produces: `GET /file/:id/share`, `POST /file/:id/share`
- Produces: Automatic Google Drive API permissions creation/deletion.

- [ ] **Step 1: Write Google Drive Permissions sync functions**
In `server-auth/services/googleDriveService.js`, add helper functions to retrieve and update google drive permissions list:
```javascript
export const syncGDrivePermissions = async (googleId, accessToken, refreshToken, userId, sharedWith, generalAccess) => {
  const drive = createDriveClient(accessToken, refreshToken);
  // Get existing permissions
  const res = await drive.permissions.list({
    fileId: googleId,
    fields: 'permissions(id, emailAddress, role, type)',
  });
  const existingPerms = res.data.permissions || [];

  // 1. Sync general access
  const anyonePerm = existingPerms.find(p => p.type === 'anyone');
  if (generalAccess === 'anyone_view') {
    if (!anyonePerm) {
      await drive.permissions.create({
        fileId: googleId,
        requestBody: { role: 'reader', type: 'anyone' },
      });
    }
  } else {
    if (anyonePerm) {
      await drive.permissions.delete({
        fileId: googleId,
        permissionId: anyonePerm.id,
      });
    }
  }

  // 2. Sync direct shares
  // Delete permissions not in the new sharedWith list
  for (const perm of existingPerms) {
    if (perm.type === 'user' && perm.emailAddress) {
      const match = sharedWith.find(s => s.email?.toLowerCase() === perm.emailAddress.toLowerCase());
      if (!match) {
        await drive.permissions.delete({ fileId: googleId, permissionId: perm.id });
      } else {
        const expectedGDriveRole = match.role === 'editor' ? 'writer' : 'reader';
        if (perm.role !== expectedGDriveRole) {
          // Update permission role
          await drive.permissions.update({
            fileId: googleId,
            permissionId: perm.id,
            requestBody: { role: expectedGDriveRole },
          });
        }
      }
    }
  }

  // Add new permissions
  for (const share of sharedWith) {
    if (share.email) {
      const exists = existingPerms.some(p => p.emailAddress?.toLowerCase() === share.email.toLowerCase());
      if (!exists) {
        await drive.permissions.create({
          fileId: googleId,
          requestBody: {
            role: share.role === 'editor' ? 'writer' : 'reader',
            type: 'user',
            emailAddress: share.email,
          },
        });
      }
    }
  }
};
```

- [ ] **Step 2: Add GET/POST controllers in `directoryController.js` & `fileController.js`**
Write functions `getShareSettings` and `updateShareSettings` for both directory and file.

For directory:
```javascript
export const getShareSettings = async (req, res) => {
  try {
    const dir = await Directory.findById(req.params.id).lean();
    if (!dir) return res.status(404).json({ error: 'Directory not found' });
    res.status(200).json({
      sharedWith: dir.sharedWith || [],
      generalAccess: dir.generalAccess || 'restricted',
      settings: dir.settings || { allowEditorShare: true },
      googleId: dir.googleId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateShareSettings = async (req, res) => {
  try {
    const { sharedWith, generalAccess, settings } = req.body;
    const dir = await Directory.findById(req.params.id);
    if (!dir) return res.status(404).json({ error: 'Directory not found' });

    dir.sharedWith = sharedWith;
    dir.generalAccess = generalAccess;
    if (settings) dir.settings = settings;
    await dir.save();

    if (dir.googleId && dir.googleId !== 'root') {
      const userData = await User.findById(req.user._id).lean();
      if (userData?.googleAccessToken) {
        await syncGDrivePermissions(
          dir.googleId,
          userData.googleAccessToken,
          userData.googleRefreshToken,
          req.user._id,
          sharedWith,
          generalAccess
        );
      }
    }

    res.status(200).json({ message: 'Share settings updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

Implement the exact same logic for files in `fileController.js`.

- [ ] **Step 3: Hook up GET/POST /share Routes**
Expose `/:id/share` endpoints on `dirRouter` and `fileRouter`, validating access (Owner/Editor can update).
```javascript
dirRouter.route('/:id/share')
  .get(getShareSettings)
  .post(updateShareSettings);
```

- [ ] **Step 4: Commit**
```bash
git add server-auth/services/googleDriveService.js server-auth/controllers/directoryController.js server-auth/controllers/fileController.js server-auth/routes/directory-routes.js server-auth/routes/files-routes.js
git commit -m "feat: implement share settings APIs and sync with Google Drive Permissions API"
```

---

### Task 5: Refactor Existing Directory & File Controllers to Enforce Access Rules

**Files:**
- Modify: `server-auth/controllers/directoryController.js`
- Modify: `server-auth/controllers/fileController.js`

**Interfaces:**
- Modifies: `getDirectory`, `renameDirectory`, `deleteDirectory`, `serveFile`, `renameFile`, `deleteFile` handlers.

- [ ] **Step 1: Update Directory handlers**
Change `userId: user?._id` lookup checks in `getDirectory` and `renameDirectory` to call `hasAccess(user._id, id, 'directory', 'viewer'/'editor')`.
Example update in `getDirectory`:
```javascript
const allowed = await hasAccess(user._id, _id, 'directory', 'viewer');
if (!allowed) {
  return res.status(403).json({ error: 'Access Denied' });
}
const directoryData = await Directory.findById(_id).lean();
```

- [ ] **Step 2: Update File handlers**
Change access checks in `serveFile`, `renameFile`, and `deleteFile` to call `hasAccess(user._id, id, 'file', 'viewer'/'editor')`.
Example update in `serveFile`:
```javascript
const allowed = await hasAccess(user._id, _id, 'file', 'viewer');
if (!allowed) {
  return res.status(403).json({ error: 'Access Denied' });
}
```

- [ ] **Step 3: Commit**
```bash
git add server-auth/controllers/directoryController.js server-auth/controllers/fileController.js
git commit -m "feat: enforce hierarchical and role-based sharing checks in file/directory routes"
```

---

### Task 6: Implement Shared-With-Me API Endpoint

**Files:**
- Modify: `server-auth/controllers/directoryController.js`
- Modify: `server-auth/routes/directory-routes.js`

**Interfaces:**
- Produces: `GET /directory/shared-with-me` returns `{ directories, files }`.

- [ ] **Step 1: Implement shared-with-me controller**
```javascript
export const getSharedWithMe = async (req, res) => {
  try {
    const userId = req.user._id;
    // Find directories shared with this user, where user is not the creator
    const directories = await Directory.find({
      'sharedWith.userId': userId,
      userId: { $ne: userId }
    }).lean();

    // Find files shared with this user, where user is not the creator
    const files = await File.find({
      'sharedWith.userId': userId,
      userId: { $ne: userId }
    }).lean();

    res.status(200).json({ directories, files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

- [ ] **Step 2: Expose route**
In `directory-routes.js`, add `dirRouter.get('/shared-with-me', getSharedWithMe)`. Make sure it's declared BEFORE `dirRouter.get('/{:id}', getDirectory)` so that the parameter matching doesn't treat `shared-with-me` as an `:id`. Let's read `server-auth/routes/directory-routes.js` to see the route structure.
```javascript
dirRouter.get('/shared-with-me', getSharedWithMe);
dirRouter.get('/{:id}', getDirectory);
```

- [ ] **Step 3: Commit**
```bash
git add server-auth/controllers/directoryController.js server-auth/routes/directory-routes.js
git commit -m "feat: implement GET /directory/shared-with-me endpoint"
```

---

### Task 7: Implement Frontend Autocomplete Search and Share Dialog UI

**Files:**
- Create: `client/src/components/action/ShareDialog.jsx`

**Interfaces:**
- Produces: `<ShareDialog isOpen={isOpen} item={item} isFile={isFile} onClose={onClose} />` React component.

- [ ] **Step 1: Write `ShareDialog.jsx`**
Create dialog modal containing:
* Autocomplete input requesting `/user/search?query=...` with debounce.
* List of existing permissions (Owner and items from `sharedWith` array).
* General access option selection (`Restricted` vs `Anyone with the link`).
* Copy link support with visual feedback (copied tooltip).
* Settings sub-toggle configuration (allow editors to share / viewers to download).
* Call `GET /file/:id/share` on open and `POST /file/:id/share` on save.

- [ ] **Step 2: Commit**
```bash
git add client/src/components/action/ShareDialog.jsx
git commit -m "feat: create Google Drive-like ShareDialog modal component"
```

---

### Task 8: Integrate Share Option in ActionMenu & Grid/List Item components

**Files:**
- Modify: `client/src/components/action/ActionMenu.jsx`
- Modify: `client/src/components/FileItem.jsx`
- Modify: `client/src/components/FolderItem.jsx`
- Modify: `client/src/directory-view.jsx`

- [ ] **Step 1: Add Share Option to ActionMenu**
Add a "Share" option with a user-plus icon. It should receive `onShare` callback.

- [ ] **Step 2: Pass down `onShare` to ActionMenu**
In `FileItem.jsx` and `FolderItem.jsx`, accept `onShare` in props and pass it to `<ActionMenu onShare={onShare} ... />`.

- [ ] **Step 3: Setup State and Handler in `directory-view.jsx`**
Add state `const [sharingItem, setSharingItem] = useState(null)` to control opening the `<ShareDialog>`. Pass `onShare={() => setSharingItem({ item, isFile })}` to all items.

- [ ] **Step 4: Commit**
```bash
git add client/src/components/action/ActionMenu.jsx client/src/components/FileItem.jsx client/src/components/FolderItem.jsx client/src/directory-view.jsx
git commit -m "feat: integrate Share option in ActionMenu and handle ShareDialog in directory view"
```

---

### Task 9: Implement Frontend Shared View & Sidebar Integration

**Files:**
- Modify: `client/src/App.jsx`
- Modify: `client/src/components/Sidebar.jsx`
- Modify: `client/src/directory-view.jsx` (add Shared Me mode)
- Create: `client/src/store/sharedSlice.js` (or add API functions to directorySlice)

- [ ] **Step 1: Add fetchSharedItems action**
Add a function in `client/src/store/directorySlice.js` or create a new Redux slice to retrieve shared-with-me files/directories:
```javascript
export const fetchSharedWithMe = createAsyncThunk(
  'directory/fetchSharedWithMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/directory/shared-with-me');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch shared items');
    }
  }
);
```

- [ ] **Step 2: Add routing in App.jsx**
Create route `/shared` targeting `DirectoryView` with `isSharedMode={true}` prop:
```javascript
  {
    path: "/shared",
    element: <DirectoryView isSharedMode={true} />,
  }
```

- [ ] **Step 3: Integrate fetch and view logic in `directory-view.jsx`**
When `isSharedMode` is true, fetch `fetchSharedWithMe` instead of `fetchDirectories`, change breadcrumb layout to show "Shared with me", and display results.

- [ ] **Step 4: Update Sidebar component**
Modify `client/src/components/Sidebar.jsx` so clicking "Shared" navigates to `/shared` and shows the active color properly.

- [ ] **Step 5: Commit**
```bash
git add client/src/App.jsx client/src/components/Sidebar.jsx client/src/directory-view.jsx client/src/store/directorySlice.js
git commit -m "feat: integrate Shared View page and Sidebar navigation"
```
