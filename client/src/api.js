import axios from 'axios';


export const TOKEN_KEY = 'clothing-store:token';
export const USER_KEY = 'clothing-store:user';

export const AUTH_EXPIRED_EVENT = 'clothing-store:auth-expired';

const DELAY_MS = Number(import.meta.env.VITE_API_DELAY_MS) || 0;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

api.interceptors.request.use(async config => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (DELAY_MS > 0) await sleep(DELAY_MS);
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    const hadToken = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && hadToken) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

const unwrap = response => response.data?.data;


export const login = (email, password) => api.post('/auth/login', { email, password }).then(unwrap);
export const register = (email, password) => api.post('/auth/register', { email, password }).then(unwrap);


export const fetchProducts = ({ search, category, limit, offset } = {}, signal) =>
  api.get('/products', {
    params: {
      ...(search ? { search } : {}),
      ...(category && category !== 'all' ? { category } : {}),
      ...(limit ? { limit, offset: offset ?? 0 } : {})
    },
    signal
  }).then(response => {
    const { data, meta } = response.data;
    return { items: data, total: meta?.total ?? data.length, hasMore: Boolean(meta?.hasMore) };
  });


export const fetchCart = signal => api.get('/cart', { signal }).then(unwrap);
export const addCartItem = item => api.post('/cart/items', item).then(unwrap);
export const updateCartItem = (id, changes) => api.put(`/cart/items/${id}`, changes).then(unwrap);
export const deleteCartItem = id => api.delete(`/cart/items/${id}`).then(unwrap);
export const clearCart = () => api.delete('/cart');


export const isCanceled = error => axios.isCancel(error);

export const getStatus = error => error?.response?.status;

export function getErrorMessage(error) {
  if (axios.isCancel(error)) return 'Запрос отменён';
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') return 'Сервер не ответил вовремя';
  if (!error?.response) {
    return 'Сервер недоступен. Проверьте подключение и что API запущен';
  }
  const { status, data } = error.response;
  if (status >= 500) return `Ошибка сервера (${status}). Попробуйте позже`;
  return data?.error?.message || `Ошибка запроса (${status})`;
}

export default api;
