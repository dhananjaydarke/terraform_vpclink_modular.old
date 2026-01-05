import sql from 'mssql'

import { logger, logError } from '../Components/Logger.js'
import { FATAL_ERROR } from '../Components/StatusCodes.js'
import { poolPromise } from '../configurations/SQL/ConnectionPool.js'

function formatDateTime(dateTime) {
    if (dateTime !== null && dateTime !== undefined) {
        const date = new Date(dateTime)
        if (isNaN(date.getTime())) {
            logger.warn('Invalid date format provided', {
                operation: 'formatDateTime',
                providedValue: dateTime,
                tool: 'Runbook'
            })
            return null
        }
        const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000
        const localDate = new Date(date.getTime() - timezoneOffsetMs)
        return localDate
    } else {
        return null
    }
}

function formatTime(time) {
    const newTime = '00:' + time
    logger.debug('Time formatted', {
        operation: 'formatTime',
        originalTime: time,
        formattedTime: newTime,
        tool: 'Runbook'
    })
    return newTime
}

async function runbookAPI(request, callback) {
    const startTime = Date.now()
    try {
        const projectName = request.body.Project_Name
        const status = request.body.Status
        const jobId = request.body.Job_ID
        
        logger.info('Runbook API request received', {
            operation: 'runbookAPI',
            projectName,
            status,
            jobId,
            maintenance: request.body.Maintenance,
            totalJobs: request.body.Total_Jobs,
            successfulJobs: request.body.Successful_Jobs,
            failedJobs: request.body.Failed_Jobs,
            tool: 'Runbook'
        })

        const updateFields = [
            'Status = @status',
            'Maintenance = @maintenance',
            'Start_Time = @startTime',
            'End_Time = @endTime',
            'Next_Execution = @nextExecution',
            'URL = @url',
            'Total_jobs = @totalJobs',
            'Successful_jobs = @successfulJobs',
            'Failed_jobs = @failedJobs'
        ]

        const pool = await poolPromise

        const updateRequest = pool.request()
            .input('status', sql.VarChar, status)
            .input('maintenance', sql.Bit, request.body.Maintenance ?? false)
            .input('startTime', sql.DateTime, formatDateTime(request.body.Start_Time))
            .input('endTime', sql.DateTime, formatDateTime(request.body.End_Time))
            .input('nextExecution', sql.DateTime, formatDateTime(request.body.Next_Execution))
            .input('url', sql.VarChar, request.body.URL)
            .input('totalJobs', sql.Int, request.body.Total_Jobs)
            .input('successfulJobs', sql.Int, request.body.Successful_Jobs)
            .input('failedJobs', sql.Int, request.body.Failed_Jobs)
            .input('projectName', sql.VarChar, projectName)

        const requestCompleted = status === 'Successful' || status === 'Success' || status === 'Failed'
        if (requestCompleted) {
            updateFields.push('Total_Time = @totalTime')
            updateRequest.input('totalTime', sql.VarChar, formatTime(request.body.Total_Time))
            if (status === 'Successful' || status === 'Success') {
                updateFields.push('Last_Execution = @lastExecution')
                updateRequest.input('lastExecution', sql.DateTime, formatDateTime(request.body.End_Time))
            }
            
            logger.info('Runbook execution completed', {
                operation: 'runbookAPI',
                projectName,
                status,
                jobId,
                totalTime: request.body.Total_Time,
                executionType: 'completed',
                tool: 'Runbook'
            })
        } else {
            updateFields.push('Progress = @progress')
            updateRequest.input('progress', sql.Int, request.body.Progress)
            
            logger.debug('Runbook execution in progress', {
                operation: 'runbookAPI',
                projectName,
                status,
                jobId,
                progress: request.body.Progress,
                executionType: 'in_progress',
                tool: 'Runbook'
            })
        }

        // Check current maintenance status
        const maintenanceQuery = `select Maintenance from THDDB.dbo.RunbookCurrent
                                    where Project_Name = @projectName`
        const maintenanceStatus = await pool.request()
            .input('projectName', sql.VarChar, projectName)
            .query(maintenanceQuery)

        let queryResults
        let maintenanceChanged = false

        if (maintenanceStatus.recordset.length !== 0) {
            const currentMaintenance = maintenanceStatus.recordset[0].Maintenance
            const newMaintenance = request.body.Maintenance
            
            if (currentMaintenance && !newMaintenance) {
                updateFields.push('Maintenance_Start_Time = @maintenanceStartTime')
                updateRequest.input('maintenanceStartTime', sql.DateTime, null)
                maintenanceChanged = true
                
                logger.info('Runbook maintenance mode ended', {
                    operation: 'runbookAPI',
                    projectName,
                    maintenanceTransition: 'ended',
                    tool: 'Runbook'
                })
            } else if (!currentMaintenance && newMaintenance) {
                updateFields.push('Maintenance_Start_Time = @maintenanceStartTime')
                updateRequest.input('maintenanceStartTime', sql.DateTime, formatDateTime(new Date()))
                maintenanceChanged = true
                
                logger.info('Runbook maintenance mode started', {
                    operation: 'runbookAPI',
                    projectName,
                    maintenanceTransition: 'started',
                    tool: 'Runbook'
                })
            }
            
            const sqlUpdate = `update THDDB.dbo.RunbookCurrent 
                                set ${updateFields.join(', ')}
                                where Project_Name = @projectName`
            queryResults = await updateRequest.query(sqlUpdate)
            
            logger.debug('Runbook current status updated', {
                operation: 'runbookAPI',
                projectName,
                fieldsUpdated: updateFields.length,
                rowsAffected: queryResults.rowsAffected[0],
                maintenanceChanged,
                tool: 'Runbook'
            })
        } else {
            logger.warn('Project not found in RunbookCurrent table', {
                operation: 'runbookAPI',
                projectName,
                tool: 'Runbook'
            })
        }

        // Insert completed jobs into history
        if (requestCompleted) {
            const insertQuery = `insert into THDDB.dbo.RunbookPast (Project_Name, job_ID, Status, Maintenance, Start_Time, End_Time, URL, Total_Jobs, Successful_Jobs, Failed_Jobs)
                                    values (@projectName, @jobId, @status, @maintenance, @startTime, @endTime, @url, @totalJobs, @successfulJobs, @failedJobs)`
            queryResults = await pool.request()
                .input('projectName', sql.VarChar, projectName)
                .input('jobId', sql.Int, jobId)
                .input('status', sql.VarChar, status)
                .input('maintenance', sql.Bit, request.body.Maintenance ?? false)
                .input('startTime', sql.DateTime, formatDateTime(request.body.Start_Time))
                .input('endTime', sql.DateTime, formatDateTime(request.body.End_Time))
                .input('url', sql.VarChar, request.body.URL)
                .input('totalJobs', sql.Int, request.body.Total_Jobs)
                .input('successfulJobs', sql.Int, request.body.Successful_Jobs)
                .input('failedJobs', sql.Int, request.body.Failed_Jobs)
                .query(insertQuery)
            
            logger.info('Runbook execution archived', {
                operation: 'runbookAPI',
                projectName,
                jobId,
                status,
                totalJobs: request.body.Total_Jobs,
                successfulJobs: request.body.Successful_Jobs,
                failedJobs: request.body.Failed_Jobs,
                rowsInserted: queryResults.rowsAffected[0],
                tool: 'Runbook'
            })
        }

        const duration = Date.now() - startTime
        logger.info('Runbook API request completed', {
            operation: 'runbookAPI',
            projectName,
            status,
            jobId,
            duration,
            requestCompleted,
            maintenanceChanged,
            tool: 'Runbook'
        })

        return callback(queryResults)
    } catch (err) {
        const duration = Date.now() - startTime
        logError(err, 'Runbook API request failed', {
            operation: 'runbookAPI',
            projectName: request.body?.Project_Name,
            jobId: request.body?.Job_ID,
            status: request.body?.Status,
            duration
        })
        return callback(FATAL_ERROR)
    }
}

export { runbookAPI }
