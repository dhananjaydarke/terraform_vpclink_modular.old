import sql from 'mssql'

import { poolPromise } from '../../configurations/SQL/ConnectionPool.js'
import { logger, logError } from '../Logger.js'
import { MISSING_THD_ERROR, SUCCESS, FATAL_ERROR } from '../StatusCodes.js'

async function removeAlert(req) {
    try {
        const name = req.Alert
        const relatedService = req.Service
        const relatedApp = req.Application
        const relatedArea = req.Area
        const relatedPortfolio = req.Portfolio
        
        logger.info('Alert deletion started', {
            operation: 'removeAlert',
            alertName: name,
            service: relatedService,
            application: relatedApp,
            area: relatedArea,
            portfolio: relatedPortfolio,
            tool: 'RITM'
        })

        const pool = await poolPromise
        const idQuery = `select Alert.ID from THDDB.dbo.Alert Alert
                            inner join THDDB.dbo.Service Service on Alert.Service_ID = Service.ID
                            inner join THDDB.dbo.Application Application on Service.Application_ID = Application.ID
                            inner join THDDB.dbo.Area Area on Application.Area_ID = Area.ID
                            inner join THDDB.dbo.Portfolio Portfolio on Portfolio.ID = Area.Portfolio_ID
                        where Alert.Alert_Name = @name and Service.Name = @service and Application.Name = @app and Area.Name = @area and Portfolio.Name = @portfolio`

        const id = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('service', sql.NVarChar, relatedService)
            .input('app', sql.NVarChar, relatedApp)
            .input('area', sql.NVarChar, relatedArea)
            .input('portfolio', sql.NVarChar, relatedPortfolio)
            .query(idQuery)

        if (id.recordset.length === 0) {
            logger.warn('Alert not found for deletion', {
                operation: 'removeAlert',
                alertName: name,
                service: relatedService,
                application: relatedApp,
                area: relatedArea,
                portfolio: relatedPortfolio,
                tool: 'RITM'
            })
            return MISSING_THD_ERROR
        }

        const alertId = id.recordset[0].ID
        const deleteStr = `delete from THDDB.dbo.AlertStatusHistory where Alert_ID = @alertId;
                            delete from THDDB.dbo.Alert where ID = @alertId`

        const result = await pool.request()
            .input('alertId', sql.Int, alertId)
            .query(deleteStr)

        if (result.rowsAffected.length > 0) {
            logger.info('Alert deleted successfully', {
                operation: 'removeAlert',
                alertName: name,
                alertId,
                historyRowsDeleted: result.rowsAffected[0] || 0,
                alertRowsDeleted: result.rowsAffected[1] || 0,
                tool: 'RITM'
            })
            return SUCCESS
        } else {
            logger.error('Alert deletion failed - no rows affected', {
                operation: 'removeAlert',
                alertName: name,
                alertId,
                tool: 'RITM'
            })
            return FATAL_ERROR
        }
    } catch (err) {
        logError(err, 'Alert deletion failed', {
            operation: 'removeAlert',
            alertName: req.Alert
        })
        return FATAL_ERROR
    }
}

async function removeService(req) {
    try {
        const name = req.Service
        const relatedApp = req.Application
        const relatedArea = req.Area
        const relatedPortfolio = req.Portfolio
        
        logger.info('Service deletion started', {
            operation: 'removeService',
            serviceName: name,
            application: relatedApp,
            area: relatedArea,
            portfolio: relatedPortfolio,
            tool: 'RITM'
        })

        const pool = await poolPromise
        const idQuery = `select Service.ID from THDDB.dbo.Service Service 
                            inner join THDDB.dbo.Application Application on Service.Application_ID = Application.ID 
                            inner join THDDB.dbo.Area Area on Area.ID = Application.Area_ID 
                            inner join THDDB.dbo.Portfolio Portfolio on Portfolio.ID = Area.Portfolio_ID
                        where Service.Name = @name and Application.Name = @app and Area.Name = @area and Portfolio.Name = @portfolio`

        const id = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('app', sql.NVarChar, relatedApp)
            .input('area', sql.NVarChar, relatedArea)
            .input('portfolio', sql.NVarChar, relatedPortfolio)
            .query(idQuery)

        if (id.recordset.length === 0) {
            logger.warn('Service not found for deletion', {
                operation: 'removeService',
                serviceName: name,
                application: relatedApp,
                area: relatedArea,
                portfolio: relatedPortfolio,
                tool: 'RITM'
            })
            return MISSING_THD_ERROR
        }

        const serviceId = id.recordset[0].ID
        const deleteStr = `delete History from THDDB.dbo.AlertStatusHistory History
                                inner join THDDB.dbo.Alert Alert on History.Alert_ID = Alert.ID
                            where Alert.Service_ID = @serviceId;
                            delete from THDDB.dbo.Alert where Service_ID = @serviceId;
                            delete from THDDB.dbo.Service where ID = @serviceId`

        const result = await pool.request()
            .input('serviceId', sql.Int, serviceId)
            .query(deleteStr)

        if (result.rowsAffected.length > 0) {
            logger.info('Service deleted successfully', {
                operation: 'removeService',
                serviceName: name,
                serviceId,
                historyRowsDeleted: result.rowsAffected[0] || 0,
                alertRowsDeleted: result.rowsAffected[1] || 0,
                serviceRowsDeleted: result.rowsAffected[2] || 0,
                tool: 'RITM'
            })
            return SUCCESS
        } else {
            logger.error('Service deletion failed - no rows affected', {
                operation: 'removeService',
                serviceName: name,
                serviceId,
                tool: 'RITM'
            })
            return FATAL_ERROR
        }
    } catch (err) {
        logError(err, 'Service deletion failed', {
            operation: 'removeService',
            serviceName: req.Service
        })
        return FATAL_ERROR
    }
}

async function removeApp(req) {
    try {
        const name = req.Application
        const relatedArea = req.Area
        const relatedPortfolio = req.Portfolio
        
        logger.info('Application deletion started', {
            operation: 'removeApp',
            applicationName: name,
            area: relatedArea,
            portfolio: relatedPortfolio,
            tool: 'RITM'
        })

        const pool = await poolPromise
        const idQuery = `select Application.ID from THDDB.dbo.Application Application
                            inner join THDDB.dbo.Area Area on Application.Area_ID = Area.ID
                            inner join THDDB.dbo.Portfolio Portfolio on Portfolio.ID = Area.Portfolio_ID
                        where Application.name = @name and Area.Name = @area and Portfolio.Name = @portfolio`

        const id = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('area', sql.NVarChar, relatedArea)
            .input('portfolio', sql.NVarChar, relatedPortfolio)
            .query(idQuery)

        if (id.recordset.length === 0) {
            logger.warn('Application not found for deletion', {
                operation: 'removeApp',
                applicationName: name,
                area: relatedArea,
                portfolio: relatedPortfolio,
                tool: 'RITM'
            })
            return MISSING_THD_ERROR
        }

        const appId = id.recordset[0].ID
        const deleteStr = `delete History from THDDB.dbo.AlertStatusHistory History
                                inner join THDDB.dbo.Alert Alert on History.Alert_ID = Alert.ID
                                inner join THDDB.dbo.Service Service on Alert.Service_ID = Service.ID
                            where Service.Application_ID = @appId;
                            delete Alert from THDDB.dbo.Alert Alert
                                inner join THDDB.dbo.Service Service on Alert.Service_ID = Service.ID
                            where Service.Application_ID = @appId;
                            delete from THDDB.dbo.Service where Application_ID = @appId;
                            delete from THDDB.dbo.Application where ID = @appId`

        const result = await pool.request()
            .input('appId', sql.Int, appId)
            .query(deleteStr)

        if (result.rowsAffected.length > 0) {
            logger.info('Application deleted successfully', {
                operation: 'removeApp',
                applicationName: name,
                applicationId: appId,
                historyRowsDeleted: result.rowsAffected[0] || 0,
                alertRowsDeleted: result.rowsAffected[1] || 0,
                serviceRowsDeleted: result.rowsAffected[2] || 0,
                applicationRowsDeleted: result.rowsAffected[3] || 0,
                tool: 'RITM'
            })
            return SUCCESS
        } else {
            logger.error('Application deletion failed - no rows affected', {
                operation: 'removeApp',
                applicationName: name,
                applicationId: appId,
                tool: 'RITM'
            })
            return FATAL_ERROR
        }
    } catch (err) {
        logError(err, 'Application deletion failed', {
            operation: 'removeApp',
            applicationName: req.Application
        })
        return FATAL_ERROR
    }
}

async function removeArea(req) {
    try {
        const name = req.Area
        const relatedPortfolio = req.Portfolio
        
        logger.info('Area deletion started', {
            operation: 'removeArea',
            areaName: name,
            portfolio: relatedPortfolio,
            tool: 'RITM'
        })

        const pool = await poolPromise
        const idQuery = `select Area.ID from THDDB.dbo.Area Area
                            inner join THDDB.dbo.Portfolio Portfolio on Area.Portfolio_ID = Portfolio.ID
                        where Area.Name = @name and Portfolio.Name = @portfolio`

        const id = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('portfolio', sql.NVarChar, relatedPortfolio)
            .query(idQuery)

        if (id.recordset.length === 0) {
            logger.warn('Area not found for deletion', {
                operation: 'removeArea',
                areaName: name,
                portfolio: relatedPortfolio,
                tool: 'RITM'
            })
            return MISSING_THD_ERROR
        }

        const areaId = id.recordset[0].ID
        const deleteStr = `delete History from THDDB.dbo.AlertStatusHistory History
                                inner join THDDB.dbo.Alert Alert on History.Alert_ID = Alert.ID
                                inner join THDDB.dbo.Service Service on Alert.Service_ID = Service.ID
                                inner join THDDB.dbo.Application App on Service.Application_ID = App.ID
                            where App.Area_ID = @areaId;
                            delete Alert from THDDB.dbo.Alert Alert
                                inner join THDDB.dbo.Service Service on Alert.Service_ID = Service.ID
                                inner join THDDB.dbo.Application App on Service.Application_ID = App.ID
                            where App.Area_ID = @areaId;
                            delete Service from THDDB.dbo.Service Service
                                inner join THDDB.dbo.Application App on service.Application_ID = App.ID
                            where App.Area_ID = @areaId;
                            delete from THDDB.dbo.Application where Area_ID = @areaId;
                            delete from THDDB.dbo.Area where ID = @areaId`

        const result = await pool.request()
            .input('areaId', sql.Int, areaId)
            .query(deleteStr)

        if (result.rowsAffected.length > 0) {
            logger.info('Area deleted successfully', {
                operation: 'removeArea',
                areaName: name,
                areaId,
                historyRowsDeleted: result.rowsAffected[0] || 0,
                alertRowsDeleted: result.rowsAffected[1] || 0,
                serviceRowsDeleted: result.rowsAffected[2] || 0,
                applicationRowsDeleted: result.rowsAffected[3] || 0,
                areaRowsDeleted: result.rowsAffected[4] || 0,
                tool: 'RITM'
            })
            return SUCCESS
        } else {
            logger.error('Area deletion failed - no rows affected', {
                operation: 'removeArea',
                areaName: name,
                areaId,
                tool: 'RITM'
            })
            return FATAL_ERROR
        }
    } catch (err) {
        logError(err, 'Area deletion failed', {
            operation: 'removeArea',
            areaName: req.Area
        })
        return FATAL_ERROR
    }
}

async function removeItems(request, callback) {
    const startTime = Date.now()
    try {
        logger.info('Item deletion request received', {
            operation: 'removeItems',
            portfolio: request.body.Portfolio,
            area: request.body.Area,
            application: request.body.Application,
            service: request.body.Service,
            alert: request.body.Alert,
            tool: 'RITM'
        })

        if (request.body.Application === null) {
            const result = await removeArea(request.body)
            const duration = Date.now() - startTime
            logger.info('Area deletion completed', {
                operation: 'removeItems',
                subOperation: 'removeArea',
                duration,
                result,
                success: result === SUCCESS,
                tool: 'RITM'
            })
            callback(result)
        } else if (request.body.Service === null) {
            const result = await removeApp(request.body)
            const duration = Date.now() - startTime
            logger.info('Application deletion completed', {
                operation: 'removeItems',
                subOperation: 'removeApp',
                duration,
                result,
                success: result === SUCCESS,
                tool: 'RITM'
            })
            callback(result)
        } else if (request.body.Alert === null) {
            const result = await removeService(request.body)
            const duration = Date.now() - startTime
            logger.info('Service deletion completed', {
                operation: 'removeItems',
                subOperation: 'removeService',
                duration,
                result,
                success: result === SUCCESS,
                tool: 'RITM'
            })
            callback(result)
        } else if (request.body.Alert !== null) {
            const result = await removeAlert(request.body)
            const duration = Date.now() - startTime
            logger.info('Alert deletion completed', {
                operation: 'removeItems',
                subOperation: 'removeAlert',
                duration,
                result,
                success: result === SUCCESS,
                tool: 'RITM'
            })
            callback(result)
        }
    } catch (err) {
        const duration = Date.now() - startTime
        logError(err, 'Item deletion failed', {
            operation: 'removeItems',
            duration,
            requestBody: request.body
        })
        callback(FATAL_ERROR)
    }
}

export { removeItems }