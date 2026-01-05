import React from 'react'
import ReactDOM from 'react-dom/client'

import './CSS/index.css'
import 'semantic-ui-css/semantic.min.css'
import App from './App.jsx'
import reportWebVitals from './reportWebVitals.jsx'

const rootElement = document.getElementById('root')
if (!rootElement) {
    throw new Error('Root element not found')
}
const root = ReactDOM.createRoot(rootElement)
root.render(
    <App />
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
