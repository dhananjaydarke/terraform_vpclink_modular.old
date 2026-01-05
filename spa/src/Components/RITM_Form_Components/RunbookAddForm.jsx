import React, { useState } from 'react'
import { Form, Button, Segment, Message } from 'semantic-ui-react'

import { apiCall, buildApiUrl } from '../../config/api.js'
import '../../CSS/RITMFormComponents.css'

const RunbookAddForm = () => {
    const [formData, setFormData] =
        useState({
            Portfolio: { value: '', placeholder: 'Portfolio', required: true },
            Area: { value: '', placeholder: 'Area', required: true },
            DisplayName: { value: '', placeholder: 'Display Name', required: true },
            ProjectName: { value: '', placeholder: 'Project Name', required: true },
            implementerId: { value: '', placeholder: 'E/X ID', required: true },
            RITM: { value: '', placeholder: 'RITM', required: true }
        })
    const [submitStatus, setSubmitStatus] = useState(null)
    const [submitMessage, setSubmitMessage] = useState(null)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: {
                ...prevFormData[name],
                value: value
            }
        }))
    }

    const handleSubmit = async(e) => {
        e.preventDefault()
        const submissionData = Object.fromEntries(
            Object.entries(formData).map(([key, field]) => [key, field.value])
        )
        try {
            const response = await apiCall(buildApiUrl('CREATE_RUNBOOK'), {
                method: 'POST',
                body: JSON.stringify({ ...submissionData })
            })

            const responseMessage = await response.text()
            setSubmitMessage(responseMessage)
            setSubmitStatus(response.status)

        } catch (error) {
            console.error('Submit error:', error)
            setSubmitMessage(`Error: Please contact the Technology Health Dashboard L3 team \n ${error}`)
            setSubmitStatus(500)
        }
    }

    return (
        <Segment>
            <Form onSubmit={handleSubmit}>
                {Object.entries(formData).map(([key, field]) => (
                    <Form.Field key={key}>
                        <label>{field.placeholder}</label>
                        <input
                            type='text'
                            name={key}
                            value={field.value || ''}
                            onChange={handleChange}
                            placeholder={field.placeholder}
                            required={field.required}
                        />
                    </Form.Field>
                ))}
                <Button type='submit' primary>Submit</Button>
                {submitStatus === 200 && <Message positive content={submitMessage} />}
                {(submitStatus === 400 || submitStatus === 500) && <Message negative content={submitMessage} />}
            </Form>
        </Segment>
    )
}

export default RunbookAddForm
