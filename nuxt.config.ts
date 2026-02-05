// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    // Private - only available on server
    apiSecret: process.env.API_SECRET || '',
    // Public - available on client & server
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:9001'
    }
  },

  // Proxy API requests to avoid CORS
  nitro: {
    routeRules: {
      '/api/**': {
        proxy: process.env.NUXT_PUBLIC_API_BASE_URL
          ? `${process.env.NUXT_PUBLIC_API_BASE_URL}/**`
          : 'http://localhost:9001/**'
      }
    }
  },

  modules: [
    'vuetify-nuxt-module'
  ],

  vuetify: {
    moduleOptions: {
      // Use default Vuetify styles
      styles: true
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: 'dark',
        themes: {
          dark: {
            colors: {
              primary: '#00DC82',
              secondary: '#1E88E5',
              accent: '#FFD54F',
              error: '#FF5252',
              info: '#2196F3',
              success: '#4CAF50',
              warning: '#FB8C00',
              background: '#121212',
              surface: '#1E1E1E'
            }
          },
          light: {
            colors: {
              primary: '#00DC82',
              secondary: '#1E88E5',
              accent: '#FFD54F',
              error: '#FF5252',
              info: '#2196F3',
              success: '#4CAF50',
              warning: '#FB8C00'
            }
          }
        }
      },
      icons: {
        defaultSet: 'mdi'
      }
    }
  },

  css: ['@mdi/font/css/materialdesignicons.css']
})
