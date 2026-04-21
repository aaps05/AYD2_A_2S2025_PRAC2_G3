import axios from 'axios';

const http = axios.create({ baseURL: '/api' });

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
