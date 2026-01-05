import 'bootstrap/dist/css/bootstrap.min.css'
import PropTypes from 'prop-types'
import React, { useState, useEffect, useCallback } from 'react'
import { Dimmer, Loader } from 'semantic-ui-react'

import PortfolioList from '../Components/Common_Components/PortfolioList.jsx'
import { isValidArray } from '../Components/miscUtils.jsx'
import { getPortfolioAlertingStatus } from '../Components/setIconUtils.jsx'
import Toolbar from '../Components/Toolbar.jsx'
import { fetchData } from '../Components/viewsUtils.jsx'
import withRouter from '../Components/withRouter.jsx'
import '../CSS/General.css'

const Portfolio = ({ params }) => {
    const [data, setData] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [, setTimer] = useState(new Date())
    const [, setTime] = useState(new Date())
    const [isMuted, setIsMuted] = useState(true)
    const [cardsExpanded] = useState(true)
    const [appsExpanded, setAppsExpanded] = useState(false)
    const [dataCenterButtonState, setDataCenterButtonState] = useState({
        selectedData: '',
        selectedDC: '',
        dataButtonIsActive: '',
        dcButtonisActive: null,
        DataCenterData: [],
        modifiedButtonStatus: false,
        impactedButtonStatus: false,
        showEnvironmentButtons: false
    })

    const fetchAndSetData = useCallback(async(url) => {
        const { data, isLoading } = await fetchData(url)
        if (isLoading) {
            setIsLoading(true)
        } else {
            setData(data)
            setIsLoading(false)
        }
    }, [])

    const updateDataCenterButtonState = (newState) => {
        setDataCenterButtonState(prevState => ({
            ...prevState,
            ...newState
        }))
    }

    const fetchAndSetDataCenterData = useCallback(async(url) => {
        const { data, isLoading } = await fetchData(url)
        if (isLoading) {
            setIsLoading(true)
        } else {
            updateDataCenterButtonState({ DataCenterData: data })
            setIsLoading(false)
        }
    }, [])

    const getPortfolioListAlertingStatus = useCallback((portfolio) => {
        const alertingStatus = getPortfolioAlertingStatus(portfolio)
        if (alertingStatus === 'danger') {
            sendMessageToRolling({ type: 'PORTFOLIO_ALERTING', title: portfolio.Portfolio })
        } else if (alertingStatus === 'warning') {
            sendMessageToRolling({ type: 'PORTFOLIO_WARNING', title: portfolio.Portfolio })
        } else {
            sendMessageToRolling({ type: 'PORTFOLIO_HEALTHY', title: portfolio.Portfolio })
        }
    }, [])

    useEffect(() => {
        window.addEventListener('message', handleMessage)
        return () => {
            window.removeEventListener('message', handleMessage) // Remove event listener on unmount
        }
    })

    useEffect(() => {
        const url = params.id
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
    }, [fetchAndSetData, fetchAndSetDataCenterData, params])

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date())
        }, 1000)
        setTimer(timer)
        return () => clearInterval(timer)
    }, [])

    const handleMessage = (event) => {
        switch (event.data.type) {
            case 'TOGGLE_EXPAND':
                setAppsExpanded(event.data.appsExpanded)
                break
            case 'TOGGLE_MUTE':
                setIsMuted(event.data.isMuted)
                break
            default:
                break
        }
    }

    const sendMessageToRolling = (data) => {
        window.parent.postMessage(data, '*')
    }

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
        getAlertingStatus: getPortfolioListAlertingStatus
    })

    return (
        <div className='portfolio-div'>
            <Toolbar state={dataCenterButtonState} updateState={updateDataCenterButtonState} />
            <div className={`portfolio-content ${dataCenterButtonState.showEnvironmentButtons ? 'environment-expanded' : ''} ${(dataCenterButtonState.showEnvironmentButtons && dataCenterButtonState.selectedData) ? 'fully-expanded' : ''}`}>

                {isValidArray(data) ? data.map((portfolio, index) => (
                    <div key={index}>
                        <PortfolioList {...getPortfolioListProps(portfolio, index)} />
                    </div>
                )) : <div>No portfolio data available</div>}
            </div>
        </div>
    )
}

Portfolio.propTypes = {
    params: PropTypes.shape({
        id: PropTypes.string.isRequired
    }).isRequired
}

export default withRouter(Portfolio)
