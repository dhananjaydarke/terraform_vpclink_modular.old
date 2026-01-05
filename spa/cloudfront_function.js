function handler(event) {
    const request = event.request
    const uri = request.uri

    // Check whether the URI is missing a file name.
    if (uri.endsWith('/')) {
        request.uri = '/build' + uri + 'index.html'
    } else if (!uri.includes('.')) { // Check whether the URI is missing a file extension.
        request.uri = '/build' + uri + '/index.html'
    } else {
        request.uri = '/build' + uri
    }

    return request
}
