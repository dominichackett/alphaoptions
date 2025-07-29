"use client";
import { Web3AuthProvider, type Web3AuthContextConfig } from "@web3auth/modal/react";
import { IWeb3AuthState, WEB3AUTH_NETWORK, CHAIN_NAMESPACES } from "@web3auth/modal";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { AuthProvider } from "../contexts/AuthContext"; // Your Supabase auth context

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;
const queryClient = new QueryClient();

const avalancheTestnet = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xA869",
  rpcTarget: "https://api.avax-test.network/ext/bc/C/rpc",
  displayName: "Avalanche Testnet",
  blockExplorerUrl: "https://testnet.snowtrace.io/",
  ticker: "AVAX",
  tickerName: "Avalanche",
  logo: "https://images.toruswallet.io/avax.svg",
};

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    chainConfig: avalancheTestnet,
    ssr: true,
    // Add these important options
    uiConfig: {
      appName: "Alpha Signals",
      mode: "dark", // or "light"
      logoLight: "https://web3auth.io/images/web3authlog.png",
      logoDark: "https://web3auth.io/images/web3authlogodark.png",
      defaultLanguage: "en",
      theme: {
        primary: "#768729"
      }
    },
    // Disable hCaptcha for development
    enableLogging: true,
    sessionTime: 86400, // 1 day
    // Add this to potentially help with localhost issues
    storageKey: "local"
  }
};

export default function Provider({
  children,
  web3authInitialState
}: {
  children: React.ReactNode,
  web3authInitialState: IWeb3AuthState | undefined
}) {
  return (
    <Web3AuthProvider config={web3AuthContextConfig} initialState={web3authInitialState}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}