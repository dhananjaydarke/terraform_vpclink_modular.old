import React, { useState, useEffect, useCallback } from 'react'
import { Card, Collapse, Col, Container, Spinner } from 'react-bootstrap'

import { getAlertIcon, getApplicationIcon, getAreaIcon, getCriticalIcon, getDatabasesIcon } from '../Components/setIconUtils.jsx'
import { fetchData, urlOpen } from '../Components/viewsUtils.jsx'
import '../CSS/LIAT.css'
import 'bootstrap/dist/css/bootstrap.min.css'

const LIAT = () => {
    const [data, setData] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [cardExpanded, setCardExpanded] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)

    const fetchAndSetData = useCallback(async(url) => {
        const { data, isLoading } = await fetchData(url) // Initial fetch to grab the data from the backend
        if (isLoading) {
            setIsLoading(true)
        } else {
            setData(data)
            setIsLoading(false)
        }
    }, [])

    const toggleCardExpanded = (index) => {
        setCardExpanded({ ...cardExpanded, [index]: !cardExpanded[index] })
    }

    const toggleExpanded = (index) => {
        setIsExpanded({ ...isExpanded, [index]: !isExpanded[index] })
    }

    const isApplicationAlerting = (application, areaIndex) => {
        const alertStatus = getApplicationIcon(application).key
        if (alertStatus === 'danger' || alertStatus === 'warning' || alertStatus === 'repair') {
            return true
        }
        return cardExpanded[areaIndex]
    }

    useEffect(() => {
        const url = 'LIAT_DATA'
        fetchAndSetData(url) // Initial fetch to grab the data from the backend
        const interval = setInterval(() => { // Fetch data every 30 seconds
            fetchAndSetData(url)
        }, 30000)
        return () => {
            clearInterval(interval) // Clear interval on unmount
        }
    }, [fetchAndSetData])

    if (isLoading) {
        return (
            <div style={{ height: '100vh', backgroundColor: '#3851a3' }}>
                <Spinner animation='border' variant='light' />
            </div>
        )
    }

    return (
        <div className='liat-body'>
            {data.map((portfolio, portfolioIndex) => (
                <div key={portfolioIndex} className='liat-portfolio-tile'>
                    <Container className='liat-body'>
                        {portfolio.Areas.map((area, areaIndex) => (
                            <Col key={areaIndex}>
                                <Card className='liat-card'>
                                    <Card.Body className='liat-body-card'>
                                        <Card.Title style={{ backgroundColor: '#3851a3', color: 'white', fontSize: '1.25rem' }} onClick={() => { toggleCardExpanded(areaIndex) }}><span className='area-card-title'>{area.Name}</span> {getAreaIcon(area)}</Card.Title>
                                        {area.Applications.map((application, applicationIndex) => (
                                            <Collapse in={isApplicationAlerting(application, areaIndex)} key={applicationIndex}>
                                                <div key={application.id}>
                                                    <Card.Subtitle onClick={() => { toggleExpanded(application.Name) }} style={{ display: 'block', textAlign: 'center', fontSize: '0.67em' }}>
                                                        {application.Name} {getDatabasesIcon(application)} {getApplicationIcon(application)}
                                                    </Card.Subtitle>
                                                    {application.Services.map((service, serviceIndex) => (
                                                        <Collapse in={isExpanded[application.Name]} key={serviceIndex}>
                                                            <Card.Text onClick={() => { urlOpen(service.URL) }} style={{ textAlign: 'center', fontSize: '.25em' }}>
                                                                {service.Name} {getCriticalIcon(service)} {getAlertIcon(service)}
                                                            </Card.Text>
                                                        </Collapse>
                                                    ))}
                                                </div>
                                            </Collapse>
                                        ))}
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Container>
                </div>
            ))}
        </div>
    )
}

export default LIAT
