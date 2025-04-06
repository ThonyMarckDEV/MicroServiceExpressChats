const { verifyChatAccess, createMessage, getMessageById } = require('../services/messageService');

const sendMessage = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.id;
    const { contenido } = req.body;
    
    if (!contenido) {
      return res.status(400).json({ message: 'El contenido del mensaje es requerido' });
    }
    
    const hasAccess = await verifyChatAccess(chatId, userId);
    if (!hasAccess) {
      return res.status(404).json({ message: 'Chat no encontrado o no autorizado' });
    }
    
    const messageId = await createMessage(chatId, userId, contenido);
    const message = await getMessageById(messageId);
    
    // El WebSocket se manejará en el servicio de sockets
    req.io.to(`chat_${chatId}`).emit('new_message', message);
    
    res.status(201).json(message);
    
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ message: 'Error al enviar mensaje' });
  }
};

module.exports = { sendMessage };