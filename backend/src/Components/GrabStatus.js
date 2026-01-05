import sql from 'mssql'

import { logger, logError } from './Logger.js'
import { poolPromise } from '../configurations/SQL/ConnectionPool.js'

async function grabStatus(request, callback) {
    const startTime = Date.now()
    try {
        const alertName = request.query.AlertName

        logger.debug('Status lookup started', {
            operation: 'grabStatus',
            alertName,
            tool: 'StatusLookup'
        })

        const pool = await poolPromise
        const statusQuery = `select Alert_Name, Status, WriteTime from THDDB.dbo.Alert where Alert_Name = @alertName`
        
        await pool.request()
            .input('alertName', sql.NVarChar, alertName)
            .query(statusQuery, (error, results) => {
                if (error) { 
                    logError(error, 'Status lookup query failed', {
                        operation: 'grabStatus',
                        alertName,
                        query: statusQuery
                    })
                    throw error 
                }

                const duration = Date.now() - startTime
                const recordCount = results.recordset.length
                const foundAlert = recordCount > 0

                if (foundAlert) {
                    const alertData = results.recordset[0]
                    
                    logger.info('Alert status retrieved successfully', {
                        operation: 'grabStatus',
                        alertName,
                        status: alertData.Status,
                        writeTime: alertData.WriteTime,
                        duration,
                        tool: 'StatusLookup'
                    })

                    logger.debug('Alert status details', {
                        operation: 'grabStatus',
                        alertName: alertData.Alert_Name,
                        status: alertData.Status,
                        lastUpdated: alertData.WriteTime,
                        recordsFound: recordCount,
                        tool: 'StatusLookup'
                    })

                    return callback(alertData)
                } else {
                    logger.warn('Alert not found', {
                        operation: 'grabStatus',
                        alertName,
                        duration,
                        recordsFound: recordCount,
                        tool: 'StatusLookup'
                    })

                    // Return undefined/null for not found case
                    return callback(results.recordset[0]) // This will be undefined
                }
            })
    } catch (err) {
        const duration = Date.now() - startTime
        logError(err, 'Status lookup failed', {
            operation: 'grabStatus',
            alertName: request.query?.AlertName,
            duration
        })
    }
}

export { grabStatus }
