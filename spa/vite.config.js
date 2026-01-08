import fs from 'fs'
import path from 'path'

import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

const envDir = path.resolve(__dirname, 'multi_envs')
const envPath = path.join(envDir, `env.${process.env.ENV}`)

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
}

export default defineConfig(() => {
    return {
        base: './',
        build: {
            outDir: 'build',
        },
        plugins: [react(), svgr()],
        test: {
            globals: true,
            environment: 'jsdom',
            include: ['**/*.test.js'],
        }
    }
})
