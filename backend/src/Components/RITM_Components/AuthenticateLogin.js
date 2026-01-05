import { username, password } from '../../configurations/SQL/ConnectionPool.js'
import { logError } from '../Logger.js'
import { SUCCESS, BAD_PASSWORD, FATAL_ERROR } from '../StatusCodes.js'

function authenticateLogin(request, callback) {
    try {
        if (request.body.username === username && request.body.password === password) {
            callback(SUCCESS)
        } else {
            callback(BAD_PASSWORD)
        }
    } catch (err) {
        logError(err)
        callback(FATAL_ERROR)
    }
}

export { authenticateLogin }