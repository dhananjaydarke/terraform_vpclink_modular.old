import PropTypes from 'prop-types'
import React, { useState } from 'react'
import { Button, Icon, Menu } from 'semantic-ui-react'
import '../CSS/Toolbar.css'

const Toolbar = ({ state, updateState }) => {
    const [modifiedButtonActive, setModifiedButtonActive] = useState(false)
    const [impactedButtonActive, setImpactedButtonActive] = useState(false)
    const [showAppDbButtons, setShowAppDbButtons] = useState(false)

    const handleSelectedData = (data, state) => {
        let newSelectedData = ''

        if (state.selectedData.includes(data)) {
            newSelectedData = state.selectedData.replace(data, '').trim()
        } else if (!state.selectedData) {
            newSelectedData = data

        } else if ((data === 'App' && state.selectedData === 'Database') || (data === 'Database' && state.selectedData === 'App')) {
            newSelectedData = 'App Database'
        } else {
            newSelectedData = `${state.selectedData} & ${data}`
        }

        updateState({
            selectedData: newSelectedData,
            selectedDC: newSelectedData ? state.selectedDC : '',
            dataButtonIsActive: newSelectedData,
            dcButtonIsActive: newSelectedData ? state.selectedDC : null
        })
    }

    const handleSelectedDC = (DC, state) => {
        updateState({
            selectedDC: state.selectedDC === DC ? '' : DC,
            dcButtonIsActive: DC === state.dcButtonIsActive ? null : DC
        })
    }

    const modifiedButtonClick = () => {
        setModifiedButtonActive(!modifiedButtonActive)
        updateState({
            ...state,
            modifiedButtonStatus: !modifiedButtonActive
        })
    }

    const impactedButtonClick = () => {
        setImpactedButtonActive(!impactedButtonActive)
        updateState({
            ...state,
            impactedButtonStatus: !impactedButtonActive
        })
    }

    const clearAppDbButtons = () => {
        if (showAppDbButtons) {
            updateState({
                ...state,
                selectedData: '',
                selectedDC: '',
                dataButtonIsActive: '',
                dcButtonIsActive: ''
            })
        }
        setShowAppDbButtons(!showAppDbButtons)
        updateState({
            ...state,
            showEnvironmentButtons: !showAppDbButtons
        })
    }

    return (
        <Menu vertical className='toolbar-container'>
            <Menu.Item className='toolbar-content'>
                <div className='location-buttons-centering'>
                    <div className='toolbar-main-buttons'>
                        <Button onClick={clearAppDbButtons} className={(showAppDbButtons || state.selectedDC) ? 'environment-selected' : 'environment'}>
                            Environment
                        </Button>
                        <Button onClick={modifiedButtonClick} className={modifiedButtonActive ? 'modified-selected' : 'modified'}>
                            Modified By Changes
                        </Button>
                        <Button onClick={impactedButtonClick} className={impactedButtonActive ? 'impacted-selected' : 'impacted'}>
                            Impacted By Changes
                        </Button>
                    </div>

                    {showAppDbButtons && (
                        <div className='app-both-db-buttons'>
                            <Button
                                onClick={() => { handleSelectedData('App', state) }}
                                icon
                                labeled='true'
                                labelPosition='left'
                                className={state.selectedData.includes('App') ? 'selected' : ''}
                            >
                                <Icon name='server' />
                                App
                            </Button>
                            <Button
                                onClick={() => handleSelectedData('Database', state)}
                                icon
                                labeled='true'
                                labelPosition='right'
                                className={state.selectedData.includes('Database') ? 'selected' : ''}
                            >
                                DB
                                <Icon name='database' />
                            </Button>
                        </div>
                    )}

                    {(state.selectedData && showAppDbButtons) && (
                        <div className='location-buttons'>
                            {state.DataCenterData.map((dcValue, id) => (
                                <Button
                                    circular
                                    onClick={() => handleSelectedDC(dcValue, state)}
                                    className={state.dcButtonIsActive === (dcValue) ? 'selected' : ''}
                                    key={id}
                                >
                                    {dcValue}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </Menu.Item>
        </Menu>
    )
}

Toolbar.propTypes = {
    state: PropTypes.shape({
        selectedData: PropTypes.string,
        selectedDC: PropTypes.string,
        dataButtonIsActive: PropTypes.string,
        dcButtonIsActive: PropTypes.string,
        DataCenterData: PropTypes.array,
        modifiedButtonStatus: PropTypes.bool,
        impactedButtonStatus: PropTypes.bool
    }).isRequired,
    updateState: PropTypes.func.isRequired
}

export default Toolbar
