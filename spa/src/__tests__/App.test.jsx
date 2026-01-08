import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

// Mock component for testing
const App = () => <div>Hello World</div>

describe('App Component', () => {
    it('renders hello world', () => {
        render(<App />)
        expect(screen.getByText('Hello World')).toBeInTheDocument()
    })
})
