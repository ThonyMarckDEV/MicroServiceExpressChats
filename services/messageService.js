const { getPool } = require('../config/database');

const createMessage = async (chatId, userId, contenido) => {
  const pool = getPool();
  const [result] = await pool.query(`
    INSERT INTO mensajes (idChat, idUsuario, contenido, leido, created_at, updated_at)
    VALUES (?, ?, ?, 0, NOW(), NOW())
  `, [chatId, userId, contenido]);
  
  return result.insertId;
};

const getMessageById = async (messageId) => {
  const pool = getPool();
  const [message] = await pool.query(`
    SELECT m.*, u.nombre as nombreUsuario, u.rol as rolUsuario 
    FROM mensajes m
    JOIN usuarios u ON m.idUsuario = u.idUsuario
    WHERE m.idMensaje = ?
  `, [messageId]);
  
  return message[0];
};

const verifyChatAccess = async (chatId, userId) => {
  const pool = getPool();
  const [chat] = await pool.query(`
    SELECT c.* FROM chats c
    WHERE c.idChat = ? AND (c.idCliente = ? OR c.idEncargado = ?)
  `, [chatId, userId, userId]);
  
  return chat.length > 0;
};

/**
 * Marca los mensajes no leídos de un chat como leídos
 */
const markMessagesAsRead = async (chatId, userId) => {
  const [result] = await pool.query(`
    UPDATE mensajes SET leido = 1 
    WHERE idChat = ? AND idUsuario != ? AND leido = 0
  `, [chatId, userId]);
  
  return result;
};

module.exports = {
  createMessage,
  getMessageById,
  verifyChatAccess,
  markMessagesAsRead
};