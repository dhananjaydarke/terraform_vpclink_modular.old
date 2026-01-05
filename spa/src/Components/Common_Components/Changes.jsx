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
                        urlOpen(`NA`)
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
