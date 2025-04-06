const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'nOmqvtdTm2IraPAKSHTpuLoBmNE30P0GTc7VTmgqtJldLUtbOOKIB1tJconVJ0nr';

module.exports = { JWT_SECRET };