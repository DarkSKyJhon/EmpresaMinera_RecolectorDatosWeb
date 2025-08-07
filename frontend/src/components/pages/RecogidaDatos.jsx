import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { datosService } from '../../services/api';
import Chart from 'chart.js/auto';

const RecogidaDatos = ({ onNavigate }) => {
  const { user } = useAuth();
  const [datos, setDatos] = useState([]);
  const [ultimoDato, setUltimoDato] = useState({});
  const [loading, setLoading] = useState(true);
  const [isRealTime, setIsRealTime] = useState(true);
  
  // Referencias para los gráficos
  const gaugeChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const areaChartRef = useRef(null);
  const chartsRef = useRef({});

  // Cargar datos al iniciar
  useEffect(() => {
    cargarDatos();
    cargarUltimoDato();
    
    // Actualizar cada 5 segundos para tiempo real
    const interval = setInterval(() => {
      if (isRealTime) {
        cargarDatos();
        cargarUltimoDato();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isRealTime]);

  // Inicializar gráficos después de cargar datos
  useEffect(() => {
    if (!loading && datos.length > 0) {
      initializeCharts();
    }
  }, [loading, datos, ultimoDato]);

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

  const initializeCharts = () => {
    // Configuración global
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = '#334155';

    // Destruir gráficos existentes
    Object.values(chartsRef.current).forEach(chart => {
      if (chart) chart.destroy();
    });

    // Preparar datos - SIN LÍMITE, todos los datos
    const ultimosDatos = datos; // Cambiar de datos.slice(-20) a datos completos
    const pesos = ultimosDatos.map(d => d.Peso);
    const fechas = ultimosDatos.map(d => 
      new Date(d.timestamp).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      })
    );

    // 1. GAUGE CHART - Indicador de Peso Actual
    if (gaugeChartRef.current) {
      const gaugeCtx = gaugeChartRef.current.getContext('2d');
      const pesoActual = ultimoDato.Peso || 0;
      const maxPeso = 1000; // Peso máximo
      const porcentaje = (pesoActual / maxPeso) * 100;

      chartsRef.current.gaugeChart = new Chart(gaugeCtx, {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [pesoActual, maxPeso - pesoActual],
            backgroundColor: [
              pesoActual > 800 ? '#ef4444' : pesoActual > 600 ? '#f59e0b' : '#10b981',
              '#334155'
            ],
            borderWidth: 0,
            cutout: '75%'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          },
          animation: {
            animateRotate: true,
            duration: 1000
          }
        },
        plugins: [{
          id: 'gaugeText',
          beforeDraw: (chart) => {
            const { width, height, ctx } = chart;
            ctx.restore();
            
            const fontSize = (height / 114).toFixed(2);
            ctx.font = `bold ${fontSize}em Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Valor principal
            ctx.fillStyle = '#f1f5f9';
            ctx.font = `bold ${fontSize * 2}em Inter, sans-serif`;
            ctx.fillText(`${pesoActual}`, width / 2, height / 2 - 10);
            
            // Unidad
            ctx.fillStyle = '#94a3b8';
            ctx.font = `${fontSize}em Inter, sans-serif`;
            ctx.fillText('kg', width / 2, height / 2 + 20);
            
            // Porcentaje
            ctx.fillStyle = '#0ea5e9';
            ctx.font = `${fontSize * 0.8}em Inter, sans-serif`;
            ctx.fillText(`${porcentaje.toFixed(1)}%`, width / 2, height / 2 + 40);
            
            ctx.save();
          }
        }]
      });
    }

    // 2. LINE CHART - Tendencia en Tiempo Real
    if (lineChartRef.current) {
      const lineCtx = lineChartRef.current.getContext('2d');
      chartsRef.current.lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: fechas.length > 0 ? fechas : ['Sin datos'],
          datasets: [{
            label: 'Peso (kg)',
            data: pesos.length > 0 ? pesos : [0],
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointBackgroundColor: '#0ea5e9',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
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
                  return value + ' kg';
                }
              }
            },
            x: {
              grid: { color: 'rgba(51, 65, 85, 0.5)' }
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
          }
        }
      });
    }

    // 3. AREA CHART - Distribución y Tendencias
    if (areaChartRef.current) {
      const areaCtx = areaChartRef.current.getContext('2d');
      
      // Crear datos para área con gradiente
      const gradient = areaCtx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
      gradient.addColorStop(1, 'rgba(245, 158, 11, 0.05)');

      chartsRef.current.areaChart = new Chart(areaCtx, {
        type: 'line',
        data: {
          labels: fechas.length > 0 ? fechas : ['Sin datos'],
          datasets: [
            {
              label: 'Peso Actual',
              data: pesos.length > 0 ? pesos : [0],
              borderColor: '#f59e0b',
              backgroundColor: gradient,
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 6
            },
            {
              label: 'Promedio Móvil',
              data: pesos.length > 0 ? pesos.map(() => 8) : [0], // Línea constante en 8 kg
              borderColor: '#10b981',
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false,
              tension: 0,
              pointRadius: 0 // Sin puntos para que se vea más como línea de referencia
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: '#f1f5f9',
                usePointStyle: true,
                padding: 20
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(51, 65, 85, 0.5)' },
              ticks: {
                callback: function(value) {
                  return value + ' kg';
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
  };

  // Función para regresar al dashboard
  const handleBackToDashboard = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  // Función para imprimir
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte de Recogida de Datos - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .chart-container { border: 1px solid #ccc; padding: 15px; }
            .data-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .data-table th, .data-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Empresa Minera Huanuni</h1>
            <h2>Reporte de Recogida de Datos</h2>
            <p>Fecha: ${new Date().toLocaleString('es-ES')}</p>
            <p>Usuario: ${user?.nombre_completo || user?.username}</p>
          </div>
          
          <div class="summary">
            <h3>Resumen Actual</h3>
            <p><strong>Peso Actual:</strong> ${ultimoDato.Peso || 0} kg</p>
            <p><strong>Última Actualización:</strong> ${ultimoDato.timestamp ? new Date(ultimoDato.timestamp).toLocaleString('es-ES') : 'N/A'}</p>
            <p><strong>Total de Registros:</strong> ${datos.length}</p>
          </div>
          
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha y Hora</th>
                <th>Peso (kg)</th>
              </tr>
            </thead>
            <tbody>
              ${datos.slice(-10).reverse().map(dato => `
                <tr>
                  <td>${dato.id}</td>
                  <td>${new Date(dato.timestamp).toLocaleString('es-ES')}</td>
                  <td>${dato.Peso}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  // Función para descargar
  const handleDownload = () => {
    const csvContent = [
      ['ID', 'Fecha y Hora', 'Peso (kg)'],
      ...datos.map(dato => [
        dato.id,
        new Date(dato.timestamp).toLocaleString('es-ES'),
        dato.Peso
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `recogida_datos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Limpiar gráficos al desmontar
  useEffect(() => {
    return () => {
      Object.values(chartsRef.current).forEach(chart => {
        if (chart) chart.destroy();
      });
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #334155',
            borderTop: '4px solid #0ea5e9',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#f1f5f9' }}>Cargando datos en tiempo real...</p>
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

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .recogida-datos-container {
          background: rgba(51, 65, 85, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid #334155;
          border-radius: 16px;
          padding: 2rem;
          margin: 2rem;
          color: #f1f5f9;
        }
        
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .status-indicators {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(30, 41, 59, 0.7);
          border-radius: 8px;
          font-size: 0.875rem;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        .status-dot.active {
          background: #10b981;
        }
        
        .status-dot.inactive {
          background: #ef4444;
        }
        
        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        
        .chart-container {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 1.5rem;
          height: 400px;
        }
        
        .chart-container.large {
          grid-column: span 2;
          height: 300px;
        }
        
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .chart-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #f1f5f9;
          margin: 0;
        }
        
        .chart-value {
          font-size: 0.875rem;
          color: #94a3b8;
        }
        
        .actions-section {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 2rem;
          flex-wrap: wrap;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
        }
        
        .btn-back {
          background: linear-gradient(135deg, #6b7280, #4b5563);
          color: white;
        }
        
        .btn-back:hover {
          background: linear-gradient(135deg, #4b5563, #374151);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(107, 114, 128, 0.4);
        }
        
        .btn-print {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
        }
        
        .btn-print:hover {
          background: linear-gradient(135deg, #2563eb, #1e40af);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        
        .btn-download {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }
        
        .btn-download:hover {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        
        .realtime-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid #334155;
          border-radius: 8px;
          color: #f1f5f9;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .realtime-toggle:hover {
          background: rgba(51, 65, 85, 0.8);
        }
        
        .toggle-switch {
          width: 40px;
          height: 20px;
          background: ${isRealTime ? '#10b981' : '#6b7280'};
          border-radius: 10px;
          position: relative;
          transition: background 0.3s ease;
        }
        
        .toggle-switch::after {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          top: 2px;
          left: ${isRealTime ? '22px' : '2px'};
          transition: left 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
          
          .chart-container.large {
            grid-column: span 1;
          }
          
          .header-section {
            flex-direction: column;
            align-items: stretch;
          }
          
          .actions-section {
            flex-direction: column;
          }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        fontFamily: 'Inter, sans-serif',
        overflowY: 'auto'
      }}>
        {/* Fondo animado */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(14, 165, 233, 0.08) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(245, 158, 11, 0.08) 0%, transparent 50%)',
          animation: 'backgroundMove 25s ease-in-out infinite',
          zIndex: -1
        }} />

        <div className="recogida-datos-container">
          {/* Header */}
          <div className="header-section">
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>
                Recogida de Datos en Tiempo Real
              </h1>
              <p style={{ color: '#94a3b8', margin: 0 }}>
                Monitoreo continuo de peso - Última actualización: {ultimoDato.timestamp ? new Date(ultimoDato.timestamp).toLocaleTimeString('es-ES') : 'N/A'}
              </p>
            </div>
            
            <div className="status-indicators">
              <div className="realtime-toggle" onClick={() => setIsRealTime(!isRealTime)}>
                <span>Tiempo Real</span>
                <div className="toggle-switch"></div>
              </div>
              
              <div className="status-indicator">
                <div className={`status-dot ${isRealTime ? 'active' : 'inactive'}`}></div>
                <span>{isRealTime ? 'Conectado' : 'Pausado'}</span>
              </div>
              
              <div className="status-indicator">
                <i className="bi bi-database" style={{ color: '#0ea5e9' }}></i>
                <span>{datos.length} registros</span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div id="charts-container" className="charts-grid">
            {/* Gauge Chart */}
            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Indicador de Peso</h3>
                <div className="chart-value">
                  Actual: {ultimoDato.Peso || 0} kg
                </div>
              </div>
              <div style={{ height: '300px', position: 'relative' }}>
                <canvas ref={gaugeChartRef}></canvas>
              </div>
            </div>

            {/* Line Chart */}
            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Tendencia en Tiempo Real</h3>
                <div className="chart-value">
                  Últimos registros
                </div>
              </div>
              <div style={{ height: '300px', position: 'relative' }}>
                <canvas ref={lineChartRef}></canvas>
              </div>
            </div>

            {/* Area Chart */}
            <div className="chart-container large">
              <div className="chart-header">
                <h3 className="chart-title">Análisis de Tendencias y Promedio Móvil</h3>
                <div className="chart-value">
                  Peso promedio: {datos.length > 0 ? (datos.reduce((sum, d) => sum + d.Peso, 0) / datos.length).toFixed(2) : 0} kg | Total: {datos.length} registros
                </div>
              </div>
              <div style={{ height: '220px', position: 'relative' }}>
                <canvas ref={areaChartRef}></canvas>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="actions-section">
            <button className="action-btn btn-back" onClick={handleBackToDashboard}>
              <i className="bi bi-arrow-left"></i>
              Volver al Dashboard
            </button>
            
            <button className="action-btn btn-print" onClick={handlePrint}>
              <i className="bi bi-printer"></i>
              Imprimir Reporte
            </button>
            
            <button className="action-btn btn-download" onClick={handleDownload}>
              <i className="bi bi-download"></i>
              Descargar CSV
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecogidaDatos;