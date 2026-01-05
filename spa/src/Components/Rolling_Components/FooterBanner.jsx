import PropTypes from 'prop-types'
import React, { useState } from 'react'

import '../../CSS/Rolling_Components/FooterBanner.css'
import redFooter from '../../Images/bottom_page_red.png'
import yellowFooter from '../../Images/bottom_page_yellow.png'
import about from '../../Images/info.png'

const FooterBanner = ({ alertingStatus }) => {
    const [isHovered, setHovered] = useState(false)
    const alertingStatusFlags = new Map([['danger', redFooter], ['warning', yellowFooter], ['ok', Flag]])
    const aboutText = `The Technology Health Dashboard is intended to provide a view into the overall health
    of the applications that serve the Southwest Airlines' Operation. Please note that while it is an aid
    to pre- and post-change status checks, it should never replace fully vetted validations via associated
    CTasks and regression testing. We continue to expand this tool's scope of coverage and welcome any feedback
    on additional features and use cases. For any questions, contact TechnologyHealthDashboardL3Support-DG@wnco.com.`

    return (
        <div className='footer-banner'>
            <img src={alertingStatusFlags.get(alertingStatus)} width={'100%'} alt='Southwest Color Flag' className='color-flag' />
            <button id='about-button' className='about-button' onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
                <img src={about} alt='About Button' className='about-button-image'/>
            </button>
            {isHovered && (
                <div className='hover-textbox' onBlur={() => setHovered(false)}>
                    {aboutText}
                </div>
            )}
        </div>
    )
}

FooterBanner.propTypes = {
    alertingStatus: PropTypes.string
}

export default FooterBanner
