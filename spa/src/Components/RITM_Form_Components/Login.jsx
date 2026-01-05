import PropTypes from 'prop-types'
import React, { useState } from 'react'
import { Button, Form, Message, Container } from 'semantic-ui-react'

import { apiCall, buildApiUrl } from '../../config/api.js'
import '../../CSS/RITMFormComponents.css'

const LoginPage = ({ onLoginSuccess }) => {
    const [username] = useState('teccdbadm')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async() => {
        setLoading(true)
        setError('')
        try {
            const response = await apiCall(buildApiUrl('LOGIN'), {
                method: 'POST',
                body: JSON.stringify({ username, password })
            })

            setLoading(false)

            if (!response.ok) {
                try {
                    const errorText = await response.text()
                    setError(`Login failed: ${errorText || 'Unknown error'}`)
                } catch {
                    setError('Login failed: Unable to read error message')
                }
                return
            }

            if (response.status === 200) {
                onLoginSuccess()
            } else {
                setError('Login failed')
            }
        } catch (err) {
            console.error('Login error:', err)
            setError(`An error occurred. Please try again later. \n ${err}`)
            setLoading(false)
        }
    }

    return (
        <Container>
            <Form onSubmit={handleSubmit} loading={loading}>
                <Form.Input
                    label='UserName'
                    value={'teccdbadm'}
                    // onChange={(e) => setUsername(e.target.value)}
                    disabled/>
                <Form.Input
                    label='Password'
                    type='password'
                    placeholder='Enter the Password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required />
                <Button type='submit' primary>
                    Login
                </Button>
                {error && <Message negative content={error} />}
            </Form>
        </Container>
    )
}

LoginPage.propTypes = {
    onLoginSuccess: PropTypes.func.isRequired
}

export default LoginPage
