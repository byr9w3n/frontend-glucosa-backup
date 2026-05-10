// src/api.js
import axios from 'axios'
import { supabase } from './supabase'

// 1. Apuntamos a tu FastAPI local
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/'
})

// 2. Interceptamos cada petición ANTES de que salga
api.interceptors.request.use(async (config) => {
  // Obtenemos la sesión actual de Supabase
  const { data: { session } } = await supabase.auth.getSession()
  
  // Si hay un usuario logueado, inyectamos su token en las cabeceras
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  
  return config
}, (error) => {
  return Promise.reject(error)
})

export default api