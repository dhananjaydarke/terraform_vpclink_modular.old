const SUCCESS = 0
const FATAL_ERROR = 1
const PORTFOLIO_ERROR = 2
const DUPLICATE_THD_ERROR = 3
const API_ERROR = 4
const DUPLICATE_GRAFANA_ERROR = 5
const BEARER_API_ERROR = 6
const MISSING_GRAFANA_ERROR = 7
const MISSING_APPD_ERROR = 8
const MISSING_THD_ERROR = 9
const BAD_PASSWORD = 10
const BAD_ALERT_NAME_ERROR = 11
const DUPLICATE_ALERT_NAME_ERROR = 12
const BAD_STATUS_ERROR = 13
const DB_APPD_API_ERROR = 14
const DASH_APP_NAME_FAIL = 15

const statusCodes = new Map([
    [SUCCESS, {statusCode: 200, Message: 'Success'}],
    [FATAL_ERROR, {statusCode: 500, Message: 'Error: Please contact the Technology Health Dashboard L3 team'}],
    [PORTFOLIO_ERROR, {statusCode: 400, Message: 'Error: Porfolio name is not accepted'}],
    [DUPLICATE_THD_ERROR, {statusCode: 400, Message: 'Error: This alert is already within this service'}],
    [API_ERROR, {statusCode: 400, Message: 'Error: API Key is invalid'}],
    [DUPLICATE_GRAFANA_ERROR, {statusCode: 400, Message: 'Error: There are duplicate alerts in this Grafana Org'}],
    [BEARER_API_ERROR, {statusCode: 400, Message: 'Error: Please add "Bearer " in front of your API Key, yes the space is necessary'}],
    [MISSING_GRAFANA_ERROR, {statusCode: 400, Message: 'Error: This alert is not found in this Grafana org'}],
    [MISSING_APPD_ERROR, {statusCode: 400, Message: 'Error: This alert is not found or is not enabled in this AppDynamics org'}],
    [MISSING_THD_ERROR, {statusCode: 400, Message: 'Error: The current name you sent in is not in the THD'}],
    [BAD_PASSWORD, {statusCode: 400, Message: 'Error: Wrong password'}],
    [BAD_ALERT_NAME_ERROR, {statusCode: 400, Message: 'Error: Invalid Alert_Name (not found)'}],
    [DUPLICATE_ALERT_NAME_ERROR, {statusCode: 400, Message: 'Error: Invalid Alert_Name (not unique)'}],
    [BAD_STATUS_ERROR, {statusCode: 400, Message: 'Error: The Status not a correct Status please use STATUS_OK, STATUS_WARNING, STATUS_DANGER, or STATUS_REPAIR'}],
    [DB_APPD_API_ERROR, {statusCode: 400, Message: 'Error: The Database monitoring Alert Name does not end with "_DB"'}],
    [DASH_APP_NAME_FAIL, {statusCode: 400, Message: 'Error: The Dash Name does not exist as an application in Dash"'}]
])

export { SUCCESS, FATAL_ERROR, PORTFOLIO_ERROR, DUPLICATE_THD_ERROR, API_ERROR, DUPLICATE_GRAFANA_ERROR, BEARER_API_ERROR, MISSING_GRAFANA_ERROR, MISSING_APPD_ERROR, MISSING_THD_ERROR, BAD_PASSWORD, BAD_ALERT_NAME_ERROR, DUPLICATE_ALERT_NAME_ERROR, BAD_STATUS_ERROR, DB_APPD_API_ERROR, DASH_APP_NAME_FAIL, statusCodes }