import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Icon, Segment } from 'semantic-ui-react'

import Portfolio from './Portfolio.jsx'
import RunbookTables from './Runbooks.jsx'
import Footer from '../Components/Rolling_Components/Footer.jsx'
import Sidebar from '../Components/Rolling_Components/Sidebar.jsx'
import '../CSS/Rolling_Components/Rolling.css'

const tabsData = [
    { id: 1, key: 'Operations', title: 'Operations', path: '/Operations', alertingStatus: '' },
    { id: 2, key: 'Commercial', title: 'Commercial', path: '/Commercial', alertingStatus: '' },
    { id: 3, key: 'Cybersecurity', title: 'Cybersecurity', path: '/Cybersecurity', alertingStatus: '' },
    { id: 4, key: 'Infrastructure & Shared Services', title: 'Infra & Shared Svcs', path: '/ISS', alertingStatus: '' },
    { id: 5, key: 'Cloud', title: 'Cloud', path: '/Cloud', alertingStatus: '' },
    { id: 6, key: 'Runbooks', title: 'Runbooks', path: '/Runbooks/All' }
]


const Rolling = () => {
    const [isMuted, setIsMuted] = useState(true)
    const [expandCollapseIcon, setExpandCollapseIcon] = useState('window maximize outline')
    const iframeRefs = useRef({})
    const [appsExpanded, setAppsExpanded] = useState(false)
    const [currentTab, setCurrentTab] = useState(1)
    const [isPlaying, setIsPlaying] = useState(true)
    const [isSidebarVisible, setIsSidebarVisible] = useState(false)
    const [iframes, setIframes] = useState(tabsData)
    const intervalId = useRef(null)
    const [alertingStatus, setAlertingStatus] = useState(null)

    const toggleMute = () => {
        const newMutedState = !isMuted
        iframes.forEach(iframe => {
            const iframeRef = iframeRefs.current[iframe.id]
            if (iframeRef && iframeRef.contentWindow) {
                iframeRef.contentWindow.postMessage(
                    { type: 'TOGGLE_MUTE', isMuted: newMutedState }, '*'
                )
            }
        })
        setIsMuted(newMutedState)
    }

    const expandCollapseAll = () => {
        const newAppsExpandedState = !appsExpanded
        iframes.forEach(iframe => {
            const iframeRef = iframeRefs.current[iframe.id]
            if (iframeRef && iframeRef.contentWindow) {
                iframeRef.contentWindow.postMessage(
                    { type: 'TOGGLE_EXPAND', appsExpanded: newAppsExpandedState }, '*'
                )
            }
        })
        setAppsExpanded(newAppsExpandedState)
        setExpandCollapseIcon(newAppsExpandedState ? 'window minimize outline' : 'window maximize outline')
    }

    const startAutoPlay = useCallback(() => {
        setIsPlaying(true)
        intervalId.current = setInterval(() => {
            setCurrentTab(prevTab => (prevTab % tabsData.length) + 1)
        }, 30000)
    }, [])

    const handleTabClick = (tabID) => {
        setCurrentTab(tabID)
        setIsPlaying(false)
        clearInterval(intervalId.current)
    }

    const togglePlay = () => {
        setIsPlaying((prevIsPlaying) => {
            if (!prevIsPlaying) {
                startAutoPlay()
            } else {
                clearInterval(intervalId.current)
            }
            return !prevIsPlaying
        })
    }

    const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible)
    }

    const closeSidebar = () => {
        setIsSidebarVisible(false)
    }

    const handleMessage = useCallback((event) => {
        setIframes((currentIframes) => {
            const updatedIframes = currentIframes.map((iframe) => {
                if (event.data.type === 'PORTFOLIO_ALERTING' && event.data.title === iframe.key) {
                    return { ...iframe, alertingStatus: 'danger' }
                } else if (event.data.type === 'PORTFOLIO_WARNING' && event.data.title === iframe.key) {
                    return { ...iframe, alertingStatus: 'warning' }
                } else if (event.data.type === 'PORTFOLIO_HEALTHY' && event.data.title === iframe.key) {
                    return { ...iframe, alertingStatus: 'ok' }
                }
                return iframe
            })
            const areIframesDifferent = updatedIframes.some((updatedIframe, index) => {
                return updatedIframe.alertingStatus !== currentIframes[index].alertingStatus
            })
            if (areIframesDifferent) {
                const alertingStatuses = updatedIframes.map((iframe) => {
                    return iframe.alertingStatus
                })
                if (alertingStatuses.includes('danger')) {
                    setAlertingStatus('danger')
                } else if (alertingStatuses.includes('warning')) {
                    setAlertingStatus('warning')
                } else {
                    setAlertingStatus('ok')
                }
                return updatedIframes
            } else {
                return currentIframes
            }
        })
    }, [])

    const getTabClassName = (iframe) => {
        let className = 'rolling-menu '
        if (iframe.alertingStatus && iframe.alertingStatus !== 'ok') {
            className += iframe.alertingStatus
        } else {
            className += iframe.title
        }
        if (iframe.id === currentTab) {
            className += ' selected'
        }
        return className
    }

    useEffect(() => {
        window.addEventListener('message', handleMessage)
        return () => {
            window.removeEventListener('message', handleMessage) // Remove event listener on unmount
        }
    }, [handleMessage])

    useEffect(() => {
        startAutoPlay()
        return () => {
            clearInterval(intervalId.current) // Clear interval on unmount
        }
    }, [startAutoPlay])


    return (
        <div>
            <Sidebar isVisible={isSidebarVisible} onClose={closeSidebar} />
            {isSidebarVisible && <div className='main-content-dim' onClick={closeSidebar}></div>}
            <div className='main-content'>
                <header>
                    <Row lg={4} className='rolling-menu row'>
                        <Col className='menu-button-col'>
                            <h2>
                                <Icon name='bars' color='blue' key='Sidebar' id='Sidebar' onClick={toggleSidebar}/>
                            </h2>
                        </Col>
                        {iframes.map((iframe) => (
                            <Col key={iframe.id} className={getTabClassName(iframe)} onClick={() => handleTabClick(iframe.id)}>
                                <h2 className='rolling-menu name'>
                                    {iframe.title}
                                </h2>
                            </Col>
                        ))}
                        <Col className='menu-button-col'>
                            <h2>
                                <Icon name={isMuted ? 'bell slash outline' : 'bell outline'} color='blue' onClick={toggleMute}/>
                            </h2>
                        </Col>
                        <Col className='menu-button-col'>
                            <h2>
                                <Icon name={expandCollapseIcon} color='blue' id='expand' onClick={expandCollapseAll}/>
                            </h2>
                        </Col>
                        <Col className='menu-button-col'>
                            <h2>
                                <Icon name={isPlaying ? 'pause circle outline' : 'play circle outline'} color='blue' onClick={togglePlay}/>
                            </h2>
                        </Col>
                    </Row>
                </header>
                <Segment className='iframe-container'>
                    {currentTab === 1 && <Portfolio params={{id: 'Operations'}} />}
                    {currentTab === 2 && <Portfolio params={{id: 'Commercial'}} />}
                    {currentTab === 3 && <Portfolio params={{id: 'Cybersecurity'}} />}
                    {currentTab === 4 && <Portfolio params={{id: 'ISS'}} />}
                    {currentTab === 5 && <Portfolio params={{id: 'Cloud'}} />}
                    {currentTab === 6 && <RunbookTables params={{id: 'All'}} />}
                </Segment>
                <Footer alertingStatus={alertingStatus} />
            </div>
        </div>
    )
}

export default Rolling
