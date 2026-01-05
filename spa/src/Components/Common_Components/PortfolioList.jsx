import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import { Col, Row, Container } from 'react-bootstrap'

import AreaCard from './AreaCard.jsx'
import { isValidArray } from '../miscUtils.jsx'
import '../../CSS/Common_Components/PortfolioList.css'

const PortfolioList = ({ portfolio, index, isMuted, cardsExpanded, appsExpanded, selectedDC, selectedData, modifiedButtonStatus, impactedButtonStatus, getAlertingStatus = () => {} }) => {

    useEffect(() => {
        getAlertingStatus(portfolio)
    }, [getAlertingStatus, portfolio])

    const getAreaCardProps = (area, areaIndex) => ({
        area: area,
        index: areaIndex,
        isMuted: isMuted,
        cardsExpanded: cardsExpanded,
        appsExpanded: appsExpanded,
        selectedDC: selectedDC,
        selectedData: selectedData,
        modifiedButtonStatus: modifiedButtonStatus,
        impactedButtonStatus: impactedButtonStatus
    })

    return (
        <div key={index} className='portfolio-tile'>
            <h2>{portfolio.Portfolio}</h2>
            <Container>
                <Row className='row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-custom-5 row-cols-custom-6'>
                    {isValidArray(portfolio.Areas) ? portfolio.Areas.map((area, areaIndex) => (
                        <Col key={areaIndex}>
                            <AreaCard {...getAreaCardProps(area, areaIndex)} />
                        </Col>
                    )) : <Col>No areas available</Col>}
                </Row>
            </Container>
        </div>
    )
}

PortfolioList.propTypes = {
    portfolio: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    isMuted: PropTypes.bool.isRequired,
    cardsExpanded: PropTypes.bool.isRequired,
    appsExpanded: PropTypes.bool.isRequired,
    selectedDC: PropTypes.string,
    selectedData: PropTypes.string,
    getAlertingStatus: PropTypes.func,
    modifiedButtonStatus: PropTypes.bool.isRequired,
    impactedButtonStatus: PropTypes.bool.isRequired
}

export default PortfolioList
