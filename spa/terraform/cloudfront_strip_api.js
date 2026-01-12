function handler(event) {
  var request = event.request;
  if (request.uri && request.uri.indexOf('/api/') === 0) {
    request.uri = request.uri.substring(4);
    if (request.uri === '') {
      request.uri = '/';
    }
  }
  return request;
}