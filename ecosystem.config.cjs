module.exports = {
  apps: [
    {
      name: "gns",
      script: "node",
      args: "node_modules/next/dist/bin/next start",
      cwd: "C:\\Informacion David\\Desarrollo\\invetario_productos",
      autorestart: true,
      restart_delay: 5000,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    {
      name: "gns-dev",
      script: "pnpm",
      args: "run dev",
      cwd: "C:\\Informacion David\\Desarrollo\\invetario_productos",
      autorestart: true,
      watch: false,
      restart_delay: 2000,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 3000
      }
    }
  ]
};
