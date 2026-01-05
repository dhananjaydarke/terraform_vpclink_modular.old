import { logger, logError } from './Logger.js'
import { poolPromise } from '../configurations/SQL/ConnectionPool.js'

async function grabFooterMessages(callback) {
    const startTime = Date.now()
    try {
        logger.debug('Footer messages query started', {
            operation: 'grabFooterMessages',
            tool: 'FooterStatus'
        })

        const pool = await poolPromise
        await pool.request().query('select Text, URL from THDDB.dbo.TECCActiveMessage', (error, results) => {
            if (error) { 
                logError(error, 'Footer messages query failed', {
                    operation: 'grabFooterMessages',
                    query: 'select Text, URL from THDDB.dbo.TECCActiveMessage'
                })
                throw error 
            }

            const duration = Date.now() - startTime
            const messageCount = results.recordset.length
            
            logger.info('Footer messages retrieved successfully', {
                operation: 'grabFooterMessages',
                duration,
                messageCount,
                hasMessages: messageCount > 0,
                tool: 'FooterStatus'
            })

            // Log message details for monitoring
            if (messageCount > 0) {
                const messagesWithUrls = results.recordset.filter(msg => msg.URL).length
                const messagesWithoutUrls = messageCount - messagesWithUrls
                
                logger.debug('Footer message details', {
                    operation: 'grabFooterMessages',
                    totalMessages: messageCount,
                    messagesWithUrls,
                    messagesWithoutUrls,
                    tool: 'FooterStatus'
                })

                // Log individual messages (debug level)
                results.recordset.forEach((message, index) => {
                    logger.debug('Footer message content', {
                        operation: 'grabFooterMessages',
                        messageIndex: index + 1,
                        hasText: !!message.Text,
                        hasUrl: !!message.URL,
                        textLength: message.Text ? message.Text.length : 0,
                        tool: 'FooterStatus'
                    })
                })
            } else {
                logger.info('No active footer messages found', {
                    operation: 'grabFooterMessages',
                    tool: 'FooterStatus'
                })
            }

            return callback(results.recordset)
        })

    } catch (err) {
        const duration = Date.now() - startTime
        logError(err, 'Footer messages retrieval failed', {
            operation: 'grabFooterMessages',
            duration
        })
    }
}

export { grabFooterMessages }
