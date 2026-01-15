import API_CONFIG, { buildApiUrl } from '../config/api.js'

const fetchData = async(urlEnd) => { // Function to grab the data from the backend
    let url

    // Check if urlEnd is an endpoint constant or a direct path
    if (API_CONFIG.ENDPOINTS[urlEnd]) {
        url = buildApiUrl(urlEnd)
    } else if (typeof urlEnd === 'string' && urlEnd.includes('/')) {
        // Handle paths like 'RUNBOOK_JSON/someId'
        const [endpoint, ...pathParts] = urlEnd.split('/')
        if (API_CONFIG.ENDPOINTS[endpoint]) {
            url = buildApiUrl(endpoint, pathParts.join('/'))
        } else {
            url = `${API_CONFIG.BASE_URL}/${urlEnd}`
        }
    } else {
        // Fallback for direct paths
        url = `${API_CONFIG.BASE_URL}/${urlEnd}`
    }
    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error('Error fetching data')
        }
        const jsonData = await response.json()
        return {data: jsonData, isLoading: false}
    } catch (error) {
        console.error('Error fetching data: ', error)
        return {data: null, isLoading: false, error: error.message}
    }
}

const urlOpen = (site) => {
    window.open(site)
}

export { fetchData, urlOpen }
