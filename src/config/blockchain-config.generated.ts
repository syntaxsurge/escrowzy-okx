// This file is auto-generated. Do not edit directly.
// Generated from: ./config/blockchains.yaml

import type { BlockchainConfig } from './blockchain-config-loader'

export const blockchainConfig: BlockchainConfig = {
  subscriptionPricing: {
    pro: 3,
    enterprise: 5
  },
  chains: {
    baseSepolia: {
      chainId: 84532,
      name: 'Base Sepolia',
      rpcUrl: 'https://sepolia.base.org',
      explorerUrl: 'https://sepolia.basescan.org',
      logo: 'https://raw.githubusercontent.com/base/brand-kit/eba9e730be34f8c9ae7f9a21f32cc6aafebe2ad1/logo/TheSquare/Digital/Base_square_blue.svg',
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
      },
      coingeckoId: 'ethereum',
      isTestnet: true,
      contractAddresses: {
        subscriptionManager: '0x9C2d41Cbde1e37A0d9C7e769594cCbc84d486835',
        escrowCore: '0xA099937F48BEecd170EDdF20F66eb738F54d9b63',
        achievementNFT: '0x79Dc4fbF279862ef631c01d6937A6fC31dfa6e2f'
      }
    },
    base: {
      chainId: 8453,
      name: 'Base',
      rpcUrl: 'https://mainnet.base.org',
      explorerUrl: 'https://basescan.org',
      logo: 'https://raw.githubusercontent.com/base/brand-kit/eba9e730be34f8c9ae7f9a21f32cc6aafebe2ad1/logo/TheSquare/Digital/Base_square_blue.svg',
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
      },
      coingeckoId: 'ethereum',
      isTestnet: false,
      contractAddresses: {
        subscriptionManager: '',
        escrowCore: '',
        achievementNFT: ''
      }
    },
    xlayerTestnet: {
      chainId: 195,
      name: 'X Layer Testnet',
      rpcUrl: 'https://testrpc.xlayer.tech',
      explorerUrl: 'https://www.okx.com/web3/explorer/xlayer-test',
      logo: 'https://static.okx.com/cdn/assets/imgs/243/230501A8E74482AB.png',
      nativeCurrency: {
        name: 'OKB',
        symbol: 'OKB',
        decimals: 18
      },
      coingeckoId: 'okb',
      isTestnet: true,
      contractAddresses: {
        subscriptionManager: '',
        escrowCore: '',
        achievementNFT: ''
      }
    },
    xlayer: {
      chainId: 196,
      name: 'X Layer',
      rpcUrl: 'https://rpc.xlayer.tech',
      explorerUrl: 'https://www.okx.com/web3/explorer/xlayer',
      logo: 'https://static.okx.com/cdn/assets/imgs/243/230501A8E74482AB.png',
      nativeCurrency: {
        name: 'OKB',
        symbol: 'OKB',
        decimals: 18
      },
      coingeckoId: 'okb',
      isTestnet: false,
      contractAddresses: {
        subscriptionManager: '',
        escrowCore: '',
        achievementNFT: ''
      }
    }
  }
}
