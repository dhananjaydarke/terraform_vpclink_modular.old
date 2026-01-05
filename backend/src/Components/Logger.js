import winston from 'winston'

const isProduction = process.env.NODE_ENV === 'production'
const isCloudWatch = process.env.AWS_EXECUTION_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        isCloudWatch || isProduction 
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
    ),
    defaultMeta: { 
        service: 'tecc-backend',
        component: process.env.pm_name || 'main',
        pid: process.pid,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
    },
    transports: [
        new winston.transports.Console({
            handleExceptions: true,
            handleRejections: true
        })
    ]
})

function logError(error, message, context = {}) {
    const errorInfo = {
        errorMessage: error.message,
        errorStack: error.stack,
        errorFunction: getFunctionNameFromStack(error.stack),
        errorType: error.constructor.name,
        ...context
    }
    
    if (message) {
        errorInfo.additionalMessage = message
    }
    
    logger.error('Application error occurred', errorInfo)
}

function getFunctionNameFromStack(stack) {
    const stackLines = stack.split('\n')
    for (const line of stackLines.slice(1)) {
        const match = line.match(/at\s+(?:[^\s.]*\.)?([^\s(]+)\s*\(/)
        if (match?.[1] && match[1] !== 'new') {
            return match[1].trim()
        }
    }
    return 'Unknown function'
}

export { logger, logError }
