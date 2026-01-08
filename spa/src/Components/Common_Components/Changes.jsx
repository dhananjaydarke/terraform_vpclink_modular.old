import PropTypes from 'prop-types'

import { urlOpen } from '../viewsUtils.jsx'

const DashChanges = ({ changes, buttonStatus, type }) => {
    return (
        <span>
            {buttonStatus && (
                <span
                    className={`${type}-changes ${changes.length === 0 ? 'no-design' : 'has-changes'}`}
                    onClick={(e) => {
                        e.stopPropagation()
                        urlOpen(`https://service-now.com/nav_to.do?uri=%2Fchange_request_list.do%3Fsysparm_query%3Dactive%3Dtrue%5EnumberIN${changes}%26sysparm_first_row%3D1%26sysparm_view%3D`)
                    }}
                    style={{cursor: 'pointer'}}>
                    {changes.length > 0 ? `${changes}` : ''}
                </span>
            )}
        </span>
    )
}

DashChanges.propTypes = {
    changes: PropTypes.array.isRequired,
    buttonStatus: PropTypes.bool.isRequired,
    type: PropTypes.string.isRequired
}

export default DashChanges
