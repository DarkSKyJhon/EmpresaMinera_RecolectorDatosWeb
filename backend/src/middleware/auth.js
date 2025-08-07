const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const { registro, login, logout, perfil, listarUsuarios } = require('../controllers/authController');
const { usuarioAutenticado, soloAdmin } = require('../middleware/auth');

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Demasiados intentos de login. Intenta en 15 minutos.',
});

// Validaciones
const validacionRegistro = [
  body('username').isLength({ min: 3, max: 50 }),
  body('password').isLength({ min: 8 }),
  body('nombre_completo').isLength({ min: 2, max: 100 })
];

const validacionLogin = [
  body('username').notEmpty(),
  body('password').notEmpty()
];

// Rutas básicas
router.post('/registro', validacionRegistro, registro);
router.post('/login', loginLimiter, validacionLogin, login);
router.post('/logout', usuarioAutenticado, logout);
router.get('/perfil', usuarioAutenticado, perfil);
router.get('/usuarios', usuarioAutenticado, soloAdmin, listarUsuarios);

module.exports = router;