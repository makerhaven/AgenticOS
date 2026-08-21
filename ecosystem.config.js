module.exports = {
  apps: [
    {
      name: "agentic-os",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3737",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: "3737",
      },
      out_file: "data/logs/out.log",
      error_file: "data/logs/err.log",
      // Daily bounce keeps long-running agent state fresh on a 4-core box.
      cron_restart: "0 4 * * *",
    },
  ],
};
