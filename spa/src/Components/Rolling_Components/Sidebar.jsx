import PropTypes from 'prop-types'
import React, { useState, useEffect, useCallback } from 'react'

import { fetchData } from '../viewsUtils.jsx'
import '../../CSS/Rolling_Components/Sidebar.css'

const Sidebar = ({ isVisible, onClose }) => {
    const [data, setData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

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
        const url = 'Sidebar'
        fetchAndSetData(url) // Initial fetch to grab the data from the backend
    }, [fetchAndSetData])

    const handleItemClick = (url) => {
        window.open(url, '_blank')
    }

    if (isLoading) {
        return (
            null
        )
    }

    return (
        <div>
            <div className={`sidebar ${isVisible ? 'visible' : ''}`}>
                <h3 style={{ color: '#559fff' }}>Technology Health Dashboard</h3>
                {data?.map((item) => (
                    <div key={item.Id} className='sidebar-item' onClick={() => handleItemClick(item.URL)}>
                        {item.Title}
                    </div>
                )) || <div>No data available</div>}
            </div>
            {isVisible && <div className='sidebar-overlay' onClick={onClose}></div>}
        </div>
    )
}

Sidebar.propTypes = {
    isVisible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
}

export default Sidebar
