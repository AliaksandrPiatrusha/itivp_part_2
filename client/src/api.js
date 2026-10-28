import axios from 'axios';

// Сервис для работы с REST API магазина (сервер из корня репозитория, лаб. №21–23).
// Все компоненты обращаются к серверу только через функции этого модуля.

export const TOKEN_KEY = 'clothing-store:token';
export const USER_KEY = 'clothing-store:user';

// Событие, которое получает useAuth, когда сервер ответил 401 (токен истёк или недействителен).
export const AUTH_EXPIRED_EVENT = 'clothing-store:auth-expired';

// Искусственная задержка каждого запроса — для проверки индикаторов загрузки (.env: VITE_API_DELAY_MS).
const DELAY_MS = Number(import.meta.env.VITE_API_DELAY_MS) || 0;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Перехватчик запросов: подставляет JWT-токен в заголовок Authorization.
api.interceptors.request.use(async config => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (DELAY_MS > 0) await sleep(DELAY_MS);
  return config;
});

// Перехватчик ответов: 401 на защищённом маршруте означает, что сессия больше не действительна.
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

// Сервер оборачивает полезные данные в { data: ... }.
const unwrap = response => response.data?.data;

/* ---------- Аутентификация ---------- */

export const login = (email, password) => api.post('/auth/login', { email, password }).then(unwrap);
export const register = (email, password) => api.post('/auth/register', { email, password }).then(unwrap);

/* ---------- Каталог ---------- */

// search, category и пагинация (limit/offset) обрабатываются на сервере;
// signal позволяет отменить устаревший запрос. Возвращает { items, total, hasMore }.
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

/* ---------- Корзина (CRUD) ---------- */

// Каждый ответ корзины: { items, total } (+ item для операций с одной позицией).
export const fetchCart = signal => api.get('/cart', { signal }).then(unwrap);
export const addCartItem = item => api.post('/cart/items', item).then(unwrap);
export const updateCartItem = (id, changes) => api.put(`/cart/items/${id}`, changes).then(unwrap);
export const deleteCartItem = id => api.delete(`/cart/items/${id}`).then(unwrap);
export const clearCart = () => api.delete('/cart');

/* ---------- Ошибки ---------- */

export const isCanceled = error => axios.isCancel(error);

export const getStatus = error => error?.response?.status;

// Человекочитаемое сообщение для любой ошибки запроса.
export function getErrorMessage(error) {
  if (axios.isCancel(error)) return 'Запрос отменён';
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') return 'Сервер не ответил вовремя';
  if (!error?.response) {
    // Ответа нет совсем: сервер выключен, нет сети или запрос заблокирован CORS.
    return 'Сервер недоступен. Проверьте подключение и что API запущен';
  }
  const { status, data } = error.response;
  if (status >= 500) return `Ошибка сервера (${status}). Попробуйте позже`;
  return data?.error?.message || `Ошибка запроса (${status})`;
}

export default api;
