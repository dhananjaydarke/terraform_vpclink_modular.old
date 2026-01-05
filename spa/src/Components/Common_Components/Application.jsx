import PropTypes from 'prop-types'
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Card, Collapse } from 'react-bootstrap'

import alertSoundFile from '../../Sounds/alert.mp3'
import { isValidArray } from '../miscUtils.jsx'
import { getDatabasesIcon, getApplicationIcon, getAlertIcon, getCriticalIcon, getTimerIcon, getToolIcon, getDangerStatus } from '../setIconUtils.jsx'
import { urlOpen } from '../viewsUtils.jsx'
import DashChanges from './Changes.jsx'
import '../../CSS/General.css'
import '../../CSS/Common_Components/CommonComponents.css'
import '../../CSS/Common_Components/Application.css'

const Application = ({ application, isMuted, appsExpanded, selectedDC, selectedData, modifiedButtonStatus, impactedButtonStatus }) => {
    const alertSound = useMemo(() => new Audio(alertSoundFile), [])
    const [lastAlertTime, setLastAlertTime] = useState(0)
    const previousAlertStates = useRef({})
    const [applicationName] = useState(application.Name)
    const [applicationDC] = useState(application.RunDCs)
    const [databaseDC] = useState(application.DBDCs)
    const [isHighlighted, setIsHighlighted] = useState(null)
    const [isExpanded, setIsExpanded] = useState(appsExpanded)
    const [, setTimer] = useState(new Date())
    const [time, setTime] = useState(new Date())
    const [modifiedChanges, setModifiedChanges] = useState(application.ModifiedChanges || [])
    const [impactedChanges, setImpactedChanges] = useState(application.ImpactedChanges || [])
    const isManualChange = useRef(false)

    const playAlertSound = useCallback(() => {
        const now = Date.now()
        // Need to check isMuted, because a user must interact with the page before a sound is played
        if (now - lastAlertTime >= 3000 && !isMuted) {
            alertSound.play().catch(() => { })
            setLastAlertTime(now)
        }
    }, [lastAlertTime, isMuted, alertSound])

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date())
        }, 1000)
        setTimer(interval)
        return () => clearInterval(interval)
    }, [setTimer])

    useEffect(() => {
        if (!isManualChange.current) {
            setIsExpanded({ [applicationName]: appsExpanded })
        }
        isManualChange.current = false
    }, [applicationName, appsExpanded])

    useEffect(() => {
        setModifiedChanges(application.ModifiedChanges || [])
    }, [application.ModifiedChanges])

    useEffect(() => {
        setImpactedChanges(application.ImpactedChanges || [])
    }, [application.ImpactedChanges])


    useEffect(() => {
        if (selectedData === 'App Database') {
            if (selectedDC && applicationDC && applicationDC.includes(selectedDC)) {
                setIsHighlighted(true)
            } else if (selectedDC && databaseDC && databaseDC.includes(selectedDC)) {
                setIsHighlighted(true)
            } else {
                setIsHighlighted(false)
            }
        } else if (selectedData === 'App') {
            if (applicationDC && selectedDC && applicationDC.includes(selectedDC)) {
                setIsHighlighted(true)
            } else {
                setIsHighlighted(false)
            }
        } else if (selectedData === 'Database') {
            if (databaseDC && selectedDC && databaseDC.includes(selectedDC)) {
                setIsHighlighted(true)
            } else {
                setIsHighlighted(false)
            }
        } else {
            setIsHighlighted(false)
        }
    }, [selectedDC, selectedData, applicationDC, databaseDC])

    useEffect(() => {
        if (isValidArray(application.Services)) {
            application.Services.forEach(service => {
                const currentDangerStatus = getDangerStatus(getAlertIcon, service)
                const previousDangerStatus = previousAlertStates.current[service.Name]
                if (currentDangerStatus === 'danger' && previousDangerStatus !== 'danger') {
                    playAlertSound()
                }
                previousAlertStates.current = {
                    ...previousAlertStates.current,
                    [service.Name]: currentDangerStatus
                }
            })
        }
    }, [application.Services, playAlertSound])

    const toggleExpanded = (appName) => {
        isManualChange.current = true
        setIsExpanded({ [appName]: !isExpanded[appName] })
    }

    const serviceIsAlerting = (service) => {
        const alertStatus = getAlertIcon(service).key
        if (alertStatus === 'danger' || alertStatus === 'warning' || alertStatus === 'repair') {
            return true
        }
        return isExpanded[applicationName]
    }

    return (
        <div>
            <Card.Subtitle onClick={() => { toggleExpanded(applicationName) }} className={isHighlighted ? 'selected' : getDangerStatus(getApplicationIcon, application)}>
                <span className='application-name'>{applicationName} {getDatabasesIcon(application)}
                    <DashChanges
                        changes={modifiedChanges}
                        buttonStatus={modifiedButtonStatus}
                        type='modified'
                    />

                    <DashChanges
                        changes={impactedChanges}
                        buttonStatus={impactedButtonStatus}
                        type='impacted'
                    />
                </span>
                {getApplicationIcon(application)}
            </Card.Subtitle>
            {application.Services.map((service, id) => (
                <Collapse in={serviceIsAlerting(service)} key={id}>
                    <Card.Text id={service.Name} onClick={() => { urlOpen(service.URL) }} className={getDangerStatus(getAlertIcon, service)}>
                        <span className='service-text-and-icons'>{getCriticalIcon(service)}{service.Name} {getToolIcon(service)}</span><span className='timer-and-status-icon'>{getTimerIcon(service, time)}{getAlertIcon(service)}</span>
                    </Card.Text>
                </Collapse>
            ))}
        </div>
    )
}

Application.propTypes = {
    application: PropTypes.object.isRequired,
    isMuted: PropTypes.bool.isRequired,
    appsExpanded: PropTypes.bool.isRequired,
    selectedDC: PropTypes.string,
    selectedData: PropTypes.string,
    modifiedButtonStatus: PropTypes.bool.isRequired,
    impactedButtonStatus: PropTypes.bool.isRequired
}

export default Application
