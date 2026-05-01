import axios from 'axios';

const http = axios.create({ baseURL: '/api' });

const ADMIN_TOKEN_KEY = 'ayd_admin_token';

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);
export const clearAdminToken = () => localStorage.removeItem(ADMIN_TOKEN_KEY);
export const loginAdmin = async (credentials) => {
  const res = await http.post('/admin/login', credentials);
  localStorage.setItem(ADMIN_TOKEN_KEY, res.data.token);
  return res;
};

// ── Servicios Médicos ──────────────────────────────────────────────────────────
export const getServicios    = ()        => http.get('/servicios');
export const getServicio     = (id)      => http.get(`/servicios/${id}`);
export const createServicio  = (data)    => http.post('/servicios', data);
export const updateServicio  = (id, data)=> http.put(`/servicios/${id}`, data);
export const deleteServicio  = (id)      => http.delete(`/servicios/${id}`);

// ── Especialidades ─────────────────────────────────────────────────────────────
export const getEspecialidades   = ()        => http.get('/especialidades');
export const getEspecialidad     = (id)      => http.get(`/especialidades/${id}`);
export const createEspecialidad  = (data)    => http.post('/especialidades', data);
export const updateEspecialidad  = (id, data)=> http.put(`/especialidades/${id}`, data);
export const deleteEspecialidad  = (id)      => http.delete(`/especialidades/${id}`);
