import axios from 'axios';

const api = axios.create({
  baseURL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'http://backend:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
