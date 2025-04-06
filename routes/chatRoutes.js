const express = require('express');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { getChat } = require('../controllers/chatController');
const { sendMessage } = require('../controllers/messageController');

const router = express.Router();

router.get('/:id', authenticateToken, getChat);
router.post('/:id/messages', authenticateToken, sendMessage);

module.exports = router;