import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const contactsAPI = {
  getAll: () => api.get('/contacts').then(r => r.data),
  create: (data) => api.post('/contacts', data).then(r => r.data),
  update: (id, data) => api.put(`/contacts/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/contacts/${id}`).then(r => r.data)
}

export const alertsAPI = {
  trigger: (data) => api.post('/alerts', data).then(r => r.data),
  getLogs: (limit = 100) => api.get(`/alerts/logs?limit=${limit}`).then(r => r.data)
}

export const systemAPI = {
  getThresholds: () => api.get('/thresholds').then(r => r.data),
  getStats: () => api.get('/stats').then(r => r.data),
  health: () => api.get('/health').then(r => r.data)
}