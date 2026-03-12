import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/myStock/', // ⬅ 注意大小寫要和 repo 名稱完全一致
})
