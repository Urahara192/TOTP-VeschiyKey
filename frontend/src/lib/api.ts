import axios from 'axios'

const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (original.url?.includes('/auth/verify-2fa')) {
        return Promise.reject(error)
      }
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        return Promise.reject(error)
      }
      original._retry = true
      try {
        const { data } = await axios.post('/auth/refresh', { refresh_token: refreshToken })
        localStorage.setItem('access_token', data.data.access_token)
        localStorage.setItem('refresh_token', data.data.refresh_token)
        original.headers.Authorization = `Bearer ${data.data.access_token}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
