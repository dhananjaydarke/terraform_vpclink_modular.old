import { logger, logError } from './Logger.js'
import { poolPromise } from '../configurations/SQL/ConnectionPool.js'

async function grabSideBarMenu(callback) {
    const startTime = Date.now()
    try {
        logger.debug('Sidebar menu query started', {
            operation: 'grabSideBarMenu',
            tool: 'SidebarStatus'
        })

        const pool = await poolPromise
        const results = await pool.request().query('select Id, Title, URL from THDDB.dbo.SideBar')
        
        const duration = Date.now() - startTime
        const menuItemCount = results.recordset.length

        logger.info('Sidebar menu retrieved successfully', {
            operation: 'grabSideBarMenu',
            duration,
            menuItemCount,
            hasMenuItems: menuItemCount > 0,
            tool: 'SidebarStatus'
        })

        if (menuItemCount > 0) {
            // Analyze menu items
            const itemsWithUrls = results.recordset.filter(item => item.URL && item.URL.trim() !== '').length
            const itemsWithoutUrls = menuItemCount - itemsWithUrls
            const maxTitleLength = Math.max(...results.recordset.map(item => item.Title ? item.Title.length : 0))
            const minTitleLength = Math.min(...results.recordset.map(item => item.Title ? item.Title.length : 0))

            logger.debug('Sidebar menu analysis', {
                operation: 'grabSideBarMenu',
                totalItems: menuItemCount,
                itemsWithUrls,
                itemsWithoutUrls,
                titleLengthRange: { min: minTitleLength, max: maxTitleLength },
                tool: 'SidebarStatus'
            })

            // Log individual menu items (debug level)
            results.recordset.forEach((item, index) => {
                logger.debug('Sidebar menu item', {
                    operation: 'grabSideBarMenu',
                    itemIndex: index + 1,
                    id: item.Id,
                    hasTitle: !!item.Title,
                    hasUrl: !!(item.URL?.trim()),
                    titleLength: item.Title ? item.Title.length : 0,
                    tool: 'SidebarStatus'
                })
            })
        } else {
            logger.warn('No sidebar menu items found', {
                operation: 'grabSideBarMenu',
                tool: 'SidebarStatus'
            })
        }

        return callback(results.recordset)
    } catch (err) {
        const duration = Date.now() - startTime
        logError(err, 'Sidebar menu retrieval failed', {
            operation: 'grabSideBarMenu',
            duration
        })
    }
}

export { grabSideBarMenu }
