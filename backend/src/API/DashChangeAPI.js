import sql from 'mssql'

import { logger, logError } from '../Components/Logger.js'
import { poolPromise } from '../configurations/SQL/ConnectionPool.js'
import { dashPoolPromise } from '../configurations/SQL/DashConnectionPool.js'

async function updateReferencedChanges(sysID, chgNumber, table) {
    try {
        const pool = await poolPromise
        const query = `merge THDDB.dbo.${table} as target
                using (select @sysID as SysID, @chgNumber as CHG_Number) as source
                on target.SysID = source.SysID and target.CHG_Number = source.CHG_Number
                when not matched then
                    insert (SysID, CHG_Number)
                    values (source.SysID, source.CHG_Number);`

        await pool.request()
            .input('sysID', sql.NVarChar, sysID)
            .input('chgNumber', sql.NVarChar, chgNumber)
            .query(query)

        logger.debug('Change reference updated', {
            operation: 'updateReferencedChanges',
            sysID,
            changeNumber: chgNumber,
            table,
            tool: 'DashChange'
        })
    } catch (err) {
        logError(err, 'Failed to update referenced changes', { 
            operation: 'updateReferencedChanges',
            sysID,
            changeNumber: chgNumber,
            table
        })
    }
}

async function cleanOldRecords() {
    try {
        const pool = await poolPromise
        const result = await pool.request().query(`delete from THDDB.dbo.ModifiedChange 
                where CreatedDateTime < dateadd(day, -1, sysdatetime());
                
                delete from THDDB.dbo.ImpactedChange 
                where CreatedDateTime < dateadd(day, -1, sysdatetime());`)

        logger.info('Old change records cleaned', {
            operation: 'cleanOldRecords',
            modifiedDeleted: result.rowsAffected[0] || 0,
            impactedDeleted: result.rowsAffected[1] || 0,
            tool: 'DashChange'
        })
    } catch (err) {
        logError(err, 'Failed to clean old records', { operation: 'cleanOldRecords' })
    }
}

async function getSysIDs() {
    try {
        const pool = await poolPromise
        const result = await pool.request().query(`select SysID from THDDB.dbo.DashApplication where SysID not like 'Pseudo%'`)
        
        logger.debug('System IDs retrieved', {
            operation: 'getSysIDs',
            sysIDCount: result.recordset.length,
            tool: 'DashChange'
        })
        
        return result.recordset
    } catch (err) {
        logError(err, 'Failed to get system IDs', { operation: 'getSysIDs' })
        return []
    }
}

async function getChangesForSystem(sysID) {
    const dashQuery = `select
                                cr.number,
                                tc.u_added_by
                           from TSS_Reporting.dbo.task_ci tc
                           inner join TSS_Reporting.dbo.change_request cr
                                on tc.dv_task = cr.number
                           where tc.ci_item = @SysID
                                and cr.start_date >= cast(getdate() as date)
                                and cr.start_date < dateadd(day, 3, cast(getdate() as date))
                                and cr.dv_u_environment = 'Production'
                                and cr.dv_state in ('Scheduled', 'Implementation', 'Completed')`
    
    const dashPool = await dashPoolPromise
    return await dashPool.request()
        .input('SysID', sql.NVarChar, sysID)
        .query(dashQuery)
}

async function processChanges(sysID, changes, counters) {
    logger.debug('Changes found for system', {
        operation: 'changeManagementAPI',
        sysID,
        changeCount: changes.recordset.length,
        tool: 'DashChange'
    })

    for (const change of changes.recordset) {
        const table = change.u_added_by === '' ? 'ModifiedChange' : 'ImpactedChange'
        await updateReferencedChanges(sysID, change.number, table)
        counters.totalChangesProcessed++
        counters[table === 'ModifiedChange' ? 'modifiedChanges' : 'impactedChanges']++
    }
}

async function changeManagementAPI() {
    const startTime = Date.now()
    try {
        logger.debug('Starting change management API cycle', { 
            operation: 'changeManagementAPI',
            tool: 'DashChange'
        })

        await cleanOldRecords()
        const sysIDs = await getSysIDs()

        const counters = {
            totalChangesProcessed: 0,
            modifiedChanges: 0,
            impactedChanges: 0
        }

        for (const { SysID } of sysIDs) {
            const changes = await getChangesForSystem(SysID)
            
            if (changes?.recordset?.length > 0) {
                await processChanges(SysID, changes, counters)
            }
        }

        const duration = Date.now() - startTime
        logger.info('Change management API cycle completed', {
            operation: 'changeManagementAPI',
            duration,
            systemsProcessed: sysIDs.length,
            ...counters,
            tool: 'DashChange'
        })
    } catch (err) {
        logError(err, 'Change management API cycle failed', { 
            operation: 'changeManagementAPI',
            duration: Date.now() - startTime
        })
    }
}

logger.info('DashChange API service starting', { component: 'DashChangeAPI', tool: 'DashChange' })
changeManagementAPI()
setInterval(() => {changeManagementAPI()}, 300000)
