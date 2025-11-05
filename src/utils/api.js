import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://eco-basket-backend.onrender.com/api',
  withCredentials: true
})

export default api
