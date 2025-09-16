export const contractAddresses = {
  ethSepolia: '0xe4983077bCF3E50ef535Fdd7263DD5BD21f9a204' as `0x${string}`,
  arbitrumSepolia: '0xA846862a340eeABAa25EB4a643B135f94f035C75' as `0x${string}`,
};

export const bridgeDexAbi = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'admin', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'LiquidityAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'targetChain', type: 'string' },
      { indexed: false, internalType: 'address', name: 'receiver', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'nonce', type: 'uint256' },
    ],
    name: 'BridgeRequested',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'receiver', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amountAfterFee', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'fee', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'nonce', type: 'uint256' },
    ],
    name: 'BridgeReleased',
    type: 'event',
  },
  {
    inputs: [],
    name: 'COMPANY_WALLET',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'FEE_PERCENT',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'depositLiquidity',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getLiquidity',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'processedNonces',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'targetChain', type: 'string' },
      { internalType: 'address', name: 'receiver', type: 'address' },
      { internalType: 'uint256', name: 'nonce', type: 'uint256' },
    ],
    name: 'requestBridge',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address payable', name: 'receiver', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'nonce', type: 'uint256' },
    ],
    name: 'release',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'withdrawLiquidity',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];