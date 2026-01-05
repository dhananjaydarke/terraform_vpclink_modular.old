import React, { useState } from 'react'
import { Form, Button, Segment, Message, Confirm } from 'semantic-ui-react'

import { apiCall, buildApiUrl } from '../../config/api.js'
import '../../CSS/RITMFormComponents.css'

const DeleteForm = () => {
    const [formData, setFormData] =
        useState({
            Portfolio: { values: '', placeholder: 'Portfolio', required: true },
            Area: { values: '', placeholder: 'Area', required: true },
            Application: { values: '', placeholder: 'Application', required: true },
            Service: { values: '', placeholder: 'Service', required: true },
            Alert: { values: '', placeholder: 'Alert Name', required: false },
            ImplementerID: { values: '', placeholder: 'E/X ID', required: true },
            RITM: { values: '', placeholder: 'RITM', required: true }
        })
    const [errors, setErrors] = useState({})
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState('')
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
        if (name === 'Area') {
            setMessages(() => 'Are you sure you want to delete this entire Area and all its Applications, Services, Alerts')
        } else if (name === 'Application') {
            setMessages(() => 'Are you sure you want to delete this entire Application and all its Services and Alerts')
        } else if (name === 'Service') {
            setMessages(() => 'Are you sure you want to delete this entire Service and all its Alerts')
        } else if (name === 'Alert') {
            setMessages(() => 'Are you sure you want to delete this Alert')
        }
    }

    const validateForm = () => {
        const newErrors = {}
        for (const field in formData) {
            if (formData[field].required && !formData[field].value) {
                newErrors[field] = formData[field].placeholder + 'is required'
            }
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleOpen = () => setOpen(true)
    const handleClose = () => setOpen(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        handleOpen()
    }

    const handleConfirm = async(e) => {
        e.preventDefault()
        handleClose()
        if (validateForm()) {
            const submissionData = Object.fromEntries(
                Object.entries(formData).map(([key, field]) => [key, field.value])
            )
            try {
                const response = await apiCall(buildApiUrl('REMOVE_ITEM'), {
                    method: 'POST',
                    body: JSON.stringify({
                        ...submissionData,
                        Area: submissionData.Area || null,
                        Application: submissionData.Application || null,
                        Service: submissionData.Service || null,
                        Alert: submissionData.Alert || null
                    })
                })
                const responseMessage = await response.text()
                setSubmitMessage(responseMessage)
                setSubmitStatus(response.status)

            } catch (error) {
                setSubmitMessage(`Error: Please contact the Technology Health Dashboard L3 team \n ${error}`)
                setSubmitStatus(500)
            }
        } else {
            console.error('Form has errors')
        }

    }

    return (
        <Segment>
            <Form onSubmit={handleSubmit}>
                {Object.entries(formData).map(([key, field]) => (
                    <Form.Field key={key} error={!!errors[key]}>
                        <label>{field.placeholder}</label>
                        <input
                            type='text'
                            name={key}
                            value={field.value || ''}
                            onChange={handleChange}
                            placeholder={field.placeholder}
                            required={field.required}
                        />
                        {errors[key] && <Message negative content={errors[key]} />}
                    </Form.Field>
                ))}
                <Button type='submit' primary>Submit</Button>
                <Confirm
                    open={open}
                    onCancel={handleClose}
                    onConfirm={handleConfirm}
                    content={messages}
                />
                {submitStatus === 200 && <Message positive content={submitMessage} />}
                {(submitStatus === 400 || submitStatus === 500) && <Message negative content={submitMessage} />}
            </Form>
        </Segment>
    )
}

export default DeleteForm
