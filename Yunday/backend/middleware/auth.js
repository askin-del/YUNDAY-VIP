const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'yunday-vip-secret-change-in-prod';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.users.getById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'Utilisateur introuvable' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Token manquant'));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.users.getById(decoded.userId);
    if (!user) return next(new Error('Utilisateur introuvable'));
    socket.user = user;
    next();
  } catch {
    next(new Error('Token invalide'));
  }
}

module.exports = { authenticate, authenticateSocket, JWT_SECRET };
