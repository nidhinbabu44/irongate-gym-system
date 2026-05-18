import axios from 'axios';
import {
  DEMO_TOKEN, DEMO_ADMIN,
  PLANS, MEMBERS, PAYMENTS, ENTRY_LOGS, DASHBOARD_STATS,
} from './mockData';

export let isDemoMode = false;

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 5000,
});

// Attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('gym_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Mock response helper
function mockResponse(data) {
  return Promise.resolve({ data, status: 200 });
}

function getMockData(method, url, body) {
  // Auth
  if (method === 'post' && url.includes('/auth/login')) {
    const { username, password } = body || {};
    if (username === 'admin' && password === 'Admin@123456') {
      return mockResponse({ token: DEMO_TOKEN, admin: DEMO_ADMIN });
    }
    return Promise.reject({ response: { data: { message: 'Invalid credentials' } } });
  }
  // Dashboard
  if (url.includes('/dashboard/stats')) return mockResponse(DASHBOARD_STATS);
  // Members list
  if (method === 'get' && /\/members$/.test(url)) return mockResponse({ success: true, data: MEMBERS, total: MEMBERS.length });
  // Member by ID
  if (method === 'get' && /\/members\/\d+$/.test(url)) {
    const id = parseInt(url.split('/').pop());
    const m = MEMBERS.find(x => x.MemberID === id);
    if (!m) return Promise.reject({ response: { data: { message: 'Member not found' } } });
    const payments = PAYMENTS.filter(p => p.MemberID === id);
    const entries = ENTRY_LOGS.filter(e => e.MemberID === id).slice(0, 10);
    return mockResponse({ success: true, data: m, payments, entries });
  }
  // Plans
  if (url.includes('/plans')) return mockResponse({ success: true, data: PLANS });
  // Payments
  if (url.includes('/payments')) return mockResponse({ success: true, data: PAYMENTS });
  // Entry logs
  if (url.includes('/entry/logs')) return mockResponse({ success: true, data: ENTRY_LOGS.slice(0, 30) });
  // Face descriptors
  if (url.includes('/members/faces')) return mockResponse({ success: true, data: [] });
  // Expiry check
  if (url.includes('/admin/run-expiry')) return mockResponse({ message: 'Expiry check complete (demo)' });
  // Entry verify
  if (url.includes('/entry/verify')) return mockResponse({ success: true, action: 'Entry', member: MEMBERS[0] });
  // Default
  return mockResponse({ success: true, data: [] });
}

// Response interceptor — fallback to mock on network error
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const isNetworkError = !err.response || err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || err.message === 'Network Error';
    if (isNetworkError) {
      isDemoMode = true;
      localStorage.setItem('demo_mode', 'true');
      const config = err.config || {};
      return getMockData(config.method, config.url || '', JSON.parse(config.data || '{}'));
    }
    if (err.response?.status === 401) {
      localStorage.removeItem('gym_token');
      localStorage.removeItem('gym_admin');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Check if already in demo mode from previous session
if (localStorage.getItem('demo_mode') === 'true') isDemoMode = true;

export default API;
