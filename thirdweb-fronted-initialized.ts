import { createThirdwebClient, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";


export const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "demo-client-id",
});


// Rootstock (RSK) Testnet configuration
export const rskTestnet = defineChain({
  id: 31,
  name: "Rootstock Testnet",
  nativeCurrency: {
    name: "Rootstock BTC",
    symbol: "tRBTC",
    decimals: 18,
  },
  rpc:  `https://31.rpc.thirdweb.com/${import.meta.env.VITE_THIRDWEB_CLIENT_ID}`,
  blockExplorers: [
    {
      name: "RSK Testnet Explorer",
      url: "https://explorer.testnet.rsk.co",
    },
  ],
});


// Smart contract addresses (these would be filled in after deployment)
export const CONTRACT_ADDRESSES = {
  PNEO_TOKEN: "0xF2F1C5d0F5a2d82dE0f04AfE90b268bC4917Ca42",   
  NEO_TOKEN: "0xB26a27425DB5Ec792Ae4bBEc97fdc134b8Fe3319",   
  SPV_PERMISSIONS: "0x...",   VESTING: "0x...",   
  CONVERSION: "0x1d44d2c9c8304CECDC4D862945f0eD4B0d3DcB75",   
  USDT: "0x4D5a316D23eBE168d8f887b4447bf8DbFA4901CC",  
  USDC: "0x1BDA44FDA2B5C7B8F4D3b5B8F4D3b5B8F4D3b5B8"
};


// Token configurations
export const SUPPORTED_TOKENS = {
  tRBTC: {
    symbol: "tRBTC",
    name: "Test Rootstock BTC",
    decimals: 18,
    isNative: true,
    address: null,
    icon: "₿"
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    isNative: false,
    address: CONTRACT_ADDRESSES.USDT,
    icon: "₮"
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    isNative: false,
    address: CONTRACT_ADDRESSES.USDC,
    icon: "$"
  }
} as const;


// Contract instances
export const getPNEOContract = () => {
  return getContract({
    client,
    chain: rskTestnet,
    address: CONTRACT_ADDRESSES.PNEO_TOKEN,
  });
};


export const getNEOContract = () => {
  return getContract({
    client,
    chain: rskTestnet,
    address: CONTRACT_ADDRESSES.NEO_TOKEN,
  });
};


export const getSPVPermissionsContract = () => {
  return getContract({
    client,
    chain: rskTestnet,
    address: CONTRACT_ADDRESSES.SPV_PERMISSIONS,
  });
};


export const getVestingContract = () => {
  return getContract({
    client,
    chain: rskTestnet,
    address: CONTRACT_ADDRESSES.VESTING,
  });
};


export const getConversionContract = () => {
  return getContract({
    client,
    chain: rskTestnet,
    address: CONTRACT_ADDRESSES.CONVERSION,
  });
};

