import { logger, logError } from './Logger.js'
import { poolPromise } from '../configurations/SQL/ConnectionPool.js'

const fullArr = []

async function grabRunbookStatus(domain, callback) {
    const startTime = Date.now()
    try {
        logger.debug('Runbook status query started', {
            operation: 'grabRunbookStatus',
            domain,
            tool: 'RunbookJson'
        })

        const pool = await poolPromise
        const queryStr = `select Name, Progress, Status, Maintenance,
                            FORMAT(Start_Time, 'yyyy-MM-dd HH:mm:ss') as Start_Time,
                            FORMAT(End_Time, 'yyyy-MM-dd HH:mm:ss') as End_Time,
                            FORMAT(Maintenance_Start_Time, 'yyyy-MM-dd HH:mm:ss') as Maintenance_Start_Time,
                            FORMAT(Last_Execution, 'yyyy-MM-dd HH:mm:ss') as Last_Execution,
                            FORMAT(Next_Execution, 'yyyy-MM-dd HH:mm:ss') as Next_Execution,
                            URL, Total_jobs, Successful_jobs, Failed_jobs, Portfolio, Area, Total_Time 
                            from THDDB.dbo.RunbookCurrent
                            where ${domain}`
        
        await pool.request().query(queryStr, (error, results) => {
            if (error) { 
                logError(error, 'Database query failed', {
                    operation: 'grabRunbookStatus',
                    domain,
                    queryStr
                })
                throw error 
            }

            const duration = Date.now() - startTime
            logger.info('Runbook status query completed', {
                operation: 'grabRunbookStatus',
                domain,
                duration,
                recordCount: results.recordset.length,
                tool: 'RunbookJson'
            })

            const jsonResult = createJSON(results.recordset)
            
            logger.info('Runbook JSON created successfully', {
                operation: 'grabRunbookStatus',
                domain,
                totalDuration: Date.now() - startTime,
                portfolioCount: jsonResult.length,
                totalRunbooks: results.recordset.length,
                tool: 'RunbookJson'
            })

            return callback(jsonResult)
        })
    } catch (err) {
        const duration = Date.now() - startTime
        logError(err, 'Runbook status retrieval failed', {
            operation: 'grabRunbookStatus',
            domain,
            duration
        })
    }
}

function createJSON(results) {
    const startTime = Date.now()
    try {
        logger.debug('JSON creation started', {
            operation: 'createJSON',
            inputRecordCount: results.length,
            tool: 'RunbookJson'
        })

        fullArr.length = 0
        let portfolioCount = 0
        let areaCount = 0
        let runbookCount = 0

        results.forEach((result) => {
            let portfolio = fullArr.find((entry) => entry.Portfolio === result.Portfolio)
            if (portfolio === undefined) {
                portfolio = { Portfolio: result.Portfolio, Area: [] }
                fullArr.push(portfolio)
                portfolioCount++
                
                logger.debug('New portfolio created', {
                    operation: 'createJSON',
                    portfolioName: result.Portfolio,
                    tool: 'RunbookJson'
                })
            }
            
            let area = portfolio.Area.find((entry) => entry.Area === result.Area)
            if (area === undefined) {
                area = { Area: result.Area, Runbooks: [] }
                portfolio.Area.push(area)
                areaCount++
                
                logger.debug('New area created', {
                    operation: 'createJSON',
                    portfolioName: result.Portfolio,
                    areaName: result.Area,
                    tool: 'RunbookJson'
                })
            }
            
            let runbooks = area.Runbooks.find((entry) => entry.Name === result.Name)
            if (runbooks === undefined) {
                runbooks = { 
                    Name: result.Name, 
                    Progress: result.Progress, 
                    Status: result.Status, 
                    Maintenance: result.Maintenance,
                    StartTime: result.Start_Time, 
                    EndTime: result.End_Time, 
                    MaintenanceStartTime: result.Maintenance_Start_Time,
                    LastExecution: result.Last_Execution, 
                    NextExecution: result.Next_Execution, 
                    URL: result.URL, 
                    TotalJobs: result.Total_jobs,
                    SuccessfulJobs: result.Successful_jobs, 
                    FailedJobs: result.Failed_jobs, 
                    TotalTime: result.Total_Time 
                }
                area.Runbooks.push(runbooks)
                runbookCount++
                
                logger.debug('New runbook added', {
                    operation: 'createJSON',
                    portfolioName: result.Portfolio,
                    areaName: result.Area,
                    runbookName: result.Name,
                    status: result.Status,
                    maintenance: result.Maintenance,
                    tool: 'RunbookJson'
                })
            }
        })

        const duration = Date.now() - startTime
        logger.info('JSON structure created successfully', {
            operation: 'createJSON',
            duration,
            inputRecords: results.length,
            portfoliosCreated: portfolioCount,
            areasCreated: areaCount,
            runbooksProcessed: runbookCount,
            outputPortfolios: fullArr.length,
            tool: 'RunbookJson'
        })

        // Log status distribution
        const statusCounts = {}
        const maintenanceCounts = { true: 0, false: 0 }
        
        results.forEach(result => {
            statusCounts[result.Status] = (statusCounts[result.Status] || 0) + 1
            maintenanceCounts[result.Maintenance] = (maintenanceCounts[result.Maintenance] || 0) + 1
        })

        logger.info('Runbook status distribution', {
            operation: 'createJSON',
            statusDistribution: statusCounts,
            maintenanceDistribution: maintenanceCounts,
            tool: 'RunbookJson'
        })

        return fullArr
    } catch (err) {
        const duration = Date.now() - startTime
        logError(err, 'JSON creation failed', {
            operation: 'createJSON',
            duration,
            inputRecordCount: results.length
        })
        return []
    }
}

export { grabRunbookStatus }
