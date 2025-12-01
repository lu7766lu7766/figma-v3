/**
 * Google API Loader
 * Handles loading of Google API scripts dynamically
 */

import { gapi } from 'gapi-script'

/**
 * Load Google Identity Services (GSI) script dynamically
 */
export function loadGoogleIdentityServices(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof google !== 'undefined' && google.accounts) {
      resolve()
      return
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="gsi/client"]')
    if (existingScript) {
      // Wait for it to load
      existingScript.addEventListener('load', () => resolve())
      existingScript.addEventListener('error', reject)
      return
    }

    // Create and load script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true

    script.onload = () => {
      // Wait a bit for google.accounts to be available
      const checkInterval = setInterval(() => {
        if (typeof google !== 'undefined' && google.accounts) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 50)

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        if (typeof google !== 'undefined' && google.accounts) {
          resolve()
        } else {
          reject(new Error('Google Identity Services failed to load'))
        }
      }, 5000)
    }

    script.onerror = () => {
      reject(new Error('Failed to load Google Identity Services script'))
    }

    document.head.appendChild(script)
  })
}

/**
 * Get gapi instance (already imported from gapi-script)
 */
export function getGapi() {
  return gapi
}

/**
 * Initialize gapi client
 */
export async function initGapiClient(config?: { apiKey?: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    gapi.load('client', {
      callback: async () => {
        try {
          await gapi.client.init(config || {})
          await gapi.client.load('sheets', 'v4')
          resolve()
        } catch (error) {
          reject(error)
        }
      },
      onerror: reject
    })
  })
}
