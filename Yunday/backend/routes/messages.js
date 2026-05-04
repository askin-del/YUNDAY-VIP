const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// Messages d'un canal
router.get('/:channelId', authenticate, (req, res) => {
  const channel = db.channels.getById(req.params.channelId);
  if (!channel) return res.status(404).json({ error: 'Canal introuvable' });

  const messages = db.messages.getByChannel(req.params.channelId, 100);

  // Enrichir avec les infos user
  const enriched = messages.map(m => {
    const user = db.users.getById(m.userId);
    return {
      ...m,
      user: user ? { id: user.id, username: user.username, avatar: user.avatar } : null
    };
  });

  res.json(enriched);
});

// Supprimer un message
router.delete('/:id', authenticate, (req, res) => {
  const messages = db.messages.getByChannel('');
  // Simple: on supprime par ID
  const allMessages = require('../db').messages;
  db.messages.delete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
