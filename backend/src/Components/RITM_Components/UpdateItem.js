import sql from 'mssql'

import { poolPromise } from '../../configurations/SQL/ConnectionPool.js'
import { dashPoolPromise } from '../../configurations/SQL/DashConnectionPool.js'
import { logger, logError } from '../Logger.js'
import { SUCCESS, FATAL_ERROR, MISSING_THD_ERROR, DASH_APP_NAME_FAIL } from '../StatusCodes.js'

const tableStructure = new Map([
    ['Area', {
        tableName: 'Area',
        parent: 'Portfolio',
    }],
    ['Application', {
        tableName: 'Application',
        parent: 'Area',
    }],
    ['Service', {
        tableName: 'Service',
        parent: 'Application',
    }]
])

async function updateName(table, newName, id) {
    try {
        const tableInfo = tableStructure.get(table)
        if (!tableInfo) {
            logger.error('Invalid table name for update', {
                operation: 'updateName',
                table,
                newName,
                id,
                tool: 'RITM'
            })
            return FATAL_ERROR
        }

        logger.debug('Updating name', {
            operation: 'updateName',
            table: tableInfo.tableName,
            newName,
            id,
            tool: 'RITM'
        })

        const pool = await poolPromise
        const updateStr = `update THDDB.dbo.${tableInfo.tableName} set Name = @newName where ID = @id`
        const result = await pool.request()
            .input('newName', sql.NVarChar, newName)
            .input('id', sql.Int, id)
            .query(updateStr)

        const success = result.rowsAffected.length > 0
        
        if (success) {
            logger.info('Name updated successfully', {
                operation: 'updateName',
                table: tableInfo.tableName,
                newName,
                id,
                rowsAffected: result.rowsAffected[0],
                tool: 'RITM'
            })
            return SUCCESS
        } else {
            logger.error('Name update failed - no rows affected', {
                operation: 'updateName',
                table: tableInfo.tableName,
                newName,
                id,
                tool: 'RITM'
            })
            return FATAL_ERROR
        }
    } catch (err) {
        logError(err, 'Name update failed', {
            operation: 'updateName',
            table,
            newName,
            id
        })
        return FATAL_ERROR
    }
}

async function updatePosition(table, newParentId, currentId) {
    try {
        const tableInfo = tableStructure.get(table)
        if (!tableInfo) {
            logger.error('Invalid table name for position update', {
                operation: 'updatePosition',
                table,
                newParentId,
                currentId,
                tool: 'RITM'
            })
            return FATAL_ERROR
        }

        logger.debug('Updating position', {
            operation: 'updatePosition',
            table: tableInfo.tableName,
            parentField: `${tableInfo.parent}_ID`,
            newParentId,
            currentId,
            tool: 'RITM'
        })

        const pool = await poolPromise
        const updateStr = `update THDDB.dbo.${tableInfo.tableName} set ${tableInfo.parent}_ID = @newParentId where ID = @currentId`

        const result = await pool.request()
            .input('newParentId', sql.Int, newParentId)
            .input('currentId', sql.Int, currentId)
            .query(updateStr)

        const success = result.rowsAffected.length > 0
        
        if (success) {
            logger.info('Position updated successfully', {
                operation: 'updatePosition',
                table: tableInfo.tableName,
                newParentId,
                currentId,
                rowsAffected: result.rowsAffected[0],
                tool: 'RITM'
            })
            return SUCCESS
        } else {
            logger.error('Position update failed - no rows affected', {
                operation: 'updatePosition',
                table: tableInfo.tableName,
                newParentId,
                currentId,
                tool: 'RITM'
            })
            return FATAL_ERROR
        }
    } catch (err) {
        logError(err, 'Position update failed', {
            operation: 'updatePosition',
            table,
            newParentId,
            currentId
        })
        return FATAL_ERROR
    }
}

async function updateArea(areaValues) {
    try {
        const currentName = areaValues.currentName
        const portfolioName = areaValues.portfolioName

        logger.info('Area update started', {
            operation: 'updateArea',
            currentName,
            portfolioName,
            updateType: areaValues.Type,
            newName: areaValues.newName,
            tool: 'RITM'
        })

        const queryStr = `select ID from THDDB.dbo.Area ar where ar.Name = @currentName and exists
                        (select 1 from THDDB.dbo.Portfolio p where ar.Portfolio_ID = p.ID and p.Name = @portfolioName)`

        const pool = await poolPromise
        const result = await pool
            .request()
            .input('currentName', sql.NVarChar, currentName)
            .input('portfolioName', sql.NVarChar, portfolioName)
            .query(queryStr)

        if (result.recordset.length === 0) {
            logger.warn('Area not found for update', {
                operation: 'updateArea',
                currentName,
                portfolioName,
                tool: 'RITM'
            })
            return MISSING_THD_ERROR
        }

        const id = result.recordset[0].ID

        if (areaValues.Type === 'Name') {
            const newName = areaValues.newName
            const updateResult = await updateName(areaValues.Tier, newName, id)
            
            logger.info('Area update completed', {
                operation: 'updateArea',
                currentName,
                newName,
                portfolioName,
                areaId: id,
                result: updateResult,
                success: updateResult === SUCCESS,
                tool: 'RITM'
            })
            
            return updateResult
        }
    } catch (err) {
        logError(err, 'Area update failed', {
            operation: 'updateArea',
            currentName: areaValues.currentName,
            portfolioName: areaValues.portfolioName
        })
        return FATAL_ERROR
    }
}

async function updateDashApplication(newDashName, applicationId) {
    try {
        logger.debug('Dash application update started', {
            operation: 'updateDashApplication',
            newDashName,
            applicationId,
            tool: 'RITM'
        })

        const dashQuery = 'select sys_id from TSS_Reporting.dbo.cmdb_ci_service_auto where name = @newDashName'
        const dashPool = await dashPoolPromise
        const result = await dashPool.request()
            .input('newDashName', newDashName)
            .query(dashQuery)

        if (!result || result.recordset.length === 0) { 
            logger.warn('Dash application name not found', {
                operation: 'updateDashApplication',
                newDashName,
                applicationId,
                tool: 'RITM'
            })
            return DASH_APP_NAME_FAIL 
        }

        const sysId = result.recordset[0].sys_id
        const pool = await poolPromise
        const dashIdQuery = `merge THDDB.dbo.DashApplication as target
                            using (select @sysID as sysID) as source
                            on target.SysID = source.sysID
                            when not matched then
                                insert (SysID, Name)
                                values (source.sysID, @newDashName);`
        await pool.request()
            .input('sysID', sql.NVarChar, sysId)
            .input('newDashName', sql.NVarChar, newDashName)
            .query(dashIdQuery)

        const updateStr = `update THDDB.dbo.Application set Dash_SysID = @sysID where ID = @id`
        const updateResult = await pool.request()
            .input('sysID', sql.NVarChar, sysId)
            .input('id', sql.Int, applicationId)
            .query(updateStr)

        const success = updateResult.rowsAffected.length > 0
        
        if (success) {
            logger.info('Dash application updated successfully', {
                operation: 'updateDashApplication',
                newDashName,
                sysId,
                applicationId,
                rowsAffected: updateResult.rowsAffected[0],
                tool: 'RITM'
            })
        } else {
            logger.error('Dash application update failed - no rows affected', {
                operation: 'updateDashApplication',
                newDashName,
                sysId,
                applicationId,
                tool: 'RITM'
            })
        }

        return success ? SUCCESS : FATAL_ERROR
    } catch (err) {
        logError(err, 'Dash application update failed', {
            operation: 'updateDashApplication',
            newDashName,
            applicationId
        })
        return FATAL_ERROR
    }
}

async function updateApplication(applicationValues) {
    try {
        const currentName = applicationValues.currentName
        const areaName = applicationValues.areaName
        const portfolioName = applicationValues.portfolioName

        logger.info('Application update started', {
            operation: 'updateApplication',
            currentName,
            areaName,
            portfolioName,
            updateType: applicationValues.Type,
            tool: 'RITM'
        })

        const queryId = `select ID from THDDB.dbo.Application ap where ap.Name = @currentName and exists
                        (select 1 from THDDB.dbo.Area ar where ap.Area_ID = ar.ID and ar.Name = @areaName and exists
                        (select 1 from THDDB.dbo.Portfolio p where ar.Portfolio_ID = p.ID and p.Name = @portfolioName))`

        const pool = await poolPromise
        const result = await pool.request()
            .input('currentName', sql.NVarChar, currentName)
            .input('areaName', sql.NVarChar, areaName)
            .input('portfolioName', sql.NVarChar, portfolioName)
            .query(queryId)

        if (result.recordset.length === 0) {
            logger.warn('Application not found for update', {
                operation: 'updateApplication',
                currentName,
                areaName,
                portfolioName,
                tool: 'RITM'
            })
            return MISSING_THD_ERROR
        }
        const id = result.recordset[0].ID

        let updateResult = null

        if (applicationValues.Type === 'Name') {
            updateResult = await updateName(applicationValues.Tier, applicationValues.newName, id)
        } else if (applicationValues.Type === 'Position') {
            const newAreaName = applicationValues.newAreaName
            const newPortfolioName = applicationValues.newPortfolioName
            const newQueryId = `select ID from THDDB.dbo.Area ar where ar.Name = @newAreaName and exists
                                (select 1 from THDDB.dbo.Portfolio p where ar.Portfolio_ID = p.ID and p.Name = @newPortfolioName)`

            const newId = await pool.request()
                .input('newAreaName', sql.NVarChar, newAreaName)
                .input('newPortfolioName', sql.NVarChar, newPortfolioName)
                .query(newQueryId)

            if (newId.recordset.length === 0) {
                logger.warn('New area not found for application position update', {
                    operation: 'updateApplication',
                    newAreaName,
                    newPortfolioName,
                    tool: 'RITM'
                })
                return MISSING_THD_ERROR
            }
            updateResult = await updatePosition(applicationValues.Tier, newId.recordset[0].ID, id)
        } else if (applicationValues.Type === 'DashApplication') {
            updateResult = await updateDashApplication(applicationValues.newDashAppName, id)
        }

        logger.info('Application update completed', {
            operation: 'updateApplication',
            currentName,
            applicationId: id,
            updateType: applicationValues.Type,
            result: updateResult,
            success: updateResult === SUCCESS,
            tool: 'RITM'
        })

        return updateResult
    } catch (err) {
        logError(err, 'Application update failed', {
            operation: 'updateApplication',
            currentName: applicationValues.currentName,
            areaName: applicationValues.areaName
        })
        return FATAL_ERROR
    }
}

async function updateService(serviceValues) {
    try {
        const currentName = serviceValues.currentName
        const applicationName = serviceValues.applicationName
        const areaName = serviceValues.areaName
        const portfolioName = serviceValues.portfolioName

        logger.info('Service update started', {
            operation: 'updateService',
            currentName,
            applicationName,
            areaName,
            portfolioName,
            updateType: serviceValues.Type,
            tool: 'RITM'
        })

        const queryId = `select ID from THDDB.dbo.Service s where s.Name = @currentName and exists
                        (select 1 from THDDB.dbo.Application ap where s.Application_ID = ap.ID and ap.Name = @applicationName and exists
                        (select 1 from THDDB.dbo.Area ar where ap.Area_ID = ar.ID and ar.Name = @areaName and exists
                        (select 1 from THDDB.dbo.Portfolio p where ar.Portfolio_ID = p.ID and p.Name = @portfolioName)))`
        const pool = await poolPromise
        const result = await pool.request()
            .input('currentName', sql.NVarChar, currentName)
            .input('applicationName', sql.NVarChar, applicationName)
            .input('areaName', sql.NVarChar, areaName)
            .input('portfolioName', sql.NVarChar, portfolioName)
            .query(queryId)

        if (result.recordset.length === 0) {
            logger.warn('Service not found for update', {
                operation: 'updateService',
                currentName,
                applicationName,
                areaName,
                portfolioName,
                tool: 'RITM'
            })
            return MISSING_THD_ERROR
        }
        const id = result.recordset[0].ID

        let updateResult = null

        if (serviceValues.Type === 'Name') {
            const newName = serviceValues.newName
            updateResult = await updateName(serviceValues.Tier, newName, id)
        } else if (serviceValues.Type === 'Position') {
            const newApplicationName = serviceValues.newApplicationName
            const newAreaName = serviceValues.newAreaName
            const newPortfolioName = serviceValues.newPortfolioName

            const newQueryId = `select ID from THDDB.dbo.Application ap where ap.Name = @newApplicationName and exists
                                (select 1 from THDDB.dbo.Area ar where ap.Area_ID = ar.ID and ar.Name = @newAreaName and exists
                                (select 1 from THDDB.dbo.Portfolio p where ar.Portfolio_ID = p.ID and p.Name = @newPortfolioName))`

            let newId = await pool.request()
                .input('newApplicationName', sql.NVarChar, newApplicationName)
                .input('newAreaName', sql.NVarChar, newAreaName)
                .input('newPortfolioName', sql.NVarChar, newPortfolioName)
                .query(newQueryId)

            if (newId.recordset.length === 0) {
                logger.warn('New application not found for service position update', {
                    operation: 'updateService',
                    newApplicationName,
                    newAreaName,
                    newPortfolioName,
                    tool: 'RITM'
                })
                return MISSING_THD_ERROR
            } else {
                newId = newId.recordset[0].ID
            }
            updateResult = await updatePosition(serviceValues.Tier, newId, id)
        } else if (serviceValues.Type === 'URL' || serviceValues.Type === 'Priority') {
            const itemChanging = serviceValues.newURL || serviceValues.newPriority

            const validColumns = new Map([['URL', 'URL'], ['Priority', 'Priority']])
            const columnName = validColumns.get(serviceValues.Type)
            if (!columnName) {
                logger.error('Invalid service column type', {
                    operation: 'updateService',
                    columnType: serviceValues.Type,
                    serviceId: id,
                    tool: 'RITM'
                })
                return FATAL_ERROR
            }
            
            const updateStr = `update THDDB.dbo.Service set ${columnName} = @itemChanging where ID = @id`
            const result = await pool.request()
                .input('itemChanging', sql.NVarChar, itemChanging)
                .input('id', sql.Int, id)
                .query(updateStr)

            const success = result.rowsAffected.length > 0
            
            if (success) {
                logger.info('Service property updated successfully', {
                    operation: 'updateService',
                    serviceId: id,
                    columnName,
                    newValue: itemChanging,
                    rowsAffected: result.rowsAffected[0],
                    tool: 'RITM'
                })
                updateResult = SUCCESS
            } else {
                logger.error('Service property update failed - no rows affected', {
                    operation: 'updateService',
                    serviceId: id,
                    columnName,
                    newValue: itemChanging,
                    tool: 'RITM'
                })
                updateResult = FATAL_ERROR
            }
        }

        logger.info('Service update completed', {
            operation: 'updateService',
            currentName,
            serviceId: id,
            updateType: serviceValues.Type,
            result: updateResult,
            success: updateResult === SUCCESS,
            tool: 'RITM'
        })

        return updateResult
    } catch (err) {
        logError(err, 'Service update failed', {
            operation: 'updateService',
            currentName: serviceValues.currentName,
            applicationName: serviceValues.applicationName
        })
        return FATAL_ERROR
    }
}

async function updateAlertId(alertValues) {
    try {
        const currentName = alertValues.currentName
        const serviceName = alertValues.serviceName
        const applicationName = alertValues.applicationName
        const areaName = alertValues.areaName
        const portfolioName = alertValues.portfolioName

        logger.info('Alert ID update started', {
            operation: 'updateAlertId',
            currentName,
            serviceName,
            applicationName,
            areaName,
            portfolioName,
            updateType: alertValues.Type,
            tool: 'RITM'
        })

        const queryId = `select ID from THDDB.dbo.Alert al where al.Alert_Name = @currentName and exists
                        (select 1 from THDDB.dbo.Service s where al.Service_ID = s.ID and s.Name = @serviceName and exists
                        (select 1 from THDDB.dbo.Application ap where s.Application_ID = ap.ID and ap.Name = @applicationName and exists
                        (select 1 from THDDB.dbo.Area ar where ap.Area_ID = ar.ID and ar.Name = @areaName and exists
                        (select 1 from THDDB.dbo.Portfolio p where ar.Portfolio_ID = p.ID and p.Name = @portfolioName))))`

        const pool = await poolPromise
        let id = await pool.request()
            .input('currentName', sql.NVarChar, currentName)
            .input('serviceName', sql.NVarChar, serviceName)
            .input('applicationName', sql.NVarChar, applicationName)
            .input('areaName', sql.NVarChar, areaName)
            .input('portfolioName', sql.NVarChar, portfolioName)
            .query(queryId)

        if (id.recordset.length === 0) {
            logger.warn('Alert not found for update', {
                operation: 'updateAlertId',
                currentName,
                serviceName,
                applicationName,
                areaName,
                portfolioName,
                tool: 'RITM'
            })
            return MISSING_THD_ERROR
        } else {
            id = id.recordset[0].ID
        }

        if (alertValues.Type === 'AlertID') {
            const newAlertId = alertValues.newAlertID
            const updateStr = `update THDDB.dbo.Alert set Alert_Id = @newAlertId where ID = @id`

            const result = await pool.request()
                .input('newAlertId', sql.Int, newAlertId)
                .input('id', sql.Int, id)
                .query(updateStr)
            
            const success = result.rowsAffected.length > 0
            
            if (success) {
                logger.info('Alert ID updated successfully', {
                    operation: 'updateAlertId',
                    alertName: currentName,
                    alertDbId: id,
                    newAlertId,
                    rowsAffected: result.rowsAffected[0],
                    tool: 'RITM'
                })
                return SUCCESS
            } else {
                logger.error('Alert ID update failed - no rows affected', {
                    operation: 'updateAlertId',
                    alertName: currentName,
                    alertDbId: id,
                    newAlertId,
                    tool: 'RITM'
                })
                return FATAL_ERROR
            }
        }
    } catch (err) {
        logError(err, 'Alert ID update failed', {
            operation: 'updateAlertId',
            currentName: alertValues.currentName,
            serviceName: alertValues.serviceName
        })
        return FATAL_ERROR
    }
}

async function updateItems(request, callback) {
    const startTime = Date.now()
    try {
        const tier = request.body.Tier
        const updateType = request.body.Type

        logger.info('Item update request received', {
            operation: 'updateItems',
            tier,
            updateType,
            tool: 'RITM'
        })

        let result = null

        if (tier === 'Area') {
            result = await updateArea(request.body)
        } else if (tier === 'Application') {
            result = await updateApplication(request.body)
        } else if (tier === 'Service') {
            result = await updateService(request.body)
        } else if (tier === 'Alert') {
            result = await updateAlertId(request.body)
        }

        const duration = Date.now() - startTime
        logger.info('Item update completed', {
            operation: 'updateItems',
            tier,
            updateType,
            duration,
            result,
            success: result === SUCCESS,
            tool: 'RITM'
        })

        callback(result)
    } catch (err) {
        const duration = Date.now() - startTime
        logError(err, 'Item update failed', {
            operation: 'updateItems',
            tier: request.body?.Tier,
            updateType: request.body?.Type,
            duration,
            requestBody: request.body
        })
        callback(FATAL_ERROR)
    }
}

export { updateItems }
