import pkg from 'follow-redirects'
const { http } = pkg

import { logger, logError } from '../Components/Logger.js'
import { poolPromise } from '../configurations/SQL/ConnectionPool.js'

const apiKeys = []
const appDDefinedAlerts = new Map()
const dbDefinedAlertNames = []
const appDDefinedStates = new Map()
const dbStates = new Map()

const appDRequest = {
    'method': 'GET',
    'hostname': 'Aappdynamics.com',
    'headers': {
        'Authorization': process.env.APPD_AUTH_HEADER
    },
    'maxRedirects': 20
}

async function grabAPIkeys() {
    try {
        apiKeys.length = 0
        const pool = await poolPromise
        const results = await pool.request().query(`select distinct API_Key from THDDB.dbo.Alert where Tool = 'AppD'`)
        results.recordset.forEach((value) => {
            apiKeys.push(value.API_Key)
        })
        logger.debug('AppD API keys retrieved', { 
            operation: 'grabAPIkeys',
            keyCount: apiKeys.length,
            tool: 'AppD'
        })
    } catch (err) {
        logError(err, 'Failed to grab AppD API keys', { operation: 'grabAPIkeys' })
    }
}

function getJSON(options, cb) {
    http.request(options, function(response) {
        let body = ''

        response.on('data', function(chunk) {
            body += chunk
        })

        response.on('end', function() {
            let alerts = ''
            try {
                alerts = JSON.parse(body)
            } catch (err) {
                logError(err, 'Failed to parse AppD API response', { 
                    operation: 'getJSON',
                    responseBody: body.substring(0, 500)
                })
            }
            cb(null, alerts)
        })

        response.on('error', cb)
    })
        .on('error', cb)
        .end()
}

function mapSeverityToState(severity) {
    const severityMap = {
        'ERROR': 'STATUS_DANGER',
        'paused': 'STATUS_REPAIR',
        'INFO': 'STATUS_OK',
        'WARN': 'STATUS_WARNING'
    }

    return severityMap[severity] || 'STATUS_REPAIR'
}

function processAlerts(result, apiKey) {
    if (!Array.isArray(result)) {
        logger.warn('AppD API returned non-array response', { 
            operation: 'processAlerts',
            apiKey,
            responseType: typeof result,
            tool: 'AppD'
        })
        return
    }

    let processedCount = 0
    for (const appDAlert of result) {
        const itemState = mapSeverityToState(appDAlert.severity)
        if (itemState === 'STATUS_REPAIR' && !['ERROR', 'paused', 'INFO', 'WARN'].includes(appDAlert.severity)) {
            logger.warn('Unexpected AppD alert severity, using STATUS_REPAIR', { 
                operation: 'processAlerts',
                severity: appDAlert.severity,
                alertSummary: appDAlert.summary,
                mappedState: itemState,
                tool: 'AppD'
            })
        }

        if (!appDDefinedAlerts.has(appDAlert.summary)) {
            appDDefinedAlerts.set(appDAlert.summary, { 'state': itemState, 'time': appDAlert.eventTime })
            processedCount++
        }
    }

    logger.debug('AppD alerts processed for API key', {
        operation: 'processAlerts',
        apiKey,
        totalReceived: result.length,
        newAlertsProcessed: processedCount,
        tool: 'AppD'
    })
}

async function getAppDState() {
    try {
        appDDefinedAlerts.clear()
        for (const apiKey of apiKeys) {
            const newPath = '/controller/rest/applications/' + apiKey + '/events?event-types=POLICY_OPEN_CRITICAL,POLICY_OPEN_WARNING,POLICY_CLOSE_CRITICAL,POLICY_CLOSE_WARNING,POLICY_CANCELED_CRITICAL,POLICY_CANCELED_WARNING,POLICY_UPGRADED,POLICY_DOWNGRADED,POLICY_CONTINUES_CRITICAL,CUSTOM&severities=INFO,WARN,ERROR&time-range-type=BEFORE_NOW&duration-in-mins=5&output=json'
            appDRequest.path = newPath
            const result = await new Promise((resolve, reject) => {
                getJSON(appDRequest, (err, data) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(data)
                    }
                })
            })

            processAlerts(result, apiKey)
        }
        logger.info('AppD state retrieval completed', {
            operation: 'getAppDState',
            totalAlerts: appDDefinedAlerts.size,
            apiKeysProcessed: apiKeys.length,
            tool: 'AppD'
        })
    } catch (err) {
        logError(err, 'Failed to get AppD state', { operation: 'getAppDState' })
    }
}

async function getDBAlertNames() {
    try {
        dbDefinedAlertNames.length = 0
        const pool = await poolPromise
        const results = await pool.request().query(`select distinct Alert_Name from THDDB.dbo.Alert where Tool = 'AppD'`)
        results.recordset.forEach((value) => {
            dbDefinedAlertNames.push(value.Alert_Name)
        })
        logger.debug('DB alert names retrieved', { 
            operation: 'getDBAlertNames',
            alertCount: dbDefinedAlertNames.length,
            tool: 'AppD'
        })
    } catch (err) {
        logError(err, 'Failed to get DB alert names', { operation: 'getDBAlertNames' })
    }
}

function compareNames(appDAlerts, dbAlerts) {
    appDDefinedStates.clear()
    let matchedCount = 0
    appDAlerts.forEach((apiEventInfo, apiSummary) => {
        const compare = dbAlerts.filter(alertName => apiSummary.includes(alertName))
        if (compare.length > 0) {
            const dbAlertNameMatch = compare[0]
            if (!appDDefinedStates.has(dbAlertNameMatch)) {
                appDDefinedStates.set(dbAlertNameMatch, apiEventInfo)
                matchedCount++
            } else if (appDDefinedStates.get(dbAlertNameMatch).time < apiEventInfo.time) {
                appDDefinedStates.set(dbAlertNameMatch, apiEventInfo)
            }
        }
    })
    logger.debug('Alert name comparison completed', {
        operation: 'compareNames',
        totalApiAlerts: appDAlerts.size,
        totalDbAlerts: dbAlerts.length,
        matchedStates: appDDefinedStates.size,
        newMatches: matchedCount,
        tool: 'AppD'
    })
}

async function getStoredStates() {
    try {
        dbStates.clear()
        const pool = await poolPromise
        const queryStr = `select Alert_Name, ID, Status from THDDB.dbo.Alert where Tool = 'AppD'`
        const results = await pool.request().query(queryStr)
        results.recordset.forEach((value) => {
            dbStates.set(value.Alert_Name, { status: value.Status, id: value.ID })
        })
        logger.debug('Stored states retrieved', { 
            operation: 'getStoredStates',
            stateCount: dbStates.size,
            tool: 'AppD'
        })
    } catch (err) {
        logError(err, 'Failed to get stored states', { operation: 'getStoredStates' })
    }
}

async function updateState() {
    try {
        let updatedCount = 0
        for (const [key, value] of dbStates) {
            if (appDDefinedStates.has(key) && value.status !== appDDefinedStates.get(key).state) {
                try {
                    const pool = await poolPromise
                    const appDState = appDDefinedStates.get(key).state
                    const updateStr = `update THDDB.dbo.Alert set Status = '${appDState}', WriteTime = sysdatetime() where ID = ${value.id};
                                        insert into THDDB.dbo.AlertStatusHistory (Alert_ID, Status, WriteTime) values (${value.id}, '${appDState}', sysdatetime())`
                    await pool.request().query(updateStr)
                    updatedCount++
                    logger.info('Alert status updated', { 
                        operation: 'updateState',
                        alertName: key,
                        alertId: value.id,
                        previousState: value.status,
                        newState: appDState,
                        tool: 'AppD'
                    })
                } catch (err) {
                    logError(err, 'Failed to update individual alert state', { 
                        operation: 'updateState',
                        alertName: key,
                        alertId: value.id
                    })
                }
            }
        }
        if (updatedCount > 0) {
            logger.info('Alert state updates completed', { 
                operation: 'updateState',
                totalUpdated: updatedCount,
                tool: 'AppD'
            })
        }
    } catch (err) {
        logError(err, 'Failed to update alert states', { operation: 'updateState' })
    }
}

async function runAppDAPI() {
    const startTime = Date.now()
    try {
        logger.debug('Starting AppD API check cycle', { operation: 'runAppDAPI', tool: 'AppD' })
        await grabAPIkeys()
        await getAppDState()
        await getDBAlertNames()
        compareNames(appDDefinedAlerts, dbDefinedAlertNames)
        await getStoredStates()
        await updateState()
        
        const duration = Date.now() - startTime
        logger.info('AppD API check cycle completed', { 
            operation: 'runAppDAPI',
            duration,
            alertsProcessed: appDDefinedAlerts.size,
            statesMatched: appDDefinedStates.size,
            tool: 'AppD'
        })
    } catch (err) {
        logError(err, 'AppD API check cycle failed', { 
            operation: 'runAppDAPI',
            duration: Date.now() - startTime
        })
    }
}

logger.info('AppD API service starting', { component: 'AppDAPI', tool: 'AppD' })
runAppDAPI()
setInterval(() => {runAppDAPI()}, 60000)
