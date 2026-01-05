import sql from 'mssql'

import { logger, logError } from './Logger.js'
import { BAD_STATUS_ERROR, DUPLICATE_ALERT_NAME_ERROR, BAD_ALERT_NAME_ERROR, SUCCESS, FATAL_ERROR } from '../Components/StatusCodes.js'
import { poolPromise } from '../configurations/SQL/ConnectionPool.js'

async function createStatus(request, callback) {
    const startTime = Date.now()
    try {
        const alertName = request.query.AlertName
        const status = request.query.Status

        logger.info('Status update request received', {
            operation: 'createStatus',
            alertName,
            status,
            tool: 'StatusUpdate'
        })

        // Validate status
        const validStatuses = ['STATUS_OK', 'STATUS_WARNING', 'STATUS_REPAIR', 'STATUS_DANGER']
        if (!validStatuses.includes(status)) {
            logger.warn('Invalid status provided', {
                operation: 'createStatus',
                alertName,
                providedStatus: status,
                validStatuses,
                tool: 'StatusUpdate'
            })
            return callback(BAD_STATUS_ERROR)
        }

        const pool = await poolPromise
        const idQueryStr = 'select ID from THDDB.dbo.Alert where Alert_Name = @alertName'
        const idQueryResults = await pool.request()
            .input('alertName', sql.NVarChar, alertName)
            .query(idQueryStr)

        logger.debug('Alert lookup completed', {
            operation: 'createStatus',
            alertName,
            matchCount: idQueryResults.recordset.length,
            tool: 'StatusUpdate'
        })

        let id
        if (idQueryResults.recordset.length === 1) {
            id = idQueryResults.recordset[0].ID
            logger.debug('Alert found', {
                operation: 'createStatus',
                alertName,
                alertId: id,
                tool: 'StatusUpdate'
            })
        } else if (idQueryResults.recordset.length > 1) {
            logger.warn('Duplicate alert names found', {
                operation: 'createStatus',
                alertName,
                duplicateCount: idQueryResults.recordset.length,
                tool: 'StatusUpdate'
            })
            return callback(DUPLICATE_ALERT_NAME_ERROR)
        } else {
            logger.warn('Alert not found', {
                operation: 'createStatus',
                alertName,
                tool: 'StatusUpdate'
            })
            return callback(BAD_ALERT_NAME_ERROR)
        }

        // Update alert status and insert history
        const updateStr = `update THDDB.dbo.Alert set Status = @status, WriteTime = sysdatetime() where ID = @id;
                                insert into THDDB.dbo.AlertStatusHistory (Alert_ID, Status) values (@id, @status)`

        const actionResults = await pool.request()
            .input('status', sql.NVarChar, status)
            .input('id', sql.Int, id)
            .query(updateStr)

        const duration = Date.now() - startTime
        const success = actionResults.rowsAffected.length === 2

        if (success) {
            logger.info('Status updated successfully', {
                operation: 'createStatus',
                alertName,
                alertId: id,
                newStatus: status,
                duration,
                alertRowsUpdated: actionResults.rowsAffected[0] || 0,
                historyRowsInserted: actionResults.rowsAffected[1] || 0,
                tool: 'StatusUpdate'
            })
            return callback(SUCCESS)
        } else {
            logger.error('Status update failed - unexpected row count', {
                operation: 'createStatus',
                alertName,
                alertId: id,
                newStatus: status,
                duration,
                rowsAffected: actionResults.rowsAffected,
                expectedRows: 2,
                tool: 'StatusUpdate'
            })
            return callback(FATAL_ERROR)
        }

    } catch (err) {
        const duration = Date.now() - startTime
        logError(err, 'Status update failed with exception', {
            operation: 'createStatus',
            alertName: request.query?.AlertName,
            status: request.query?.Status,
            duration
        })
        return callback(FATAL_ERROR)
    }
}

export { createStatus }