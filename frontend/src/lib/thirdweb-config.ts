import { sepolia } from "thirdweb/chains";
import { createWallet } from "thirdweb/wallets";

export const activeChain = sepolia;

export const supportedChains = [sepolia];

export const supportedWallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.zerion.wallet"),
];