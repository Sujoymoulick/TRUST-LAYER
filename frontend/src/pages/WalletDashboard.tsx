import { useAccount, useBalance, useChainId, useDisconnect } from 'wagmi';
import { formatUnits } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Loader2, ExternalLink, Copy, CheckCircle2, AlertCircle, Wallet as WalletIcon, History, LayoutGrid } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Transaction {
  id: string;
  tx_hash: string;
  from_address: string;
  to_address: string;
  amount: number;
  network: string;
  status: string;
  timestamp: string;
  type: string;
}

export default function WalletDashboard() {
  const { address, isConnected } = useAccount();
  const { data: balance, isLoading: balanceLoading } = useBalance({ address });
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchTransactions() {
      if (!address) return;
      try {
        const { data, error } = await supabase
          .from('wallet_transactions')
          .select('*')
          .order('timestamp', { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      } finally {
        setLoading(false);
      }
    }

    if (isConnected) fetchTransactions();
    else setLoading(false);
  }, [isConnected, address]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-24 h-24 border-4 border-black bg-brutal-yellow flex items-center justify-center text-5xl shadow-[8px_8px_0px_#000]">
          <WalletIcon size={48} />
        </div>
        <h2 className="font-display text-3xl uppercase">Wallet Not Connected</h2>
        <p className="max-w-md font-bold text-gray-500 uppercase text-xs tracking-widest">
          Connect your crypto wallet to view your balances, transactions, and manage your Web3 identity.
        </p>
        <ConnectButton label="Connect Your Wallet" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="font-display text-3xl uppercase">Wallet Console</h2>
        <div className="flex gap-2">
           <button 
            onClick={() => disconnect()}
            className="brutal-btn bg-brutal-pink text-white px-4 py-2 text-[10px] font-black uppercase"
           >
             Disconnect
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Account & Balance */}
        <div className="lg:col-span-4 space-y-8">
          <div className="brutal-card flex flex-col items-center text-center gap-6 py-10 bg-white">
            <div className="w-20 h-20 border-4 border-black bg-gray-100 flex items-center justify-center shadow-[4px_4px_0px_#000] overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${address}`} alt="wallet avatar" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 justify-center">
                <span className="font-mono text-sm font-black tracking-tighter">
                  {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
                </span>
                <button onClick={copyAddress} className="p-1 hover:bg-gray-100 border-2 border-black">
                  {copied ? <CheckCircle2 size={12} className="text-brutal-green" /> : <Copy size={12} />}
                </button>
              </div>
              <div className="inline-block px-3 py-1 bg-brutal-green border-2 border-black text-[10px] font-black uppercase shadow-[2px_2px_0px_#000]">
                {balance?.symbol} Network Active
              </div>
            </div>

            <div className="w-full h-px bg-black opacity-10 my-2" />

            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Available Balance</p>
              <div className="font-display text-4xl leading-none">
                {balanceLoading ? <Loader2 className="animate-spin" /> : balance ? Number(formatUnits(balance.value, balance.decimals)).toFixed(4) : '0.0000'}
              </div>
              <p className="font-black uppercase text-xs text-brutal-blue">{balance?.symbol}</p>
            </div>
          </div>

          <div className="brutal-card bg-black text-white space-y-6">
            <h3 className="font-display text-xs uppercase tracking-widest text-brutal-yellow">Security Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border-2 border-white/20 bg-white/5">
                <span className="text-[10px] font-black uppercase">SIWE Verified</span>
                <CheckCircle2 size={16} className="text-brutal-green" />
              </div>
              <div className="flex items-center justify-between p-3 border-2 border-white/20 bg-white/5">
                <span className="text-[10px] font-black uppercase">Chain ID</span>
                <span className="font-mono text-xs">{chainId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Activity & NFTs */}
        <div className="lg:col-span-8 space-y-8">
          {/* History */}
          <div className="brutal-card bg-white">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <History size={20} />
                <h3 className="font-display text-lg uppercase">Transaction History</h3>
              </div>
              <div className="flex gap-2">
                <span className="brutal-badge bg-brutal-blue text-[8px] uppercase">Live</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Hash</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8">
                        <Loader2 className="animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="font-black uppercase text-[10px]">{tx.type}</td>
                        <td className="font-mono text-[10px] opacity-60">{tx.tx_hash.substring(0, 14)}...</td>
                        <td className="font-black text-[10px]">{tx.amount}</td>
                        <td>
                          <span className={`brutal-badge !border-2 !px-2 !py-0.5 uppercase text-[8px] ${
                            tx.status === 'success' ? 'bg-brutal-green' : tx.status === 'failed' ? 'bg-brutal-pink' : 'bg-brutal-yellow'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td>
                          <a href={`https://etherscan.io/tx/${tx.tx_hash}`} target="_blank" rel="noreferrer" className="p-1 inline-block border-2 border-black hover:bg-brutal-yellow">
                            <ExternalLink size={12} />
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 font-bold uppercase text-[10px]">
                        No transactions found for this wallet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* NFTs Placeholder */}
          <div className="brutal-card bg-brutal-pink/10">
            <div className="flex items-center gap-3 mb-8">
              <LayoutGrid size={20} />
              <h3 className="font-display text-lg uppercase">Collectibles (NFTs)</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square border-2 border-black bg-white flex flex-col shadow-[4px_4px_0px_#000]">
                  <div className="flex-1 bg-gray-100 flex items-center justify-center opacity-40">
                    <AlertCircle size={24} />
                  </div>
                  <div className="p-2 border-t-2 border-black bg-white">
                    <p className="text-[8px] font-black uppercase">Hidden Asset #{i}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
