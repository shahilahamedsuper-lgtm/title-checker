// PM2 process manager config — keeps the backend alive on the VPS
// Usage: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "backend",
      script: "./backend/server.js",
      cwd: "/var/www/myapp",
      instances: "max",       // one per CPU core
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      error_file: "/var/log/pm2/backend-error.log",
      out_file: "/var/log/pm2/backend-out.log",
      merge_logs: true,
      restart_delay: 3000,
    },
  ],
};
