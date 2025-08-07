import { scriptEnv } from '@/config/env.scripts'
import { registerAllHandlers } from '@/lib/queue/handlers'
import { startQueue } from '@/lib/queue/manager'

export async function register() {
  // Only run on server-side
  if (scriptEnv.isNextjsEnvironment()) {
    console.log('🚀 Initializing server instrumentation...')

    // Register all job handlers
    registerAllHandlers()

    // Start the queue processor
    startQueue()

    // Set up graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down queue processor...')
      const { stopQueue } = require('@/lib/queue/manager')
      stopQueue()
    })

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down queue processor...')
      const { stopQueue } = require('@/lib/queue/manager')
      stopQueue()
    })

    console.log('✅ Server instrumentation initialized')
  }
}
