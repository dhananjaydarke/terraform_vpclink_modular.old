function logError(error, message) {
    try {
        if (message) { console.error('Message:', JSON.stringify(message)) }
        console.error('Error Message:', error.message)
        console.error('Function Name:', getFunctionNameFromStack(error.stack))
        console.error('Line Error:', getPathFromStack(error))
        console.error('Stack Error:', error.stack)
    } catch (err) {
        console.error('Error during logging', err)
    }
}

function getPathFromStack(error) {
    const stackLines = error.stack.split('\n')
    const functionLine = stackLines[1]
    return functionLine
}

function getFunctionNameFromStack(error) {
    const stackLines = error.split('\n')
    for (const line of stackLines.slice(1)) {
        const match = line.match(/at\s+(?:[^\s.]*\.)?([^\s(]+)\s*\(/)
        if (match?.[1] && match[1] !== 'new') {
            return match[1].trim()
        }
    }
    return 'Unkown function'
}

export { logError }