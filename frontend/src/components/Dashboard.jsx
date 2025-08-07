import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { datosService } from '../services/api';
import Chart from 'chart.js/auto';

const Dashboard = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [datos, setDatos] = useState([]);
  const [ultimoDato, setUltimoDato] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Referencias para los gráficos
  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const chartsRef = useRef({});

  // Cargar datos al iniciar
  useEffect(() => {
    cargarDatos();
    cargarUltimoDato();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      cargarDatos();
      cargarUltimoDato();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Inicializar gráficos después de que se carguen los datos
  useEffect(() => {
    if (!loading && datos.length > 0) {
      initializeCharts();
    }
  }, [loading, datos]);

  const cargarDatos = async () => {
    try {
      const data = await datosService.obtenerTodos();
      setDatos(data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarUltimoDato = async () => {
    try {
      const ultimo = await datosService.obtenerUltimo();
      setUltimoDato(ultimo);
    } catch (error) {
      console.error('Error cargando último dato:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = () => {
    if (window.confirm('¿Está seguro que desea cerrar sesión?')) {
      logout();
    }
  };

  const handleNavigation = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
    
    if (window.innerWidth <= 768) {
      setSidebarCollapsed(true);
    }
  };

  const initializeCharts = () => {
    // Configuración por defecto para todos los gráficos
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = '#334155';

    // Destruir gráficos existentes
    Object.values(chartsRef.current).forEach(chart => {
      if (chart) chart.destroy();
    });

    // Preparar datos para gráficos basados en datos reales
    const ultimosSieteDatos = datos.slice(-7);
    const pesosPorDia = ultimosSieteDatos.map(d => d.Peso);
    const fechasPorDia = ultimosSieteDatos.map(d => 
      new Date(d.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
    );

    // Gráfico de Barras - Producción Semanal
    if (barChartRef.current) {
      const barCtx = barChartRef.current.getContext('2d');
      chartsRef.current.barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: fechasPorDia.length > 0 ? fechasPorDia : ['Sin datos'],
          datasets: [{
            label: 'Peso (kg)',
            data: pesosPorDia.length > 0 ? pesosPorDia : [0],
            backgroundColor: 'rgba(14, 165, 233, 0.8)',
            borderColor: '#0ea5e9',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(51, 65, 85, 0.5)' },
              ticks: {
                callback: function(value) {
                  return value.toLocaleString() + ' kg';
                }
              }
            },
            x: {
              grid: { color: 'rgba(51, 65, 85, 0.5)' }
            }
          }
        }
      });
    }

    // Gráfico de Líneas - Tendencia
    if (lineChartRef.current) {
      const lineCtx = lineChartRef.current.getContext('2d');
      chartsRef.current.lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: fechasPorDia.length > 0 ? fechasPorDia : ['Sin datos'],
          datasets: [{
            label: 'Tendencia de Peso',
            data: pesosPorDia.length > 0 ? pesosPorDia : [0],
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#0ea5e9',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(51, 65, 85, 0.5)' },
              ticks: {
                callback: function(value) {
                  return value.toLocaleString() + ' kg';
                }
              }
            },
            x: {
              grid: { color: 'rgba(51, 65, 85, 0.5)' }
            }
          }
        }
      });
    }

    // Gráfico de Dona - Distribución
    if (pieChartRef.current) {
      const pieCtx = pieChartRef.current.getContext('2d');
      const totalPeso = pesosPorDia.reduce((a, b) => a + b, 0);
      
      chartsRef.current.pieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
          labels: ['Peso Total', 'Capacidad Restante'],
          datasets: [{
            data: [totalPeso, Math.max(0, 10000 - totalPeso)],
            backgroundColor: ['#0ea5e9', '#334155'],
            borderColor: '#1e293b',
            borderWidth: 3,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: { size: 12 }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed;
                  return `${label}: ${value.toLocaleString()} kg`;
                }
              }
            }
          },
          cutout: '60%'
        }
      });
    }
  };

  // Limpiar gráficos al desmontar componente
  useEffect(() => {
    return () => {
      Object.values(chartsRef.current).forEach(chart => {
        if (chart) chart.destroy();
      });
    };
  }, []);

  const getUserInitials = () => {
    if (user?.nombre_completo) {
      return user.nombre_completo.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user?.username?.substring(0, 2).toUpperCase() || 'U';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow-x: hidden !important;
          background: #0f172a !important;
        }
          
        @keyframes backgroundMove {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-30px) translateY(-20px); }
        }
        
        .dashboard-container {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
          color: #f1f5f9;
          overflow-x: hidden;
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          margin: 0;
          padding: 0;
        }
        
        .animated-bg {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(14, 165, 233, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(245, 158, 11, 0.08) 0%, transparent 50%);
          animation: backgroundMove 25s ease-in-out infinite;
          z-index: -1;
        }
        
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          height: 100vh;
          width: 280px;
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(20px);
          border-right: 1px solid #334155;
          z-index: 1000;
          transition: transform 0.3s ease;
          overflow-y: auto;
        }
        
        .sidebar.collapsed {
          transform: translateX(-280px);
        }
        
        .sidebar:hover {
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .main-content {
          margin-left: 280px;
          min-height: 100vh;
          transition: margin-left 0.3s ease;
        }
        
        .main-content.expanded {
          margin-left: 0;
        }
        
        .header {
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #334155;
          padding: 1rem 2rem;
          position: sticky;
          top: 0;
          z-index: 999;
        }
        
        .nav-link {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          color: #94a3b8;
          text-decoration: none;
          transition: all 0.3s ease;
          border-left: 3px solid transparent;
        }
        
        .nav-link:hover,
        .nav-link.active {
          color: #0ea5e9 !important;
          background: rgba(14, 165, 233, 0.1) !important;
          border-left-color: #0ea5e9 !important;
        }
        
        .stat-card {
          background: rgba(51, 65, 85, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid #334155;
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(14, 165, 233, 0.2);
        }
        
        .chart-card {
          background: rgba(51, 65, 85, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid #334155;
          border-radius: 16px;
          padding: 1.5rem;
        }
        
        .custom-table tr:hover {
          background: rgba(14, 165, 233, 0.05) !important;
        }
        
        .user-info:hover {
          background: rgba(51, 65, 85, 0.8) !important;
        }
        
        .menu-toggle:hover {
          background: rgba(51, 65, 85, 0.6) !important;
        }
        
        .notification-btn:hover {
          color: #0ea5e9 !important;
          background: rgba(51, 65, 85, 0.6) !important;
        }
        
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-280px) !important;
          }
          
          .main-content {
            margin-left: 0 !important;
          }
          
          .charts-grid {
            grid-template-columns: 1fr !important;
          }
          
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          
          .header {
            padding: 1rem !important;
          }
        }
      `}</style>

      <div className="dashboard-container">
        {/* Fondo animado */}
        <div className="animated-bg" />

        {/* Sidebar */}
        <nav className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #334155',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: 'white',
              fontWeight: '700',
              fontSize: '1.2rem'
            }}>
              EMH
            </div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#f1f5f9',
              lineHeight: '1.2'
            }}>
              EMPRESA MINERA<br/>HUANUNI
            </div>
          </div>
          
          <div style={{ padding: '1rem 0' }}>
            {[
              { icon: 'bi-speedometer2', text: 'Dashboard', page: 'dashboard' },
              { icon: 'bi-clipboard-data', text: 'Recogida de Datos', page: 'recogida-datos' },
              { icon: 'bi-people', text: 'Usuarios', page: 'usuarios' },
              { icon: 'bi-clock-history', text: 'Historial Entradas', page: 'historial-entradas' },
              { icon: 'bi-download', text: 'Historial Descargas', page: 'historial-descargas' },
              { icon: 'bi-printer', text: 'Historial Impresiones', page: 'historial-impresiones' },
              { icon: 'bi-graph-up', text: 'Reportes', page: 'reportes' },
              { icon: 'bi-gear', text: 'Configuración', page: 'configuracion' }
            ].map((item, index) => (
              <div key={index} style={{ marginBottom: '0.5rem' }}>
                <div 
                    onClick={() => handleNavigation(item.page)}
                    className={`nav-link ${item.page === 'dashboard' ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                  <i className={`bi ${item.icon}`} style={{
                    marginRight: '0.75rem',
                    fontSize: '1.1rem',
                    width: '20px'
                  }}></i>
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <div className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
          {/* Header */}
          <header className="header">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={toggleSidebar}
                  className="menu-toggle"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#f1f5f9',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    transition: 'background 0.3s ease'
                  }}
                >
                  <i className="bi bi-list"></i>
                </button>
                <h1 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#f1f5f9',
                  margin: 0
                }}>
                  Dashboard Principal
                </h1>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="notification-btn" style={{
                  position: 'relative',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.2rem',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}>
                  <i className="bi bi-bell"></i>
                  <span style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>3</span>
                </button>
                
                <div onClick={handleLogout} className="user-info" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(51, 65, 85, 0.6)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    {getUserInitials()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                      {user?.nombre_completo || user?.username || 'Usuario'}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                      {user?.rol || 'Usuario'}
                    </div>
                  </div>
                  <i className="bi bi-chevron-down" style={{ color: '#94a3b8' }}></i>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main style={{ padding: '2rem' }}>
            {/* Stats Cards */}
            <div className="stats-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {[
                {
                  icon: 'bi-minecart-loaded',
                  value: ultimoDato.Peso || '0',
                  label: 'Peso Actual (kg)',
                  change: '+12.5% vs anterior',
                  color: '#0ea5e9',
                  positive: true
                },
                {
                  icon: 'bi-people',
                  value: datos.length,
                  label: 'Registros Cargados',
                  change: `+${datos.length} registros`,
                  color: '#10b981',
                  positive: true
                },
                {
                  icon: 'bi-clock-history',
                  value: ultimoDato.timestamp ? formatDate(ultimoDato.timestamp) : 'Sin datos',
                  label: 'Última Actualización',
                  change: 'Tiempo real',
                  color: '#f59e0b',
                  positive: true,
                  isTime: true
                },
                {
                  icon: 'bi-database',
                  value: datos.reduce((sum, d) => sum + (d.Peso || 0), 0).toFixed(2),
                  label: 'Peso Total Acumulado (kg)',
                  change: 'Histórico completo',
                  color: '#8b5cf6',
                  positive: true
                }
              ].map((stat, index) => (
                <div key={index} className="stat-card">
                  <div style={{
                    content: '',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${stat.color}, ${stat.color})`
                  }} />
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      background: `rgba(${stat.color === '#0ea5e9' ? '14, 165, 233' : stat.color === '#10b981' ? '16, 185, 129' : stat.color === '#f59e0b' ? '245, 158, 11' : '139, 92, 246'}, 0.2)`,
                      color: stat.color
                    }}>
                      <i className={`bi ${stat.icon}`}></i>
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: stat.isTime ? '1rem' : '2rem',
                    fontWeight: '700',
                    color: '#f1f5f9',
                    marginBottom: '0.5rem'
                  }}>
                    {stat.isTime ? stat.value : typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </div>
                  
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '0.9rem',
                    marginBottom: '0.75rem'
                  }}>
                    {stat.label}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: stat.positive ? '#10b981' : '#ef4444'
                  }}>
                    <i className={`bi bi-arrow-${stat.positive ? 'up' : 'down'}`}></i>
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="charts-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              <div className="chart-card">
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#f1f5f9',
                    margin: 0
                  }}>
                    Últimos Registros de Peso (kg)
                  </h3>
                </div>
                <div style={{ height: '300px', position: 'relative' }}>
                  <canvas ref={barChartRef}></canvas>
                </div>
              </div>

              <div className="chart-card">
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#f1f5f9',
                    margin: 0
                  }}>
                    Tendencia de Peso
                  </h3>
                </div>
                <div style={{ height: '300px', position: 'relative' }}>
                  <canvas ref={lineChartRef}></canvas>
                </div>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="chart-card" style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#f1f5f9',
                  margin: 0
                }}>
                  Distribución de Capacidad
                </h3>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  Datos actuales
                </span>
              </div>
              <div style={{ height: '350px', position: 'relative' }}>
                <canvas ref={pieChartRef}></canvas>
              </div>
            </div>

            {/* Recent Data Table */}
            <div className="chart-card">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#f1f5f9',
                  margin: 0
                }}>
                  Últimos Registros de Datos
                </h3>
                <button className="btn btn-outline-primary btn-sm">
                  Ver Todos
                </button>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr>
                      <th style={{
                        background: 'rgba(14, 165, 233, 0.1)',
                        color: '#0ea5e9',
                        fontWeight: '600',
                        padding: '1rem',
                        textAlign: 'left',
                        borderBottom: '1px solid #334155'
                      }}>
                        ID
                      </th>
                      <th style={{
                        background: 'rgba(14, 165, 233, 0.1)',
                        color: '#0ea5e9',
                        fontWeight: '600',
                        padding: '1rem',
                        textAlign: 'left',
                        borderBottom: '1px solid #334155'
                      }}>
                        Fecha/Hora
                      </th>
                      <th style={{
                        background: 'rgba(14, 165, 233, 0.1)',
                        color: '#0ea5e9',
                        fontWeight: '600',
                        padding: '1rem',
                        textAlign: 'left',
                        borderBottom: '1px solid #334155'
                      }}>
                        Peso (kg)
                      </th>
                      <th style={{
                        background: 'rgba(14, 165, 233, 0.1)',
                        color: '#0ea5e9',
                        fontWeight: '600',
                        padding: '1rem',
                        textAlign: 'left',
                        borderBottom: '1px solid #334155'
                      }}>
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.slice(-10).reverse().map((dato) => (
                      <tr key={dato.id} style={{
                        transition: 'background 0.3s ease'
                      }}>
                        <td style={{
                          padding: '1rem',
                          borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
                          color: '#f1f5f9'
                        }}>
                          {dato.id}
                        </td>
                        <td style={{
                          padding: '1rem',
                          borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
                          color: '#f1f5f9'
                        }}>
                          {formatDate(dato.timestamp)}
                        </td>
                        <td style={{
                          padding: '1rem',
                          borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
                          color: '#f1f5f9',
                          fontWeight: '600'
                        }}>
                          {dato.Peso}
                        </td>
                        <td style={{
                          padding: '1rem',
                          borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
                          color: '#f1f5f9'
                        }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#10b981'
                          }}>
                            Activo
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Dashboard;