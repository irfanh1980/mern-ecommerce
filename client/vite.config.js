import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_ORIGIN = 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      // React Fast Refresh uses eval/inline scripts in dev only
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https://res.cloudinary.com",
        "font-src 'self' data:",
        `connect-src 'self' ${API_ORIGIN} ws://localhost:5000 ws://localhost:5173 ws://localhost:5174 ws://localhost:5175`,
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
      ].join('; '),
    },
  },
});
