module.exports = {
  apps: [
    {
      name: "bmc-smart-civic-api",
      script: "./index.js",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "800M",
      listen_timeout: 8000,
      kill_timeout: 5000,
      wait_ready: true,
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 5000,
      },
    },
  ],
};
