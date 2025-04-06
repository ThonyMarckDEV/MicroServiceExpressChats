const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'constructoraesmeraldadb'
};

let pool;

async function initializeDbPool() {
  try {
    pool = mysql.createPool(dbConfig);
    console.log('Conexión a la base de datos establecida');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1);
  }
}

// Secreto para JWT
const JWT_SECRET = 'nOmqvtdTm2IraPAKSHTpuLoBmNE30P0GTc7VTmgqtJldLUtbOOKIB1tJconVJ0nr';

// Crear instancia de Express
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

// Middleware para verificar token JWT (HTTP)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Token no proporcionado' });
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    
    req.user = {
      id: decoded.sub,   // Usar sub como ID
      role: decoded.rol  // Usar rol del token
    };
    
    next();
  });
};




// Middleware para WebSockets
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) return next(new Error('Token no proporcionado'));
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = {
      id: decoded.sub,   // ID desde sub
      role: decoded.rol  // Rol desde rol
    };
    next();
  } catch (err) {
    return next(new Error('Token inválido'));
  }
});

// Inicializar pool de conexiones
initializeDbPool();


// Rutas HTTP para el chat
app.get('/api/chats/:id', authenticateToken, async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.id;
    
    // Verificar que el usuario tiene acceso a este chat y obtener información de participantes
    const [chat] = await pool.query(`
      SELECT c.*, 
        cli.nombre as cliente_nombre, cli.apellido as cliente_apellido, cli.rol as cliente_rol,
        enc.nombre as encargado_nombre, enc.apellido as encargado_apellido, enc.rol as encargado_rol,
        p.nombre as proyecto_nombre
      FROM chats c
      JOIN usuarios cli ON c.idCliente = cli.idUsuario
      JOIN usuarios enc ON c.idEncargado = enc.idUsuario
      JOIN proyectos p ON c.idProyecto = p.idProyecto
      WHERE c.idChat = ? AND (c.idCliente = ? OR c.idEncargado = ?)
    `, [chatId, userId, userId]);
    
    if (!chat.length) {
      return res.status(404).json({ message: 'Chat no encontrado o no autorizado' });
    }
    
    // Obtener mensajes del chat
    const [messages] = await pool.query(`
      SELECT m.*, u.nombre as nombreUsuario, u.rol as rolUsuario 
      FROM mensajes m
      JOIN usuarios u ON m.idUsuario = u.idUsuario
      WHERE m.idChat = ?
      ORDER BY m.created_at ASC
    `, [chatId]);
    
    // Marcar mensajes como leídos si es el receptor
    await pool.query(`
      UPDATE mensajes SET leido = 1 
      WHERE idChat = ? AND idUsuario != ? AND leido = 0
    `, [chatId, userId]);
    
    res.json({
      chat: {
        idChat: chat[0].idChat,
        idCliente: chat[0].idCliente,
        idEncargado: chat[0].idEncargado,
        idProyecto: chat[0].idProyecto,
        created_at: chat[0].created_at,
        updated_at: chat[0].updated_at
      },
      cliente: {
        idUsuario: chat[0].idCliente,
        nombre: chat[0].cliente_nombre,
        apellido: chat[0].cliente_apellido,
        rol: chat[0].cliente_rol
      },
      encargado: {
        idUsuario: chat[0].idEncargado,
        nombre: chat[0].encargado_nombre,
        apellido: chat[0].encargado_apellido,
        rol: chat[0].encargado_rol
      },
      proyecto: {
        idProyecto: chat[0].idProyecto,
        nombre: chat[0].proyecto_nombre
      },
      messages
    });
    
  } catch (error) {
    console.error('Error al obtener chat:', error);
    res.status(500).json({ message: 'Error al obtener chat' });
  }
});

app.post('/api/chats/:id/mark-as-read', authenticateToken, async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.id;
    
    // Verificar que el usuario tiene acceso a este chat
    const [chat] = await pool.query(`
      SELECT c.* FROM chats c
      WHERE c.idChat = ? AND (c.idCliente = ? OR c.idEncargado = ?)
    `, [chatId, userId, userId]);
    
    if (!chat.length) {
      return res.status(404).json({ message: 'Chat no encontrado o no autorizado' });
    }
    
    // Marcar como leídos solo los mensajes dirigidos al usuario actual
    // (es decir, los mensajes que el usuario NO envió)
    const [result] = await pool.query(`
      UPDATE mensajes SET leido = 1 
      WHERE idChat = ? AND idUsuario != ? AND leido = 0
    `, [chatId, userId]);
    
    res.status(200).json({ 
      message: 'Mensajes marcados como leídos',
      updatedCount: result.affectedRows
    });
    
  } catch (error) {
    console.error('Error al marcar mensajes como leídos:', error);
    res.status(500).json({ message: 'Error al marcar mensajes como leídos' });
  }
});

app.post('/api/chats/:id/messages', authenticateToken, async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.id;
    const { contenido } = req.body;
    
    if (!contenido) {
      return res.status(400).json({ message: 'El contenido del mensaje es requerido' });
    }
    
    // Verificar que el usuario tiene acceso a este chat
    const [chat] = await pool.query(`
      SELECT c.* FROM chats c
      WHERE c.idChat = ? AND (c.idCliente = ? OR c.idEncargado = ?)
    `, [chatId, userId, userId]);
    
    if (!chat.length) {
      return res.status(404).json({ message: 'Chat no encontrado o no autorizado' });
    }
    
    // Insertar mensaje
    const [result] = await pool.query(`
      INSERT INTO mensajes (idChat, idUsuario, contenido, leido, created_at, updated_at)
      VALUES (?, ?, ?, 0, NOW() , NOW())
    `, [chatId, userId, contenido]);
    
    // Obtener el mensaje recién creado con info del usuario
    const [message] = await pool.query(`
      SELECT m.*, u.nombre as nombreUsuario, u.rol as rolUsuario 
      FROM mensajes m
      JOIN usuarios u ON m.idUsuario = u.idUsuario
      WHERE m.idMensaje = ?
    `, [result.insertId]);
    
    // Emitir el mensaje a través de WebSocket
    io.to(`chat_${chatId}`).emit('new_message', message[0]);
    
    res.status(201).json(message[0]);
    
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ message: 'Error al enviar mensaje' });
  }
});

// WebSocket connections
const activeUsers = {};

io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.user.id} (${socket.user.role})`);
  
  // Unirse a las salas de chat relevantes
  socket.on('join_chat', async (chatId) => {
    try {
      // Verificar que el usuario tiene acceso a este chat
      const [chat] = await pool.query(`
        SELECT c.* FROM chats c
        WHERE c.idChat = ? AND (c.idCliente = ? OR c.idEncargado = ?)
      `, [chatId, socket.user.id, socket.user.id]);
      
      if (chat.length) {
        socket.join(`chat_${chatId}`);
        console.log(`Usuario ${socket.user.id} se unió al chat ${chatId}`);
        
        // Notificar a otros usuarios en el chat
        socket.to(`chat_${chatId}`).emit('user_joined', {
          userId: socket.user.id,
          chatId
        });
      }
    } catch (error) {
      console.error('Error al unirse al chat:', error);
    }
  });
  
  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log(`Usuario desconectado: ${socket.user.id}`);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
}); 