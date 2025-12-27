import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 載入當前環境的變數，不限於 VITE_ 前綴
  // Explicitly use process.cwd() from imported node process to resolve TS2339: Property 'cwd' does not exist on type 'Process'
  const env = loadEnv(mode, process.cwd(), '');
  
  // 統一優先順序：GEMINI_API_KEY > API_KEY
  const apiKey = env.GEMINI_API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // 確保 SDK 讀取的是 process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(apiKey),
      // 防止其他依賴 process.env 的程式碼報錯
      'process.env': {}
    }
  }
})
