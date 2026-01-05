import PropTypes from 'prop-types'
import { useState, useEffect, useCallback } from 'react'
import { Table, Progress, Icon, Dimmer, Loader, Menu, MenuHeader, MenuItem } from 'semantic-ui-react'

import { getFormattedDuration } from '../Components/setIconUtils.jsx'
import { fetchData, urlOpen } from '../Components/viewsUtils.jsx'
import withRouter from '../Components/withRouter.jsx'
import '../CSS/Runbooks.css'

const RunbookTables = ({ params }) => {
    const [data, setData] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [activePortfolio, setActivePortfolio] = useState(null)
    const [activeArea, setActiveArea] = useState(null)
    const [, setSelectedRunbooks] = useState([])

    const fetchAndSetData = useCallback(async(url) => {
        const { data, isLoading } = await fetchData(url)
        if (isLoading) {
            setIsLoading(true)
        } else {
            setData(data || [])
            setIsLoading(false)
        }
    }, [])

    const handleAreaClick = (portfolio, area) => {
        const activePortfolio = portfolio
        const selectedPortfolio = data.find(portfolio => portfolio.Portfolio === activePortfolio)
        if (!selectedPortfolio) {
            return
        }
        const selectedArea = selectedPortfolio.Area.find(item => item.Area === area)
        if (!selectedArea) {
            return
        }
        if (activeArea === area) {
            setActivePortfolio('')
            setActiveArea('')
            setSelectedRunbooks([])
        } else {
            setActiveArea(area)
            setSelectedRunbooks(selectedArea.Runbooks || [])
            setActivePortfolio(activePortfolio)
        }
    }

    const getStatusColor = (status, isMaintenance) => {
        if (isMaintenance) { return 'yellow' }
        if (status === 'Failed') {
            return 'red'
        } else if (status === 'Running') {
            return 'blue'
        } else {
            return 'green'
        }
    }

    const renderStatusIcon = (status, isMaintenance) => {
        if (status === null) { return '---' }
        let icon
        if (status === 'Failed') {
            icon = 'x'
        } else if (status === 'Running') {
            icon = 'sync'
        } else {
            icon = 'checkmark'
        }
        const isLoading = status === 'Running'
        return <Icon {...(isLoading && { loading: true })} name={icon} color={getStatusColor(status, isMaintenance)} />
    }

    const renderProgressBar = (status, percent, isMaintenance) => {
        if (status === null) { percent = '0' }
        return <Progress className='progress-bar' percent={percent} color={getStatusColor(status, isMaintenance)} active={status === 'Running'} />
    }

    const renderAreaIcon = (runbooks) => {
        const isSuccess = runbooks.every((runbook) => runbook.Status === 'Successful' || runbook.Status === 'Success')
        // const isRunning = runbooks.some((runbook) => runbook.Status === 'Running')
        const isFailed = runbooks.some((runbook) => runbook.Status === 'Failed')
        if (isSuccess) {
            return <Icon name='checkmark' color='green' />
        } else if (isFailed) {
            return <Icon name='x' color='red' />
        } else {
            return <Icon loading name='sync' color='blue' />
        }
    }

    const formatDateTime = (dateTimeString) => {
        if (dateTimeString) {
            return dateTimeString.replace('T', ' ').replace('Z', ' ').replace('.000', '')
        } else {
            return '---'
        }
    }

    const formatTime = (timeString) => {
        if (timeString) {
            return timeString.split('T').pop().replace('Z', '').replace('.000', '')
        } else {
            return '---'
        }
    }

    useEffect(() => {
        const url = `RUNBOOK_JSON/${params.id}`
        fetchAndSetData(url)
        const interval = setInterval(() => {
            fetchAndSetData(url)
        }, 1000)
        return () => {
            clearInterval(interval)
        }
    }, [fetchAndSetData, params])


    const renderTable = () => {
        if (!activePortfolio) {
            return
        }

        const selectedPortfolio = data.find(portfolio => portfolio.Portfolio === activePortfolio)
        const selectedArea = selectedPortfolio.Area.find(item => item.Area === activeArea)
        const selectedRunbooks = selectedArea.Runbooks

        return (
            <div className='runbook-table-container'>
                <Table celled collapsing className='runbook-table'>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell className='runbook-table-header' colSpan='5' textAlign='center'>{activeArea} Runbooks Total - {selectedArea.Runbooks.length}</Table.HeaderCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.HeaderCell className='runbook-table-header' width={1}>Name</Table.HeaderCell>
                            <Table.HeaderCell className='runbook-table-header' width={1}>Status</Table.HeaderCell>
                            <Table.HeaderCell className='runbook-table-header' width={1}>Times</Table.HeaderCell>
                            <Table.HeaderCell className='runbook-table-header' width={1}>Details</Table.HeaderCell>
                            <Table.HeaderCell className='runbook-table-header' width={1}>Execution</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body className='runbook-table-body'>
                        {selectedRunbooks.map((runbooks, index) => (
                            <Table.Row key={index}>
                                <Table.Cell onClick={() => { urlOpen(runbooks.URL) }} className='name-cell'>
                                    {runbooks.Name}
                                    {runbooks.Maintenance && (
                                        <div className='maintenance-timer'>
                                            {getFormattedDuration(runbooks.MaintenanceStartTime)}
                                            <Icon name='wrench' color='yellow' className='maintenance-icon' />
                                        </div>
                                    )}
                                </Table.Cell>
                                <Table.Cell>
                                    <div className='progress-container'> {renderProgressBar(runbooks.Status, runbooks.Progress, runbooks.Maintenance)}
                                        <span className='progress-percent-and-icon'>{runbooks.Progress}% {renderStatusIcon(runbooks.Status, runbooks.Maintenance)}</span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell className='times'>
                                    <div>Total Time: <span className='right-justified-data'>{formatTime(runbooks.TotalTime)}</span></div>
                                    <div className='text-indent'>Started: <span className='right-justified-data'>{formatDateTime(runbooks.StartTime)}</span></div>
                                    <div className='text-indent'>Completed: <span className='right-justified-data'>{formatDateTime(runbooks.EndTime)}</span></div>
                                </Table.Cell>
                                <Table.Cell>
                                    <div>Total Jobs: <span className='right-justified-data'>{runbooks.TotalJobs}</span></div>
                                    <div className='text-indent'>Successful: <span className='right-justified-data'>{runbooks.SuccessfulJobs}</span></div>
                                    <div className='text-indent'>Failed: <span className='right-justified-data'>{runbooks.FailedJobs}</span></div>
                                </Table.Cell>
                                <Table.Cell className='executions'>
                                    <div>Last Successful: <span className='right-justified-data'>{formatDateTime(runbooks.LastExecution)}</span></div>
                                    <div>Next: <span className='right-justified-data'>{formatDateTime(runbooks.NextExecution)}</span></div>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </div>
        )
    }


    const renderFailedTable = () => {
        const failedItems = []

        data.forEach(item => {
            item.Area.forEach(area => {
                area.Runbooks.forEach(runbook => {
                    if (runbook.Status === 'Failed') {
                        failedItems.push({ Area: area.Area, Runbook: runbook })
                    }
                })
            })
        })

        if (failedItems.length === 0) {
            return
        }

        return (
            <div className='runbook-table-container'>
                <Table celled collapsing className='runbook-table'>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell className='runbook-table-header' colSpan='5' textAlign='center'>Failed Runbooks Total - {failedItems.length}</Table.HeaderCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.HeaderCell className='runbook-table-header' width={1}>Name</Table.HeaderCell>
                            <Table.HeaderCell className='runbook-table-header' width={1}>Status</Table.HeaderCell>
                            <Table.HeaderCell className='runbook-table-header' width={1}>Times</Table.HeaderCell>
                            <Table.HeaderCell className='runbook-table-header' width={1}>Details</Table.HeaderCell>
                            <Table.HeaderCell className='runbook-table-header' width={1}>Execution</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body className='runbook-table-body'>
                        {failedItems.map((item, index) => (
                            <Table.Row key={index}>
                                <Table.Cell onClick={() => { urlOpen(item.Runbook.URL) }} className='name-cell'>
                                    <span className='runbook-and-area-name'>
                                        {item.Runbook.Name}
                                        <div className='text-indent'>{item.Area}</div>
                                    </span>
                                    {item.Runbook.Maintenance && (
                                        <div className='maintenance-timer'>
                                            {getFormattedDuration(item.Runbook.MaintenanceStartTime)}
                                            <Icon name='wrench' color='yellow' className='maintenance-icon'/>
                                        </div>
                                    )}
                                </Table.Cell>
                                <Table.Cell>
                                    <div className='progress-container'> {renderProgressBar(item.Runbook.Status, item.Runbook.Progress, item.Runbook.Maintenance)}
                                        <span className='progress-percent-and-icon'>{item.Runbook.Progress}% {renderStatusIcon(item.Runbook.Status, item.Runbook.Maintenance)}</span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell className='times'>
                                    <div>Total Time: <span className='right-justified-data'>{formatTime(item.Runbook.TotalTime)}</span></div>
                                    <div className='text-indent'>Started: <span className='right-justified-data'>{formatDateTime(item.Runbook.StartTime)}</span></div>
                                    <div className='text-indent'>Completed: <span className='right-justified-data'>{formatDateTime(item.Runbook.EndTime)}</span></div>
                                </Table.Cell>
                                <Table.Cell>
                                    <div>Total Jobs: <span className='right-justified-data'>{item.Runbook.TotalJobs}</span></div>
                                    <div className='text-indent'>Successful: <span className='right-justified-data'>{item.Runbook.SuccessfulJobs}</span></div>
                                    <div className='text-indent'>Failed: <span className='right-justified-data'>{item.Runbook.FailedJobs}</span></div>
                                </Table.Cell>
                                <Table.Cell className='executions'>
                                    <div>Last Successful: <span className='right-justified-data'>{formatDateTime(item.Runbook.LastExecution)}</span></div>
                                    <div>Next: <span className='right-justified-data'>{formatDateTime(item.Runbook.NextExecution)}</span></div>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </div>
        )
    }

    if (isLoading) {
        return (
            <Dimmer active>
                <Loader />
            </Dimmer>
        )
    }

    return (
        <div>
            <Menu vertical className='portfolio-table-menu'>
                {data && data.length > 0 ? data.map(portfolio => (
                    <MenuItem key={portfolio.Portfolio} className='portfolio-table'>
                        <MenuHeader key={portfolio.Portfolio} className='portfolio-header'>
                            {portfolio.Portfolio}
                        </MenuHeader>
                        {(
                            <Menu.Menu className='area-table'>
                                {portfolio.Area.map(area => (
                                    <Menu.Item key={area.Area} active={area.Area === activeArea} onClick={() => handleAreaClick(portfolio.Portfolio, area.Area)} className='runbook-area'>
                                        <span className='area-name'>{area.Area}</span>
                                        <span className='area-icon'>{renderAreaIcon(area.Runbooks, area.Area)}</span>
                                    </Menu.Item>
                                ))}
                            </Menu.Menu>
                        )}
                    </MenuItem>
                )) : <div style={{color: 'white', padding: '20px'}}>No runbook data available</div>}
            </Menu>
            {renderTable()}
            {renderFailedTable()}
        </div>
    )
}

RunbookTables.propTypes = {
    params: PropTypes.shape({
        id: PropTypes.string.isRequired
    }).isRequired
}

export default withRouter(RunbookTables)
