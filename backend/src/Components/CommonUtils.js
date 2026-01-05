import https from 'https'

import { logger, logError } from './Logger.js'

async function getJSON(options) {
    const startTime = Date.now()
    try {
        logger.debug('HTTP GET request started', {
            operation: 'getJSON',
            host: options.host || options.hostname,
            path: options.path,
            method: options.method || 'GET',
            tool: 'CommonUtils'
        })

        const response = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = ''
                
                logger.debug('HTTP response received', {
                    operation: 'getJSON',
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    contentType: res.headers['content-type'],
                    tool: 'CommonUtils'
                })

                res.on('data', chunk => data += chunk)
                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(data)
                        resolve(parsedData)
                    } catch (error) {
                        logError(error, 'Failed to parse JSON response', {
                            operation: 'getJSON',
                            responseData: data.substring(0, 500),
                            statusCode: res.statusCode
                        })
                        reject(error)
                    }
                })
            })

            req.on('error', (error) => {
                logError(error, 'HTTP request failed', {
                    operation: 'getJSON',
                    host: options.host || options.hostname,
                    path: options.path
                })
                reject(error)
            })
            req.end()
        })

        const duration = Date.now() - startTime
        logger.info('HTTP GET request completed successfully', {
            operation: 'getJSON',
            host: options.host || options.hostname,
            path: options.path,
            duration,
            responseSize: JSON.stringify(response).length,
            tool: 'CommonUtils'
        })

        return response
    } catch (error) {
        const duration = Date.now() - startTime
        logError(error, 'HTTP GET request failed', {
            operation: 'getJSON',
            host: options.host || options.hostname,
            path: options.path,
            duration
        })
        throw error
    }
}

async function getPOST(options, postData) {
    const startTime = Date.now()
    try {
        logger.debug('HTTP POST request started', {
            operation: 'getPOST',
            host: options.host || options.hostname,
            path: options.path,
            method: options.method || 'POST',
            dataSize: postData ? postData.length : 0,
            tool: 'CommonUtils'
        })

        const response = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = ''
                
                logger.debug('HTTP POST response received', {
                    operation: 'getPOST',
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    contentType: res.headers['content-type'],
                    tool: 'CommonUtils'
                })

                res.on('data', chunk => data += chunk)
                res.on('end', () => {
                    resolve(data)
                })
            })

            req.on('error', (error) => {
                logError(error, 'HTTP POST request failed', {
                    operation: 'getPOST',
                    host: options.host || options.hostname,
                    path: options.path,
                    dataSize: postData ? postData.length : 0
                })
                reject(error)
            })
            
            if (postData) {
                req.write(postData)
            }
            req.end()
        })

        const duration = Date.now() - startTime
        logger.info('HTTP POST request completed successfully', {
            operation: 'getPOST',
            host: options.host || options.hostname,
            path: options.path,
            duration,
            requestDataSize: postData ? postData.length : 0,
            responseSize: response.length,
            tool: 'CommonUtils'
        })

        return response
    } catch (error) {
        const duration = Date.now() - startTime
        logError(error, 'HTTP POST request failed', {
            operation: 'getPOST',
            host: options.host || options.hostname,
            path: options.path,
            duration,
            dataSize: postData ? postData.length : 0
        })
        throw error
    }
}

export { getJSON, getPOST }
