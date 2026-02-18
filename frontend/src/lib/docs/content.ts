export interface DocItem {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  tags: string[];
  href: string;
  fullContent?: string;
  featureHref?: string;
}

export const DOC_CONTENT: DocItem[] = [
  {
    id: "intro",
    title: "Introduction to ChainVerse",
    category: "Getting Started",
    description: "Welcome to the bridge between traditional finance and the decentralized future.",
    content: "ChainVerse is a unified Web3 ecosystem designed for everyone—from blockchain veterans to newcomers. Our mission is to democratize access to decentralized finance and the metaverse through a seamless, user-centric interface.",
    fullContent: `
      ## What is ChainVerse?
      ChainVerse is more than just a platform; it's a digital nation built on the principles of sovereignty, transparency, and community. We've integrated the most powerful tools in Web3 to provide a seamless experience for trading, social interaction, and governance.

      ### Our Vision
      To be the primary gateway for the next billion users entering the decentralized era. We believe that blockchain technology should be invisible—powering everything but staying out of the way of the user experience.

      ### Key Features
      - **Unified Identity**: One account for the entire ecosystem.
      - **Cross-Chain Compatibility**: Trade assets across multiple networks with ease.
      - **AI-Powered Assistance**: Our Agent 'CAT' helps you navigate the complex world of Web3.
      - **Rewards for All**: Every interaction contributes to your reputation and rewards.
    `,
    tags: ["intro", "overview", "basics", "vision"],
    href: "/docs/intro"
  },
  {
    id: "account-creation",
    title: "Creating your Account",
    category: "Getting Started",
    description: "How to set up your ChainVerse identity.",
    content: "ChainVerse supports multiple onion-layered registration methods. You can sign up using traditional email, social logins (Google, Facebook), or modern Web3 methods like Passkeys and Biometrics.",
    fullContent: `
      ## Onboarding Methods
      We offer several ways to join ChainVerse, prioritized by security and convenience.

      ### 1. Social Login (Web2.5)
      Connect instantly using your Google or Facebook account. We use Thirdweb's embedded wallet technology to create a non-custodial wallet for you behind the scenes.

      ### 2. Biometric Passkeys
      The gold standard of security. Create an account that is tied to your device's biometric authentication (FaceID, TouchID). No passwords to remember, no seed phrases to lose.

      ### 3. Traditional Web3
      Connect your existing MetaMask, Phantom, or Coinbase Wallet. You retain full control over your keys.

      ### Verification (The Blue Tick)
      Once your account is created, you can apply for verification. This involves proving your identity to the community architects to gain access to premium features and increased trust.
    `,
    tags: ["account", "signup", "registration", "onboarding", "passkeys"],
    href: "/docs/account-creation",
    featureHref: "/register"
  },
  {
    id: "dex-trading",
    title: "DEX Node Matrix",
    category: "Core Infrastructure",
    description: "Understanding the Liquidity and Swap mechanisms.",
    content: "The DEX Node Matrix is our efficient liquidity layer. It allows instant swaps between assets with AI-optimized routing.",
    fullContent: `
      ## The Node Matrix
      Our Decentralized Exchange (DEX) is built for speed and efficiency. It uses a custom-tuned routing algorithm to find the best prices across multiple liquidity pools.

      ### Swap Mechanism
      - **Low Slippage**: Our deep liquidity pools ensure you get the price you see.
      - **AI Routing**: The 'CAT' agent constantly monitors network congestion to choose the cheapest gas route.
      - **Instant Settlement**: Trades are executed and settled on-chain in seconds.

      ### Liquidity Provision
      You can contribute to our pools and earn a percentage of all trade fees. This is a great way to earn passive income while supporting the ecosystem.

      ### Sepolia Payouts
      For developers and testers, we support Sepolia testnet assets. You can purchase these via Razorpay and they will be delivered within 48 hours.
    `,
    tags: ["dex", "swap", "trading", "liquidity", "yield", "sepolia"],
    href: "/docs/dex-trading",
    featureHref: "/user/trading"
  },
  {
    id: "tokenomics",
    title: "Tokenomics & $CV Utility",
    category: "Core Infrastructure",
    description: "The economic engine power the ChainVerse ecosystem.",
    content: "ChainVerse is powered by the $CV token. It is used for governance, staking rewards, and as the primary currency within our NFT marketplace.",
    fullContent: `
      ## $CV Tokenomics
      The $CV token is the lifeblood of our digital economy.

      ### Total Supply: 1,000,000,000 $CV
      - **Community Rewards**: 40% (Distributed over 10 years)
      - **Ecosystem Development**: 20%
      - **Core Architects**: 15% (2-year cliff, 4-year vesting)
      - **Treasury/DAO**: 15%
      - **Strategic Partners**: 10%

      ### Token Utility
      1. **Governance**: Vote on proposals and software updates.
      2. **Staking**: Lock your $CV tokens to earn a share of platform fees.
      3. **Platform Currency**: Purchase premium NFT collections and ChainCast tickets.
      4. **Reputation**: Holding $CV increases your status in the community social feed.
    `,
    tags: ["tokenomics", "cv", "utility", "staking", "governance"],
    href: "/docs/tokenomics"
  },
  {
    id: "privacy-policy",
    title: "Privacy Policy",
    category: "Policies",
    description: "How we protect and manage your data.",
    content: "At ChainVerse, we prioritize user sovereignty. Most of your data lives on the blockchain, owned by you.",
    fullContent: `
      ## Privacy First
      In the Web3 era, you are not the product; you are the owner.

      ### Data Ownership
      - **On-Chain Data**: Your transactions, NFT holdings, and smart contract interactions are stored on the public blockchain. We do not control this data.
      - **Off-Chain Data**: We use Convex DB to store meta-information such as your social profile bio, notification preferences, and community messages. This data is encrypted.

      ### What We Collect
      We do not collect PII (Personally Identifiable Information) unless you voluntarily provide it during the verification process. We do not use cookies for tracking—only for session management.

      ### No Third-Party Selling
      We never sell your data to advertisers or third parties. Our business model is based on platform fees, not data monetization.
    `,
    tags: ["privacy", "legal", "data", "sovereignty"],
    href: "/docs/privacy"
  },
  {
    id: "terms-of-service",
    title: "Terms of Service",
    category: "Policies",
    description: "The rules and agreements for using ChainVerse.",
    content: "By using ChainVerse, you agree to our terms regarding decentralized interactions.",
    fullContent: `
      ## Terms of Interaction
      By accessing the ChainVerse platform, you agree to the following:

      ### 1. Self-Custody
      You are solely responsible for the security of your private keys and biometric passkeys. ChainVerse cannot recover your account if you lose access.

      ### 2. Irreversibility
      Blockchain transactions are immutable. Once you confirm a swap or a transfer, it cannot be reversed.

      ### 3. Community Conduct
      We maintain a high standard of respect in our community social feeds. Malicious behavior, spam, or harassment will result in your account being flagged or restricted by the DAO.

      ### 4. Risks
      Web3 technologies involve inherent risks. While we prioritize security, smart contracts can have vulnerabilities. Use the platform at your own discretion.
    `,
    tags: ["terms", "legal", "rules", "conduct"],
    href: "/docs/terms"
  },
  {
    id: "security-standards",
    title: "Security & Audits",
    category: "Policies",
    description: "Our commitment to a safe Web3 environment.",
    content: "We implement multi-layered security including audit-verified smart contracts and Biometric Passkeys.",
    fullContent: `
      ## Security Architecture
      Safety is not a feature; it's our foundation.

      ### Smart Contract Audits
      All our core contracts—including the DEX, Bridge, and NFT Forge—undergo rigorous audits by top-tier security firms before deployment.

      ### Wallet Guardian
      Our system monitors for suspicious patterns. If a login attempt occurs from a new location, we may require an additional biometric check or a 'signed message' from your wallet.

      ### Whale Alerts
      To protect users from market manipulation, we provide real-time tracking of large movements. If a 'whale' moves significant assets, our community is notified instantly.

      ### Responsible Disclosure
      We maintain a bug bounty program. If you find a security vulnerability, please report it to our security team for a reward in $CV tokens.
    `,
    tags: ["security", "audit", "whale alert", "protection"],
    href: "/docs/security"
  },
  {
    id: "community-guidelines",
    title: "Community Guidelines",
    category: "Governance & Community",
    description: "Maintaining a healthy and productive ecosystem.",
    content: "The rules that keep the ChainVerse community vibrant and safe.",
    fullContent: `
      ## Community Core Values
      ChainVerse is a space for innovation and collaboration.

      ### 1. Be Constructive
      Critique ideas, not people. We value diverse perspectives and healthy debate.

      ### 2. No Financial Advice
      Never give or ask for financial advice. Users should always do their own research (DYOR).

      ### 3. Content Standards
      - No illegal or prohibited content.
      - No NSFW content in public feeds.
      - No excessive self-promotion or spam.

      ### 4. Governance Participation
      Active members are encouraged to participate in DAO discussions. Your voice matters, especially if you hold verification status.
    `,
    tags: ["community", "rules", "guidelines", "governance"],
    href: "/docs/community-guidelines"
  },
  {
    id: "nft-forge",
    title: "The NFT Forge",
    category: "Core Infrastructure",
    description: "Minting and trading digital assets with absolute ownership.",
    content: "The NFT market specialized for the ChainVerse ecosystem.",
    fullContent: `
      ## Digital Asset Persistence
      The NFT Forge allows creators to mint unique digital assets that are stored permanently on the blockchain.

      ### IPFS Storage
      We use InterPlanetary File System (IPFS) to ensure your NFT's metadata and media are decentralized and immutable. Unlike traditional servers, IPFS ensures your assets never 'disappear'.

      ### Solidity Standard
      Our NFTs follow the ERC-721 and ERC-1155 standards, ensuring compatibility with other major marketplaces while maintaining specialized utility within the ChainVerse metaverse.

      ### Royalties
      Creators receive automatic royalties on every secondary sale, powered by smart contracts. This ensures that artists are rewarded for their work's growing value.
    `,
    tags: ["nft", "minting", "market", "ipfs"],
    href: "/docs/nft-forge",
    featureHref: "/user/nft"
  }
];
