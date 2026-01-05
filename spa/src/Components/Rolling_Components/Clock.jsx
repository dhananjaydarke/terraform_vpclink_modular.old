import PropTypes from 'prop-types'
import React from 'react'

const Clock = ({ timeZone, time }) => {
    let timeZoneName
    const getTimeWithTimeZone = () => {
        const options = {
            timeZone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }
        return time.toLocaleString('en-US', options)
    }

    if (timeZone === 'Pacific/Honolulu') {
        timeZoneName = 'HAST'
    } else if (timeZone === 'PST') {
        timeZoneName = 'PT'
    } else if (timeZone === 'America/Denver') {
        timeZoneName = 'MT'
    } else if (timeZone === 'America/Chicago') {
        timeZoneName = 'CT'
    } else if (timeZone === 'America/New_York') {
        timeZoneName = 'ET'
    } else if (timeZone === 'UTC') {
        timeZoneName = 'UTC'
    } else if (timeZone === 'IST') {
        timeZoneName = 'IST'
    }

    return (
        <div>
            <h4>{timeZoneName} - {getTimeWithTimeZone()}</h4>
        </div>
    )
}

Clock.propTypes = {
    timeZone: PropTypes.string.isRequired,
    time: PropTypes.instanceOf(Date).isRequired
}

export default Clock
