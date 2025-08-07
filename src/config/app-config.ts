import { envPublic } from '@/config/env.public'

export const appConfig = {
  name: envPublic.NEXT_PUBLIC_APP_NAME,
  description: envPublic.NEXT_PUBLIC_APP_DESCRIPTION,
  url: envPublic.NEXT_PUBLIC_APP_URL,

  // Server configuration
  server: {
    defaultHost: 'localhost:3000',
    defaultProtocol: 'http' as const,
    productionHost:
      envPublic.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') ||
      'app.escrowzy.com',
    developmentUrl: 'http://localhost:3000',
    localhostIp: '127.0.0.1'
  },

  // Email configuration
  email: {
    defaultFrom: 'noreply@escrowzy.com',
    supportEmail: 'support@escrowzy.com',
    adminEmail: 'admin@escrowzy.com'
  },

  // Platform messages
  messages: {
    defaultFeeText: 'platform fee',
    defaultFeePercentage: '2.5%'
  },

  // Media configuration
  media: {
    placeholderVideoUrl: 'https://www.youtube.com/embed/xxxxxxx'
  }
}
