import { execSync } from 'child_process'

/**
 * Load environment variables from Replit Secrets
 */
export function loadEnvFromReplit() {
  try {
    // Get all secrets from Replit
    const secrets = execSync('replit secrets list --json', { encoding: 'utf8' })
    const secretsData = JSON.parse(secrets)
    
    // Set each secret as an environment variable
    for (const secret of secretsData) {
      if (secret.name.startsWith('NEXT_PUBLIC_FIREBASE_')) {
        process.env[secret.name] = secret.value
      }
    }
    
    console.log('Loaded environment variables from Replit Secrets')
  } catch (error) {
    console.error('Failed to load environment variables:', error)
    process.exit(1)
  }
} 