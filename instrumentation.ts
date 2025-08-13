export async function register() {
  // Only run on server-side in Node.js environment
  if (
    typeof process !== 'undefined' &&
    process.versions &&
    process.versions.node
  ) {
    console.log('🚀 Initializing server instrumentation...')

    // Dynamic imports to avoid Edge Runtime issues
    const { registerAllHandlers } = await import('@/lib/queue/handlers')
    const { startQueue, stopQueue } = await import('@/lib/queue/manager')

    // Register all job handlers
    registerAllHandlers()

    // Start the queue processor
    startQueue()

    // Set up graceful shutdown only in Node.js environment
    if (typeof process.on === 'function') {
      process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down queue processor...')
        stopQueue()
      })

      process.on('SIGINT', () => {
        console.log('SIGINT received, shutting down queue processor...')
        stopQueue()
      })
    }

    console.log('✅ Server instrumentation initialized')
  }
}
