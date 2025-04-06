const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'constructoraesmeraldadb'
};

let pool;

const initializeDbPool = async () => {
  try {
    pool = mysql.createPool(dbConfig);
    console.log('Conexión a la base de datos establecida');
    return pool;
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1);
  }
};

const getPool = () => pool;

module.exports = { initializeDbPool, getPool };