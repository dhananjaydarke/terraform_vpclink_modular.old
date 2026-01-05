
import React, { useState } from 'react'
import { Form, Input, Button, Message, Select } from 'semantic-ui-react'

import { apiCall, buildApiUrl } from '../../config/api.js'
import { isValidArray } from '../miscUtils.jsx'
import '../../CSS/RITMFormComponents.css'

const ChangeForm = () => {
    const [tierData] =
        useState({
            Area: {
                key: 'Area', text: 'Area', value: 'Area', changetypeoption: [
                    {
                        key: 'Name', text: 'Change Name', value: 'Name', formoptions: [
                            { Name: 'portfolioName', value: '', required: true, Placeholder: 'Portfolio Name' },
                            { Name: 'currentName', value: '', required: true, Placeholder: 'Current Area Name' },
                            { Name: 'newName', value: '', required: true, Placeholder: 'New Area Name' },
                            { Name: 'implementerID', value: '', required: true, Placeholder: 'E/X ID' },
                            { Name: 'ritm', value: '', required: true, Placeholder: 'RITM' },
                        ]
                    }]
            },
            Application: {
                key: 'Application', text: 'Application', value: 'Application', changetypeoption: [
                    {
                        key: 'Name', text: 'Change Name', value: 'Name', formoptions: [
                            { Name: 'portfolioName', value: '', required: true, Placeholder: 'Portfolio Name' },
                            { Name: 'areaName', value: '', required: true, Placeholder: 'Area Name' },
                            { Name: 'currentName', value: '', Placeholder: 'Current Application Name', required: true },
                            { Name: 'newName', value: '', required: true, Placeholder: 'New Application Name' },
                            { Name: 'implementerID', value: '', required: true, Placeholder: 'E/X ID' },
                            { Name: 'ritm', value: '', required: true, Placeholder: 'RITM' },
                        ]
                    },
                    {
                        key: 'Position', text: 'Change Area', value: 'Position', formoptions: [
                            { Name: 'currentName', value: '', required: true, Placeholder: 'Application Name' },
                            { Name: 'portfolioName', value: '', required: true, Placeholder: 'Current Portfolio name' },
                            { Name: 'areaName', value: '', required: true, Placeholder: 'Current Area Name' },
                            { Name: 'newPortfolioName', value: '', required: true, Placeholder: 'New Portfolio Name' },
                            { Name: 'newAreaName', value: '', required: true, Placeholder: 'New Area Name' },
                            { Name: 'implementerID', value: '', required: true, Placeholder: 'E/X ID' },
                            { Name: 'ritm', value: '', required: true, Placeholder: 'RITM' },
                        ]
                    },
                    {
                        key: 'DashApplication', text: 'Change Dash Application Name', value: 'DashApplication', formoptions: [
                            { Name: 'portfolioName', value: '', Placeholder: 'Portfolio Name', required: true },
                            { Name: 'areaName', value: '', Placeholder: 'Area Name', required: true },
                            { Name: 'currentName', value: '', Placeholder: 'Application Name', required: true },
                            { Name: 'newDashAppName', value: '', Placeholder: 'New Dash App Name', required: true },
                            { Name: 'implementerID', value: '', required: true, Placeholder: 'E/X ID' },
                            { Name: 'ritm', value: '', required: true, Placeholder: 'RITM' },
                        ]
                    }]
            },
            Service: {
                key: 'Service', text: 'Service', value: 'Service', changetypeoption: [
                    {
                        key: 'Name', text: 'Change Name', value: 'Name', formoptions: [
                            { Name: 'portfolioName', value: '', required: true, Placeholder: 'Portfolio Name' },
                            { Name: 'areaName', value: '', required: true, Placeholder: 'Area Name' },
                            { Name: 'applicationName', value: '', Placeholder: 'Application Name', required: true },
                            { Name: 'currentName', value: '', Placeholder: 'Current Service Name', required: true },
                            { Name: 'newName', value: '', Placeholder: 'New Service Name', required: true },
                            { Name: 'implementerID', value: '', required: true, Placeholder: 'E/X ID' },
                            { Name: 'ritm', value: '', required: true, Placeholder: 'RITM' },
                        ]
                    },
                    {
                        key: 'Position', text: 'Change Application', value: 'Position', formoptions: [
                            { Name: 'currentName', value: '', required: true, Placeholder: 'Service Name' },
                            { Name: 'portfolioName', value: '', required: true, Placeholder: 'Current Portfolio Name' },
                            { Name: 'areaName', value: '', required: true, Placeholder: 'Current Area Name' },
                            { Name: 'applicationName', value: '', required: true, Placeholder: 'Current Application Name' },
                            { Name: 'newPortfolioName', value: '', required: true, Placeholder: ' New Portfolio Name' },
                            { Name: 'newAreaName', value: '', required: true, Placeholder: 'New Area Name' },
                            { Name: 'newApplicationName', value: '', required: true, Placeholder: 'New Application Name' },
                            { Name: 'implementerID', value: '', required: true, Placeholder: 'E/X ID' },
                            { Name: 'ritm', value: '', required: true, Placeholder: 'RITM' },
                        ]
                    },
                    {
                        key: 'URL', text: 'Change URL', value: 'URL', formoptions: [
                            { Name: 'portfolioName', value: '', required: true, Placeholder: 'Portfolio Name' },
                            { Name: 'areaName', value: '', required: true, Placeholder: 'Area Name' },
                            { Name: 'applicationName', value: '', Placeholder: 'Application Name', required: true },
                            { Name: 'currentName', value: '', Placeholder: 'Service Name', required: true },
                            { Name: 'newURL', value: '', required: true, Placeholder: 'URL' },
                            { Name: 'implementerID', value: '', required: true, Placeholder: 'E/X ID' },
                            { Name: 'ritm', value: '', required: true, Placeholder: 'RITM' },
                        ]
                    },
                    {
                        key: 'Priority', text: 'Change Priority', value: 'Priority', formoptions: [
                            { Name: 'portfolioName', value: '', required: true, Placeholder: 'Portfolio Name' },
                            { Name: 'areaName', value: '', required: true, Placeholder: 'Area Name' },
                            { Name: 'applicationName', value: '', Placeholder: 'Application Name', required: true },
                            { Name: 'currentName', value: '', Placeholder: 'Service Name', required: true },
                            { Name: 'newPriority', value: '', required: true, Placeholder: 'New Priority' },
                            { Name: 'implementerID', value: '', required: true, Placeholder: 'E/X ID' },
                            { Name: 'ritm', value: '', required: true, Placeholder: 'RITM' },
                        ]
                    }]
            },
            Alert: {
                key: 'Alert', text: 'Alert', value: 'Alert', changetypeoption: [
                    {
                        key: 'AlertID', text: 'Change Alert ID', value: 'AlertID', formoptions: [
                            { Name: 'portfolioName', value: '', required: true, Placeholder: 'Portfolio Name' },
                            { Name: 'areaName', value: '', required: true, Placeholder: 'Area Name' },
                            { Name: 'applicationName', value: '', Placeholder: 'Application Name', required: true },
                            { Name: 'serviceName', value: '', Placeholder: 'Service Name', required: true },
                            { Name: 'currentName', value: '', Placeholder: 'Alert Name', required: true },
                            { Name: 'newAlertID', value: '', required: true, Placeholder: 'New Alert ID' },
                            { Name: 'implementerID', value: '', required: true, Placeholder: 'E/X ID' },
                            { Name: 'ritm', value: '', required: true, Placeholder: 'RITM' },
                        ]
                    }]
            }
        })
    const [formData, setFormData] =
        useState({
            Tier: '',
            Type: ''
        })

    const [submitStatus, setSubmitStatus] = useState(null)
    const [submitMessage, setSubmitMessage] = useState(null)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: value
        }))

    }


    const handleSubmit = async(e) => {
        e.preventDefault()
        const submissionData = Object.fromEntries(
            Object.entries(formData).map(([key, field]) => [key, field])
        )
        try {
            const response = await apiCall(buildApiUrl('UPDATE_ITEM'), {
                method: 'POST',
                body: JSON.stringify(submissionData)
            })
            const responseMessage = await response.text()
            setSubmitMessage(responseMessage)
            setSubmitStatus(response.status)

        } catch (error) {
            setSubmitMessage(`Error: Please contact the Technology Health Dashboard L3 team \n ${error}`)
            setSubmitStatus(500)
        }
    }

    const selectTierChange = (e, { name, value }) => {
        setFormData({
            [name]: value,
            Type: ''
        })
    }

    const selectFormOptions = (e, { value }) => {
        setFormData((prevFormData) => ({
            Tier: prevFormData.Tier,
            Type: value
        }))
        const changeTypeOption = tierData[formData.Tier]?.changetypeoption?.find((options) => options.key === value)
        if (changeTypeOption && isValidArray(changeTypeOption.formoptions)) {
            changeTypeOption.formoptions.map((formoptions) => (
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    [formoptions.Name]: formoptions.value || ''
                }))
            ))
        }
    }

    return (
        <Form onSubmit={handleSubmit}>
            <Form.Field required>
                <Select
                    name='Tier'
                    onChange={selectTierChange}
                    options={Object.values(tierData)}
                    value={Object.values(tierData).value}
                />
            </Form.Field>

            {formData.Tier &&
                <Form.Field required>
                    <Select
                        key={Object.values(tierData).find(Tier => Tier.key === formData.Tier).value}
                        name='Options'
                        onChange={selectFormOptions}
                        options={Object.values(tierData).find(Tier => Tier.key === formData.Tier).changetypeoption}
                        value={formData.Type}
                    />
                </Form.Field>}
            {formData.Type && (() => {
                const tier = Object.values(tierData).find(Tier => Tier.key === formData.Tier)
                const option = tier?.changetypeoption?.find(Options => formData.Type === Options.key)
                return isValidArray(option?.formoptions) ? option.formoptions.map((Options) =>
                    <div key={Options.Name}>
                        {Options.required &&
                        <Form.Field key={Options.Name} required={Options.required}>
                            <Input
                                key={Options.Name}
                                name={Options.Name}
                                placeholder={Options.Placeholder}
                                required={Options.required}
                                onChange={handleChange}
                                value={formData[Options.Name]}
                                type='text'
                            />
                        </Form.Field>}
                    </div>
                ) : null
            })()}
            <Button type='submit' primary>Submit</Button>
            {submitStatus === 200 && <Message positive content={submitMessage} />}
            {(submitStatus === 400 || submitStatus === 500) && <Message negative content={submitMessage} />}
        </Form>
    )
}

export default ChangeForm
