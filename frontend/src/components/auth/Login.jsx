import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../assets/styles/login.css';

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Cargar usuario recordado al iniciar
  useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      setFormData(prev => ({
        ...prev,
        username: rememberedUser,
        rememberMe: true
      }));
    }
  }, []);

  // Manejar cambios en inputs
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error al escribir
    if (error) setError('');
  };

  // Toggle mostrar/ocultar contraseña
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Función de autenticación (conecta con tu API)
  const authenticateUser = async (username, password) => {
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error de autenticación');
      }

      const data = await response.json();
      return data.usuario;
    } catch (error) {
      console.error('Error en autenticación:', error);
      throw error;
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;

    const { username, password, rememberMe } = formData;

    // Validaciones
    if (!username.trim() || !password) {
      setError('Por favor complete todos los campos');
      return;
    }

    if (username.length < 3) {
      setError('El usuario debe tener al menos 3 caracteres');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const user = await authenticateUser(username, password);

      // Guardar datos de sesión
      if (rememberMe) {
        localStorage.setItem('rememberedUser', username);
      } else {
        localStorage.removeItem('rememberedUser');
      }

      // Guardar token y datos de usuario
      sessionStorage.setItem('userToken', 'jwt-token-' + Date.now());
      sessionStorage.setItem('userName', username);
      sessionStorage.setItem('userRole', user.rol);
      sessionStorage.setItem('userFullName', user.nombre_completo);
      sessionStorage.setItem('userId', user.id);

      // Llamar login del context
      login(user);

    } catch (error) {
      setError(error.message || 'Error de conexión. Verifique su conexión a internet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid login-container">
      <div className="login-card">
        {/* Loading overlay */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        )}

        {/* Logo Section */}
        <div className="logo-section">
          <div className="logo-container">
            <img 
              src="/src/assets/images/logo.png" 
              alt="Logo Empresa Minera Huanuni" 
              style={{maxWidth: '80px', maxHeight: '80px', objectFit: 'contain'}}
              onError={(e) => {
                // Si no encuentra la imagen, mostrar placeholder
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="logo-placeholder" style={{display: 'none'}}>
              EMH
            </div>
          </div>
          <h1 className="company-title">EMPRESA MINERA HUANUNI</h1>
          <p className="company-subtitle">Sistema de Gestión Integral</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-custom" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Username Field */}
          <div className="form-floating">
            <input 
              type="text" 
              className="form-control" 
              id="username" 
              name="username"
              placeholder="" 
              value={formData.username}
              onChange={handleInputChange}
              required
              autoComplete="username"
            />
            <label htmlFor="username">
              <i className="bi bi-person-fill me-2"></i>Usuario
            </label>
          </div>

          {/* Password Field */}
          <div className="form-floating position-relative">
            <input 
              type={showPassword ? "text" : "password"}
              className="form-control" 
              id="password" 
              name="password"
              placeholder=""
              value={formData.password}
              onChange={handleInputChange}
              required
              autoComplete="current-password"
            />
            <label htmlFor="password">
              <i className="bi bi-lock-fill me-2"></i>Contraseña
            </label>
            <button 
              type="button" 
              className="password-toggle"
              onClick={togglePasswordVisibility}
            >
              <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
            </button>
          </div>

          {/* Form Options */}
          <div className="form-options">
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="rememberMe" 
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
              />
              <label className="form-check-label" htmlFor="rememberMe">
                Recordarme
              </label>
            </div>
            <a href="#" className="forgot-link">¿Olvidó su contraseña?</a>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-login" 
            disabled={isLoading}
          >
            <i className={`bi ${isLoading ? 'bi-hourglass-split' : 'bi-box-arrow-in-right'} me-2`}></i>
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* System Info */}
        <div className="system-info">
          <h6>Sistema de Monitoreo Minero</h6>
          <p>
            <strong>Versión 2.0</strong> | Acceso autorizado únicamente<br/>
            Soporte técnico: <strong>soporte@huanuni.com</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;