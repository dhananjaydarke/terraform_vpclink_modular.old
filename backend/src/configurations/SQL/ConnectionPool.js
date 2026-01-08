import sql from 'mssql'

const password = process.env.THD_DB_PASS
const username = process.env.THD_DB_USER


const config = {
    user: process.env.THD_DB_USER,
    password: process.env.THD_DB_PASS,
    server: process.env.THD_DB_ENDPOINT,
    database: process.env.THD_DB_NAME || '',
    port: parseInt(process.env.THD_DB_PORT) || 1433,
    trustServerCertificate: true,
    encrypt: false,
    multisubnetfailover: true,
    pool: { idleTimeoutMillis: 100000 },
    requestTimeout: 300000
}

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .catch(err => {
        console.error('Database Connection Failed:', err)
        throw err
    })

export { sql, poolPromise, password, username }
