import PropTypes from 'prop-types'
import React, { useState, useEffect, useRef } from 'react'
import { Card, Collapse } from 'react-bootstrap'

import Application from './Application.jsx'
import { getAreaIcon, getApplicationIcon, getDangerStatus } from '../setIconUtils.jsx'
import '../../CSS/General.css'
import '../../CSS/Common_Components/CommonComponents.css'
import '../../CSS/Common_Components/AreaCard.css'

const AreaCard = ({ area, isMuted, cardsExpanded, appsExpanded, selectedDC, selectedData, modifiedButtonStatus, impactedButtonStatus }) => {
    const [isExpanded, setIsExpanded] = useState(cardsExpanded)
    const [areAppsExpanded, setAreAppsExpanded] = useState(appsExpanded)
    const isManualChange = useRef(false)

    useEffect(() => {
        if (!isManualChange.current) {
            setIsExpanded(cardsExpanded)
        }
        isManualChange.current = false
    }, [cardsExpanded])

    useEffect(() => {
        if (!isManualChange.current) {
            setAreAppsExpanded(appsExpanded)
            if (!isExpanded) {
                setIsExpanded(appsExpanded)
            }
        }
        isManualChange.current = false
    }, [isExpanded, appsExpanded])

    const collapseDropdown = () => {
        isManualChange.current = true
        if (isExpanded) {
            setIsExpanded(false)
            setAreAppsExpanded(false)
        } else {
            setIsExpanded(true)
        }
    }

    const applicationIsAlerting = (application) => {
        const alertStatus = getApplicationIcon(application).key
        if (alertStatus === 'danger' || alertStatus === 'warning' || alertStatus === 'repair') {
            return true
        }
        return isExpanded
    }

    const getApplicationProps = (application, index) => ({
        application: application,
        index: index,
        isMuted: isMuted,
        appsExpanded: areAppsExpanded,
        selectedDC: selectedDC,
        selectedData: selectedData,
        modifiedButtonStatus: modifiedButtonStatus,
        impactedButtonStatus: impactedButtonStatus
    })

    return (
        <div className='area-card'>
            <Card.Title onClick={() => { collapseDropdown() }} className={getDangerStatus(getAreaIcon, area)}>
                <span className='area-card-title'>{area.Name}</span> {getAreaIcon(area)}
            </Card.Title>
            {area.Applications.map((application, index) => (
                <Collapse in={applicationIsAlerting(application)} key={index}>
                    <div key={application.id}>
                        <Application {...getApplicationProps(application, index)} />
                    </div>
                </Collapse>
            ))}
        </div>
    )
}

AreaCard.propTypes = {
    area: PropTypes.object.isRequired,
    isMuted: PropTypes.bool.isRequired,
    cardsExpanded: PropTypes.bool.isRequired,
    appsExpanded: PropTypes.bool.isRequired,
    selectedDC: PropTypes.string,
    selectedData: PropTypes.string,
    modifiedButtonStatus: PropTypes.bool.isRequired,
    impactedButtonStatus: PropTypes.bool.isRequired
}

export default AreaCard
