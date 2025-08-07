import { NextRequest, NextResponse } from 'next/server'

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
  // In production, you would fetch from actual gas oracle APIs
  // For now, using reasonable estimates for each chain

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

  // Try to fetch real gas prices from external APIs
  try {
    if (chainId === '1') {
      // For Ethereum mainnet, could fetch from Etherscan or other gas oracles
      // This is where you'd integrate with real gas APIs
      const realGasPrice = await fetchEthereumGasPrice()
      if (realGasPrice) {
        return realGasPrice
      }
    }
  } catch (error) {
    console.error('Failed to fetch real gas price:', error)
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

async function fetchEthereumGasPrice(): Promise<GasPrice | null> {
  // Placeholder for real gas oracle integration
  // In production, you would call APIs like:
  // - Etherscan Gas Oracle API
  // - ETH Gas Station
  // - Blocknative Gas Platform

  // For now, return null to use fallback prices
  return null
}

// Helper function to estimate transaction cost
export function estimateTransactionCost(
  gasPrice: string,
  gasLimit: number = 200000,
  nativeTokenPrice: number = 3500
): string {
  const gasPriceInGwei = parseFloat(gasPrice)
  const gasCostInEth = (gasPriceInGwei * gasLimit) / 1e9
  const gasCostInUsd = gasCostInEth * nativeTokenPrice

  return gasCostInUsd.toFixed(2)
}
