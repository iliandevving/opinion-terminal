'use client'

import { useEffect } from 'react'

/**
 * Component that suppresses hydration warnings from browser extensions
 * Should be placed at the root of the application
 */
export function HydrationErrorHandler() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Store original console.error
    const originalError = console.error

    // Override console.error to filter out browser extension hydration warnings
    console.error = (...args) => {
      // Convert args to string for checking
      const errorMessage = args.join(' ')

      // Check if this is a hydration warning related to browser extensions
      const isBrowserExtensionError =
        errorMessage.includes('data-dashlane') ||
        errorMessage.includes('data-lastpass') ||
        errorMessage.includes('data-1password') ||
        errorMessage.includes('data-bitwarden') ||
        errorMessage.includes('data-lpignore') ||
        errorMessage.includes('data-dashlane-rid') ||
        errorMessage.includes('data-dashlane-classification') ||
        errorMessage.includes('data-dashlane-label') ||
        (errorMessage.includes('A tree hydrated but some attributes of the server rendered HTML didn\'t match the client properties') &&
         (errorMessage.includes('data-dashlane') ||
          errorMessage.includes('data-lastpass') ||
          errorMessage.includes('data-1password') ||
          errorMessage.includes('data-bitwarden'))) ||
        (errorMessage.includes('Hydration failed') &&
         (errorMessage.includes('data-dashlane') ||
          errorMessage.includes('server rendered HTML didn\'t match')))

      // If it's not a browser extension error, show it normally
      if (!isBrowserExtensionError) {
        originalError.apply(console, args)
      }
      // Otherwise, silently ignore it
    }

    // Cleanup function to restore original console.error
    return () => {
      console.error = originalError
    }
  }, [])

  // This component doesn't render anything
  return null
}