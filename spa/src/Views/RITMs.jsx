import React, { useState } from 'react'
import { Button } from 'semantic-ui-react'

import AddForm from '../Components/RITM_Form_Components/AddForm.jsx'
import ChangeForm from '../Components/RITM_Form_Components/ChangeForm.jsx'
import DeleteForm from '../Components/RITM_Form_Components/DeleteForm.jsx'
import LoginForm from '../Components/RITM_Form_Components/Login.jsx'
import RunbookAddForm from '../Components/RITM_Form_Components/RunbookAddForm.jsx'
import '../CSS/RITMFormComponents.css'

const RITM = () => {
    const [selectedOption, setSelectedOption] = useState('')
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    const handleOptionChange = (e, {value}) => {
        if (selectedOption === value) {
            setSelectedOption('')
        } else {
            setSelectedOption(value)
        }
    }

    const handleLoginSuccess = () => {
        setIsLoggedIn(true)
    }

    return (
        <div>
            {isLoggedIn ? (
                <div>
                    <h2 style={{ textAlign: 'center' }}>Complete RITM with the following:</h2>
                    <div className='align-center'>
                        <Button value='Add' onClick={handleOptionChange} className={selectedOption.includes('Add') ? 'selected-ritm' : 'ritm'}> Add </Button>
                        <Button value='Change' onClick={handleOptionChange} className={selectedOption.includes('Change') ? 'selected-ritm' : 'ritm'}> Change </Button>
                        <Button value='Delete' onClick={handleOptionChange} className={selectedOption.includes('Delete') ? 'selected-ritm' : 'ritm'}> Delete </Button>
                        <Button value='Runbook' onClick={handleOptionChange} className={selectedOption.includes('Runbook') ? 'selected-ritm' : 'ritm'}> Runbook </Button>
                    </div>
                    {selectedOption === 'Add' && <AddForm />}
                    {selectedOption === 'Change' && <ChangeForm />}
                    {selectedOption === 'Delete' && <DeleteForm />}
                    {selectedOption === 'Runbook' && <RunbookAddForm />}
                </div>
            ) : <LoginForm onLoginSuccess={handleLoginSuccess} />}
        </div>
    )
}

export default RITM
