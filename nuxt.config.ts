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

  app: {
    head: {
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap'
        }
      ]
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
              background: '#0B1120',
              surface: '#131C2E'
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
      },
    }
  },

  css: [
    '@mdi/font/css/materialdesignicons.css',
    '~/assets/css/global.css'
  ]
})
