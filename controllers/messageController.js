const { verifyChatAccess, createMessage, getMessageById, markMessagesAsReadService } = require('../services/messageService');

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
    
    // Verificar que req.io existe antes de usarlo
    if (req.io) {
      req.io.to(`chat_${chatId}`).emit('new_message', message);
    }
    
    res.status(201).json(message);
    
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ message: 'Error al enviar mensaje' });
  }
};

/**
 * Marca los mensajes de un chat como leídos
 */
const markMessagesAsReadController = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.id;
    
    // Verificar acceso al chat
    const hasAccess = await verifyChatAccess(chatId, userId);
    if (!hasAccess) {
      return res.status(404).json({ message: 'Chat no encontrado o no autorizado' });
    }
    
    // Marcar mensajes como leídos
    const result = await markMessagesAsReadService(chatId, userId);
    
    // Emitir evento WebSocket
    // Verificar que req.io existe antes de usarlo
    if (req.io) {
      req.io.to(`chat_${chatId}`).emit('messages_read', {
        chatId,
        userId,
        count: result.affectedRows
      });
    }
    
    res.json({ 
      success: true, 
      count: result.affectedRows 
    });
    
  } catch (error) {
    console.error('Error al marcar mensajes como leídos:', error);
    res.status(500).json({ 
      message: 'Error al marcar mensajes como leídos' 
    });
  }
};

module.exports = {
  markMessagesAsReadController,
  sendMessage
};