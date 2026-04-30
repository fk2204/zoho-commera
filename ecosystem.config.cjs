module.exports = {
  apps: [
    {
      name: "commera-scheduler",
      script: "scripts/automation/scheduler.js",
      cwd: "C:\\Users\\fkozi\\zoho commera",
      env_file: ".env",
      watch: false,
      autorestart: true,
      max_memory_restart: "500M",
      error_file: "logs/scheduler-error.log",
      out_file: "logs/scheduler-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
