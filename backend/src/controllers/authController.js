const pool = require('../config/database');
const { hashPassword, comparePassword, generarToken, validarPassword } = require('../utils/security');
const { validationResult } = require('express-validator');

// Registro de usuario
const registro = async (req, res) => {
  try {
    // Validar errores de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, nombre_completo, rol = 'viewer' } = req.body;

    // Validar fortaleza de password
    const passwordValidation = validarPassword(password);
    if (!passwordValidation.esValido) {
      return res.status(400).json({ 
        error: 'Password no cumple los requisitos',
        requisitos: passwordValidation.errores
      });
    }

    // Verificar si el usuario ya existe
    const [usuarioExistente] = await pool.execute(
      'SELECT id FROM usuarios WHERE username = ?',
      [username]
    );

    if (usuarioExistente.length > 0) {
      return res.status(400).json({ error: 'Usuario ya existe' });
    }

    // Hash del password
    const passwordHash = await hashPassword(password);

    // Insertar usuario
    const [result] = await pool.execute(
      'INSERT INTO usuarios (username, password_hash, nombre_completo, rol) VALUES (?, ?, ?, ?, ?)',
      [username, passwordHash, nombre_completo, rol]
    );

    // Log de registro
    await pool.execute(
      'INSERT INTO logs_acceso (usuario_id, accion, ip_address, detalles) VALUES (?, ?, ?, ?)',
      [result.insertId, 'REGISTRO', req.ip, JSON.stringify({ username, rol })]
    );

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      usuario: {
        id: result.insertId,
        username,
        nombre_completo,
        rol
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Login de usuario
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Buscar usuario
    const [usuarios] = await pool.execute(
      'SELECT id, username, password_hash, rol, nombre_completo, activo FROM usuarios WHERE username = ?',
      [username, username]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = usuarios[0];

    // Verificar si está activo
    if (!usuario.activo) {
      return res.status(401).json({ error: 'Usuario desactivado' });
    }

    // Verificar password
    const passwordValido = await comparePassword(password, usuario.password_hash);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = generarToken(usuario.id, usuario.username, usuario.rol);

    // Actualizar último acceso
    await pool.execute(
      'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?',
      [usuario.id]
    );

    // Log de login
    await pool.execute(
      'INSERT INTO logs_acceso (usuario_id, accion, ip_address, detalles) VALUES (?, ?, ?, ?)',
      [usuario.id, 'LOGIN', req.ip, JSON.stringify({ username: usuario.username })]
    );

    // Configurar cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000 // 8 horas
    });

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        nombre_completo: usuario.nombre_completo,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    // Log de logout
    if (req.usuario) {
      await pool.execute(
        'INSERT INTO logs_acceso (usuario_id, accion, ip_address) VALUES (?, ?, ?)',
        [req.usuario.id, 'LOGOUT', req.ip]
      );
    }

    res.clearCookie('token');
    res.json({ mensaje: 'Logout exitoso' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener perfil del usuario actual
const perfil = async (req, res) => {
  try {
    res.json({
      usuario: {
        id: req.usuario.id,
        username: req.usuario.username,
        nombre_completo: req.usuario.nombre_completo,
        rol: req.usuario.rol
      }
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Listar usuarios (solo admin)
const listarUsuarios = async (req, res) => {
  try {
    const [usuarios] = await pool.execute(
      'SELECT id, username, nombre_completo, rol, activo, ultimo_acceso, fecha_creacion FROM usuarios ORDER BY fecha_creacion DESC'
    );

    res.json(usuarios);
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  registro,
  login,
  logout,
  perfil,
  listarUsuarios
};