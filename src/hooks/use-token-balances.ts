'use client'

import { useState, useEffect, useCallback } from 'react'

import { NATIVE_TOKEN_ADDRESS } from 'thirdweb'

import { apiEndpoints } from '@/config/api-endpoints'
import { useUnifiedWalletInfo, useUnifiedChainInfo } from '@/context/blockchain'
import type { OKXBalanceInfo, OKXTokenInfo } from '@/types/okx-dex'

export function useTokenBalances() {
  const { address } = useUnifiedWalletInfo()
  const { chainId } = useUnifiedChainInfo()

  const [balances, setBalances] = useState<OKXBalanceInfo[]>([])
  const [popularTokens, setPopularTokens] = useState<OKXTokenInfo[]>([])
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)
  const [isLoadingTokens, setIsLoadingTokens] = useState(false)

  // Fetch token balances
  const fetchBalances = useCallback(async () => {
    if (!address || !chainId) return

    setIsLoadingBalances(true)
    try {
      const response = await fetch(apiEndpoints.swap.balances, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          chainId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setBalances(data.balances || [])
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error)
    } finally {
      setIsLoadingBalances(false)
    }
  }, [address, chainId])

  // Fetch popular tokens
  const fetchPopularTokens = useCallback(async () => {
    if (!chainId) return

    setIsLoadingTokens(true)
    try {
      const response = await fetch(apiEndpoints.swap.tokens, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chainId })
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`Fetched ${data.tokens?.length || 0} tokens from API`)

        // Add native token if not present
        const tokens = data.tokens || []
        const hasNativeToken = tokens.some(
          (t: any) =>
            t.tokenContractAddress?.toLowerCase() === NATIVE_TOKEN_ADDRESS
        )

        if (!hasNativeToken && chainId) {
          // Add native token based on chain
          const nativeSymbol =
            chainId === 56
              ? 'BNB'
              : chainId === 137
                ? 'MATIC'
                : chainId === 43114
                  ? 'AVAX'
                  : 'ETH'

          tokens.unshift({
            tokenContractAddress: NATIVE_TOKEN_ADDRESS,
            tokenSymbol: nativeSymbol,
            tokenName: nativeSymbol,
            tokenDecimals: '18',
            tokenLogoUrl: undefined
          })
        }

        setPopularTokens(tokens)
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error)
    } finally {
      setIsLoadingTokens(false)
    }
  }, [chainId])

  // Search tokens
  const searchTokens = useCallback(
    async (query: string): Promise<OKXTokenInfo[]> => {
      if (!chainId || !query) return []

      try {
        const response = await fetch(apiEndpoints.swap.tokens, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chainId, query })
        })

        if (response.ok) {
          const data = await response.json()
          return data.tokens || []
        }
      } catch (error) {
        console.error('Failed to search tokens:', error)
      }
      return []
    },
    [chainId]
  )

  // Get balance for specific token
  const getTokenBalance = useCallback(
    (tokenAddress: string): string => {
      const balance = balances.find(
        b => b.tokenContractAddress.toLowerCase() === tokenAddress.toLowerCase()
      )
      return balance?.balance || '0'
    },
    [balances]
  )

  // Format balance for display
  const formatBalance = useCallback(
    (balance: string, decimals: number = 18): string => {
      // Check if balance is already formatted (not in wei)
      // OKX returns balances already formatted
      const value = parseFloat(balance)

      // If the value is extremely large, it's likely in wei/smallest unit
      if (value > 1e15) {
        // Convert from smallest unit to actual value
        const actualValue = value / Math.pow(10, decimals)
        if (actualValue === 0) return '0'
        if (actualValue < 0.0001) return '<0.0001'
        if (actualValue < 1) return actualValue.toFixed(4)
        if (actualValue < 10000) return actualValue.toFixed(2)
        return actualValue.toLocaleString()
      }

      // Value is already formatted
      if (value === 0) return '0'
      if (value < 0.0001) return '<0.0001'
      if (value < 1) return value.toFixed(4)
      if (value < 10000) return value.toFixed(2)
      return value.toLocaleString()
    },
    []
  )

  // Auto-fetch on mount and chain/account change
  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  useEffect(() => {
    fetchPopularTokens()
  }, [fetchPopularTokens])

  return {
    balances,
    popularTokens,
    isLoadingBalances,
    isLoadingTokens,
    fetchBalances,
    searchTokens,
    getTokenBalance,
    formatBalance,
    refetch: () => {
      fetchBalances()
      fetchPopularTokens()
    }
  }
}
