// middleware/upload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'uploads/', // Crée ce dossier s’il n’existe pas
  filename: (req, file, cb) => {
    const uniqueName = 'avatar-' + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

module.exports = upload;
