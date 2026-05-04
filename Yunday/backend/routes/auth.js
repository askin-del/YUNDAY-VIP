const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

// Inscription (via code d'invitation)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, inviteCode } = req.body;

    if (!username || !email || !password || !inviteCode) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Vérifier le code d'invitation
    const invite = db.invites.getByCode(inviteCode);
    if (!invite) {
      return res.status(400).json({ error: 'Code d\'invitation invalide ou déjà utilisé' });
    }

    // Vérifier si email/username déjà pris
    if (db.users.getByEmail(email)) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }
    if (db.users.getByUsername(username)) {
      return res.status(400).json({ error: 'Nom d\'utilisateur déjà pris' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = db.users.create({
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      avatar: null,
      role: 'member',
      status: 'online',
      createdAt: new Date().toISOString()
    });

    db.invites.markUsed(inviteCode);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userSafe } = user;

    res.status(201).json({ token, user: userSafe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const user = db.users.getByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    db.users.update(user.id, { status: 'online', lastSeen: new Date().toISOString() });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userSafe } = user;

    res.json({ token, user: userSafe });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Profil actuel
router.get('/me', authenticate, (req, res) => {
  const { password, ...userSafe } = req.user;
  res.json(userSafe);
});

// Générer un code d'invitation (admin uniquement)
router.post('/invite', authenticate, (req, res) => {
  // Premier user = admin auto
  const allUsers = db.users.getAll();
  const isAdmin = req.user.role === 'admin' || allUsers[0]?.id === req.user.id;

  if (!isAdmin) {
    return res.status(403).json({ error: 'Réservé aux administrateurs' });
  }

  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  const invite = db.invites.create({
    id: uuidv4(),
    code,
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    used: false
  });

  res.json({ code: invite.code });
});

// Liste des membres
router.get('/members', authenticate, (req, res) => {
  const users = db.users.getAll().map(({ password, ...u }) => u);
  res.json(users);
});

// Setup initial (premier utilisateur = admin, sans invitation)
router.post('/setup', async (req, res) => {
  const existing = db.users.getAll();
  if (existing.length > 0) {
    return res.status(400).json({ error: 'Setup déjà effectué' });
  }

  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = db.users.create({
    id: uuidv4(),
    username,
    email,
    password: hashedPassword,
    avatar: null,
    role: 'admin',
    status: 'online',
    createdAt: new Date().toISOString()
  });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...userSafe } = user;

  res.status(201).json({ token, user: userSafe });
});

module.exports = router;
