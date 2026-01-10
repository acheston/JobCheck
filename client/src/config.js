// API URL configuration
// In development, use the local Express server
// In production (Vercel), use relative paths to serverless functions

const isDev = import.meta.env.DEV;

export const API_URL = isDev ? 'http://localhost:3001/api' : '/api';
export const SERVER_URL = isDev ? 'http://localhost:3001' : '';
