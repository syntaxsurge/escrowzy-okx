import { NextRequest, NextResponse } from 'next/server'

import { apiEndpoints } from '@/config/api-endpoints'
import { envServer } from '@/config/env.server'
import { getChainIndex } from '@/lib/config/chain-mappings'

interface GasPrice {
  slow: string
  average: string
  fast: string
  baseFee?: string
  priority?: {
    low: string
    medium: string
    high: string
  }
}

interface OKXGasPriceResponse {
  code: string
  data: Array<{
    // EVM fields
    normal?: string
    min?: string
    max?: string
    supportEip1559?: boolean
    erc1599Protocol?: {
      suggestBaseFee: string
      baseFee: string
      proposePriorityFee: string
      safePriorityFee: string
      fastPriorityFee: string
    }
    // UTXO fields
    normalFeeRate?: string
    maxFeeRate?: string
    minFeeRate?: string
    inscriptionOutput?: string
    minOutput?: string
    normalCost?: string
    maxCost?: string
    minCost?: string
  }>
  msg: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const chainId = searchParams.get('chainId') || '1'

    // Get gas prices based on chain
    const gasPrice = await getGasPriceForChain(chainId)

    return NextResponse.json({
      success: true,
      chainId,
      gasPrice,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Gas price API error:', error)

    // Return default gas prices on error
    return NextResponse.json({
      success: false,
      chainId: request.nextUrl.searchParams.get('chainId') || '1',
      gasPrice: {
        slow: '10',
        average: '15',
        fast: '20',
        baseFee: '10'
      },
      lastUpdated: new Date().toISOString()
    })
  }
}

async function getGasPriceForChain(chainId: string): Promise<GasPrice> {
  // Try to fetch real gas prices from OKX API first
  try {
    const chainIndex = getChainIndex(chainId)
    const okxGasPrice = await fetchOKXGasPrice(chainIndex)
    if (okxGasPrice) {
      return okxGasPrice
    }
  } catch (error) {
    console.error('Failed to fetch OKX gas price:', error)
  }

  // Fallback to reasonable estimates for each chain
  const gasPrices: Record<string, GasPrice> = {
    '1': {
      // Ethereum
      slow: '15',
      average: '20',
      fast: '30',
      baseFee: '15',
      priority: {
        low: '1',
        medium: '2',
        high: '3'
      }
    },
    '56': {
      // BSC
      slow: '3',
      average: '5',
      fast: '7',
      baseFee: '3'
    },
    '137': {
      // Polygon
      slow: '30',
      average: '50',
      fast: '100',
      baseFee: '30'
    },
    '42161': {
      // Arbitrum
      slow: '0.1',
      average: '0.15',
      fast: '0.2',
      baseFee: '0.1'
    },
    '10': {
      // Optimism
      slow: '0.001',
      average: '0.01',
      fast: '0.05',
      baseFee: '0.001'
    },
    '43114': {
      // Avalanche
      slow: '25',
      average: '35',
      fast: '50',
      baseFee: '25'
    },
    '8453': {
      // Base
      slow: '0.001',
      average: '0.01',
      fast: '0.05',
      baseFee: '0.001'
    },
    '250': {
      // Fantom
      slow: '10',
      average: '20',
      fast: '50',
      baseFee: '10'
    },
    '324': {
      // zkSync Era
      slow: '0.05',
      average: '0.1',
      fast: '0.2',
      baseFee: '0.05'
    },
    '59144': {
      // Linea
      slow: '0.1',
      average: '0.5',
      fast: '1',
      baseFee: '0.1'
    },
    '534352': {
      // Scroll
      slow: '0.01',
      average: '0.05',
      fast: '0.1',
      baseFee: '0.01'
    }
  }

  return (
    gasPrices[chainId] || {
      slow: '10',
      average: '15',
      fast: '20',
      baseFee: '10'
    }
  )
}

async function fetchOKXGasPrice(chainIndex: string): Promise<GasPrice | null> {
  try {
    const url = `${apiEndpoints.external.okxDex.baseUrl}${apiEndpoints.external.okxDex.basePath}${apiEndpoints.external.okxDex.endpoints.gasPrice}`

    const timestamp = new Date().toISOString()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Add OKX API credentials if available
    if (
      envServer.OKX_DEX_API_KEY &&
      envServer.OKX_DEX_SECRET_KEY &&
      envServer.OKX_DEX_PASSPHRASE
    ) {
      const crypto = await import('crypto')
      const method = 'GET'
      const requestPath = `${apiEndpoints.external.okxDex.basePath}${apiEndpoints.external.okxDex.endpoints.gasPrice}?chainIndex=${chainIndex}`
      const message = timestamp + method + requestPath

      const hmac = crypto.createHmac('sha256', envServer.OKX_DEX_SECRET_KEY)
      hmac.update(message)
      const signature = hmac.digest('base64')

      headers['OK-ACCESS-KEY'] = envServer.OKX_DEX_API_KEY
      headers['OK-ACCESS-SIGN'] = signature
      headers['OK-ACCESS-TIMESTAMP'] = timestamp
      headers['OK-ACCESS-PASSPHRASE'] = envServer.OKX_DEX_PASSPHRASE
      headers['OK-ACCESS-PROJECT'] =
        envServer.OKX_DEX_PROJECT_ID || envServer.OKX_DEX_API_KEY
    }

    const response = await fetch(`${url}?chainIndex=${chainIndex}`, {
      method: 'GET',
      headers,
      next: { revalidate: 30 } // Cache for 30 seconds
    })

    if (!response.ok) {
      console.error('OKX API error:', response.status, response.statusText)
      return null
    }

    const data: OKXGasPriceResponse = await response.json()

    if (data.code !== '0' || !data.data || data.data.length === 0) {
      console.error('OKX API returned error:', data.msg)
      return null
    }

    const gasPriceData = data.data[0]

    // Check if it's an EVM chain (has normal/min/max fields)
    if (gasPriceData.normal && gasPriceData.min && gasPriceData.max) {
      // Convert from wei to gwei for consistency
      const weiToGwei = (wei: string) => (BigInt(wei) / BigInt(1e9)).toString()

      const gasPrice: GasPrice = {
        slow: weiToGwei(gasPriceData.min),
        average: weiToGwei(gasPriceData.normal),
        fast: weiToGwei(gasPriceData.max),
        baseFee: gasPriceData.erc1599Protocol?.baseFee
          ? weiToGwei(gasPriceData.erc1599Protocol.baseFee)
          : weiToGwei(gasPriceData.min)
      }

      // Add EIP-1559 priority fees if available
      if (gasPriceData.supportEip1559 && gasPriceData.erc1599Protocol) {
        gasPrice.priority = {
          low: weiToGwei(gasPriceData.erc1599Protocol.safePriorityFee),
          medium: weiToGwei(gasPriceData.erc1599Protocol.proposePriorityFee),
          high: weiToGwei(gasPriceData.erc1599Protocol.fastPriorityFee)
        }
      }

      return gasPrice
    }

    // For UTXO chains, return fee rates as gas prices
    if (
      gasPriceData.normalFeeRate &&
      gasPriceData.minFeeRate &&
      gasPriceData.maxFeeRate
    ) {
      return {
        slow: gasPriceData.minFeeRate,
        average: gasPriceData.normalFeeRate,
        fast: gasPriceData.maxFeeRate,
        baseFee: gasPriceData.minFeeRate
      }
    }

    return null
  } catch (error) {
    console.error('Failed to fetch OKX gas price:', error)
    return null
  }
}
