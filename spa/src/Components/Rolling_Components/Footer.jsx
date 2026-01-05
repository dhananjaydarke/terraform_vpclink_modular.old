import PropTypes from 'prop-types'
import React, { useState, useEffect } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Icon, Image } from 'semantic-ui-react'

import Clock from './Clock.jsx'
import FooterBanner from './FooterBanner.jsx'
import AppD from '../../Images/AppD - White.png'
import Messages from '../Messages.jsx'
import '../../CSS/Rolling_Components/Footer.css'

const Footer = ({ alertingStatus }) => {
    const [time, setTime] = useState(new Date())
    const [, setTimer] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date())
        }, 1000)
        setTimer(timer)
        return () => clearInterval(timer)
    }, [])

    return (
        <footer className='footer-container'>
            <Messages />
            <Row className='legend-row' lg={7}>
                <Col className='legend-item'><h4><Icon name='x' color='red' key='danger' className='legend icon' /> = Service Impaired</h4></Col>
                <Col className='legend-item'><h4><Icon name='warning circle' color='yellow' className='legend icon' /> = Service Warning</h4></Col>
                <Col className='legend-item'><h4><Icon name='wrench' color='yellow' className='legend icon' /> = Change In Progress</h4></Col>
                <Col className='legend-item'><h4><Icon name='checkmark' color='green' className='legend icon' /> = Service OK</h4></Col>
                <Col className='legend-item'><h4><Icon inverted name='bell slash outline' className='legend icon' /> = Non-Alerting</h4></Col>
                <Col className='legend-item'><h4><Icon name='exclamation triangle' color='grey' className='legend icon' />  = Critical Service</h4></Col>
                <Col className='legend-item'><h4><Icon name='aws' color='orange' className='legend icon' />  = AWS</h4></Col>
                <Col className='legend-item'><h4><Image src={AppD} avatar />  = AppD</h4></Col>
            </Row>
            <Row className='footer-clock-row' lg={5}>
                <Col className='footer-clock'><Clock timeZone='Pacific/Honolulu' time={time} /></Col>
                <Col className='footer-clock'><Clock timeZone='PST' time={time} /></Col>
                <Col className='footer-clock'><Clock timeZone='America/Denver' time={time} /></Col>
                <Col className='footer-clock'><Clock timeZone='America/Chicago' time={time} /></Col>
                <Col className='footer-clock'><Clock timeZone='America/New_York' time={time} /></Col>
                <Col className='footer-clock'><Clock timeZone='UTC' time={time} /></Col>
                <Col className='footer-clock'><Clock timeZone='IST' time={time} /></Col>
            </Row>
            <FooterBanner alertingStatus={alertingStatus} />
        </footer>
    )
}

Footer.propTypes = {
    alertingStatus: PropTypes.string
}

export default Footer
