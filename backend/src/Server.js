import cluster from 'cluster'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'

import { runbookAPI } from './API/RunbookAPI.js'
import { grabRunbookStatus } from './Components/CreateRunbookJson.js'
import { createStatus } from './Components/CreateStatus.js'
import { grabCurrentStatus } from './Components/CreateStatusJson.js'
import { logger, logError } from './Components/Logger.js'
import { grabFooterMessages } from './Components/FooterStatus.js'
import { grabLocationData } from './Components/GrabLocationData.js'
import { grabStatus } from './Components/GrabStatus.js'
import { authenticateLogin } from './Components/RITM_Components/AuthenticateLogin.js'
import { createItem } from './Components/RITM_Components/CreateItem.js'
import { createRunbook } from './Components/RITM_Components/CreateRunbook.js'
import { removeItems } from './Components/RITM_Components/DeleteItem.js'
import { updateItems } from './Components/RITM_Components/UpdateItem.js'
import { grabSideBarMenu } from './Components/SidebarStatus.js'
import { statusCodes, SUCCESS, FATAL_ERROR } from './Components/StatusCodes.js'

logger.info('Server starting', {
    operation: 'startup',
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    tool: 'Server'
})

const PORT = process.env.PORT || 3001
const totalCPUs = os.cpus().length

const logFile = path.join('../../', 'RITMlog.log') // Log file to record all RITM items outside of the folder so that we have a centralized place to find the logs instead of having to go through the version folders.

function appendLog(body) {
    try {
        fs.appendFileSync(logFile, `${getCTDate()}: ${JSON.stringify(body)}\n`, 'utf-8')
        logger.debug('RITM log entry written', {
            operation: 'appendLog',
            logFile,
            bodySize: JSON.stringify(body).length,
            tool: 'Server'
        })
    } catch (err) {
        logError(err, 'Failed to write RITM log', {
            operation: 'appendLog',
            logFile
        })
    }
}

function getCTDate() {
    const options = {
        timeZone: 'America/Chicago',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }

    const formatTime = new Intl.DateTimeFormat('en-US', options)
    return formatTime.format(new Date())
}

function handleError(err, res, req) {
    logError(err, 'Request handler error', {
        operation: 'handleError',
        method: req?.method,
        path: req?.path,
        userAgent: req?.get('User-Agent'),
        tool: 'Server'
    })
    const code = statusCodes.get(FATAL_ERROR)
    res.status(code.statusCode).send(code.Message)
}

function createPostHandler(handlerFunc, shouldLog = true) {
    return (req, res) => {
        const startTime = Date.now()
        const requestId = Math.random().toString(36).substring(7)
        
        logger.debug('POST request started', {
            operation: 'createPostHandler',
            requestId,
            method: req.method,
            path: req.path,
            shouldLog,
            userAgent: req.get('User-Agent'),
            contentLength: req.get('Content-Length'),
            tool: 'Server'
        })

        Promise.resolve(handlerFunc(req, (result) => {
            res.set('Access-Control-Allow-Origin', '*')

            if (shouldLog && result === SUCCESS) {
                appendLog(req.body)
            }

            const code = statusCodes.get(result)
            const duration = Date.now() - startTime
            
            logger.info('POST request completed', {
                operation: 'createPostHandler',
                requestId,
                method: req.method,
                path: req.path,
                statusCode: code.statusCode,
                result,
                duration,
                success: result === SUCCESS,
                logged: shouldLog && result === SUCCESS,
                tool: 'Server'
            })
            
            res.status(code.statusCode).send(code.Message)
        })).catch(err => handleError(err, res, req))
    }
}

function createGetHandler(handlerFunc, ...args) {
    return (req, res) => {
        const startTime = Date.now()
        const requestId = Math.random().toString(36).substring(7)
        
        logger.debug('GET request started', {
            operation: 'createGetHandler',
            requestId,
            method: req.method,
            path: req.path,
            query: req.query,
            userAgent: req.get('User-Agent'),
            tool: 'Server'
        })

        Promise.resolve(handlerFunc(...args, (result) => {
            res.set('Access-Control-Allow-Origin', '*')
            
            const duration = Date.now() - startTime
            const responseSize = JSON.stringify(result).length
            
            logger.info('GET request completed', {
                operation: 'createGetHandler',
                requestId,
                method: req.method,
                path: req.path,
                duration,
                responseSize,
                hasResult: !!result,
                tool: 'Server'
            })
            
            res.send(result)
        })).catch(err => handleError(err, res, req))
    }
}

function createRunbookHandler(handlerFunc, ...args) {
    return (req, res) => {
        const startTime = Date.now()
        const requestId = Math.random().toString(36).substring(7)
        
        logger.debug('Runbook request started', {
            operation: 'createRunbookHandler',
            requestId,
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            tool: 'Server'
        })

        Promise.resolve(handlerFunc(...args, (result) => {
            res.set('Access-Control-Allow-Origin', '*')
            
            const duration = Date.now() - startTime
            let statusCode = 200
            let isStatusCode = false
            
            if (statusCodes.has(result)) {
                const code = statusCodes.get(result)
                statusCode = code.statusCode
                isStatusCode = true
                res.status(code.statusCode).send(code.Message)
            } else {
                res.send(result)
            }
            
            logger.info('Runbook request completed', {
                operation: 'createRunbookHandler',
                requestId,
                method: req.method,
                path: req.path,
                statusCode,
                duration,
                isStatusCode,
                result: isStatusCode ? result : 'data',
                tool: 'Server'
            })
        })).catch(err => handleError(err, res, req))
    }
}

if (cluster.isMaster) {
    logger.info('Master process started', {
        operation: 'cluster-master',
        pid: process.pid,
        totalCPUs,
        tool: 'Server'
    })

    // Fork workers.
    for (let i = 0; i < totalCPUs; i++) {
        cluster.fork()
    }

    cluster.on('exit', (worker, code, signal) => {
        logger.warn('Worker died, forking new worker', {
            operation: 'cluster-master',
            deadWorkerPid: worker.process.pid,
            exitCode: code,
            signal,
            tool: 'Server'
        })
        cluster.fork()
    })
} else {
    const app = express()

    logger.info('Worker process started', {
        operation: 'worker-startup',
        pid: process.pid,
        workerId: cluster.worker.id,
        tool: 'Server'
    })

    app.disable('x-powered-by')
    app.use(express.json())
    app.use(bodyParser.json())

    const corsOption = {
        origin: function(origin, callback) {
            if (!origin) { return callback(null, true) }

            try {
                const url = new URL(origin)

                if (url.port === '3001') {
                    url.port = '3000'
                }

                const modifiedOrigin = `${url.protocol}//${url.hostname}:${url.port}`

                logger.debug('CORS origin processed', {
                    operation: 'cors',
                    originalOrigin: origin,
                    modifiedOrigin,
                    tool: 'Server'
                })

                return callback(null, modifiedOrigin)
            } catch (err) {
                logger.warn('CORS origin processing failed', {
                    operation: 'cors',
                    origin,
                    error: err.message,
                    tool: 'Server'
                })
                return callback(err)
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }
    app.use(cors({ corsOption }))

    app.use((req, res, next) => { // handle request for timeouts
        const timeoutDuration = 10000

        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                logger.warn('Request timeout', {
                    operation: 'timeout',
                    method: req.method,
                    path: req.path,
                    timeoutDuration,
                    userAgent: req.get('User-Agent'),
                    tool: 'Server'
                })
                const code = statusCodes.get(FATAL_ERROR)
                res.status(code.statusCode).send(code.Message)
            }
        }, timeoutDuration)

        res.on('finish', () => clearTimeout(timeout))

        next()
    })

    // Route definitions with logging
    logger.debug('Setting up routes', {
        operation: 'route-setup',
        tool: 'Server'
    })

    app.post('/Login', createPostHandler(authenticateLogin, false))
    app.post('/CreateRunbook', createPostHandler(createRunbook))
    app.post('/CreateAddition', createPostHandler(createItem))
    app.post('/UpdateItem', createPostHandler(updateItems))
    app.post('/RemoveItem', createPostHandler(removeItems))
    app.post('/CreateStatus', createPostHandler(createStatus, false))
    app.post('/Runbooks', createRunbookHandler(runbookAPI))
    app.post('/GrabStatus', createGetHandler(grabStatus))

    app.get('/Runbookjson/All', createGetHandler(grabRunbookStatus, "Portfolio = Portfolio ORDER BY (CASE Portfolio WHEN 'Operations' THEN 1 WHEN 'Commercial' THEN 2 WHEN 'Infrastructure'  THEN 3 ELSE 100 END)"))
    app.get('/Runbookjson/Operations', createGetHandler(grabRunbookStatus, "Portfolio = 'Operations'"))
    app.get('/Runbookjson/Commercial', createGetHandler(grabRunbookStatus, "Portfolio = 'Commercial'"))

    // Each area gets it own section. Added single quotes since SQL requires single quotes, however if need to pull everyhting does not need single quotes
    app.get('/Operations', createGetHandler(grabCurrentStatus, "p.Name = 'Operations'"))
    app.get('/Commercial', createGetHandler(grabCurrentStatus, "p.Name = 'Commercial'"))
    app.get('/Cybersecurity', createGetHandler(grabCurrentStatus, "p.Name = 'Cybersecurity'"))
    app.get('/ISS', createGetHandler(grabCurrentStatus, "p.Name = 'Infrastructure & Shared Services'"))
    app.get('/Cloud', createGetHandler(grabCurrentStatus, "p.Name = 'Cloud'"))
    app.get('/Footer', createGetHandler(grabFooterMessages))
    app.get('/Sidebar', createGetHandler(grabSideBarMenu))
    app.get('/Location', createGetHandler(grabLocationData))
    app.get('/LIAT', createGetHandler(grabCurrentStatus, "ar.LIAT = 'Yes'"))
    app.get('/All', createGetHandler(grabCurrentStatus, 'p.Name = p.Name'))

    // create healthcheck endpoint for ECS
    app.get('/healthcheck_receive', (req, res) => {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString()
          })
    })
    
    app.listen(PORT, () => { // start node server with http server
        logger.info('Worker server listening', {
            operation: 'worker-listening',
            pid: process.pid,
            workerId: cluster.worker.id,
            port: PORT,
            tool: 'Server'
        })
    })
}
