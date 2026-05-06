import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  bsc,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import type { ReactNode } from 'react';

const config = getDefaultConfig({
  appName: 'TrustLayer',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID_PLACEHOLDER', 
  chains: [mainnet, polygon, optimism, arbitrum, base, bsc],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
  },
  ssr: false, // Set to true if using Next.js
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#FFE600',
            accentColorForeground: 'black',
            borderRadius: 'none',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
