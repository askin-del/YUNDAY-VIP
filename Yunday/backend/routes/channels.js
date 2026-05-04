const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// Liste des canaux
router.get('/', authenticate, (req, res) => {
  res.json(db.channels.getAll());
});

// Créer un canal
router.post('/', authenticate, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom requis' });

  const channel = db.channels.create({
    id: uuidv4(),
    name: name.toLowerCase().replace(/\s+/g, '-'),
    description: description || '',
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  });

  res.status(201).json(channel);
});

// Supprimer un canal
router.delete('/:id', authenticate, (req, res) => {
  const channel = db.channels.getById(req.params.id);
  if (!channel) return res.status(404).json({ error: 'Canal introuvable' });

  // Seul le créateur ou admin peut supprimer
  const allUsers = db.users.getAll();
  const isAdmin = req.user.role === 'admin' || allUsers[0]?.id === req.user.id;
  if (!isAdmin && channel.createdBy !== req.user.id) {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  db.channels.delete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
