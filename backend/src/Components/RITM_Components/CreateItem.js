import fs from 'fs'
import https from 'https'

import sql from 'mssql'

import { poolPromise } from '../../configurations/SQL/ConnectionPool.js'
import { dashPoolPromise } from '../../configurations/SQL/DashConnectionPool.js'
import { logger, logError } from '../Logger.js'
import { SUCCESS, API_ERROR, DUPLICATE_THD_ERROR, DUPLICATE_GRAFANA_ERROR, MISSING_GRAFANA_ERROR, FATAL_ERROR, MISSING_APPD_ERROR, DB_APPD_API_ERROR, PORTFOLIO_ERROR, BEARER_API_ERROR, DASH_APP_NAME_FAIL } from '../StatusCodes.js'

async function getOrCreatePortfolio(portfolioName) {
    try {
        const pool = await poolPromise
        const queryStr = 'select ID from THDDB.dbo.Portfolio where Name = @portfolioName'

        const portfolioId = await pool.request()
            .input('portfolioName', sql.NVarChar, portfolioName)
            .query(queryStr)

        if (portfolioId.recordset.length === 0) {
            logger.warn('Portfolio not found', {
                operation: 'getOrCreatePortfolio',
                portfolioName,
                tool: 'RITM'
            })
            return 'Portfolio not found'
        }

        logger.debug('Portfolio found', {
            operation: 'getOrCreatePortfolio',
            portfolioName,
            portfolioId: portfolioId.recordset[0].ID,
            tool: 'RITM'
        })

        return portfolioId.recordset[0].ID
    } catch (err) {
        logError(err, 'Failed to get or create portfolio', {
            operation: 'getOrCreatePortfolio',
            portfolioName
        })
        return 'Error'
    }
}

async function getOrCreateArea(areaName, portfolioId) {
    try {
        const pool = await poolPromise
        const queryStr = `merge THDDB.dbo.Area as target
            using (select @name as name, @portfolioId as portfolioID) as source
            on target.Name = source.name and target.Portfolio_ID = source.portfolioID
            when matched then
                update set target.Name = target.Name
            when not matched then
                insert (Name, Portfolio_ID)
                values (source.name, source.portfolioID)
            output inserted.ID;`

        const areaId = await pool.request()
            .input('name', sql.NVarChar, areaName)
            .input('portfolioId', sql.Int, portfolioId)
            .query(queryStr)

        logger.debug('Area created or found', {
            operation: 'getOrCreateArea',
            areaName,
            portfolioId,
            areaId: areaId.recordset[0].ID,
            tool: 'RITM'
        })

        return areaId.recordset[0].ID
    } catch (err) {
        logError(err, 'Failed to get or create area', {
            operation: 'getOrCreateArea',
            areaName,
            portfolioId
        })
        return 'Error'
    }
}

async function getOrCreateDashApp(dashName) {
    try {
        const dashQuery = 'select sys_id from TSS_Reporting.dbo.cmdb_ci_service_auto where name = @dashName'
        const dashPool = await dashPoolPromise
        const appData = await dashPool.request()
            .input('dashName', dashName)
            .query(dashQuery)

        if (appData && appData.recordset.length > 0) {
            const sysId = appData.recordset[0].sys_id
            const pool = await poolPromise
            const queryStr = `merge THDDB.dbo.DashApplication as target
                              using (select @sysId as sysID) as source
                              on target.SysID = source.sysID
                              when not matched then
                                    insert (SysID, Name)
                              values (@sysId, @dashName);`

            await pool.request()
                .input('sysId', sql.NVarChar, sysId)
                .input('dashName', sql.NVarChar, dashName)
                .query(queryStr)

            logger.debug('Dash application created or found', {
                operation: 'getOrCreateDashApp',
                dashName,
                sysId,
                tool: 'RITM'
            })

            return sysId
        } else {
            logger.warn('Invalid Dash application name', {
                operation: 'getOrCreateDashApp',
                dashName,
                tool: 'RITM'
            })
            return 'Invalid Dash Application Name'
        }
    } catch (err) {
        logError(err, 'Failed to get or create dash app', {
            operation: 'getOrCreateDashApp',
            dashName
        })
        return 'Error'
    }
}

async function getOrCreateApplication(applicationName, areaId, dashAppID) {
    try {
        const pool = await poolPromise
        const queryStr = `merge THDDB.dbo.Application as target
            using (select @name as name, @areaId as AreaID) as source
            on target.Name = source.name and target.Area_ID = source.AreaID
            when matched then
                update set target.Name = target.Name
            when not matched then
                insert (Name, Area_ID, Dash_SysID)
                values (source.name, source.AreaID, @dashAppID)
            output inserted.ID;`

        const applicationId = await pool.request()
            .input('name', sql.NVarChar, applicationName)
            .input('areaId', sql.Int, areaId)
            .input('dashAppID', sql.NVarChar, dashAppID)
            .query(queryStr)

        logger.debug('Application created or found', {
            operation: 'getOrCreateApplication',
            applicationName,
            areaId,
            dashAppID,
            applicationId: applicationId.recordset[0].ID,
            tool: 'RITM'
        })

        return applicationId.recordset[0].ID
    } catch (err) {
        logError(err, 'Failed to get or create application', {
            operation: 'getOrCreateApplication',
            applicationName,
            areaId,
            dashAppID
        })
        return 'Error'
    }
}

async function getOrCreateService(serviceName, applicationId, urlInput, priority) {
    try {
        const pool = await poolPromise
        const queryStr = `
            merge THDDB.dbo.Service as target
            using (select @name as name, @applicationId as Application_ID) 
            as source
            on target.Name = source.name and target.Application_ID = source.Application_ID
            when matched then
                update set target.Name = target.Name
            when not matched then
                insert (Name, Application_ID, URL, Priority)
                values (source.name, source.Application_ID, @url, @priority)
            output inserted.ID;`

        const serviceId = await pool.request()
            .input('name', sql.NVarChar, serviceName)
            .input('applicationId', sql.Int, applicationId)
            .input('url', sql.NVarChar, urlInput)
            .input('priority', sql.NVarChar, priority)
            .query(queryStr)

        logger.debug('Service created or found', {
            operation: 'getOrCreateService',
            serviceName,
            applicationId,
            url: urlInput,
            priority,
            serviceId: serviceId.recordset[0].ID,
            tool: 'RITM'
        })

        return serviceId.recordset[0].ID
    } catch (err) {
        logError(err, 'Failed to get or create service', {
            operation: 'getOrCreateService',
            serviceName,
            applicationId,
            url: urlInput,
            priority
        })
        return 'Error'
    }
}

function getId(options) {
    return new Promise((resolve, reject) => {
        https.request(options, (response) => {
            let body = ''
            response.on('data', function (chunk) {
                body += chunk
            })

            response.on('end', function () {
                let alerts = ''
                try {
                    alerts = JSON.parse(body)
                } catch (err) {
                    logError(err, 'Failed to parse API response', {
                        operation: 'getId',
                        responseBody: body.substring(0, 500)
                    })
                    reject(err)
                }
                resolve(alerts)
            })

            response.on('error', (e) => {
                reject(e)
            })
        })
            .end()
    })
}

async function authorizeGrafana(alertName, apiKey) {
    try {
        const encodedAlertName = alertName.replace(/ /g, '%20')
        const certPath = process.env.CERT_PATH || './configurations/certificate/certificateDDARKE.pem'
        const options = {
            host: 'em-grafana.ris.prod.DDARKEcorp.com',
            port: 443,
            path: '/api/alerts?query=' + encodedAlertName,
            method: 'GET',
            ca: fs.readFileSync(certPath, 'ascii'),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': apiKey
            },
            mode: 'no-cors'
        }

        const result = await getId(options)
        if (result.message) {
            logger.warn('Grafana API returned error message', {
                operation: 'authorizeGrafana',
                alertName,
                apiKey: apiKey.substring(0, 10) + '...',
                errorMessage: result.message,
                tool: 'RITM'
            })
            return result.message
        }

        const alerts = result.filter((alert) => alert.name === alertName)
        if (alerts.length === 0) {
            logger.warn('Grafana alert not found', {
                operation: 'authorizeGrafana',
                alertName,
                apiKey: apiKey.substring(0, 10) + '...',
                tool: 'RITM'
            })
            return 'No Alert Found'
        } else if (alerts.length > 1) {
            logger.warn('Duplicate Grafana alerts found', {
                operation: 'authorizeGrafana',
                alertName,
                apiKey: apiKey.substring(0, 10) + '...',
                duplicateCount: alerts.length,
                tool: 'RITM'
            })
            return 'Duplicates'
        } else {
            logger.info('Grafana alert authorized', {
                operation: 'authorizeGrafana',
                alertName,
                alertId: alerts[0].id,
                apiKey: apiKey.substring(0, 10) + '...',
                tool: 'RITM'
            })
            return alerts[0].id
        }
    } catch (err) {
        logError(err, 'Failed to authorize Grafana alert', {
            operation: 'authorizeGrafana',
            alertName,
            apiKey: apiKey?.substring(0, 10) + '...'
        })
        return 'Error'
    }
}

async function authorizeAppDApp(alertName, apiKey) {
    try {
        const options = {
            'method': 'GET',
            'hostname': 'Appdynamics.com',
            'path': `/controller/alerting/rest/v1/applications/${apiKey}/health-rules/`,
            'headers': {
                'Authorization': process.env.APPD_AUTH_HEADER
            },
            'maxRedirects': 20
        }

        const result = await getId(options)

        if (result.message) {
            logger.warn('AppD API returned error message', {
                operation: 'authorizeAppDApp',
                alertName,
                apiKey,
                errorMessage: result.message,
                tool: 'RITM'
            })
            return result.message
        }

        const alerts = result.find((alert) => alert.name.includes(alertName) && alert.enabled)
        if (!alerts) {
            logger.warn('AppD alert not found or not enabled', {
                operation: 'authorizeAppDApp',
                alertName,
                apiKey,
                tool: 'RITM'
            })
            return 'Alert not enabled or Alert not found'
        } else {
            logger.info('AppD application alert authorized', {
                operation: 'authorizeAppDApp',
                alertName,
                alertId: alerts.id,
                apiKey,
                enabled: alerts.enabled,
                tool: 'RITM'
            })
            return alerts.id
        }
    } catch (err) {
        logError(err, 'Failed to authorize AppD application alert', {
            operation: 'authorizeAppDApp',
            alertName,
            apiKey
        })
        return 'Error'
    }
}

async function authorizeAppDDb(alertName) {
    try {
        const suffix = '_DB'
        const options = {
            'method': 'GET',
            'hostname': 'Appdynamics.com',
            'path': `/controller/rest/databases/collectors`,
            'headers': {
                'Authorization': process.env.APPD_AUTH_HEADER
            },
            'maxRedirects': 20
        }

        if (alertName.endsWith(suffix)) {
            alertName = alertName.slice(0, -suffix.length)
        } else {
            logger.warn('AppD DB alert missing required suffix', {
                operation: 'authorizeAppDDb',
                alertName,
                requiredSuffix: suffix,
                tool: 'RITM'
            })
            return `Missing Suffix`
        }

        const result = await getId(options)
        const alerts = result.find((alert) => alert.config.name === alertName && alert.config.enabled)

        if (!alerts) {
            logger.warn('AppD DB alert not found or not enabled', {
                operation: 'authorizeAppDDb',
                alertName,
                tool: 'RITM'
            })
            return 'Alert not enabled or Alert not found'
        } else {
            logger.info('AppD database alert authorized', {
                operation: 'authorizeAppDDb',
                alertName,
                alertId: alerts.config.id,
                enabled: alerts.config.enabled,
                tool: 'RITM'
            })
            return alerts.config.id
        }
    } catch (err) {
        logError(err, 'Failed to authorize AppD database alert', {
            operation: 'authorizeAppDDb',
            alertName
        })
        return 'Error'
    }
}

function validateGrafanaResponse(alertId) {
    const errorMap = {
        'invalid API key': API_ERROR,
        'Invalid Basic Auth Header': BEARER_API_ERROR,
        'Duplicates': DUPLICATE_GRAFANA_ERROR,
        'No Alert Found': MISSING_GRAFANA_ERROR,
        'Error': FATAL_ERROR
    }
    return errorMap[alertId] || null
}

function validateAppDDbResponse(alertId) {
    const errorMap = {
        'Alert not enabled or Alert not found': MISSING_APPD_ERROR,
        'Missing Suffix': DB_APPD_API_ERROR,
        'Error': FATAL_ERROR
    }
    return errorMap[alertId] || null
}

function validateAppDAppResponse(alertId, apiKey) {
    const errorMap = {
        [`Application Id: ${apiKey} not found.`]: API_ERROR,
        'Alert not enabled or Alert not found': MISSING_APPD_ERROR,
        'Error': FATAL_ERROR
    }
    return errorMap[alertId] || null
}

async function validateAndGetAlertId(tool, apiKey, alertName) {
    logger.debug('Validating alert', {
        operation: 'validateAndGetAlertId',
        alertName,
        apiKey: tool === 'Grafana' ? apiKey?.substring(0, 10) + '...' : apiKey,
        tool: 'RITM'
    })

    if (tool === 'Grafana') {
        const alertId = await authorizeGrafana(alertName, apiKey)
        return validateGrafanaResponse(alertId) || alertId
    }

    if (tool === 'AppD') {
        if (apiKey === '_dbmon') {
            const alertId = await authorizeAppDDb(alertName)
            return validateAppDDbResponse(alertId) || alertId
        } else {
            const alertId = await authorizeAppDApp(alertName, apiKey)
            return validateAppDAppResponse(alertId, apiKey) || alertId
        }
    }

    return null
}

function insertAlertRecord(pool, serviceId, tool, apiKey, alertName, alertId, initialStatus) {
    const insertAlert = `insert into THDDB.dbo.Alert (Service_ID, Tool, API_Key, Alert_Name, Alert_ID, Status) output inserted.ID values (@serviceId, @tool, @apiKey, @alertName, @alertId, @initialStatus)`

    return pool.request()
        .input('serviceId', sql.Int, serviceId)
        .input('tool', sql.NVarChar, tool)
        .input('apiKey', sql.NVarChar, apiKey)
        .input('alertName', sql.NVarChar, alertName)
        .input('alertId', sql.Int, alertId)
        .input('initialStatus', sql.NVarChar, initialStatus)
        .query(insertAlert)
        .then(result => result.recordset[0].ID)
}

async function createAlert(serviceId, tool, apiKey, alertName) {
    try {
        if (alertName === null) {
            logger.debug('No alert name provided, skipping alert creation', {
                operation: 'createAlert',
                serviceId,
                tool: 'RITM'
            })
            return SUCCESS
        }

        if (apiKey === null && (tool === 'Grafana' || tool === 'AppD')) {
            logger.warn('API key required but not provided', {
                operation: 'createAlert',
                serviceId,
                alertName,
                tool: 'RITM'
            })
            return API_ERROR
        }

        const pool = await poolPromise
        const validationQuery = `select ID from THDDB.dbo.Alert where Alert_Name = @alertName and Tool = @tool and Service_ID = @serviceId`

        const validation = await pool.request()
            .input('alertName', sql.NVarChar, alertName)
            .input('tool', sql.NVarChar, tool)
            .input('serviceId', sql.Int, serviceId)
            .query(validationQuery)

        if (validation.recordset.length !== 0) {
            logger.warn('Duplicate alert found in database', {
                operation: 'createAlert',
                serviceId,
                alertName,
                existingAlertId: validation.recordset[0].ID,
                tool: 'RITM'
            })
            return DUPLICATE_THD_ERROR
        }

        const alertId = await validateAndGetAlertId(tool, apiKey, alertName)
        if (typeof alertId === 'string') {
            logger.error('Alert validation failed', {
                operation: 'createAlert',
                serviceId,
                alertName,
                validationError: alertId,
                tool: 'RITM'
            })
            return alertId
        }

        const initialStatus = (tool === 'AppD') ? 'STATUS_OK' : 'STATUS_ONBOARDING'
        const newAlert = await insertAlertRecord(pool, serviceId, tool, apiKey, alertName, alertId, initialStatus)

        if (!newAlert) {
            logger.error('Failed to insert alert record', {
                operation: 'createAlert',
                serviceId,
                alertName,
                alertId,
                tool: 'RITM'
            })
            return FATAL_ERROR
        }

        const insertHistory = `insert into THDDB.dbo.AlertStatusHistory (Alert_ID, Status) values (@alertID, @initialStatus)`
        const newHistory = await pool.request()
            .input('alertID', sql.Int, newAlert)
            .input('initialStatus', sql.NVarChar, initialStatus)
            .query(insertHistory)

        const success = newHistory.rowsAffected.length > 0

        logger.info('Alert created successfully', {
            operation: 'createAlert',
            serviceId,
            alertName,
            alertId,
            newAlertDbId: newAlert,
            initialStatus,
            historyCreated: success,
            tool: 'RITM'
        })

        return success ? SUCCESS : FATAL_ERROR
    } catch (err) {
        logError(err, 'Failed to create alert', {
            operation: 'createAlert',
            serviceId,
            tool,
            alertName
        })
        return FATAL_ERROR
    }
}

async function createItem(request, callback) {
    const startTime = Date.now()
    try {
        const requestData = {
            portfolio: request.body.Portfolio,
            area: request.body.Area,
            application: request.body.Application,
            service: request.body.Service,
            dashName: request.body.DashName,
            url: request.body.URL,
            priority: request.body.Priority,
            tool: request.body.Tool,
            apiKey: request.body.APIKey,
            alertName: request.body.AlertName
        }

        let maskedApiKey = null
        if (requestData.apiKey) {
            maskedApiKey = requestData.tool === 'Grafana' ? requestData.apiKey.substring(0, 10) + '...' : requestData.apiKey
        }

        logger.info('RITM item creation started', {
            operation: 'createItem',
            ...requestData,
            apiKey: maskedApiKey,
            tool: 'RITM'
        })

        const portfolioId = await getOrCreatePortfolio(requestData.portfolio)
        if (portfolioId === 'Portfolio not found') { return callback(PORTFOLIO_ERROR) }
        if (portfolioId === 'Error') { return callback(FATAL_ERROR) }

        const areaId = await getOrCreateArea(requestData.area, portfolioId)
        if (areaId === 'Error') { return callback(FATAL_ERROR) }

        let dashId = null
        if (requestData.dashName) {
            dashId = await getOrCreateDashApp(requestData.dashName)
            if (dashId === 'Invalid Dash Application Name') { return callback(DASH_APP_NAME_FAIL) }
            if (dashId === 'Error') { return callback(FATAL_ERROR) }
        }

        const appId = await getOrCreateApplication(requestData.application, areaId, dashId)
        if (appId === 'Error') { return callback(FATAL_ERROR) }

        const serviceId = await getOrCreateService(requestData.service, appId, requestData.url, requestData.priority)
        if (serviceId === 'Error') { return callback(FATAL_ERROR) }

        const alert = await createAlert(serviceId, requestData.tool, requestData.apiKey, requestData.alertName)

        const duration = Date.now() - startTime
        logger.info('RITM item creation completed', {
            operation: 'createItem',
            duration,
            portfolioId,
            areaId,
            applicationId: appId,
            serviceId,
            dashId,
            alertResult: alert,
            success: alert === SUCCESS,
            tool: 'RITM'
        })

        callback(alert)

    } catch (err) {
        const duration = Date.now() - startTime
        logError(err, 'RITM item creation failed', {
            operation: 'createItem',
            duration,
            requestBody: request.body
        })
        callback(FATAL_ERROR)
    }
}

export { createItem }
