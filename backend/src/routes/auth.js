const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const { registro, login, logout, perfil, listarUsuarios } = require('../controllers/authController');
const { usuarioAutenticado, soloAdmin } = require('../middleware/auth');

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos por IP
  message: 'Demasiados intentos de login. Intenta en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validaciones
const validacionRegistro = [
  body('username').isLength({ min: 3, max: 50 }).withMessage('Username debe tener entre 3 y 50 caracteres'),
  body('password').isLength({ min: 8 }).withMessage('Password debe tener mínimo 8 caracteres'),
  body('nombre_completo').isLength({ min: 2, max: 100 }).withMessage('Nombre completo requerido')
];

const validacionLogin = [
  body('username').notEmpty().withMessage('Username requerido'),
  body('password').notEmpty().withMessage('Password requerido')
];

// Rutas públicas
router.post('/registro', validacionRegistro, registro);
router.post('/login', loginLimiter, validacionLogin, login);

// Rutas protegidas
router.post('/logout', usuarioAutenticado, logout);
router.get('/perfil', usuarioAutenticado, perfil);
router.get('/usuarios', usuarioAutenticado, soloAdmin, listarUsuarios);

module.exports = router;