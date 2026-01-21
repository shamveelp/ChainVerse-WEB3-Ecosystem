'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
    ArrowLeft,
    Share2,
    ExternalLink,
    User,
    Calendar,
    Tag,
    TrendingUp,
    DollarSign,
    Eye,
    AlertCircle,
    Copy,
    Zap,
    Clock,
    Shield,
    History,
    Info,
    ChevronDown,
    LayoutGrid,
    FileText,
    Activity,
    Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNFTContract } from '@/hooks/nft/useNFTContract';
import { NFTWithMetadata } from '@/types/types-nft';
import { LoadingSpinner } from '@/components/nft/loading-skeleton';
import { toast } from 'sonner';
import { ethers } from 'ethers';

const NFT_MARKETPLACE_ADDRESS = "0xe349f285223EfB570997f7D40632860714E29054";

export default function AdminNFTDetailPage() {
    const params = useParams();
    const router = useRouter();
    const tokenId = params.id as string;

    const [nft, setNft] = useState<NFTWithMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const {
        getListedTokenForId,
        fetchNFTMetadata,
    } = useNFTContract();

    useEffect(() => {
        if (tokenId) {
            loadNFTDetails();
        }
    }, [tokenId]);

    const loadNFTDetails = async () => {
        try {
            setLoading(true);
            const tokenIdBigInt = BigInt(tokenId);
            const listedToken = await getListedTokenForId(tokenIdBigInt);

            if (!listedToken || Number(listedToken.tokenId) === 0) {
                throw new Error('NFT not found');
            }

            const metadata = await fetchNFTMetadata(tokenIdBigInt);
            const enrichedNFT: NFTWithMetadata = {
                ...listedToken,
                metadata: metadata ?? null,
                imageUrl: metadata?.image || metadata?.img_url,
                formattedPrice: ethers.formatEther(listedToken.price),
            };

            setNft(enrichedNFT);
        } catch (error) {
            console.error('Error loading details:', error);
            toast.error('Sync failed');
        } finally {
            setLoading(false);
        }
    };

    const copyAddress = (address: string) => {
        navigator.clipboard.writeText(address);
        toast.success('Address copied');
    };

    const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

    const formatDate = (timestamp: bigint) => {
        if (!timestamp || Number(timestamp) === 0) return 'Undated';
        const date = new Date(Number(timestamp) * 1000);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!nft) {
        return (
            <div className="px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <AlertCircle className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
                    <h1 className="text-2xl font-bold mb-4">NFT Not Found</h1>
                    <p className="text-muted-foreground mb-8">
                        The NFT ID #{tokenId} returned a null pointer from the primary registry.
                    </p>
                    <Button onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="px-4 py-8 sm:px-6 lg:px-8 bg-background text-foreground">
                <div className="mx-auto max-w-7xl">
                    {/* Back Button */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-8"
                    >
                        <Button variant="ghost" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Inventory
                        </Button>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* NFT Image Section */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="overflow-hidden bg-gradient-to-br from-background/95 to-muted/20 border-border">
                                <div className="aspect-square relative flex items-center justify-center bg-muted/10">
                                    {!imageError && nft.imageUrl ? (
                                        <Image
                                            src={nft.imageUrl}
                                            alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                                            fill
                                            className="object-cover"
                                            onError={() => setImageError(true)}
                                            unoptimized
                                            priority
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                                            <div className="text-center">
                                                <AlertCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                                                <div className="text-2xl font-bold text-muted-foreground">
                                                    NFT #{nft.tokenId.toString()}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Status Badges Overlay */}
                                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                                        {nft.currentlyListed ? (
                                            <Badge className="bg-green-500/90 hover:bg-green-500 text-white border-none">
                                                <Zap className="h-3 w-3 mr-1" />
                                                Listed
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/30 backdrop-blur-md">
                                                <Shield className="h-3 w-3 mr-1" />
                                                Vaulted
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="bg-primary/10 border-primary/30 backdrop-blur-md text-primary">
                                            Admin Scan Active
                                        </Badge>
                                    </div>
                                </div>
                            </Card>

                            {/* Technical Context Summary (Admin Specific) */}
                            <div className="mt-8">
                                <Card className="p-6 border-border shadow-sm">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                                        <Info className="h-4 w-4" /> Technical Parameters
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium">Registry Hub</span>
                                            <button onClick={() => copyAddress(NFT_MARKETPLACE_ADDRESS)} className="text-primary hover:underline font-mono flex items-center gap-1.5 transition-colors">
                                                {formatAddress(NFT_MARKETPLACE_ADDRESS)} <Copy className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <Separator className="bg-border/50" />
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium">Blockchain Node</span>
                                            <span className="font-bold">Sepolia Ethereum</span>
                                        </div>
                                        <Separator className="bg-border/50" />
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium">Standard</span>
                                            <Badge variant="outline" className="text-[10px] font-bold">ERC-721</Badge>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </motion.div>

                        {/* NFT Details Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="space-y-6"
                        >
                            {/* Title and Basic Info */}
                            <div>
                                <h1 className="text-4xl font-black mb-4 tracking-tight">
                                    {nft.metadata?.name || `NFT #${nft.tokenId}`}
                                </h1>
                                <div className="flex items-center gap-4 text-muted-foreground mb-4">
                                    <span className="flex items-center gap-1.5 text-sm font-medium">
                                        <Eye className="h-4 w-4" />
                                        Token ID: #{nft.tokenId.toString()}
                                    </span>
                                    {nft.createdAt && Number(nft.createdAt) > 0 && (
                                        <span className="flex items-center gap-1.5 text-sm font-medium">
                                            <Clock className="h-4 w-4" />
                                            {formatDate(nft.createdAt)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Valuation Card */}
                            <Card className="p-8 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border-primary/10">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" /> Current Valuation
                                            </h3>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl font-black text-foreground">{nft.formattedPrice}</span>
                                                <span className="text-2xl font-bold text-muted-foreground">ETH</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Global Est.</p>
                                            <p className="text-xl font-bold text-foreground">
                                                ${(parseFloat(nft.formattedPrice) * 2245).toLocaleString()}
                                                <span className="text-xs text-muted-foreground ml-1">USD</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button className="flex-1 h-14 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                                            Sync Chain State
                                        </Button>
                                        <a href={`https://sepolia.etherscan.io/token/${NFT_MARKETPLACE_ADDRESS}?a=${nft.tokenId}`} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" className="h-14 w-14 rounded-2xl border-border hover:bg-muted transition-all">
                                                <ExternalLink className="h-5 w-5" />
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            </Card>

                            {/* Description */}
                            <Card className="p-6 border-border shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    <h3 className="font-bold">Narrative Metadata</h3>
                                </div>
                                <p className="text-muted-foreground leading-relaxed text-sm">
                                    {nft.metadata?.description || "This asset operates without a designated descriptive register on the primary ledger."}
                                </p>
                            </Card>

                            {/* Ownership Card */}
                            <Card className="p-6 border-border shadow-sm">
                                <h3 className="font-bold mb-6 flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" /> Ownership Verification
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Originator Node</span>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="secondary" size="sm" className="font-mono text-[11px] bg-muted/50 hover:bg-muted" onClick={() => copyAddress(nft.creator || '')}>
                                                    {formatAddress(nft.creator || nft.owner)} <Copy className="h-3 w-3 ml-1.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Copy creator address</TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <Separator className="bg-border/50" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Current Custodian</span>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="secondary" size="sm" className="font-mono text-[11px] bg-muted/50 hover:bg-muted" onClick={() => copyAddress(nft.owner)}>
                                                    {formatAddress(nft.owner)} <Copy className="h-3 w-3 ml-1.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Copy owner address</TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            </Card>

                            {/* Attributes Grid */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                    <LayoutGrid className="h-4 w-4" /> Genetic Parameters
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {nft.metadata?.attributes?.map((attr, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all group text-center">
                                            <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{attr.trait_type}</div>
                                            <div className="text-sm font-bold text-foreground truncate">{attr.value}</div>
                                        </div>
                                    )) || (
                                            <div className="col-span-full py-8 text-center text-muted-foreground font-medium border-2 border-dashed border-border rounded-2xl">
                                                Null Attributes
                                            </div>
                                        )}
                                </div>
                            </div>

                            {/* Blockchain Provenance Ledger */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Activity className="h-4 w-4" /> Asset Ledger
                                </h3>
                                <Card className="border-border shadow-sm overflow-hidden">
                                    <div className="divide-y divide-border/50">
                                        <div className="p-4 flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground border border-border">
                                                    <History className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">Mint Entry</p>
                                                    <p className="text-muted-foreground text-xs">{formatAddress(nft.creator || nft.owner)}</p>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-widest px-2 py-0.5">Verified</Badge>
                                        </div>
                                        {nft.currentlyListed && (
                                            <div className="p-4 flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                                        <Tag className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground">Market List</p>
                                                        <p className="text-muted-foreground text-xs">{nft.formattedPrice} ETH indexed</p>
                                                    </div>
                                                </div>
                                                <Badge className="bg-primary/20 text-primary border-none font-bold text-[10px] uppercase tracking-widest px-2 py-0.5">Active</Badge>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>

                            {/* External Relay Hub */}
                            <Card className="p-6 border-border shadow-sm">
                                <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">Relay Hub</h3>
                                <div className="flex gap-4">
                                    <Button variant="outline" size="sm" className="rounded-xl font-bold h-11 px-6 border-border hover:bg-muted" asChild>
                                        <a href={`https://sepolia.etherscan.io/token/${NFT_MARKETPLACE_ADDRESS}?a=${nft.tokenId}`} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" /> Etherscan
                                        </a>
                                    </Button>
                                    <Button variant="outline" size="sm" className="rounded-xl font-bold h-11 px-6 border-border hover:bg-muted" asChild>
                                        <a href={`https://testnets.opensea.io/assets/sepolia/${NFT_MARKETPLACE_ADDRESS}/${nft.tokenId}`} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" /> OpenSea
                                        </a>
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
