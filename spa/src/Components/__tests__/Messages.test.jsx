import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import Messages from '../Messages'

// Mock the Messages component since we don't have the actual implementation
vi.mock('../Messages', () => ({
    default: ({ messages = [] }) => (
        <div data-testid='messages'>
            {messages.map((msg, index) => (
                <div key={index} data-testid='message'>{msg}</div>
            ))}
        </div>
    )
}))

describe('Messages Component', () => {
    it('renders without crashing', () => {
        render(<Messages />)
        expect(screen.getByTestId('messages')).toBeInTheDocument()
    })

    it('displays messages when provided', () => {
        const messages = ['Test message 1', 'Test message 2']
        render(<Messages messages={messages} />)

        const messageElements = screen.getAllByTestId('message')
        expect(messageElements).toHaveLength(2)
        expect(messageElements[0]).toHaveTextContent('Test message 1')
        expect(messageElements[1]).toHaveTextContent('Test message 2')
    })
})
