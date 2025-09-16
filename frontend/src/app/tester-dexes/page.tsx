"use client";

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { sepolia, arbitrumSepolia } from 'wagmi/chains';
import { contractAddresses, bridgeDexAbi } from '@/tester-codes/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface BridgeEvent {
  user: string;
  amount: string;
  targetChain: string;
  receiver: string;
  nonce: string;
  type: 'requested' | 'released';
  timestamp: number;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [receiver, setReceiver] = useState('');
  const [nonce, setNonce] = useState('');
  const [targetChain, setTargetChain] = useState('eth-sepolia');
  const [events, setEvents] = useState<BridgeEvent[]>([]);

  // Liquidity balances
  const ethLiquidity = useReadContract({
    address: contractAddresses.ethSepolia,
    abi: bridgeDexAbi,
    functionName: 'getLiquidity',
    chainId: sepolia.id,
  });

  const arbLiquidity = useReadContract({
    address: contractAddresses.arbitrumSepolia,
    abi: bridgeDexAbi,
    functionName: 'getLiquidity',
    chainId: arbitrumSepolia.id,
  });

  // User balance
  const userBalance = useBalance({ address });

  // Write contract functions
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Handle bridge request
  const handleRequestBridge = async () => {
    if (!amount || !receiver || !nonce) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    const contractAddress = targetChain === 'eth-sepolia' ? contractAddresses.ethSepolia : contractAddresses.arbitrumSepolia;
    const targetChainName = targetChain === 'eth-sepolia' ? 'Arbitrum Sepolia' : 'ETH Sepolia';

    try {
      writeContract({
        address: contractAddress,
        abi: bridgeDexAbi,
        functionName: 'requestBridge',
        args: [targetChainName, receiver, BigInt(nonce)],
        value: parseEther(amount),
      });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to request bridge', variant: 'destructive' });
    }
  };

  // Handle deposit liquidity
  const handleDepositLiquidity = async () => {
    if (!amount) {
      toast({ title: 'Error', description: 'Please enter an amount', variant: 'destructive' });
      return;
    }

    const contractAddress = targetChain === 'eth-sepolia' ? contractAddresses.ethSepolia : contractAddresses.arbitrumSepolia;

    try {
      writeContract({
        address: contractAddress,
        abi: bridgeDexAbi,
        functionName: 'depositLiquidity',
        value: parseEther(amount),
      });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to deposit liquidity', variant: 'destructive' });
    }
  };

  // Handle release funds
  const handleRelease = async (event: BridgeEvent) => {
    const contractAddress = targetChain === 'eth-sepolia' ? contractAddresses.arbitrumSepolia : contractAddresses.ethSepolia;

    try {
      writeContract({
        address: contractAddress,
        abi: bridgeDexAbi,
        functionName: 'release',
        args: [event.receiver, BigInt(event.amount), BigInt(event.nonce)],
      });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to release funds', variant: 'destructive' });
    }
  };

  // Transaction feedback
  useEffect(() => {
    if (isConfirmed) {
      toast({ title: 'Success', description: 'Transaction confirmed!' });
      setAmount('');
      setReceiver('');
      setNonce('');
    }
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }, [isConfirmed, error, toast]);

  // Mock event listener (simulated for demo)
  useEffect(() => {
    // In a real app, use viem's watchContractEvent to listen for BridgeRequested and BridgeReleased
    const mockEvents: BridgeEvent[] = [
      {
        user: '0x123...',
        amount: '1.0',
        targetChain: 'Arbitrum Sepolia',
        receiver: '0x456...',
        nonce: '123',
        type: 'requested',
        timestamp: Date.now(),
      },
    ];
    setEvents(mockEvents);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">BridgeDEX</h1>
          <ConnectButton />
        </div>

        <Tabs defaultValue="user" className="space-y-4">
          <TabsList>
            <TabsTrigger value="user">User Bridge</TabsTrigger>
            <TabsTrigger value="admin">Admin Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="user">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bridge Tokens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium">From Chain</label>
                      <Select value={targetChain} onValueChange={setTargetChain}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eth-sepolia">ETH Sepolia</SelectItem>
                          <SelectItem value="arb-sepolia">Arbitrum Sepolia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium">To Chain</label>
                      <div className="text-gray-500">
                        {targetChain === 'eth-sepolia' ? 'Arbitrum Sepolia' : 'ETH Sepolia'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Amount (ETH)</label>
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Receiver Address</label>
                      <Input
                        value={receiver}
                        onChange={(e) => setReceiver(e.target.value)}
                        placeholder="0x..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Nonce</label>
                      <Input
                        type="number"
                        value={nonce}
                        onChange={(e) => setNonce(e.target.value)}
                        placeholder="Enter nonce"
                      />
                    </div>
                    <Button
                      onClick={handleRequestBridge}
                      disabled={isPending || isConfirming || !isConnected}
                      className="w-full"
                    >
                      {isPending || isConfirming ? 'Processing...' : 'Request Bridge'}
                    </Button>
                    <p className="text-sm text-gray-500">
                      2.5% fee will be sent to company wallet: 0xcc5d972ee1e4abe7d1d6b5fed1349ae4913cd423
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bridge Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {events.length > 0 ? (
                    <ul className="space-y-2">
                      {events.map((event, index) => (
                        <li key={index} className="text-sm">
                          {event.type === 'requested' ? 'Bridge Requested' : 'Bridge Released'}: {event.amount} ETH to{' '}
                          {event.targetChain} for {event.receiver} (Nonce: {event.nonce})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Waiting for relayer...</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="admin">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium">Select Chain</label>
                      <Select value={targetChain} onValueChange={setTargetChain}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eth-sepolia">ETH Sepolia</SelectItem>
                          <SelectItem value="arb-sepolia">Arbitrum Sepolia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Deposit Liquidity (ETH)</label>
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    <Button
                      onClick={handleDepositLiquidity}
                      disabled={isPending || isConfirming || !isConnected}
                      className="w-full"
                    >
                      {isPending || isConfirming ? 'Processing...' : 'Deposit Liquidity'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Liquidity Pool</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>ETH Sepolia: {ethLiquidity.data ? formatEther(ethLiquidity.data as bigint) : 'Loading...'} ETH</p>
                  <p>Arbitrum Sepolia: {arbLiquidity.data ? formatEther(arbLiquidity.data as bigint) : 'Loading...'} ETH</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pending Bridge Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {events
                    .filter((e) => e.type === 'requested')
                    .map((event, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <p>Amount: {event.amount} ETH</p>
                          <p>Receiver: {event.receiver}</p>
                          <p>Nonce: {event.nonce}</p>
                        </div>
                        <Button onClick={() => handleRelease(event)}>Release on {targetChain === 'eth-sepolia' ? 'Arb' : 'ETH'}</Button>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>User Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{userBalance.data ? `${formatEther(userBalance.data.value)} ETH` : 'Loading...'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}