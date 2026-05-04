const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// Dossiers d'upload
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const CHUNKS_DIR = path.join(__dirname, '..', 'uploads', 'chunks');

[UPLOAD_DIR, CHUNKS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Config multer pour chunks
const chunkStorage = multer.diskStorage({
  destination: CHUNKS_DIR,
  filename: (req, file, cb) => {
    const { uploadId, chunkIndex } = req.body;
    cb(null, `${uploadId}-${chunkIndex}`);
  }
});

const upload = multer({
  storage: chunkStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB par chunk
});

// Upload d'un chunk
router.post('/chunk', authenticate, upload.single('chunk'), async (req, res) => {
  try {
    const { uploadId, chunkIndex, totalChunks, fileName, fileSize, channelId, mimeType } = req.body;

    if (!uploadId || chunkIndex === undefined || !totalChunks) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    // Si c'est le dernier chunk, assembler le fichier
    if (parseInt(chunkIndex) === parseInt(totalChunks) - 1) {
      const ext = path.extname(fileName);
      const finalFileName = `${uuidv4()}${ext}`;
      const finalPath = path.join(UPLOAD_DIR, finalFileName);
      const writeStream = fs.createWriteStream(finalPath);

      // Assembler tous les chunks dans l'ordre
      for (let i = 0; i < parseInt(totalChunks); i++) {
        const chunkPath = path.join(CHUNKS_DIR, `${uploadId}-${i}`);
        const chunkData = fs.readFileSync(chunkPath);
        writeStream.write(chunkData);
        fs.unlinkSync(chunkPath); // Nettoyer le chunk
      }

      writeStream.end();

      await new Promise((resolve) => writeStream.on('finish', resolve));

      // Enregistrer en DB
      const fileRecord = db.files.create({
        id: uuidv4(),
        name: fileName,
        fileName: finalFileName,
        size: parseInt(fileSize),
        mimeType: mimeType || 'application/octet-stream',
        channelId,
        uploadedBy: req.user.id,
        url: `/uploads/${finalFileName}`,
        createdAt: new Date().toISOString()
      });

      return res.json({ 
        complete: true, 
        file: fileRecord 
      });
    }

    res.json({ complete: false, chunk: parseInt(chunkIndex) + 1 });
  } catch (err) {
    console.error('Chunk upload error:', err);
    res.status(500).json({ error: 'Erreur upload' });
  }
});

// Upload simple (fichiers < 10MB)
const simpleStorage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const simpleUpload = multer({
  storage: simpleStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/simple', authenticate, simpleUpload.single('file'), (req, res) => {
  try {
    const { channelId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'Fichier manquant' });

    const fileRecord = db.files.create({
      id: uuidv4(),
      name: file.originalname,
      fileName: file.filename,
      size: file.size,
      mimeType: file.mimetype,
      channelId,
      uploadedBy: req.user.id,
      url: `/uploads/${file.filename}`,
      createdAt: new Date().toISOString()
    });

    res.json({ file: fileRecord });
  } catch (err) {
    res.status(500).json({ error: 'Erreur upload' });
  }
});

// Liste des fichiers d'un canal
router.get('/channel/:channelId', authenticate, (req, res) => {
  const files = db.files.getByChannel(req.params.channelId).map(f => {
    const user = db.users.getById(f.uploadedBy);
    return { ...f, uploader: user ? { username: user.username } : null };
  });
  res.json(files);
});

// Téléchargement
router.get('/download/:id', authenticate, (req, res) => {
  const file = db.files.getById(req.params.id);
  if (!file) return res.status(404).json({ error: 'Fichier introuvable' });

  const filePath = path.join(UPLOAD_DIR, file.fileName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Fichier manquant sur le disque' });

  res.download(filePath, file.name);
});

module.exports = router;
