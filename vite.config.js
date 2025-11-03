import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Mandy/', // Add this line - replace with your actual repo name
  css: {
    preprocessorOptions: {
      scss: {
        // Add global SCSS variables/mixins here if needed
        additionalData: `// Global SCSS variables and mixins can go here`
      }
    }
  },
  server: {
    port: 3000
  }
});