const { v4: uuidv4 } = require('uuid');
const db = require('../db');

function setupSocketHandlers(io) {
  // Track connected users
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`✅ ${user.username} connecté`);

    // Marquer online
    onlineUsers.set(user.id, { socketId: socket.id, username: user.username });
    db.users.update(user.id, { status: 'online' });

    // Broadcast liste des users online
    io.emit('users:online', Array.from(onlineUsers.entries()).map(([id, data]) => ({ id, ...data })));

    // Rejoindre un canal
    socket.on('channel:join', (channelId) => {
      socket.join(channelId);
      console.log(`${user.username} a rejoint #${channelId}`);
    });

    // Quitter un canal
    socket.on('channel:leave', (channelId) => {
      socket.leave(channelId);
    });

    // Envoyer un message texte
    socket.on('message:send', (data) => {
      const { channelId, content } = data;

      if (!content?.trim() || !channelId) return;

      const channel = db.channels.getById(channelId);
      if (!channel) return;

      const message = db.messages.create({
        id: uuidv4(),
        channelId,
        userId: user.id,
        content: content.trim(),
        type: 'text',
        createdAt: new Date().toISOString(),
        edited: false
      });

      const enriched = {
        ...message,
        user: { id: user.id, username: user.username, avatar: user.avatar }
      };

      // Broadcast dans le canal
      io.to(channelId).emit('message:new', enriched);
    });

    // Notification upload de fichier terminé
    socket.on('file:uploaded', (data) => {
      const { channelId, fileId } = data;

      const file = db.files.getById(fileId);
      if (!file) return;

      const message = db.messages.create({
        id: uuidv4(),
        channelId,
        userId: user.id,
        content: `a partagé un fichier: ${file.name}`,
        type: 'file',
        fileId: file.id,
        createdAt: new Date().toISOString()
      });

      const enriched = {
        ...message,
        user: { id: user.id, username: user.username, avatar: user.avatar },
        file
      };

      io.to(channelId).emit('message:new', enriched);
    });

    // Indicateur "en train d'écrire"
    socket.on('typing:start', (channelId) => {
      socket.to(channelId).emit('typing:update', {
        userId: user.id,
        username: user.username,
        typing: true
      });
    });

    socket.on('typing:stop', (channelId) => {
      socket.to(channelId).emit('typing:update', {
        userId: user.id,
        username: user.username,
        typing: false
      });
    });

    // Supprimer un message
    socket.on('message:delete', (messageId) => {
      db.messages.delete(messageId);
      io.emit('message:deleted', messageId);
    });

    // Réaction emoji
    socket.on('message:react', (data) => {
      io.to(data.channelId).emit('message:reaction', {
        messageId: data.messageId,
        emoji: data.emoji,
        userId: user.id,
        username: user.username
      });
    });

    // Déconnexion
    socket.on('disconnect', () => {
      console.log(`❌ ${user.username} déconnecté`);
      onlineUsers.delete(user.id);
      db.users.update(user.id, { status: 'offline', lastSeen: new Date().toISOString() });
      io.emit('users:online', Array.from(onlineUsers.entries()).map(([id, data]) => ({ id, ...data })));
    });
  });
}

module.exports = { setupSocketHandlers };
