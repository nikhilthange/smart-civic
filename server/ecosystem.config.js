module.exports = {
  apps: [
    {
      name: "bmc-smart-civic-api",
      script: "./index.js",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "1G",
      exp_backoff_restart_delay: 100,
      listen_timeout: 8000,
      kill_timeout: 5000,
      wait_ready: true,
      error_file: "/var/log/smart-civic/pm2-error.log",
      out_file: "/var/log/smart-civic/pm2-out.log",
      merge_logs: true,
      time: true,
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      env_staging: {
        NODE_ENV: "staging",
        PORT: 5000,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 5000,
      },
    },
  ],
};
