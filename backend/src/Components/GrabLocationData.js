import { logger, logError } from './Logger.js'
import { poolPromise } from '../configurations/SQL/ConnectionPool.js'

async function grabLocationData(callback) {
    const startTime = Date.now()
    try {
        logger.debug('Location data query started', {
            operation: 'grabLocationData',
            tool: 'LocationData'
        })

        const pool = await poolPromise
        const queryStr = `select distinct RunDCs value from THDDB.dbo.DashApplication where not (RunDCs = '' or RunDCs = 'N/A')
                         union
                         select distinct DatabaseDCs value from THDDB.dbo.DashApplication where not (DatabaseDCs = '' or DatabaseDCs = 'N/A')`
        
        await pool.request().query(queryStr, (error, results) => {
            if (error) { 
                logError(error, 'Location data query failed', {
                    operation: 'grabLocationData',
                    query: queryStr
                })
                throw error 
            }

            const duration = Date.now() - startTime
            const rawRecordCount = results.recordset.length
            
            logger.debug('Raw location data retrieved', {
                operation: 'grabLocationData',
                rawRecordCount,
                duration,
                tool: 'LocationData'
            })

            // Process the data
            const dcSet = new Set()
            let totalSplitValues = 0
            let recordsWithMultipleDCs = 0

            results.recordset.forEach((dc) => {
                const splitValues = dc.value.split('&')
                totalSplitValues += splitValues.length
                
                if (splitValues.length > 1) {
                    recordsWithMultipleDCs++
                    logger.debug('Multiple DCs found in single record', {
                        operation: 'grabLocationData',
                        originalValue: dc.value,
                        splitCount: splitValues.length,
                        tool: 'LocationData'
                    })
                }
                
                splitValues.forEach((splitDC) => {
                    const trimmedDC = splitDC.trim()
                    if (trimmedDC) {
                        dcSet.add(trimmedDC)
                    }
                })
            })

            const finalResult = Array.from(dcSet).sort().reverse()
            const totalDuration = Date.now() - startTime

            logger.info('Location data processed successfully', {
                operation: 'grabLocationData',
                totalDuration,
                rawRecords: rawRecordCount,
                totalSplitValues,
                recordsWithMultipleDCs,
                uniqueDataCenters: dcSet.size,
                finalResultCount: finalResult.length,
                tool: 'LocationData'
            })

            // Log the actual data centers found (debug level)
            logger.debug('Data centers identified', {
                operation: 'grabLocationData',
                dataCenters: finalResult,
                tool: 'LocationData'
            })

            // Log statistics about DC names
            const dcStats = {
                shortNames: finalResult.filter(dc => dc.length <= 3).length,
                longNames: finalResult.filter(dc => dc.length > 3).length,
                containsNumbers: finalResult.filter(dc => /\d/.test(dc)).length
            }

            logger.debug('Data center name statistics', {
                operation: 'grabLocationData',
                dcStats,
                tool: 'LocationData'
            })

            return callback(finalResult)
        })

    } catch (err) {
        const duration = Date.now() - startTime
        logError(err, 'Location data retrieval failed', {
            operation: 'grabLocationData',
            duration
        })
    }
}

export { grabLocationData }
