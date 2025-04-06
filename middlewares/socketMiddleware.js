const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

const socketAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) return next(new Error('Token no proporcionado'));
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = {
      id: decoded.sub,
      role: decoded.rol
    };
    next();
  } catch (err) {
    return next(new Error('Token inválido'));
  }
};

module.exports = { socketAuthMiddleware };