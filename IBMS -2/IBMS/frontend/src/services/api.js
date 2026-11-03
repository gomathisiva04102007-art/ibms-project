import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Inject Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ibms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('ibms_token');
        localStorage.removeItem('ibms_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Customer endpoints
export const customerService = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// Product endpoints
export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Invoice endpoints
export const invoiceService = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  calculate: (data) => api.post('/invoices/calculate', data),
  voidInvoice: (id, reason) => api.post(`/invoices/${id}/void`, { reason }),
  delete: (id) => api.delete(`/invoices/${id}`),
  getPayments: (id) => api.get(`/invoices/${id}/payments`),
};

// Payment endpoints
export const paymentService = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  record: (data) => api.post('/payments', data),
  delete: (id) => api.delete(`/payments/${id}`),
};

// Dashboard endpoints
export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getRevenueCharts: () => api.get('/dashboard/revenue'),
};

// Reports endpoints
export const reportService = {
  getRevenue: (params) => api.get('/reports/revenue', { params }),
  getInvoices: (params) => api.get('/reports/invoices', { params }),
  getPayments: (params) => api.get('/reports/payments', { params }),
  getGst: (params) => api.get('/reports/gst', { params }),
  getCustomers: () => api.get('/reports/customers'),
  getProducts: () => api.get('/reports/products'),
};

// Business Profile endpoints
export const businessProfileService = {
  get: () => api.get('/business-profile'),
  update: (data) => api.put('/business-profile', data),
};

export default api;
