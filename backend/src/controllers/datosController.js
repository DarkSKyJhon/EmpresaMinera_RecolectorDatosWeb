const pool = require('../config/database');

// Obtener todos los datos de peso
const obtenerDatos = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, timestamp, Peso FROM Datos ORDER BY timestamp DESC LIMIT 50'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo datos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener último dato
const obtenerUltimoDato = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, timestamp, Peso FROM Datos ORDER BY timestamp DESC LIMIT 1'
    );
    res.json(rows[0] || {});
  } catch (error) {
    console.error('Error obteniendo último dato:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Insertar nuevo dato (para futuras funcionalidades)
const insertarDato = async (req, res) => {
  try {
    const { peso } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO Datos (Peso) VALUES (?)',
      [peso]
    );
    res.json({ id: result.insertId, mensaje: 'Dato insertado correctamente' });
  } catch (error) {
    console.error('Error insertando dato:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  obtenerDatos,
  obtenerUltimoDato,
  insertarDato
};