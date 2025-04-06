const {
    getChatWithParticipants,
    getChatMessages,
    markMessagesAsRead
  } = require('../services/chatService');
  
  const getChat = async (req, res) => {
    try {
      const chatId = req.params.id;
      const userId = req.user.id;
      
      const chat = await getChatWithParticipants(chatId, userId);
      if (!chat) {
        return res.status(404).json({ message: 'Chat no encontrado o no autorizado' });
      }
      
      const messages = await getChatMessages(chatId);
      await markMessagesAsRead(chatId, userId);
      
      res.json({
        chat: {
          idChat: chat.idChat,
          idCliente: chat.idCliente,
          idEncargado: chat.idEncargado,
          idProyecto: chat.idProyecto,
          created_at: chat.created_at,
          updated_at: chat.updated_at
        },
        cliente: {
          idUsuario: chat.idCliente,
          nombre: chat.cliente_nombre,
          apellido: chat.cliente_apellido,
          rol: chat.cliente_rol
        },
        encargado: {
          idUsuario: chat.idEncargado,
          nombre: chat.encargado_nombre,
          apellido: chat.encargado_apellido,
          rol: chat.encargado_rol
        },
        proyecto: {
          idProyecto: chat.idProyecto,
          nombre: chat.proyecto_nombre
        },
        messages
      });
      
    } catch (error) {
      console.error('Error al obtener chat:', error);
      res.status(500).json({ message: 'Error al obtener chat' });
    }
  };
  
  module.exports = { getChat };