import React, { useState } from 'react'
import { Form, Button, Segment, Message } from 'semantic-ui-react'

import { apiCall, buildApiUrl } from '../../config/api.js'
import '../../CSS/RITMFormComponents.css'

const FORM_FIELDS = {
    Portfolio: { values: '', placeholder: 'Portfolio', required: true },
    Area: { values: '', placeholder: 'Area', required: true },
    DashName: { values: '', placeholder: 'Dash Name', required: false },
    Application: { values: '', placeholder: 'Application', required: true },
    Service: { values: '', placeholder: 'Service', required: true },
    URL: { values: '', placeholder: 'URL', required: true },
    Priority: { values: '', placeholder: 'Priority', required: true },
    Tool: { values: '', placeholder: 'Tool', required: false },
    APIKey: { values: '', placeholder: 'API Key', required: false },
    AlertName: { values: '', placeholder: 'Alert Name', required: false },
    ImplementerID: { values: '', placeholder: 'E/X ID', required: true },
    RITM: { values: '', placeholder: 'RITM', required: true }
}

const AddForm = () => {
    const [formData, setFormData] = useState(FORM_FIELDS)
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
            const response = await apiCall(buildApiUrl('CREATE_ADDITION'), {
                method: 'POST',
                body: JSON.stringify({
                    ...submissionData,
                    SysID: submissionData.SysID || null,
                    AlertName: submissionData.AlertName || null,
                    AlertID: submissionData.AlertID || null,
                    Tool: submissionData.Tool || null,
                    APIKey: submissionData.APIKey || null
                })
            })
            const responseMessage = await response.text()
            setSubmitMessage(responseMessage)
            setSubmitStatus(response.status)
        } catch (error) {
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

export default AddForm
