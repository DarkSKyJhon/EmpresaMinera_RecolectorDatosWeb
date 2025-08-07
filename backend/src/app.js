const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Importar rutas de datos (sin protección)
const datosRoutes = require('./routes/datos');
const pool = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { 
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middlewares básicos
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Empresa Minera - Simple',
    version: '1.0.0',
    endpoints: [
      'POST /api/login - Login simple',
      'GET /api/datos - Obtener datos',
      'GET /api/datos/ultimo - Último dato'
    ]
  });
});

// LOGIN SIMPLE
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password requeridos' });
    }

    // Buscar usuario en la base de datos
    const [usuarios] = await pool.execute(
      'SELECT id, username, password_hash, rol, nombre_completo, activo FROM usuarios WHERE username = ?',
      [username]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const usuario = usuarios[0];

    // Verificar si está activo
    if (!usuario.activo) {
      return res.status(401).json({ error: 'Usuario desactivado' });
    }

    // Verificar password
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Password incorrecto' });
    }

    // Login exitoso - devolver info del usuario
    res.json({
      mensaje: 'Login exitoso',
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
});

// Rutas de datos (sin protección por ahora)
app.use('/api/datos', datosRoutes);

// Socket.io básico
io.on('connection', (socket) => {
  console.log('🔗 Cliente conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor simple corriendo en http://localhost:${PORT}`);
  console.log(`👤 Login disponible en POST http://localhost:${PORT}/api/login`);
  console.log(`📊 Datos disponibles en http://localhost:${PORT}/api/datos`);
});

// GET para probar desde navegador
app.get('/api/login', (req, res) => {
  res.json({
    mensaje: 'Endpoint de login funcionando',
    metodo: 'Usar POST con username y password',
    ejemplo: {
      url: 'POST /api/login',
      body: {
        username: 'admin',
        password: 'Admin123!'
      }
    }
  });
});