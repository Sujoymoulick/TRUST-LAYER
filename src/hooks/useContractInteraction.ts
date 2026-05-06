import { useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { useState } from 'react';

export function useContractInteraction() {
  const { sendTransactionAsync } = useSendTransaction();
  const [isPending, setIsPending] = useState(false);

  /**
   * Simple Native Token Transfer
   */
  const transferNative = async (to: string, amount: string) => {
    setIsPending(true);
    try {
      const hash = await sendTransactionAsync({
        to: to as `0x${string}`,
        value: parseEther(amount),
      });
      return hash;
    } catch (error) {
      console.error('Transfer failed:', error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  /**
   * Placeholder for Smart Contract Write
   * In a real scenario, you'd use useWriteContract from wagmi
   */
  const callContract = async (address: string, functionName: string, args: any[]) => {
    // This is a template for future implementation
    console.log('Contract call requested:', { address, functionName, args });
    alert('Contract interaction logic ready. Add your ABI and contract address to continue.');
  };

  return {
    transferNative,
    callContract,
    isPending,
  };
}
