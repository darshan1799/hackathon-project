import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests if it exists
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Handle token expiration
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

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

export const authAPI = {
  login: (data) => {
    const formData = new FormData()
    formData.append('username', data.email)
    formData.append('password', data.password)
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data)
  },
  signup: (data) => api.post('/auth/signup', data).then(r => r.data),
  getMe: () => api.get('/auth/me').then(r => r.data),
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return Promise.resolve()
  }
}

export const testAPI = {
  getTestContacts: () => api.get('/test/contacts').then(r => r.data),
  triggerTestAlert: (data) => api.post('/test/alert', data).then(r => r.data)
}