/**
 * PM2 Ecosystem Configuration for Plesk Deployment
 * Smart Trader Frontend - Nuxt 4 Application
 */
module.exports = {
  apps: [
    {
      name: 'smart-trader-frontend',
      script: '.output/server/index.mjs',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      }
    }
  ]
}
