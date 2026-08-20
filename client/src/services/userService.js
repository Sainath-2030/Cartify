import { api } from './api.js';

export const userService = {
  getMe: () => api.get('/users/me', { auth: true }),
  updateMe: (payload) => api.put('/users/me', payload, { auth: true }),
};
