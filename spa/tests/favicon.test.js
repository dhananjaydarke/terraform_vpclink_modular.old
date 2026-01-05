import fs from 'fs'
import path from 'path'

describe('Favicon', () => {
    test('favicon.ico exists in public directory', () => {
        const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico')
        expect(fs.existsSync(faviconPath)).toBe(true)
    })
})
