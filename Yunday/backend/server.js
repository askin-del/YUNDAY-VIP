require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const channelRoutes = require('./routes/channels');
const fileRoutes = require('./routes/files');
const messageRoutes = require('./routes/messages');
const { authenticateSocket } = require('./middleware/auth');
const { setupSocketHandlers } = require('./socket/handlers');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  maxHttpBufferSize: 1e8 // 100MB pour les chunks de fichiers
});

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use('/api/', limiter);

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io auth middleware
io.use(authenticateSocket);

// Setup socket handlers
setupSocketHandlers(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 TeamSpace server running on port ${PORT}`);
});

module.exports = { app, io };
