import sql from 'mssql'

const config = {
    user: process.env.DASH_DB_USER,
    password: process.env.DASH_DB_PASS,
    server: process.env.DASH_DB_ENDPOINT,
    database: process.env.DASH_DB_NAME || '',
    port: parseInt(process.env.DASH_DB_PORT) || 1433,
    trustServerCertificate: true,
    encrypt: false,
    multisubnetfailover: true,
    pool: { idleTimeoutMillis: 100000 },
    requestTimeout: 300000
}

const dashPoolPromise = new sql.ConnectionPool(config)
    .connect()
    .catch(err => {
        console.error('Dash Database Connection Failed:', err)
        throw err
    })

export { sql, dashPoolPromise }
