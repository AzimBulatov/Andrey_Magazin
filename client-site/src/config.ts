// API URL configuration
// В продакшене nginx проксирует /api и /auth на backend
export const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : '';
