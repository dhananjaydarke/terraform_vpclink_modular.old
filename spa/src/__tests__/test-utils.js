import { render } from '@testing-library/react'
import PropTypes from 'prop-types'
import { BrowserRouter } from 'react-router-dom'

// Custom render function that includes router context
export const renderWithRouter = (ui, options = {}) => {
    const Wrapper = ({ children }) => (
        <BrowserRouter>{children}</BrowserRouter>
    )

    Wrapper.propTypes = {
        children: PropTypes.node.isRequired
    }

    return render(ui, { wrapper: Wrapper, ...options })
}

// Mock data generators
export const mockMessages = (count = 3) =>
    Array.from({ length: count }, (_, i) => `Test message ${i + 1}`)

export const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com'
}

// Common test assertions
export const expectElementToBeVisible = (element) => {
    expect(element).toBeInTheDocument()
    expect(element).toBeVisible()
}
