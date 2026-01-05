import sql from 'mssql'

import { logger, logError } from '../Components/Logger.js'
import { poolPromise } from '../configurations/SQL/ConnectionPool.js'
import { dashPoolPromise } from '../configurations/SQL/DashConnectionPool.js'

const dashDefinedLocations = new Map()
const dbDefinedLocations = new Map()

async function getDbLocations() {
    try {
        dbDefinedLocations.clear()
        const pool = await poolPromise
        const results = await pool.request().query(`select SysID, Name, RunDCs, DatabaseDCs from THDDB.dbo.DashApplication where SysID not like 'Pseudo%'`)
        results.recordset.forEach((value) => {
            dbDefinedLocations.set(value.SysID, { name: value.Name, runDCs: value.RunDCs, databaseDCs: value.DatabaseDCs })
        })
        
        logger.debug('DB locations retrieved', {
            operation: 'getDbLocations',
            locationCount: dbDefinedLocations.size,
            tool: 'DashLocationData'
        })
    } catch (err) {
        logError(err, 'Failed to get DB locations', { operation: 'getDbLocations' })
    }
}

async function getDashDc() {
    try {
        dashDefinedLocations.clear()
        let processedCount = 0
        let foundCount = 0
        let notFoundCount = 0

        for (const dashSysID of dbDefinedLocations.keys()) {
            try {
                const dashQuery = `select dv_u_database_currently_running_in, dv_u_application_currently_running_in, name
                                        from TSS_Reporting.dbo.cmdb_ci_service_auto
                                        where sys_id = @dashSysID
                                        and dv_u_application_currently_running_in is not null
                                        and dv_u_database_currently_running_in is not null`
                const dashPool = await dashPoolPromise
                const serverData = await dashPool.request()
                    .input('dashSysID', sql.NVarChar, dashSysID)
                    .query(dashQuery)
                
                processedCount++
                
                if (serverData.recordset.length) {
                    for (const app of serverData.recordset) {
                        dashDefinedLocations.set(dashSysID, { 
                            name: app.name, 
                            databaseDCs: app.dv_u_database_currently_running_in, 
                            runDCs: app.dv_u_application_currently_running_in 
                        })
                        foundCount++
                        
                        logger.debug('Location data found for system', {
                            operation: 'getDashDc',
                            sysID: dashSysID,
                            appName: app.name,
                            runDCs: app.dv_u_application_currently_running_in,
                            databaseDCs: app.dv_u_database_currently_running_in,
                            tool: 'DashLocationData'
                        })
                    }
                } else {
                    notFoundCount++
                    logger.warn('SysID not found in Dash', {
                        operation: 'getDashDc',
                        sysID: dashSysID,
                        tool: 'DashLocationData'
                    })
                }
            } catch (err) {
                logError(err, 'Failed to process individual SysID', { 
                    operation: 'getDashDc',
                    sysID: dashSysID
                })
            }
        }

        logger.info('Dash DC data retrieval completed', {
            operation: 'getDashDc',
            totalProcessed: processedCount,
            foundSystems: foundCount,
            notFoundSystems: notFoundCount,
            dashLocationsCount: dashDefinedLocations.size,
            tool: 'DashLocationData'
        })
    } catch (err) {
        logError(err, 'Failed to get Dash DC data', { operation: 'getDashDc' })
    }
}

async function updateState() {
    try {
        let updatedCount = 0
        let unchangedCount = 0

        for (const [appSysID, dbApp] of dbDefinedLocations) {
            const dashInfo = dashDefinedLocations.get(appSysID)

            if (dashInfo !== undefined && (dbApp.databaseDCs !== dashInfo.databaseDCs || dbApp.runDCs !== dashInfo.runDCs || dbApp.name !== dashInfo.name)) {
                try {
                    const pool = await poolPromise
                    await pool.request()
                        .input('name', sql.NVarChar, dashInfo.name)
                        .input('runDCs', sql.NVarChar, dashInfo.runDCs)
                        .input('databaseDCs', sql.NVarChar, dashInfo.databaseDCs)
                        .input('sysID', sql.NVarChar, appSysID)
                        .query(`update THDDB.dbo.DashApplication 
                        set Name = @name, 
                            RunDCs = @runDCs, 
                            DatabaseDCs = @databaseDCs, 
                            LastUpdated = sysdatetime() 
                        where SysID = @sysID`)

                    updatedCount++
                    logger.info('Location data updated', {
                        operation: 'updateState',
                        sysID: appSysID,
                        previousName: dbApp.name,
                        newName: dashInfo.name,
                        previousRunDCs: dbApp.runDCs,
                        newRunDCs: dashInfo.runDCs,
                        previousDatabaseDCs: dbApp.databaseDCs,
                        newDatabaseDCs: dashInfo.databaseDCs,
                        tool: 'DashLocationData'
                    })
                } catch (err) {
                    logError(err, 'Failed to update individual location', { 
                        operation: 'updateState',
                        sysID: appSysID
                    })
                }
            } else {
                unchangedCount++
            }
        }

        logger.info('Location state updates completed', {
            operation: 'updateState',
            totalUpdated: updatedCount,
            unchangedCount,
            tool: 'DashLocationData'
        })
    } catch (err) {
        logError(err, 'Failed to update location states', { operation: 'updateState' })
    }
}

async function runLocationDataAPI() {
    const startTime = Date.now()
    try {
        logger.debug('Starting location data API cycle', { 
            operation: 'runLocationDataAPI',
            tool: 'DashLocationData'
        })

        await getDbLocations()
        await getDashDc()
        await updateState()

        const duration = Date.now() - startTime
        logger.info('Location data API cycle completed', {
            operation: 'runLocationDataAPI',
            duration,
            dbLocationsProcessed: dbDefinedLocations.size,
            dashLocationsFound: dashDefinedLocations.size,
            tool: 'DashLocationData'
        })
    } catch (err) {
        logError(err, 'Location data API cycle failed', { 
            operation: 'runLocationDataAPI',
            duration: Date.now() - startTime
        })
    }
}

logger.info('DashLocationData API service starting', { 
    component: 'DashLocationDataAPI', 
    tool: 'DashLocationData',
    intervalMinutes: 60
})
runLocationDataAPI()
setInterval(() => {runLocationDataAPI()}, 3600000) // refresh hourly
