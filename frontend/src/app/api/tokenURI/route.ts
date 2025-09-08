import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { NFT_ABI } from '@/lib/web3-config';

const client = createPublicClient({
  chain: sepolia,
  transport: http(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get('tokenId');
  const contract = searchParams.get('contract');

  if (!tokenId || !contract) {
    return NextResponse.json({ error: 'Missing tokenId or contract' }, { status: 400 });
  }

  try {
    const tokenURI = await client.readContract({
      address: contract as `0x${string}`,
      abi: NFT_ABI,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    });

    return NextResponse.json({ tokenURI });
  } catch (error) {
    console.error('Error fetching token URI:', error);
    return NextResponse.json({ error: 'Failed to fetch token URI' }, { status: 500 });
  }
}