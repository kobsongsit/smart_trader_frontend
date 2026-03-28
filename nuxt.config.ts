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
      meta: [
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'KOB-Trade' }
      ],
      link: [
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png'
        },
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
              primary: '#4ADE80',
              secondary: '#1E88E5',
              accent: '#FFD54F',
              error: '#FF5252',
              info: '#2196F3',
              success: '#4CAF50',
              warning: '#FB8C00',
              background: '#060A13',
              surface: '#0A0F1C'
            }
          },
          light: {
            colors: {
              primary: '#4ADE80',
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
