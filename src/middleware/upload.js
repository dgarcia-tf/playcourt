const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadsRoot = path.join(__dirname, '..', '..', 'public', 'uploads');

function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    cb(new Error('Solo se permiten archivos de imagen'));
    return;
  }
  cb(null, true);
};

function createPosterUpload(subdirectory) {
  const destination = path.join(uploadsRoot, subdirectory);
  ensureDirectoryExists(destination);

  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, destination);
    },
    filename(req, file, cb) {
      const extension = path.extname(file.originalname || '') || '.png';
      const baseName = path.basename(file.originalname || 'poster', extension).replace(/\s+/g, '-');
      const safeBase = baseName.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const timestamp = Date.now();
      cb(null, `${safeBase || 'poster'}-${timestamp}${extension}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter,
  });
}

const tournamentPosterUpload = createPosterUpload('tournaments');
const leaguePosterUpload = createPosterUpload('leagues');

module.exports = {
  tournamentPosterUpload,
  leaguePosterUpload,
};
