import { sepolia, mainnet } from "thirdweb/chains";
import { createWallet } from "thirdweb/wallets";

export const supportedChains = [sepolia, mainnet];

export const supportedWallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.zerion.wallet"),
];