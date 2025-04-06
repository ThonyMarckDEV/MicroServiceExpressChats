const express = require('express');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { getChat } = require('../controllers/chatController');
const { sendMessage , markMessagesAsReadController } = require('../controllers/messageController');

const router = express.Router();

router.get('/:id', authenticateToken, getChat);
router.post('/:id/messages', authenticateToken, sendMessage);
router.post('/:id/mark-as-read', authenticateToken, markMessagesAsReadController);

// 💡 ESTA LÍNEA ES CLAVE:
module.exports = router;
