const { getPool } = require('../config/database');

const joinChatRoom = async (socket, chatId) => {
  const pool = getPool();
  const [chat] = await pool.query(`
    SELECT c.* FROM chats c
    WHERE c.idChat = ? AND (c.idCliente = ? OR c.idEncargado = ?)
  `, [chatId, socket.user.id, socket.user.id]);
  
  if (chat.length) {
    socket.join(`chat_${chatId}`);
    console.log(`Usuario ${socket.user.id} se unió al chat ${chatId}`);
    
    socket.to(`chat_${chatId}`).emit('user_joined', {
      userId: socket.user.id,
      chatId
    });
    
    return true;
  }
  return false;
};

module.exports = { joinChatRoom };