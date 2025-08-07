const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  port: 3307,  // Puerto de tu contenedor Docker
  user: 'admin',
  password: 'E.M.H.2025BdD',
  database: 'empresa_minera'
};

// Pool de conexiones para mejor rendimiento
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;