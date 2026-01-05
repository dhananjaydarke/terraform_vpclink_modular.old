import { logger, logError } from './Logger.js'
import { poolPromise } from '../configurations/SQL/ConnectionPool.js'

async function grabCurrentStatus(domain, callback) {
    const startTime = Date.now()
    try {
        logger.debug('Current status query started', {
            operation: 'grabCurrentStatus',
            domain,
            tool: 'StatusJson'
        })

        const pool = await poolPromise
        const queryStr = `select p.Name Portfolio, ar.Name Area, ap.Name Application, 
            s.Name Service, al.Alert_Name, al.Status, 
            FORMAT(al.WriteTime, 'yyyy-MM-dd HH:mm:ss') WriteTime, 
            s.URL, s.Priority, al.Tool, da.RunDCs, 
            da.DatabaseDCs, ar.LIAT,
            mc.CHG_Number ModifiedChangeNumber,
            ic.CHG_Number ImpactedChangeNumber
        from THDDB.dbo.Portfolio p
        inner join THDDB.dbo.Area ar on p.ID = ar.Portfolio_ID
        inner join THDDB.dbo.Application ap on ar.ID = ap.Area_ID
        left join THDDB.dbo.DashApplication da on ap.Dash_SysID = da.SysID
        left join THDDB.dbo.ModifiedChange mc on da.SysID = mc.SysID
        left join THDDB.dbo.ImpactedChange ic on da.SysID = ic.SysID
        inner join THDDB.dbo.Service s on ap.ID = s.Application_ID
        left join THDDB.dbo.Alert al on s.ID = al.Service_ID
        where ${domain}
        order by p.Sequence, Portfolio, ar.Sequence, Area, 
        ap.Sequence, Application, s.Priority, s.Sequence, Service
        option (hash join);`

        await pool.request().query(queryStr, (error, results) => {
            if (error) {
                logError(error, 'Database query failed', {
                    operation: 'grabCurrentStatus',
                    domain,
                    queryStr: queryStr.substring(0, 200) + '...'
                })
                throw error
            }

            const duration = Date.now() - startTime
            logger.info('Current status query completed', {
                operation: 'grabCurrentStatus',
                domain,
                duration,
                recordCount: results.recordset.length,
                tool: 'StatusJson'
            })

            const jsonResult = createJSON(results.recordset)

            logger.info('Status JSON created successfully', {
                operation: 'grabCurrentStatus',
                domain,
                totalDuration: Date.now() - startTime,
                portfolioCount: jsonResult.length,
                totalRecords: results.recordset.length,
                tool: 'StatusJson'
            })

            return callback(jsonResult)
        })
    } catch (err) {
        const duration = Date.now() - startTime
        logError(err, 'Current status retrieval failed', {
            operation: 'grabCurrentStatus',
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
            tool: 'StatusJson'
        })

        const portfolioMap = new Map()
        let portfolioCount = 0
        let areaCount = 0
        let applicationCount = 0
        let serviceCount = 0
        let alertCount = 0
        let nullAlertCount = 0
        let modifiedChangeCount = 0
        let impactedChangeCount = 0

        // Status distribution tracking
        const statusCounts = {}
        const toolCounts = {}

        results.forEach((result) => {
            // Portfolio handling
            let portfolio = portfolioMap.get(result.Portfolio)
            if (!portfolio) {
                portfolio = { Portfolio: result.Portfolio, Areas: new Map() }
                portfolioMap.set(result.Portfolio, portfolio)
                portfolioCount++

                logger.debug('New portfolio created', {
                    operation: 'createJSON',
                    portfolioName: result.Portfolio,
                    tool: 'StatusJson'
                })
            }

            // Area handling
            let area = portfolio.Areas.get(result.Area)
            if (!area) {
                area = { Name: result.Area, Applications: new Map() }
                portfolio.Areas.set(result.Area, area)
                areaCount++

                logger.debug('New area created', {
                    operation: 'createJSON',
                    portfolioName: result.Portfolio,
                    areaName: result.Area,
                    tool: 'StatusJson'
                })
            }

            // Application handling
            let application = area.Applications.get(result.Application)
            if (!application) {
                application = {
                    Name: result.Application,
                    RunDCs: result.RunDCs,
                    DBDCs: result.DatabaseDCs,
                    ModifiedChanges: new Set(),
                    ImpactedChanges: new Set(),
                    Services: new Map()
                }
                area.Applications.set(result.Application, application)
                applicationCount++

                logger.debug('New application created', {
                    operation: 'createJSON',
                    portfolioName: result.Portfolio,
                    areaName: result.Area,
                    applicationName: result.Application,
                    runDCs: result.RunDCs,
                    dbDCs: result.DatabaseDCs,
                    tool: 'StatusJson'
                })
            }

            // Handle changes
            if (result.ModifiedChangeNumber) {
                application.ModifiedChanges.add(result.ModifiedChangeNumber)
                modifiedChangeCount++
            }
            if (result.ImpactedChangeNumber) {
                application.ImpactedChanges.add(result.ImpactedChangeNumber)
                impactedChangeCount++
            }

            // Service handling
            let service = application.Services.get(result.Service)
            if (!service) {
                service = {
                    Name: result.Service,
                    URL: result.URL,
                    Priority: result.Priority,
                    Alerts: new Map()
                }
                application.Services.set(result.Service, service)
                serviceCount++

                logger.debug('New service created', {
                    operation: 'createJSON',
                    portfolioName: result.Portfolio,
                    areaName: result.Area,
                    applicationName: result.Application,
                    serviceName: result.Service,
                    priority: result.Priority,
                    tool: 'StatusJson'
                })
            }

            // Alert handling
            if (result.Alert_Name) {
                if (!service.Alerts.has(result.Alert_Name)) {
                    service.Alerts.set(result.Alert_Name, {
                        Name: result.Alert_Name,
                        Status: result.Status,
                        Time: result.WriteTime,
                        Tool: result.Tool
                    })
                    alertCount++

                    // Track status and tool distribution
                    statusCounts[result.Status] = (statusCounts[result.Status] || 0) + 1
                    toolCounts[result.Tool] = (toolCounts[result.Tool] || 0) + 1

                    logger.debug('New alert added', {
                        operation: 'createJSON',
                        portfolioName: result.Portfolio,
                        areaName: result.Area,
                        applicationName: result.Application,
                        serviceName: result.Service,
                        alertName: result.Alert_Name,
                        status: result.Status,
                        tool: result.Tool
                    })
                }
            } else if (!service.Alerts.has('nullAlert')) {
                service.Alerts.set('nullAlert', {
                    Name: null,
                    Status: null,
                    Time: null,
                    Tool: null
                })
                nullAlertCount++
            }
        })

        // Convert Maps back to arrays for final output
        const finalResult = Array.from(portfolioMap.values()).map(convertPortfolio)

        const duration = Date.now() - startTime
        logger.info('JSON structure created successfully', {
            operation: 'createJSON',
            duration,
            inputRecords: results.length,
            portfoliosCreated: portfolioCount,
            areasCreated: areaCount,
            applicationsCreated: applicationCount,
            servicesCreated: serviceCount,
            alertsProcessed: alertCount,
            nullAlerts: nullAlertCount,
            modifiedChanges: modifiedChangeCount,
            impactedChanges: impactedChangeCount,
            outputPortfolios: finalResult.length,
            tool: 'StatusJson'
        })

        // Log status and tool distribution
        logger.info('Alert status distribution', {
            operation: 'createJSON',
            statusDistribution: statusCounts,
            toolDistribution: toolCounts,
            tool: 'StatusJson'
        })

        return finalResult
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

function convertService(service) {
    return {
        Name: service.Name,
        URL: service.URL,
        Priority: service.Priority,
        Alerts: Array.from(service.Alerts.values())
    }
}

function convertApplication(app) {
    return {
        Name: app.Name,
        RunDCs: app.RunDCs,
        DBDCs: app.DBDCs,
        ModifiedChanges: Array.from(app.ModifiedChanges).sort(),
        ImpactedChanges: Array.from(app.ImpactedChanges).sort(),
        Services: Array.from(app.Services.values()).map(convertService)
    }
}

function convertArea(area) {
    return {
        Name: area.Name,
        Applications: Array.from(area.Applications.values()).map(convertApplication)
    }
}

function convertPortfolio(portfolio) {
    return {
        Portfolio: portfolio.Portfolio,
        Areas: Array.from(portfolio.Areas.values()).map(convertArea)
    }
}

export { grabCurrentStatus }
