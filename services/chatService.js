const { getPool } = require('../config/database');

const getChatWithParticipants = async (chatId, userId) => {
  const pool = getPool();
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
  
  return chat[0];
};

const getChatMessages = async (chatId) => {
  const pool = getPool();
  const [messages] = await pool.query(`
    SELECT m.*, u.nombre as nombreUsuario, u.rol as rolUsuario 
    FROM mensajes m
    JOIN usuarios u ON m.idUsuario = u.idUsuario
    WHERE m.idChat = ?
    ORDER BY m.created_at ASC
  `, [chatId]);
  
  return messages;
};

const markMessagesAsRead = async (chatId, userId) => {
  const pool = getPool();
  await pool.query(`
    UPDATE mensajes SET leido = 1 
    WHERE idChat = ? AND idUsuario != ? AND leido = 0
  `, [chatId, userId]);
};

module.exports = {
  getChatWithParticipants,
  getChatMessages,
  markMessagesAsRead
};