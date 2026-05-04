// Simple JSON-based database (remplacer par PostgreSQL/MongoDB en prod)
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data');

// Assure que le dossier data existe
if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH, { recursive: true });

const files = {
  users: path.join(DB_PATH, 'users.json'),
  channels: path.join(DB_PATH, 'channels.json'),
  messages: path.join(DB_PATH, 'messages.json'),
  files: path.join(DB_PATH, 'files.json'),
  invites: path.join(DB_PATH, 'invites.json'),
};

// Init files vides si n'existent pas
const defaults = {
  users: [],
  channels: [
    { id: 'general', name: 'général', description: 'Canal principal', createdAt: new Date().toISOString() },
    { id: 'files', name: 'fichiers', description: 'Partage de fichiers', createdAt: new Date().toISOString() },
    { id: 'random', name: 'random', description: 'Discussions diverses', createdAt: new Date().toISOString() },
  ],
  messages: [],
  files: [],
  invites: [],
};

Object.entries(files).forEach(([key, filePath]) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaults[key], null, 2));
  }
});

function read(table) {
  try {
    return JSON.parse(fs.readFileSync(files[table], 'utf8'));
  } catch {
    return defaults[table] || [];
  }
}

function write(table, data) {
  fs.writeFileSync(files[table], JSON.stringify(data, null, 2));
}

module.exports = {
  users: {
    getAll: () => read('users'),
    getById: (id) => read('users').find(u => u.id === id),
    getByEmail: (email) => read('users').find(u => u.email === email),
    getByUsername: (username) => read('users').find(u => u.username === username),
    create: (user) => {
      const users = read('users');
      users.push(user);
      write('users', users);
      return user;
    },
    update: (id, data) => {
      const users = read('users');
      const idx = users.findIndex(u => u.id === id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...data };
        write('users', users);
        return users[idx];
      }
      return null;
    }
  },
  channels: {
    getAll: () => read('channels'),
    getById: (id) => read('channels').find(c => c.id === id),
    create: (channel) => {
      const channels = read('channels');
      channels.push(channel);
      write('channels', channels);
      return channel;
    },
    delete: (id) => {
      const channels = read('channels').filter(c => c.id !== id);
      write('channels', channels);
    }
  },
  messages: {
    getByChannel: (channelId, limit = 50) => {
      const msgs = read('messages').filter(m => m.channelId === channelId);
      return msgs.slice(-limit);
    },
    create: (message) => {
      const messages = read('messages');
      messages.push(message);
      write('messages', messages);
      return message;
    },
    delete: (id) => {
      const messages = read('messages').filter(m => m.id !== id);
      write('messages', messages);
    }
  },
  files: {
    getAll: () => read('files'),
    getByChannel: (channelId) => read('files').filter(f => f.channelId === channelId),
    getById: (id) => read('files').find(f => f.id === id),
    create: (file) => {
      const files = read('files');
      files.push(file);
      write('files', files);
      return file;
    }
  },
  invites: {
    getAll: () => read('invites'),
    getByCode: (code) => read('invites').find(i => i.code === code && !i.used),
    create: (invite) => {
      const invites = read('invites');
      invites.push(invite);
      write('invites', invites);
      return invite;
    },
    markUsed: (code) => {
      const invites = read('invites');
      const idx = invites.findIndex(i => i.code === code);
      if (idx !== -1) {
        invites[idx].used = true;
        invites[idx].usedAt = new Date().toISOString();
        write('invites', invites);
      }
    }
  }
};
