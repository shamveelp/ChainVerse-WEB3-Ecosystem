import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        template: '%s | ChainVerse Docs',
        default: 'Documentation | ChainVerse Ecosystem',
    },
    description: "Deep dive into the architecture, tokenomics, and security protocols of the ChainVerse Web3 ecosystem.",
    keywords: ["Web3", "Blockchain", "DEX", "NFT", "Documentation", "Tokenomics", "Security"],
    openGraph: {
        title: 'ChainVerse Documentation',
        description: 'Master the unified Web3 ecosystem.',
        url: 'https://chainverse.dex',
        siteName: 'ChainVerse',
        images: [
            {
                url: '/docs-og.png',
                width: 1200,
                height: 630,
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
};

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {children}
        </>
    );
}
