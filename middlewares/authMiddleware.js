const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Token no proporcionado' });
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    
    req.user = {
      id: decoded.sub,
      role: decoded.rol
    };
    
    next();
  });
};

module.exports = { authenticateToken };