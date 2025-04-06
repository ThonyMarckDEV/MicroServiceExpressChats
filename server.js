const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initializeDbPool } = require('./config/database');
const { socketAuthMiddleware } = require('./middlewares/socketMiddleware');
const { joinChatRoom } = require('./services/socketService');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middlewares
app.use(cors());
app.use(express.json());

// Inicializar pool de conexiones
initializeDbPool();

// Middleware de sockets
io.use(socketAuthMiddleware);

// Rutas HTTP
app.use('/api/chats', chatRoutes);

// Asignar io a app para uso en controladores
app.set('io', io);

// Conexiones WebSocket
io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.user.id} (${socket.user.role})`);
  
  socket.on('join_chat', async (chatId) => {
    try {
      await joinChatRoom(socket, chatId);
    } catch (error) {
      console.error('Error al unirse al chat:', error);
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`Usuario desconectado: ${socket.user.id}`);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});