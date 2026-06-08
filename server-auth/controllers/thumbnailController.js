import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { File } from '../models/fileModel.js';
import { Directory } from '../models/directoryModel.js';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

const execFileAsync = promisify(execFile);

const STORAGE_DIR = path.join(process.cwd(), 'storage');
const THUMBNAIL_DIR = path.join(STORAGE_DIR, 'thumbnails');
const SIZE = 256;

await fs.mkdir(THUMBNAIL_DIR, { recursive: true });

const VIDEO_EXTS = new Set([
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.webm',
  '.wmv',
  '.flv',
]);

export const getThumbnail = async (req, res) => {
  try {
    const { user } = req;
    const _id = req.params.id;

    if (!_id) return res.status(400).json({ error: 'File ID is required' });

    const fileInfo = await File.findOne({ _id }).lean();
    if (!fileInfo) return res.status(404).json({ error: 'File not found' });

    const parentDir = await Directory.findOne({ _id: fileInfo.parentDirId });
    if (parentDir?.userId.toString() !== user._id.toString()) {
      return res.status(401).json({ error: 'No permission' });
    }

    if (fileInfo.googleId && fileInfo.syncState !== 'offline') {
      return res.status(404).json({ error: 'No local copy' });
    }

    const cachePath = path.join(THUMBNAIL_DIR, `${_id}.webp`);
    try {
      await fs.access(cachePath);
      return res.sendFile(cachePath);
    } catch {}

    const filePath = path.join(
      STORAGE_DIR,
      `${_id}${fileInfo.extension || ''}`,
    );
    const mimeType = fileInfo.mimeType || '';
    const ext = (fileInfo.extension || '').toLowerCase();

    let thumbnailBuffer;

    if (
      mimeType.startsWith('image/') ||
      ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)
    ) {
      thumbnailBuffer = await sharp(filePath)
        .resize(SIZE, SIZE, { fit: 'cover', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } else if (mimeType === 'application/pdf' || ext === '.pdf') {
      thumbnailBuffer = await generatePdfThumbnail(filePath);
    } else if (mimeType.startsWith('video/') || VIDEO_EXTS.has(ext)) {
      thumbnailBuffer = await generateVideoThumbnail(filePath, _id);
    } else {
      return res.status(404).json({ error: 'No thumbnail available' });
    }

    await fs.writeFile(cachePath, thumbnailBuffer);

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(thumbnailBuffer);
  } catch (err) {
    console.error('Thumbnail error:', err);
    res.status(500).json({ error: 'Failed to generate thumbnail' });
  }
};

async function generatePdfThumbnail(filePath) {
  const tmpPrefix = path.join(os.tmpdir(), `thumb-pdf-${Date.now()}`);
  await execFileAsync('pdftoppm', [
    '-png',
    '-f',
    '1',
    '-l',
    '1',
    '-scale-to',
    String(SIZE),
    filePath,
    tmpPrefix,
  ]);
  const tmpPath = `${tmpPrefix}-1.png`;
  const buffer = await sharp(tmpPath)
    .resize(SIZE, SIZE, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();
  await fs.unlink(tmpPath).catch(() => {});
  return buffer;
}

async function generateVideoThumbnail(filePath, id) {
  const tmpDir = os.tmpdir();
  const outputName = `thumb-${id}.png`;

  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .screenshots({
        count: 1,
        timemarks: ['1'],
        filename: outputName,
        folder: tmpDir,
        size: `${SIZE}x${SIZE}`,
      })
      .on('end', async () => {
        const tmpPath = path.join(tmpDir, outputName);
        try {
          const buffer = await sharp(tmpPath)
            .resize(SIZE, SIZE, { fit: 'cover' })
            .webp({ quality: 80 })
            .toBuffer();
          await fs.unlink(tmpPath).catch(() => {});
          resolve(buffer);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', reject);
  });
}
