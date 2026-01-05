module.exports = {
  apps: [
    // {
    //   name: 'pullCerts',
    //   script: 'pullCerts.js',
    //   env: {
    //     NODE_ENV: 'development',
    //     LOG_LEVEL: 'debug',
    //     pm_name: 'pullCerts'
    //   },
    //   env_qa: {
    //     NODE_ENV: 'qa',
    //     LOG_LEVEL: 'info',
    //     pm_name: 'pullCerts'
    //   },
    //   env_production: {
    //     NODE_ENV: 'production',
    //     LOG_LEVEL: 'warn',
    //     pm_name: 'pullCerts'
    //   },
    //   log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    //   merge_logs: true,
    //   out_file: '/dev/stdout',
    //   error_file: '/dev/stderr'
    // },
    {
      name: 'backend',
      script: './Server.js',
      env: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
        pm_name: 'backend'
      },
      env_qa: {
        NODE_ENV: 'qa',
        LOG_LEVEL: 'info',
        pm_name: 'backend'
      },
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'warn',
        pm_name: 'backend'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      out_file: '/dev/stdout',
      error_file: '/dev/stderr'
    },
    {
      name: 'AlertReport',
      script: 'AlertReport.js',
      env: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
        pm_name: 'AlertReport'
      },
      env_qa: {
        NODE_ENV: 'qa',
        LOG_LEVEL: 'info',
        pm_name: 'AlertReport'
      },
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'warn',
        pm_name: 'AlertReport'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      out_file: '/dev/stdout',
      error_file: '/dev/stderr'
    },
    {
      name: 'GrafanaAPI',
      cwd: 'API',
      script: 'GrafanaAPI.js',
      env: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'warn',
        pm_name: 'GrafanaAPI'
      },
      env_qa: {
        NODE_ENV: 'qa',
        LOG_LEVEL: 'info',
        pm_name: 'GrafanaAPI'
      },
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'warn',
        pm_name: 'GrafanaAPI'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      out_file: '/dev/stdout',
      error_file: '/dev/stderr'
    },
    {
      name: 'AppDAPI',
      cwd: 'API',
      script: 'AppDAPI.js',
      env: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'warn',
        pm_name: 'AppDAPI'
      },
      env_qa: {
        NODE_ENV: 'qa',
        LOG_LEVEL: 'info',
        pm_name: 'AppDAPI'
      },
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'warn',
        pm_name: 'AppDAPI'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      out_file: '/dev/stdout',
      error_file: '/dev/stderr'
    },
    {
      name: 'DashLocationDataAPI',
      cwd: 'API',
      script: 'DashLocationDataAPI.js',
      env: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
        pm_name: 'DashLocationDataAPI'
      },
      env_qa: {
        NODE_ENV: 'qa',
        LOG_LEVEL: 'info',
        pm_name: 'DashLocationDataAPI'
      },
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'warn',
        pm_name: 'DashLocationDataAPI'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      out_file: '/dev/stdout',
      error_file: '/dev/stderr'
    },
    {
      name: 'DashChangeAPI',
      cwd: 'API',
      script: 'DashChangeAPI.js',
      env: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
        pm_name: 'DashChangeAPI'
      },
      env_qa: {
        NODE_ENV: 'qa',
        LOG_LEVEL: 'info',
        pm_name: 'DashChangeAPI'
      },
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'warn',
        pm_name: 'DashChangeAPI'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      out_file: '/dev/stdout',
      error_file: '/dev/stderr'
    }
  ]
};