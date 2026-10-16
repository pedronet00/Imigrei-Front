const DEFAULT_API_URL = import.meta.env.PROD
  ? 'https://imigrei.duckdns.org/api'
  : 'https://localhost:7230/api';

export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, '');
