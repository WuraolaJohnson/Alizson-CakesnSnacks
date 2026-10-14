import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // NEXT_PUBLIC_* lets the app use the variables added by Vercel's Supabase
  // integration. Only variables referenced by name in src/ end up in the
  // bundle — never put a secret behind either prefix.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  server: {
    port: 5173,
    host: true
  }
})
