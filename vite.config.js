import { defineConfig } from 'vite';

export default defineConfig({
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
