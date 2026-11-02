import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
export default defineConfig({ plugins: [react(), tailwindcss()], preview: { host: '0.0.0.0', port: 5180, allowedHosts: true } })
