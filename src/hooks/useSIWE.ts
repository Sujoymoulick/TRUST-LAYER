import { useEffect, useState } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { SiweMessage } from 'siwe';
import { apiFetch } from '../lib/api';

export function useSIWE() {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function authenticate() {
      if (!isConnected || !address || authenticated || loading) return;

      setLoading(true);
      try {
        // 1. Get nonce from backend
        const { nonce } = await apiFetch('/auth/wallet/nonce', {
          method: 'POST',
          body: JSON.stringify({ address }),
        });

        // 2. Prepare SIWE message
        const message = new SiweMessage({
          domain: window.location.host,
          address,
          statement: 'Sign in with Ethereum to Pramaaan.',
          uri: window.location.origin,
          version: '1',
          chainId: chainId,
          nonce: nonce,
        });

        const messageToSign = message.prepareMessage();

        // 3. Sign message
        const signature = await signMessageAsync({
          message: messageToSign,
        });

        // 4. Verify on backend
        const result = await apiFetch('/auth/wallet/verify', {
          method: 'POST',
          body: JSON.stringify({ 
            message: message, 
            signature 
          }),
        });

        if (result.success) {
          setAuthenticated(true);
          console.log('Successfully authenticated with SIWE');
        } else {
          throw new Error('Verification failed');
        }
      } catch (error) {
        console.error('SIWE authentication failed:', error);
        disconnect(); // Disconnect wallet if auth fails
      } finally {
        setLoading(false);
      }
    }

    authenticate();
  }, [isConnected, address, authenticated, chainId, signMessageAsync, disconnect, loading]);

  return { authenticated, loading };
}
