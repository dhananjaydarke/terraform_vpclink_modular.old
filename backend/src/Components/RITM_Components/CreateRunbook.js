import sql from 'mssql'

import { poolPromise } from '../../configurations/SQL/ConnectionPool.js'
import { logger, logError } from '../Logger.js'
import { SUCCESS, FATAL_ERROR, MISSING_THD_ERROR } from '../StatusCodes.js'

async function createRunbook(request, callback) {
    const startTime = Date.now()
    try {
        const portfolio = request.body.Portfolio
        const area = request.body.Area
        const displayName = request.body.DisplayName
        const projectName = request.body.ProjectName

        logger.info('Runbook creation started', {
            operation: 'createRunbook',
            projectName,
            portfolio,
            area,
            displayName,
            tool: 'RITM'
        })

        const confirmQuery = `select top 1 [Status] from THDDB.dbo.RunbookPast where Project_Name = @projectName`
        const duplicateQuery = `select Name from THDDB.dbo.RunbookCurrent where Project_Name = @projectName`

        const pool = await poolPromise
        
        // Check if project exists in past executions
        const confirmation = await pool.request()
            .input('projectName', sql.NVarChar, projectName)
            .query(confirmQuery)

        // Check if project already exists in current runbooks
        const duplicate = await pool.request()
            .input('projectName', sql.NVarChar, projectName)
            .query(duplicateQuery)

        logger.debug('Runbook validation checks completed', {
            operation: 'createRunbook',
            projectName,
            hasHistoricalData: confirmation.recordset.length > 0,
            alreadyExists: duplicate.recordset.length > 0,
            tool: 'RITM'
        })

        if (confirmation.recordset.length === 1 && duplicate.recordset.length === 0) {
            // Project has historical data but doesn't exist in current - can create
            const insertQuery = `insert into THDDB.dbo.RunbookCurrent (Project_Name, Portfolio, Area, Name)
                                    values (@projectName, @portfolio, @area, @displayName)`

            const result = await pool.request()
                .input('projectName', sql.NVarChar, projectName)
                .input('portfolio', sql.NVarChar, portfolio)
                .input('area', sql.NVarChar, area)
                .input('displayName', sql.NVarChar, displayName)
                .query(insertQuery)

            const success = result.rowsAffected.length > 0
            const duration = Date.now() - startTime

            if (success) {
                logger.info('Runbook created successfully', {
                    operation: 'createRunbook',
                    projectName,
                    portfolio,
                    area,
                    displayName,
                    duration,
                    rowsInserted: result.rowsAffected[0],
                    tool: 'RITM'
                })
                return callback(SUCCESS)
            } else {
                logger.error('Runbook creation failed - no rows inserted', {
                    operation: 'createRunbook',
                    projectName,
                    portfolio,
                    area,
                    displayName,
                    duration,
                    tool: 'RITM'
                })
                return callback(FATAL_ERROR)
            }
        } else {
            const duration = Date.now() - startTime
            let reason = ''
            
            if (confirmation.recordset.length === 0) {
                reason = 'No historical data found'
            } else if (duplicate.recordset.length > 0) {
                reason = 'Runbook already exists in current table'
            } else {
                reason = 'Multiple validation failures'
            }

            logger.warn('Runbook creation rejected', {
                operation: 'createRunbook',
                projectName,
                portfolio,
                area,
                displayName,
                duration,
                reason,
                hasHistoricalData: confirmation.recordset.length > 0,
                alreadyExists: duplicate.recordset.length > 0,
                tool: 'RITM'
            })
            
            return callback(MISSING_THD_ERROR)
        }

    } catch (err) {
        const duration = Date.now() - startTime
        logError(err, 'Runbook creation failed with exception', {
            operation: 'createRunbook',
            projectName: request.body?.ProjectName,
            portfolio: request.body?.Portfolio,
            area: request.body?.Area,
            displayName: request.body?.DisplayName,
            duration
        })
        return callback(FATAL_ERROR)
    }
}

export { createRunbook }
