const express = require('express');
const router = express.Router();
const { obtenerDatos, obtenerUltimoDato, insertarDato } = require('../controllers/datosController');

// Rutas simples sin parámetros complejos
router.get('/', obtenerDatos);
router.get('/ultimo', obtenerUltimoDato);
router.post('/', insertarDato);

module.exports = router;