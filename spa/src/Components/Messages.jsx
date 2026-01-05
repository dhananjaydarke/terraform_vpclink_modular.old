import React, { useState, useEffect, useCallback } from 'react'
import { Row } from 'react-bootstrap'

import { isValidArray } from '../Components/miscUtils.jsx'
import { fetchData, urlOpen } from '../Components/viewsUtils.jsx'
import '../CSS/Messages.css'

const Messages = () => {
    const [data, setData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [, setTimer] = useState(new Date())
    const [, setTime] = useState(new Date())

    const fetchAndSetData = useCallback(async(url) => {
        const { data, isLoading } = await fetchData(url) // Initial fetch to grab the data from the backend
        if (isLoading) {
            setIsLoading(true)
        } else {
            setData(data)
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        const url = 'Footer'
        fetchAndSetData(url) // Initial fetch to grab the data from the backend
        const interval = setInterval(() => { // Fetch data every 30 seconds
            fetchAndSetData(url)
        }, 60000)
        return () => {
            clearInterval(interval) // Clear interval on unmount
        }
    }, [fetchAndSetData])

    useEffect(() => {
        setTimer(setInterval(() => {
            setTime(new Date())
        }, 30000))
    }, [setTimer])
    if (isLoading) {
        return <div>Loading...</div>
    }


    return (
        <Row className='tecc-messages'>
            {isValidArray(data) ? data.map((messages, id) => (<h3 key={id} onClick={() => { messages.URL && urlOpen(messages.URL) }}>{messages.Text}</h3>)) : <div> --- </div>}
        </Row>
    )
}

export default Messages
