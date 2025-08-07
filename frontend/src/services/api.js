import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Servicios para datos
export const datosService = {
  // Obtener todos los datos
  obtenerTodos: async () => {
    try {
      const response = await api.get('/datos');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo datos:', error);
      throw error;
    }
  },

  // Obtener último dato
  obtenerUltimo: async () => {
    try {
      const response = await api.get('/datos/ultimo');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo último dato:', error);
      throw error;
    }
  },

  // Insertar dato
  insertar: async (peso) => {
    try {
      const response = await api.post('/datos', { peso });
      return response.data;
    } catch (error) {
      console.error('Error insertando dato:', error);
      throw error;
    }
  }
};

export default api;