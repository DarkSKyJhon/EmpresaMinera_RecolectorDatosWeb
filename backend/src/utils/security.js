const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// Hash de password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Comparar password
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Generar JWT token
const generarToken = (userId, username, rol) => {
  return jwt.sign(
    { 
      userId, 
      username, 
      rol,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: '8h' } // Token expira en 8 horas
  );
};

// Validar fortaleza de password
const validarPassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Mínimo ${minLength} caracteres`);
  }
  if (!hasUpperCase) {
    errors.push('Al menos una mayúscula');
  }
  if (!hasLowerCase) {
    errors.push('Al menos una minúscula');
  }
  if (!hasNumbers) {
    errors.push('Al menos un número');
  }
  if (!hasSpecialChar) {
    errors.push('Al menos un carácter especial');
  }

  return {
    esValido: errors.length === 0,
    errores: errors
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  generarToken,
  validarPassword
};