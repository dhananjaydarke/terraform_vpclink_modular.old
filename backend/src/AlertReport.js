import { hostname } from 'os'

import nodemailer from 'nodemailer'

import { logger, logError } from './Components/Logger.js'
import { poolPromise } from './configurations/SQL/ConnectionPool.js'

const localTest = process.env.LOCAL_TEST // true if EMAIL_USER/PASS are defined locally as env variables
let fromEmail = `Technology Health Dashboard <teccmon@${hostname}.DARKE.com>`
let transporterObj = { sendmail: true }

if (localTest) {
    fromEmail = process.env.EMAIL_USER
    transporterObj = {
        host: 'smtp.ddarkecorp.com',
        port: 587,
        secure: false,
        tls: { rejectUnauthorized: false }, // do not fail on invalid certs
        auth: { user: fromEmail, pass: process.env.EMAIL_PASS }
    }
}

const transporter = nodemailer.createTransport(transporterObj)

const emailTimeHour = 8 // Used to determine time window of alert query, and time email is sent
const emailTimeMinute = 5 // Used to determine time email is sent
const date = new Date()
date.setHours(emailTimeHour)
date.setMinutes(0)
const emailTimeHourFormatted = date.toLocaleString([], { hour: 'numeric', minute: '2-digit' })

const prodRegex = /^((w11|sdc)p|xl[ps])/
const inProd = prodRegex.test(hostname)

const thdL3DG = 'TechnologyHealthDashboardL3Support-DG@wnco.com'
const thdAlertReportDG = 'THDAlertReport-DG@wnco.com'
const emailInfo = {
    from: fromEmail,
    cc: localTest ? fromEmail : thdL3DG,
    bcc: inProd ? thdAlertReportDG : '',
    subject: '',
    html: ''
}

logger.info('Alert Report service initialized', {
    operation: 'initialization',
    localTest: !!localTest,
    inProduction: inProd,
    hostname,
    emailTimeHour,
    emailTimeMinute,
    fromEmail: localTest ? fromEmail : 'masked',
    tool: 'AlertReport'
})

function grabDate() {
    const dateTime = new Date()
    const day = ('0' + dateTime.getDate()).slice(-2)
    const month = ('0' + (dateTime.getMonth() + 1)).slice(-2)
    const year = dateTime.getFullYear()
    const currentDate = year + '-' + month + '-' + day

    return currentDate
}

let totalAlerts = 0
let alertHeader = ''
const alerts = new Map()
const cellStyle = 'border: 1px solid; padding-left: 10px; padding-right: 10px; text-align: left'

function formatRow(row) {
    const tableRow = '<tr>' + row.map((cell, index) => `<td style="${cellStyle}" ${index === 0 ? 'nowrap' : ''}>${cell}</td>`).join('') + '</tr>'
    return tableRow
}

async function grabAlerts() {
    const startTime = Date.now()
    try {
        logger.debug('Alert report data collection started', {
            operation: 'grabAlerts',
            emailTimeHour,
            tool: 'AlertReport'
        })

        alerts.clear() // clear out any previous alert entries
        totalAlerts = 0
        const pool = await poolPromise

        // Get portfolios first
        const portfolioQuery = `select Name
                                from THDDB.dbo.Portfolio
                                order by Sequence, Name`
        const portfolioResults = await pool.request().query(portfolioQuery)
        
        logger.debug('Portfolios retrieved', {
            operation: 'grabAlerts',
            portfolioCount: portfolioResults.recordset.length,
            tool: 'AlertReport'
        })

        portfolioResults.recordset.forEach((portfolio) => {
            alerts.set(portfolio.Name, [])
        })

        // Get alerts within time window
        const queryStr = `select p.Name Portfolio, FORMAT(h.WriteTime, 'yyyy-MM-dd HH:mm:ss') 'Write Time', h.Status,
                                al.Alert_Name 'Alert Name', s.Name Service, ap.Name Application, ar.Name Area
                            from THDDB.dbo.Portfolio p
                                inner join THDDB.dbo.Area ar on ar.Portfolio_ID = p.ID
                                inner join THDDB.dbo.Application ap on ap.Area_ID = ar.ID
                                inner join THDDB.dbo.Service s on s.Application_ID = ap.ID
                                inner join THDDB.dbo.Alert al on al.Service_ID = s.ID
                                inner join THDDB.dbo.AlertStatusHistory h on h.Alert_ID = al.ID
                            where h.WriteTime between datetimefromparts(
                                datepart(year, dateadd(day, -1, sysdatetime())),
                                datepart(month, dateadd(day, -1, sysdatetime())),
                                datepart(day, dateadd(day, -1, sysdatetime())),
                                ${emailTimeHour},0,0,0)
                            and datetimefromparts(
                                datepart(year, sysdatetime()),
                                datepart(month, sysdatetime()),
                                datepart(day, sysdatetime()),
                                ${emailTimeHour},0,0,0)
                            order by p.Sequence, Portfolio, h.WriteTime desc`
        
        const results = await pool.request().query(queryStr)
        
        if (results.recordset.length > 0) {
            // there are results, get the header row, removing Portfolio column from the beginning
            alertHeader = formatRow(Object.keys(results.recordset[0]).slice(1))
        }

        // Process alerts by portfolio
        const portfolioStats = {}
        results.recordset.forEach((alertInfo) => {
            totalAlerts++
            const portfolio = alertInfo.Portfolio
            
            if (!portfolioStats[portfolio]) {
                portfolioStats[portfolio] = { count: 0, statuses: {} }
            }
            portfolioStats[portfolio].count++
            portfolioStats[portfolio].statuses[alertInfo.Status] = (portfolioStats[portfolio].statuses[alertInfo.Status] || 0) + 1
            
            // append values for this entry, removing the Portfolio column from the beginning
            alerts.get(alertInfo.Portfolio).push(Object.values(alertInfo).slice(1))
        })

        const duration = Date.now() - startTime
        logger.info('Alert report data collected successfully', {
            operation: 'grabAlerts',
            duration,
            totalAlerts,
            portfoliosWithAlerts: Object.keys(portfolioStats).length,
            portfolioStats,
            timeWindow: `${emailTimeHour}:00 to ${emailTimeHour}:00`,
            tool: 'AlertReport'
        })

    } catch (err) {
        const duration = Date.now() - startTime
        logError(err, 'Alert report data collection failed', {
            operation: 'grabAlerts',
            duration,
            emailTimeHour
        })
        throw err
    }
}

function portfolioAlertReport(portfolio, portfolioAlerts) {
    logger.debug('Generating portfolio report section', {
        operation: 'portfolioAlertReport',
        portfolio,
        alertCount: portfolioAlerts.length,
        tool: 'AlertReport'
    })

    // create the HTML table header rows
    const portfolioHeader = `<tr><th colspan=3 style="${cellStyle}"><h2>Portfolio: ${portfolio}</h2></th>` +
        `<th colspan=3 style="${cellStyle}">Alert count: ${portfolioAlerts.length}</th></tr>`
    const alertTableHeader = `<thead style="font-weight: bold; ${cellStyle}">${portfolioHeader}${alertHeader}</thead>`
    // convert each row into an HTML format string
    const alertTable = portfolioAlerts.map((row) => formatRow(row)).join('\n')
    // create the HTML table body from the formatted rows
    const alertTableBody = `<tbody>${alertTable}</tbody>`
    // combine the header and body rows into an HTML table
    const portfolioTable = `<br><table style="border: 1px solid">${alertTableHeader}${alertTableBody}</table>`
    return portfolioTable
}

async function runAlertReport() {
    const startTime = Date.now()
    try {
        logger.info('Alert report generation started', {
            operation: 'runAlertReport',
            reportDate: grabDate(),
            localTest: !!localTest,
            tool: 'AlertReport'
        })

        // populate alerts array from DB
        await grabAlerts()
        let alertTables = ''
        let portfoliosWithAlerts = 0
        
        // process each portfolio's alerts
        alerts.forEach((portfolioAlerts, portfolio) => {
            if (portfolioAlerts.length > 0) {
                portfoliosWithAlerts++
            }
            alertTables += portfolioAlertReport(portfolio, portfolioAlerts)
        })

        emailInfo.subject = `Technology Health Dashboard Daily Alert Report for ${grabDate()}`
        const emailBody = `BCC: ${thdAlertReportDG}<br>` +
            `Report of THD alerts from ${emailTimeHourFormatted} to ${emailTimeHourFormatted}.<br>` +
            `Total alert count: ${totalAlerts}`
        emailInfo.html = `<body>${emailBody}<br>${alertTables}</body>`
        
        logger.debug('Email content prepared', {
            operation: 'runAlertReport',
            subject: emailInfo.subject,
            totalAlerts,
            portfoliosWithAlerts,
            emailBodyLength: emailInfo.html.length,
            tool: 'AlertReport'
        })

        await transporter.sendMail(emailInfo)
        
        const duration = Date.now() - startTime
        logger.info('Alert report sent successfully', {
            operation: 'runAlertReport',
            duration,
            totalAlerts,
            portfoliosWithAlerts,
            reportDate: grabDate(),
            recipients: {
                from: fromEmail,
                cc: emailInfo.cc,
                bcc: emailInfo.bcc
            },
            tool: 'AlertReport'
        })

    } catch (err) {
        const duration = Date.now() - startTime
        logError(err, 'Alert report generation failed', {
            operation: 'runAlertReport',
            duration,
            reportDate: grabDate()
        })
    }
    // schedule tomorrow's report
    scheduleAlertReport()
}

function scheduleAlertReport() {
    try {
        const now = new Date()
        const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), emailTimeHour, emailTimeMinute)
        let delayMillis = targetTime - now
        if (delayMillis < 0) { delayMillis += 24 * 60 * 60 * 1000 } // target time already passed today, add 24 hours
        targetTime.setTime(now.getTime() + delayMillis)
        delayMillis += (emailTimeHour - targetTime.getHours()) * 60 * 60 * 1000 // account for DST hour differences
        
        const nextRunTime = new Date(now.getTime() + delayMillis)
        
        logger.info('Alert report scheduled', {
            operation: 'scheduleAlertReport',
            nextRunTime: nextRunTime.toISOString(),
            delayHours: Math.round(delayMillis / (1000 * 60 * 60) * 100) / 100,
            targetHour: emailTimeHour,
            targetMinute: emailTimeMinute,
            tool: 'AlertReport'
        })

        setTimeout(runAlertReport, delayMillis)
    } catch (err) {
        logError(err, 'Failed to schedule alert report', {
            operation: 'scheduleAlertReport',
            emailTimeHour,
            emailTimeMinute
        })
    }
}

if (localTest) {
    logger.info('Running alert report immediately (local test mode)', {
        operation: 'startup',
        localTest: true,
        tool: 'AlertReport'
    })
    runAlertReport()
} else {
    logger.info('Alert report service starting in production mode', {
        operation: 'startup',
        localTest: false,
        tool: 'AlertReport'
    })
    scheduleAlertReport() // schedule the report for the next time slot
}

