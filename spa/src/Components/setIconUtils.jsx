import React from 'react'
import { Icon, Popup, Image } from 'semantic-ui-react'

import AppD from '../Images/AppD - White.png'
import '../CSS/setIconUtils.css'


const allAreOk = (array) => { // If all of the alerts are a status ok then return true
    const result = array.every(element => {
        if (element === 'STATUS_OK') {
            return true
        }
        return false
    })
    return result
}

const allAreNonAlert = (array) => { // If all of the alerts are a status ok then return true
    const result = array.every(element => {
        if (element === 'non-alert') {
            return true
        }
        return false
    })
    return result
}

const getToolIcon = (status) => {
    if (status.Alerts.length === 0) {
        return null
    }

    const firstTool = status.Alerts[0].Tool
    const allTools = status.Alerts.every(tools => tools.Tool === firstTool)
    if (allTools) {
        if (firstTool === 'Grafana') {
            // return <Image src={Grafana} avatar />
        } else if (firstTool === 'AppD') {
            return <Image src={AppD} avatar />
        }
    }

    return null
}

const getCriticalIcon = (status) => { // Set the Alerts Icons
    if (status.Priority === 'Critical') {
        return <Icon name='exclamation triangle' color='grey' />
    }

}

const getDatabasesIcon = (application) => { // Set if application is in AWS
    if (JSON.stringify(application.RunDCs).includes('AWS') || JSON.stringify(application.DBDCs).includes('AWS')) {
        return <Icon name='aws' color='orange' />
    } else if (application.Databases === 'WNDC') {
        return <Icon name='database' color='orange' />
    } else {
        return null
    }
}

const getFormattedDuration = (start, now = new Date()) => {
    if (!start) { return '' }
    const startDateTime = new Date(start)
    const currentCstTime = Date.parse(now.toLocaleString('en-US', {timeZone: 'America/Chicago'}))
    const duration = currentCstTime - startDateTime

    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((duration % (1000 * 60)) / 1000)

    return `${hours.toString()}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const getTimerIcon = (status, time) => {
    let alerting = false
    let alertTime = 0

    status.Alerts.forEach((entry) => {
        if (entry.Status === 'STATUS_DANGER' || entry.Status === 'STATUS_WARNING' || entry.Status === 'STATUS_REPAIR') {
            const entryTime = Date.parse(entry.Time)
            if ((!alerting) || (entryTime < alertTime)) {
                // only set alertTime if unset or new one is older than current one
                alerting = true
                alertTime = entryTime
            }
        }
    })

    if (alerting) {
        const currentCstTime = Date.parse(time.toLocaleString('en-US', {timeZone: 'America/Chicago'}))
        const alertDuration = currentCstTime - alertTime
        const hours = Math.floor(alertDuration / (1000 * 60 * 60))
        let minutes = Math.floor((alertDuration % (1000 * 60 * 60)) / (1000 * 60))
        let seconds = Math.floor((alertDuration % (1000 * 60)) / 1000)

        // zero-pad minutes and seconds
        minutes = ('0' + minutes).slice(-2)
        seconds = ('0' + seconds).slice(-2)

        return <span className='stop-watch'>{hours}:{minutes}:{seconds}</span>
    }
}

const getAlertIcon = (status) => { // Set the Alerts Icons
    const alertStatus = status.Alerts.map((entry) => entry.Status)

    if (alertStatus.includes(null) && status.Alerts[0].Name === null) {
        return <Popup trigger={<Icon inverted name='bell slash outline' key='non-alert' />} key='non-alert' content='Non-Alerting' inverted />
    } else if (alertStatus.includes('STATUS_DANGER') && status.Priority === 'Critical') {
        return <Popup trigger={<Icon name='x' color='red' key='danger' />} key='danger' content='DANGER! ISSUE!' inverted />
    } else if ((alertStatus.includes('STATUS_DANGER') && status.Priority === 'Non-Critical') || alertStatus.includes('STATUS_WARNING')) {
        return <Popup trigger={<Icon name='warning circle' color='yellow' key='warning' />} key='warning' content='Service in Warning State' inverted />
    } else if (alertStatus.includes('STATUS_REPAIR') || alertStatus.includes('undefined') || alertStatus.includes(null)) {
        return <Popup trigger={<Icon name='wrench' color='yellow' key='repair' />} key='repair' content='Change In Progress/Non-functional' inverted />
    } else if (alertStatus.includes('STATUS_ONBOARDING')) {
        return <Popup trigger={<Icon inverted name='bell slash outline' key='non-alert' />} key='non-alert' content='Onboarding Alert' inverted />
    } else if (allAreOk(alertStatus)) {
        return <Popup trigger={<Icon name='checkmark' color='green' key='ok' />} key='ok' content='No Known Issues' inverted />
    }
}

const getApplicationIcon = (applications) => { // Set the Applications Icons
    if (!applications || applications.length === 0) {
        return null
    }
    const applicationStatuses = applications.Services.map((application) => {
        const services = application || []
        if (getAlertIcon(services).key === 'danger') {
            return 'danger'
        } else if (getAlertIcon(services).key === 'ok') {
            return 'ok'
        } else if (getAlertIcon(services).key === 'warning') {
            return 'warning'
        } else if (getAlertIcon(services).key === 'repair') {
            return 'repair'
        } else if (getAlertIcon(services).key === 'non-alert') {
            return 'non-alert'
        } return null
    })

    if (applicationStatuses.includes('danger')) {
        return <Icon name='x' color='red' key='danger' />
    } else if (applicationStatuses.includes(null) || applicationStatuses.includes('warning')) {
        return <Icon name='warning circle' color='yellow' key='warning' />
    } else if (applicationStatuses.includes('repair')) {
        return <Icon name='wrench' color='yellow' key='repair' />
    } else if (allAreNonAlert(applicationStatuses)) {
        return <Icon inverted name='bell slash outline' key='non-alert' />
    } else {
        return <Icon name='checkmark' color='green' key='ok' />
    }
}

const getAreaIcon = (areas) => { // Set the Area's Icon
    if (!areas || areas.length === 0) {
        return null
    }

    const areaStatuses = areas.Applications.map((area) => {

        if (getApplicationIcon(area).key === 'danger') {
            return 'danger'
        } else if (getApplicationIcon(area).key === 'ok') {
            return 'ok'
        } else if (getApplicationIcon(area).key === 'warning') {
            return 'warning'
        } else if (getApplicationIcon(area).key === 'repair') {
            return 'repair'
        } else if (getApplicationIcon(area).key === 'non-alert') {
            return 'non-alert'
        } return null
    })

    if (areaStatuses.includes('danger')) {
        return <Icon name='x' color='red' key='danger' />
    } else if (areaStatuses.includes(null) || areaStatuses.includes('warning')) {
        return <Icon name='warning circle' color='yellow' key='warning' />
    } else if (areaStatuses.includes('repair')) {
        return <Icon name='wrench' color='yellow' key='repair' />
    } else if (allAreNonAlert(areaStatuses)) {
        return <Icon inverted name='bell slash outline' key='non-alert' />
    } else {
        return <Icon name='checkmark' color='green' key='ok' />
    }
}

const getPortfolioAlertingStatus = (portfolio) => {
    if (!portfolio || portfolio.length === 0) {
        return null
    }

    const alertingStatus = portfolio.Areas.map((area) => {
        return getAreaIcon(area).key
    })

    if (alertingStatus.includes('danger')) {
        return 'danger'
    } else if (alertingStatus.includes('warning')) {
        return 'warning'
    } else {
        return 'ok'
    }
}

const getDangerStatus = (getIconFunction, item) => {
    const alertStatus = getIconFunction(item).key
    return alertStatus === 'danger' ? alertStatus : ''
}

export { getAlertIcon, getApplicationIcon, getAreaIcon, getPortfolioAlertingStatus, getCriticalIcon, getDatabasesIcon, getFormattedDuration, getTimerIcon, getToolIcon, getDangerStatus }
