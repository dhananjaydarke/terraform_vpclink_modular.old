import 'bootstrap/dist/css/bootstrap.min.css'
import React, { useState, useEffect, useCallback } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Dimmer, Loader, Icon } from 'semantic-ui-react'

import PortfolioList from '../Components/Common_Components/PortfolioList.jsx'
import Messages from '../Components/Messages.jsx'
import Toolbar from '../Components/Toolbar.jsx'
import { fetchData } from '../Components/viewsUtils.jsx'
import '../CSS/Health.css'

const Health = () => {
    const [data, setData] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [, setTimer] = useState(new Date())
    const [, setTime] = useState(new Date())
    const [isMuted, setIsMuted] = useState(true)
    const [cardsExpanded, setCardsExpanded] = useState(true)
    const [appsExpanded, setAppsExpanded] = useState(false)
    const [dataCenterButtonState, setDataCenterButtonState] = useState({
        selectedData: '',
        selectedDC: '',
        dataButtonIsActive: '',
        dcButtonIsActive: null,
        DataCenterData: [],
        modifiedButtonStatus: false,
        impactedButtonStatus: false
    })

    const updateDataCenterButtonState = (newState) => {
        setDataCenterButtonState(prevState => ({
            ...prevState,
            ...newState
        }))
    }

    const fetchAndSetData = useCallback(async(url) => {
        const { data, isLoading } = await fetchData(url)
        if (isLoading) {
            setIsLoading(true)
        } else {
            setData(data)
            setIsLoading(false)
        }
    }, [])

    const fetchAndSetDataCenterData = useCallback(async(url) => {
        const { data, isLoading } = await fetchData(url)
        if (isLoading) {
            setIsLoading(true)
        } else {
            updateDataCenterButtonState({DataCenterData: data})
            setIsLoading(false)
        }
    }, [])

    const expandCollapseAll = () => {
        setCardsExpanded(!cardsExpanded)
        setAppsExpanded(!cardsExpanded)
    }

    useEffect(() => {
        const url = 'ALL_DATA'
        const dataCenterDataURL = 'LOCATION_DATA'
        fetchAndSetData(url)
        fetchAndSetDataCenterData(dataCenterDataURL)
        const dataInterval = setInterval(() => { // Fetch data every 30 seconds
            fetchAndSetData(url)
        }, 30000)
        const dataCenterDataInterval = setInterval(() => { // Fetch data center data every 30 minutes
            fetchAndSetDataCenterData(dataCenterDataURL)
        }, 1800000)
        return () => {
            clearInterval(dataInterval) // Clear interval on unmount
            clearInterval(dataCenterDataInterval) // Clear interval on unmount
        }
    }, [fetchAndSetData, fetchAndSetDataCenterData])

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date())
        }, 1000)
        setTimer(timer)
        return () => clearInterval(timer)
    }, [])

    if (isLoading) {
        return (
            <Dimmer active>
                <Loader />
            </Dimmer>
        )
    }

    const getPortfolioListProps = (portfolio, index) => ({
        portfolio: portfolio,
        index: index,
        isMuted: isMuted,
        cardsExpanded: cardsExpanded,
        appsExpanded: appsExpanded,
        selectedDC: dataCenterButtonState.selectedDC,
        selectedData: dataCenterButtonState.selectedData,
        modifiedButtonStatus: dataCenterButtonState.modifiedButtonStatus,
        impactedButtonStatus: dataCenterButtonState.impactedButtonStatus,
    })

    return (
        <div>
            <Row lg={4} className='health-messages-container'>
                <Messages />
            </Row>
            <Row lg={4} className='health-menu'>
                <Col className='menu-button-col'>
                    <h2>
                        <Icon name={isMuted ? 'bell slash outline' : 'bell outline'} color='blue' onClick={() => setIsMuted(!isMuted)}/>
                    </h2>
                </Col>
                <Col className='menu-button-col'>
                    <h2>
                        <Icon name={cardsExpanded ? 'window minimize outline' : 'window maximize outline'} color='blue' onClick={expandCollapseAll}/>
                    </h2>
                </Col>
            </Row>
            <Toolbar state={dataCenterButtonState} updateState={updateDataCenterButtonState} />
            {data.map((portfolio, index) => (
                <PortfolioList {...getPortfolioListProps(portfolio, index)} key={index} />
            ))}
        </div>
    )
}

export default Health
