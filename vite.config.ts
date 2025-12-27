import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Remove process.env references - use import.meta.env instead
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
    'import.meta.env.VITE_API_KEY': JSON.stringify(process.env.API_KEY || '')
  }
})
