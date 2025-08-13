import type {
  OKXBaseResponse,
  OKXTokenInfo,
  OKXBalanceInfo,
  OKXLiquiditySource,
  OKXQuoteRequest,
  OKXSwapRequest,
  OKXQuoteResponse,
  OKXSwapResponse,
  OKXApproveRequest,
  OKXApproveResponse,
  OKXChain
} from '@/types/okx-dex'

/**
 * Client-safe OKX DEX API base class
 * This version doesn't import any server-only dependencies
 * It relies on API routes for actual OKX communication
 */
export abstract class OKXDexAPIClient {
  protected readonly baseUrl: string
  protected readonly basePath: string

  constructor() {
    // For client-side, we'll use our API routes instead of direct OKX access
    this.baseUrl = ''
    this.basePath = '/api'
  }

  /**
   * Abstract method for making requests
   * Must be implemented by subclasses
   */
  protected abstract request<T>(endpoint: string, config?: any): Promise<T>

  /**
   * Get supported chains from OKX
   */
  public async getSupportedChains(): Promise<
    OKXBaseResponse<{ chains: OKXChain[] }>
  > {
    return this.request('/swap/chains')
  }

  /**
   * Get all tokens for a specific chain
   */
  public async getAllTokens(
    chainId: string
  ): Promise<{ tokens: OKXTokenInfo[] }> {
    return this.request('/swap/all-tokens', {
      method: 'POST',
      body: { chainId: parseInt(chainId) }
    })
  }

  /**
   * Search tokens by query string
   */
  public async searchTokens(
    chainId: string,
    query: string
  ): Promise<OKXTokenInfo[]> {
    const response = await this.request<{
      success: boolean
      tokens: OKXTokenInfo[]
    }>('/swap/tokens', {
      method: 'POST',
      body: { chainId: parseInt(chainId), query }
    })
    return response.tokens || []
  }

  /**
   * Get token balances for an address
   */
  public async getAllTokenBalances(
    address: string,
    chainId: string
  ): Promise<OKXBaseResponse<{ balances: OKXBalanceInfo[] }>> {
    return this.request('/swap/balances', {
      method: 'POST',
      body: { walletAddress: address, chainId: parseInt(chainId) }
    })
  }

  /**
   * Get liquidity sources for a chain
   */
  public async getLiquiditySources(
    chainId: string
  ): Promise<OKXBaseResponse<{ liquiditySources: OKXLiquiditySource[] }>> {
    return this.request('/swap/liquidity', {
      method: 'POST',
      body: { chainId: parseInt(chainId) }
    })
  }

  /**
   * Get market price info for a token
   */
  public async getMarketPriceInfo(
    tokenAddress: string,
    chainId: string
  ): Promise<any> {
    const response = await this.request<{ success: boolean; data: any }>(
      '/swap/price',
      {
        method: 'POST',
        body: { tokenAddress, chainId: parseInt(chainId) }
      }
    )
    return response.data || { price: '0' }
  }

  /**
   * Get token price
   */
  public async getTokenPrice(
    tokenAddress: string,
    chainId: string
  ): Promise<number> {
    const priceInfo = await this.getMarketPriceInfo(tokenAddress, chainId)
    // Handle the response format - it's either the direct object or nested under token address
    if (typeof priceInfo === 'object' && 'price' in priceInfo) {
      return parseFloat(priceInfo.price || '0')
    }
    // Handle indexed response format
    const tokenData = priceInfo[tokenAddress.toLowerCase()]
    return tokenData ? parseFloat(tokenData.price || '0') : 0
  }

  /**
   * Get swap quote
   */
  public async getQuote(request: OKXQuoteRequest): Promise<OKXQuoteResponse> {
    return this.request('/swap/quote', {
      method: 'POST',
      body: {
        fromToken: request.fromTokenAddress,
        toToken: request.toTokenAddress,
        fromAmount: request.amount,
        chainId: parseInt(request.chainIndex),
        slippage: parseFloat(request.slippage || '0.5')
      }
    })
  }

  /**
   * Get swap transaction data
   */
  public async getSwapData(request: OKXSwapRequest): Promise<OKXSwapResponse> {
    return this.request('/swap/execute', {
      method: 'POST',
      body: {
        fromToken: request.fromTokenAddress,
        toToken: request.toTokenAddress,
        fromAmount: request.amount,
        chainId: parseInt(request.chainIndex),
        slippage: parseFloat(request.slippage || '0.5'),
        userAddress: request.userWalletAddress
      }
    })
  }

  /**
   * Get approve transaction for token
   */
  public async getApproveTransaction(
    request: OKXApproveRequest
  ): Promise<OKXApproveResponse> {
    return this.request('/swap/approve', {
      method: 'POST',
      body: {
        chainId: parseInt(request.chainIndex),
        tokenAddress: request.tokenContractAddress,
        amount: request.approveAmount
      }
    })
  }
}
