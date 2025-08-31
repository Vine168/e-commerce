import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth tokens (if needed later)
api.interceptors.request.use(
  (config) => {
    // Add auth token here if implementing authentication
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Product API
export const productAPI = {
  // Get all products
  getAll: () => api.get("/products"),

  // Get single product by ID
  getById: (id) => api.get(`/products/${id}`),

  // Get product by slug
  getBySlug: (slug) => api.get(`/products/slug/${slug}`),

  // Create product (admin)
  create: (productData) => api.post("/products", productData),

  // Update product (admin)
  update: (id, productData) => api.patch(`/products/${id}`, productData),

  // Delete product (admin)
  delete: (id) => api.delete(`/products/${id}`),
};

// Order API
export const orderAPI = {
  // Create new order
  create: (orderData) => api.post("/orders", orderData),

  // Generate KHQR for order
  generateKHQR: (orderId) => api.post(`/orders/${orderId}/khqr`),

  // Check payment status
  checkPaymentStatus: (orderId) => api.get(`/orders/${orderId}/status`),

  // Get all orders (admin)
  getAll: () => api.get("/orders"),

  // Get single order
  getById: (id) => api.get(`/orders/${id}`),

  // Update order status (admin)
  updateStatus: (id, statusData) =>
    api.patch(`/orders/${id}/status`, statusData),
};

// Admin API
export const adminAPI = {
  // Get dashboard data
  getDashboard: () => api.get("/admin/dashboard"),

  // Get products for admin panel
  getProducts: () => api.get("/admin/products"),

  // Get orders for admin panel
  getOrders: () => api.get("/admin/orders"),
};

export default api;
