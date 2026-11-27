import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // O fallback para `index.html` depende desta declaração, e não de um valor por omissão do Vite.
  appType: 'spa',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Separa o router das dependências da aplicação, para que o
        // ficheiro mais pesado se mantenha abaixo do limite de 250 kB.
        manualChunks(id: string): string | undefined {
          if (id.includes('@tanstack')) {
            return 'router'
          }

          return undefined
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    // Os testes end-to-end correm com Playwright, não com Vitest.
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
})
