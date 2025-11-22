module.exports = {
  apps: [
    {
      name: 'cacao-voice-agent',
      script: './agent/voice-agent.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        // These should be set in your .env file
        LIVEKIT_URL: process.env.LIVEKIT_URL,
        LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
        DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
        GROQ_API_KEY: process.env.GROQ_API_KEY,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        ASSISTANT_VOICE: process.env.ASSISTANT_VOICE || 'en-US-Ava'
      },
      env_development: {
        NODE_ENV: 'development',
        watch: ['agent/'],
        ignore_watch: ['node_modules', 'logs'],
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
      },
      env_production: {
        NODE_ENV: 'production',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
      },
      // Logging configuration
      log_file: './logs/voice-agent-combined.log',
      out_file: './logs/voice-agent-out.log',
      error_file: './logs/voice-agent-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Process management
      kill_timeout: 5000,
      listen_timeout: 3000,

      // Advanced settings
      node_args: '--max-old-space-size=1024',

      // Monitoring
      pmx: true,

      // Health checks
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true
    }
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/cacaoconnect.git',
      path: '/var/www/cacaoconnect',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },

    staging: {
      user: 'node',
      host: 'staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/cacaoconnect.git',
      path: '/var/www/cacaoconnect-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging'
    }
  }
};