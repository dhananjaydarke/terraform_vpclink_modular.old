import { createWriteStream } from 'fs'
import { mkdir, readdir } from 'fs/promises'
import { pipeline } from 'stream/promises'

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

import { logger, logError } from './Components/Logger.js'

const NAME = 'thd-backend/dev'
const CERT_DIR = 'configurations/certificate'

const certificates = [
    'certificateDDARKE.pem',
]

const s3Client = new S3Client({})
const secretsClient = new SecretsManagerClient({})

logger.info('Certificate pull service initialized', {
    operation: 'initialization',
    secretName: NAME,
    certDirectory: CERT_DIR,
    certificateCount: certificates.length,
    certificates,
    tool: 'PullCerts'
})

async function getBucketName() {
    const startTime = Date.now()
    try {
        logger.debug('Retrieving S3 bucket name from secrets', {
            operation: 'getBucketName',
            secretName: NAME,
            tool: 'PullCerts'
        })

        const command = new GetSecretValueCommand({ SecretId: NAME })
        const response = await secretsClient.send(command)
        const secretData = JSON.parse(response.SecretString)
        const bucketName = secretData['s3-bucket-cert']

        const duration = Date.now() - startTime
        logger.info('S3 bucket name retrieved successfully', {
            operation: 'getBucketName',
            duration,
            bucketName,
            secretName: NAME,
            tool: 'PullCerts'
        })

        return bucketName
    } catch (error) {
        const duration = Date.now() - startTime
        logError(error, 'Failed to retrieve S3 bucket name', {
            operation: 'getBucketName',
            duration,
            secretName: NAME
        })
        throw error
    }
}

async function downloadCertificates() {
    const startTime = Date.now()
    try {
        logger.info('Certificate download process started', {
            operation: 'downloadCertificates',
            certificateCount: certificates.length,
            tool: 'PullCerts'
        })

        const bucketName = await getBucketName()
        
        // Create certificate directory
        await mkdir(CERT_DIR, { recursive: true })
        logger.debug('Certificate directory created', {
            operation: 'downloadCertificates',
            directory: CERT_DIR,
            tool: 'PullCerts'
        })

        let successCount = 0
        let failureCount = 0
        const downloadResults = []

        for (const cert of certificates) {
            const certStartTime = Date.now()
            try {
                logger.debug('Downloading certificate', {
                    operation: 'downloadCertificates',
                    certificate: cert,
                    bucketName,
                    tool: 'PullCerts'
                })

                const command = new GetObjectCommand({
                    Bucket: bucketName,
                    Key: cert
                })
                
                const response = await s3Client.send(command)
                const writeStream = createWriteStream(`${CERT_DIR}/${cert}`)

                await pipeline(response.Body, writeStream)
                
                const certDuration = Date.now() - certStartTime
                successCount++
                
                logger.info('Certificate downloaded successfully', {
                    operation: 'downloadCertificates',
                    certificate: cert,
                    duration: certDuration,
                    bucketName,
                    filePath: `${CERT_DIR}/${cert}`,
                    tool: 'PullCerts'
                })

                downloadResults.push({
                    certificate: cert,
                    status: 'success',
                    duration: certDuration
                })

            } catch (error) {
                const certDuration = Date.now() - certStartTime
                failureCount++
                
                logError(error, 'Failed to download certificate', {
                    operation: 'downloadCertificates',
                    certificate: cert,
                    duration: certDuration,
                    bucketName
                })

                downloadResults.push({
                    certificate: cert,
                    status: 'failed',
                    duration: certDuration,
                    error: error.message
                })
            }
        }

        // List files in CERT_DIR for verification
        const files = await readdir(CERT_DIR)
        
        const totalDuration = Date.now() - startTime
        logger.info('Certificate download process completed', {
            operation: 'downloadCertificates',
            totalDuration,
            successCount,
            failureCount,
            totalCertificates: certificates.length,
            filesInDirectory: files.length,
            directoryContents: files,
            downloadResults,
            tool: 'PullCerts'
        })

        // Log summary statistics
        if (successCount === certificates.length) {
            logger.info('All certificates downloaded successfully', {
                operation: 'downloadCertificates',
                allSuccess: true,
                certificateCount: successCount,
                tool: 'PullCerts'
            })
        } else if (failureCount === certificates.length) {
            logger.error('All certificate downloads failed', {
                operation: 'downloadCertificates',
                allFailed: true,
                certificateCount: failureCount,
                tool: 'PullCerts'
            })
        } else {
            logger.warn('Partial certificate download success', {
                operation: 'downloadCertificates',
                partialSuccess: true,
                successCount,
                failureCount,
                tool: 'PullCerts'
            })
        }

    } catch (error) {
        const duration = Date.now() - startTime
        logError(error, 'Certificate download process failed', {
            operation: 'downloadCertificates',
            duration,
            certificateCount: certificates.length
        })
    }
}

logger.info('Starting certificate download', {
    operation: 'startup',
    tool: 'PullCerts'
})

downloadCertificates().catch((error) => {
    logError(error, 'Certificate download process crashed', {
        operation: 'startup'
    })
})
