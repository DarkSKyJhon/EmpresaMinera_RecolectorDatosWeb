import { useState } from 'react'; // AGREGAR ESTA LÍNEA
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Dashboard from './components/Dashboard';
import RecogidaDatos from './components/pages/RecogidaDatos'; // AGREGAR ESTA LÍNEA
import './App.css';

const AppContent = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard'); // AGREGAR ESTA LÍNEA

  // AGREGAR ESTA FUNCIÓN:
  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="login-page" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0
      }}>
        <Login />
      </div>
    );
  }

  // CAMBIAR ESTA LÍNEA:
  // return <Dashboard user={user} />;
  
  // POR ESTAS LÍNEAS:
  return (
    <>
      {currentPage === 'dashboard' && <Dashboard user={user} onNavigate={handleNavigation} />}
      {currentPage === 'recogida-datos' && <RecogidaDatos onNavigate={handleNavigation} />}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;