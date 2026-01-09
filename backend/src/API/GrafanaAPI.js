import fs from 'fs'
import https from 'https'

import { logger, logError } from '../Components/Logger.js'
import { poolPromise } from '../configurations/SQL/ConnectionPool.js'

const apiKeys = [] // These are the bearer tokens for various orgs
const grafanaDefinedAlerts = new Map() // {API_Key, Alert_Id} is key, current Grafana state is value, for every Grafana alert across all orgs
const dbDefinedAlerts = [] // {API_Key, Alert_Id} configured in DB; no duplicates - NOT ENFORCED BY DB OR GRAFANA, SO COULD HAPPEN THEY'RE NOT UNIQUE
const grafanaDefinedStates = new Map() // copies of grafanaDefinedAlerts entries (apiKey, alertId, state) that match dbDefinedAlerts entries
const dbStates = new Map() // state in DB of each unique API_Key/Alert_Id

const grafanaRequest = {
    host: 'em-grafana.ris.prod.DDARKEcorp.com',
    port: 443,
    path: '/api/alerts',
    method: 'GET',
    // ca: fs.readFileSync('./configurations/certificate/certificateDDARKE.pem', 'ascii'), //When importing to the Server.js, you have to use the relative path from the Server.js Path
    ca: fs.readFileSync('../configurations/certificate/certificateDDARKE.pem', 'ascii'), // Fixed path for Docker container
    headers: {
        'Accept'        : 'application/json',
        'Content-Type'  : 'application/json',
        'Authorization' : ''
    },
    mode: 'no-cors'
}

async function grabAPIKeys() {
    try {
        // API Keys are the bearer tokens for the orgs
        apiKeys.length = 0 // clear out any previous array entries
        const pool = await poolPromise
        const results = await pool.request().query(`select distinct API_Key from THDDB.dbo.Alert where Tool = 'Grafana'`)
        results.recordset.forEach((value) => {
            apiKeys.push(value.API_Key)
        })
        
        logger.debug('Grafana API keys retrieved', {
            operation: 'grabAPIKeys',
            keyCount: apiKeys.length,
            tool: 'Grafana'
        })
    } catch (err) {
        logError(err, 'Failed to grab Grafana API keys', { operation: 'grabAPIKeys' })
    }
}

function getJSON(options, cb) {
    https.request(options, function(response) {
        let body = ''

        response.on('data', function(chunk) {
            body += chunk
        })

        response.on('end', function() {
            let alerts = ''
            try {
                alerts = JSON.parse(body)
            } catch (err) {
                logError(err, 'Failed to parse Grafana API response', {
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

async function getGrafanaState() {
    try {
        grafanaDefinedAlerts.clear() // clear out any previous map entries
        let totalAlertsProcessed = 0
        let apiKeysWithNoAlerts = 0

        for (const apiKey of apiKeys) {
            grafanaRequest.headers.Authorization = apiKey
            const key = { apiKey: apiKey, alertId: '' }
            try {
                const result = await new Promise((resolve, reject) => {
                    getJSON(grafanaRequest, (err, data) => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(data)
                        }
                    })
                })
                let itemState
                const defaultState = 'STATUS_REPAIR'
                if (result.length === undefined || result.length === 0) {
                    apiKeysWithNoAlerts++
                    logger.warn('Grafana API key has no alerts configured', {
                        operation: 'getGrafanaState',
                        apiKey: apiKey.substring(0, 10) + '...',
                        tool: 'Grafana'
                    })
                } else {
                    for (const grafanaAlert of result) {
                        switch (grafanaAlert.state) {
                            case 'ok':
                                itemState = 'STATUS_OK'
                                break
                            case 'pending':
                                itemState = 'STATUS_WARNING'
                                break
                            case 'alerting':
                                itemState = 'STATUS_DANGER'
                                break
                            case 'no_data':
                                itemState = 'STATUS_DANGER'
                                break
                            case 'paused':
                                itemState = 'STATUS_REPAIR'
                                break
                            case 'unknown':
                                itemState = 'STATUS_REPAIR'
                                break
                            default:
                                logger.warn('Unexpected Grafana alert state, using STATUS_REPAIR', {
                                    operation: 'getGrafanaState',
                                    alertState: grafanaAlert.state,
                                    alertId: grafanaAlert.id,
                                    alertName: grafanaAlert.name,
                                    mappedState: defaultState,
                                    tool: 'Grafana'
                                })
                                itemState = defaultState
                        }
                        key.alertId = String(grafanaAlert.id)
                        grafanaDefinedAlerts.set(JSON.stringify(key), itemState)
                        totalAlertsProcessed++
                    }
                    
                    logger.debug('Grafana alerts processed for API key', {
                        operation: 'getGrafanaState',
                        apiKey: apiKey.substring(0, 10) + '...',
                        alertCount: result.length,
                        tool: 'Grafana'
                    })
                }
            } catch (err) {
                logError(err, 'Failed to process Grafana API key', {
                    operation: 'getGrafanaState',
                    apiKey: apiKey.substring(0, 10) + '...'
                })
            }
        }

        logger.info('Grafana state retrieval completed', {
            operation: 'getGrafanaState',
            totalAlerts: grafanaDefinedAlerts.size,
            totalAlertsProcessed,
            apiKeysProcessed: apiKeys.length,
            apiKeysWithNoAlerts,
            tool: 'Grafana'
        })
    } catch (err) {
        logError(err, 'Failed to get Grafana state', { operation: 'getGrafanaState' })
    }
}

async function getAlertIdentifiers() {
    try {
        dbDefinedAlerts.length = 0 // clear out any previous array entries
        const pool = await poolPromise
        const results = await pool.request().query(`select distinct API_Key, Alert_Id from THDDB.dbo.Alert where Tool = 'Grafana'`)
        results.recordset.forEach((value) => {
            dbDefinedAlerts.push(JSON.stringify({ apiKey: value.API_Key, alertId: value.Alert_Id }))
        })
        
        logger.debug('DB alert identifiers retrieved', {
            operation: 'getAlertIdentifiers',
            alertCount: dbDefinedAlerts.length,
            tool: 'Grafana'
        })
    } catch (err) {
        logError(err, 'Failed to get alert identifiers', { operation: 'getAlertIdentifiers' })
    }
}

function compareNames(grafanaAlerts, dbAlerts) {
    grafanaDefinedStates.clear() // clear out any previous map entries
    let matchedCount = 0
    
    dbAlerts.forEach((dbAlert) => {
        try {
            const dbObj = JSON.parse(dbAlert)
            
            // Try both string and number versions of alert ID
            const stringKey = JSON.stringify({ apiKey: dbObj.apiKey, alertId: String(dbObj.alertId) })
            const numberKey = JSON.stringify({ apiKey: dbObj.apiKey, alertId: Number(dbObj.alertId) })
            
            if (grafanaAlerts.has(stringKey)) {
                grafanaDefinedStates.set(dbAlert, grafanaAlerts.get(stringKey))
                matchedCount++
            } else if (grafanaAlerts.has(numberKey)) {
                grafanaDefinedStates.set(dbAlert, grafanaAlerts.get(numberKey))
                matchedCount++
            }
        } catch (err) {
            logger.error('Failed to parse DB alert key', {
                operation: 'compareNames',
                dbAlert,
                error: err.message,
                tool: 'Grafana'
            })
        }
    })
    
    logger.debug('Alert comparison completed', {
        operation: 'compareNames',
        totalGrafanaAlerts: grafanaAlerts.size,
        totalDbAlerts: dbAlerts.length,
        matchedAlerts: matchedCount,
        tool: 'Grafana'
    })
}

async function getStoredStates() {
    try {
        dbStates.clear() // clear out any previous map entries
        const pool = await poolPromise
        // get API_Key, Alert_Id, and current status of all alerts in DB
        const queryStr = `select API_Key, Alert_Id, ID, Status from THDDB.dbo.Alert where Tool = 'Grafana'`
        const results = await pool.request().query(queryStr)
        results.recordset.forEach((value) => {
            dbStates.set(JSON.stringify({apiKey: value.API_Key, alertId: value.Alert_Id}), {status: value.Status, id: value.ID})
        })
        
        logger.debug('Stored states retrieved', {
            operation: 'getStoredStates',
            stateCount: dbStates.size,
            tool: 'Grafana'
        })
    } catch (err) {
        logError(err, 'Failed to get stored states', { operation: 'getStoredStates' })
    }
}

async function updateState() {
    try {
        let updatedCount = 0
        
        for (const [key, value] of dbStates) {
            if (grafanaDefinedStates.has(key) && value.status !== grafanaDefinedStates.get(key)) {
                // state has changed, update DB
                try {
                    const pool = await poolPromise
                    const grafanaState = grafanaDefinedStates.get(key)
                    const updateStr = `update THDDB.dbo.Alert set Status = '${grafanaState}', WriteTime = sysdatetime() where ID = ${value.id};
                                        insert into THDDB.dbo.AlertStatusHistory (Alert_ID, Status, WriteTime) values (${value.id}, '${grafanaState}', sysdatetime())`
                    await pool.request().query(updateStr)
                    updatedCount++
                    
                    const alertKey = JSON.parse(key)
                    logger.info('Grafana alert status updated', {
                        operation: 'updateState',
                        alertId: alertKey.alertId,
                        apiKey: alertKey.apiKey.substring(0, 10) + '...',
                        previousState: value.status,
                        newState: grafanaState,
                        dbId: value.id,
                        tool: 'Grafana'
                    })
                } catch (err) {
                    const alertKey = JSON.parse(key)
                    logError(err, 'Failed to update individual Grafana alert', {
                        operation: 'updateState',
                        alertId: alertKey.alertId,
                        dbId: value.id
                    })
                }
            }
        }
        
        if (updatedCount > 0) {
            logger.info('Grafana alert state updates completed', {
                operation: 'updateState',
                totalUpdated: updatedCount,
                tool: 'Grafana'
            })
        }
    } catch (err) {
        logError(err, 'Failed to update Grafana alert states', { operation: 'updateState' })
    }
}

async function runGrafanaAPI() {
    const startTime = Date.now()
    try {
        logger.debug('Starting Grafana API check cycle', {
            operation: 'runGrafanaAPI',
            tool: 'Grafana'
        })

        await grabAPIKeys() // populates apiKeys array from DB
        await getGrafanaState() // populates grafanaDefinedAlerts map [apiKey, alertId] => (state) from API
        await getAlertIdentifiers() // populates unique {apiKey, alertId} array dbDefinedAlerts from DB
        compareNames(grafanaDefinedAlerts, dbDefinedAlerts) // populates grafanaDefinedStates (a subset of grafanaDefinedAlerts entries matching dbDefinedAlerts)
        await getStoredStates() // populates dbStates map [apiKey, alertId] => (status, id) with all current status from the DB
        await updateState() // updates DB for every alert whose state has changed

        const duration = Date.now() - startTime
        logger.info('Grafana API check cycle completed', {
            operation: 'runGrafanaAPI',
            duration,
            alertsProcessed: grafanaDefinedAlerts.size,
            statesMatched: grafanaDefinedStates.size,
            tool: 'Grafana'
        })
    } catch (err) {
        logError(err, 'Grafana API check cycle failed', {
            operation: 'runGrafanaAPI',
            duration: Date.now() - startTime
        })
    }
}

logger.info('Grafana API service starting', { 
    component: 'GrafanaAPI', 
    tool: 'Grafana',
    intervalSeconds: 30
})
runGrafanaAPI()
setInterval(runGrafanaAPI, 30000)
