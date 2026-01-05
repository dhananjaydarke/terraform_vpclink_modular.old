// API Configuration
const getBaseUrl = () => {
    // If environment variable is set, use it
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL
    }

    // Auto-detect based on hostname
    const hostname = window.location.hostname

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${window.location.protocol}//${hostname}:3000`
    }

    // Production - adjust based on your actual API setup
    //if (hostname && (hostname.includes('technologyhealth.swacorp.com') || hostname.includes('cloudfront.net'))) {
    //    return 'https://technologyhealth.swacorp.com'
        return `${window.location.protocol}//${hostname}/api`

    //}

    // Default fallback
    //return `${window.location.protocol}//${hostname || 'localhost'}:3000`
}


const API_CONFIG = {
    // Base URL configuration
    BASE_URL: getBaseUrl(),

    // API endpoints
    ENDPOINTS: {
    // RITM Form endpoints
        CREATE_ADDITION: '/CreateAddition',
        UPDATE_ITEM: '/UpdateItem',
        REMOVE_ITEM: '/RemoveItem',
        LOGIN: '/Login',
        CREATE_RUNBOOK: '/CreateRunbook',

        // Data fetching endpoints
        ALL_DATA: '/All',
        LOCATION_DATA: '/Location',
        LIAT_DATA: '/LIAT',
        RUNBOOK_JSON: '/RunbookJSON',
        //OPERATIONS: '/Operations'

    }
}

// Helper function to build full API URL
export const buildApiUrl = (endpoint, pathParam = '') => {
    const baseEndpoint = API_CONFIG.ENDPOINTS[endpoint] || endpoint
    return `${API_CONFIG.BASE_URL}${baseEndpoint}${pathParam ? `/${pathParam}` : ''}`
}

// Helper function to make API calls
export const apiCall = async(endpoint, options = {}) => {
    const url = typeof endpoint === 'string' ? endpoint : buildApiUrl(endpoint)

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    }

    const finalOptions = { ...defaultOptions, ...options }

    try {
        const response = await fetch(url, finalOptions)
        return response
    } catch (error) {
        console.error('API call failed:', error)
        throw error
    }
}

export { getBaseUrl }
export default API_CONFIG
