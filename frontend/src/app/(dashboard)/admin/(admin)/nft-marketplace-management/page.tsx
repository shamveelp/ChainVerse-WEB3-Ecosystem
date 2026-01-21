'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    ExternalLink,
    RefreshCw,
    BarChart3,
    Rocket,
    History,
    Image as ImageIcon,
    MoreVertical,
    CheckCircle2,
    Tag,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNFTContract } from '@/hooks/nft/useNFTContract';
import { ListedToken, NFTMetadata, MarketplaceStats, NFTWithMetadata } from '@/types/types-nft';
import { NFT_MARKETPLACE_ADDRESS } from '@/lib/nft/contracts';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { ethers } from 'ethers';

// Helper component for Stat Card
const StatCard = ({ title, value, subtitle, icon: Icon, gradient }: {
    title: string,
    value: string | number,
    subtitle: string,
    icon: any,
    gradient: string
}) => (
    <Card className={`bg-gradient-to-br ${gradient} backdrop-blur-md border-white/10 overflow-hidden relative group`}>
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Icon className="h-20 w-20 text-white" />
        </div>
        <CardHeader className="pb-2">
            <CardTitle className="text-white/70 text-sm font-medium flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
            <p className="text-white/50 text-xs mt-1">{subtitle}</p>
        </CardContent>
    </Card>
);

export default function NFTMarketplaceManagement() {
    // State
    const [enrichedNFTs, setEnrichedNFTs] = useState<NFTWithMetadata[]>([]);
    const [stats, setStats] = useState<MarketplaceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Search and Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const { getAllNFTs, getMarketplaceStats, enrichNFTsWithMetadata } = useNFTContract();

    // 1. Initial Fetch of Data
    const loadNFTs = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            console.log("AdminNFT: Starting data load...");

            // Fetch Stats and NFTs
            const [allNFTs, s] = await Promise.all([
                getAllNFTs(),
                getMarketplaceStats().catch(() => null)
            ]);

            if (s) {
                console.log("AdminNFT: Stats loaded", s);
                setStats(s);
            }

            console.log(`AdminNFT: Fetched ${allNFTs?.length || 0} raw tokens`);

            if (allNFTs && allNFTs.length > 0) {
                const enriched = await enrichNFTsWithMetadata(allNFTs);
                console.log(`AdminNFT: Enriched ${enriched.length} tokens`);
                setEnrichedNFTs(enriched);
            } else {
                setEnrichedNFTs([]);
            }
        } catch (error) {
            console.error('Error fetching admin NFT data:', error);
            toast.error('Failed to load marketplace data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getAllNFTs, getMarketplaceStats, enrichNFTsWithMetadata]);

    useEffect(() => {
        loadNFTs();
    }, [loadNFTs]);

    // 2. Filter logic
    const filteredNFTs = useMemo(() => {
        let filtered = [...enrichedNFTs];

        if (statusFilter !== 'all') {
            if (statusFilter === 'listed') filtered = filtered.filter(nft => nft.currentlyListed);
            else if (statusFilter === 'unlisted') filtered = filtered.filter(nft => !nft.currentlyListed);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(nft =>
                nft.tokenId.toString().includes(term) ||
                nft.seller.toLowerCase().includes(term) ||
                nft.owner.toLowerCase().includes(term) ||
                (nft.metadata?.name && nft.metadata.name.toLowerCase().includes(term))
            );
        }

        switch (sortBy) {
            case 'price-low':
                filtered.sort((a, b) => Number(a.price) - Number(b.price));
                break;
            case 'price-high':
                filtered.sort((a, b) => Number(b.price) - Number(a.price));
                break;
            case 'id-asc':
                filtered.sort((a, b) => Number(a.tokenId) - Number(b.tokenId));
                break;
            case 'id-desc':
            case 'recent':
            default:
                filtered.sort((a, b) => Number(b.tokenId) - Number(a.tokenId));
                break;
        }

        return filtered;
    }, [enrichedNFTs, searchTerm, statusFilter, sortBy]);

    // 3. Pagination Logic
    const totalPages = Math.ceil(filteredNFTs.length / itemsPerPage);
    const paginatedNFTs = useMemo(() => {
        return filteredNFTs.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
    }, [filteredNFTs, currentPage]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, sortBy]);

    const handleRefresh = () => {
        loadNFTs(true);
        toast.success('Marketplace data synchronized with blockchain');
    };

    const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    if (loading) {
        return (
            <div className="p-6 space-y-8 min-h-screen">
                <div className="flex justify-between items-center mb-6">
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-64 bg-slate-800" />
                        <Skeleton className="h-6 w-96 bg-slate-800/50" />
                    </div>
                    <Skeleton className="h-12 w-32 bg-slate-800 rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 bg-slate-800/40 rounded-[2rem]" />)}
                </div>
                <Card className="bg-slate-900/40 border-white/5 rounded-[2rem] overflow-hidden">
                    <div className="p-8 border-b border-white/5">
                        <Skeleton className="h-10 w-48 bg-slate-800" />
                    </div>
                    <div className="p-8 space-y-6">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full bg-slate-800/20 rounded-2xl" />)}
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-10 min-h-screen pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-5xl font-black bg-gradient-to-br from-white via-slate-300 to-slate-600 bg-clip-text text-transparent tracking-tighter">
                        Marketplace Management
                    </h1>
                    <p className="text-slate-400 mt-3 flex items-center gap-2 text-lg font-light">
                        <BarChart3 className="h-5 w-5 text-blue-400" />
                        On-chain asset oversight with optimized data fetching
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-4"
                >
                    <Button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        variant="outline"
                        className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-2xl h-12 px-6 gap-3 transition-all active:scale-95"
                    >
                        <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Syncing...' : 'Sync Blockchain'}
                    </Button>
                </motion.div>
            </div>

            {/* Stats Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                <StatCard
                    title="Total Minted"
                    value={stats?.totalTokens ?? 0}
                    subtitle="Lifetime assets on-chain"
                    icon={Rocket}
                    gradient="from-blue-500/10 to-indigo-500/10"
                />
                <StatCard
                    title="Market Listing"
                    value={stats?.currentListings ?? 0}
                    subtitle="NFTs available for purchase"
                    icon={Tag}
                    gradient="from-purple-500/10 to-pink-500/10"
                />
                <StatCard
                    title="Successful Trades"
                    value={stats?.totalSold ?? 0}
                    subtitle="Confirmed owner handovers"
                    icon={CheckCircle2}
                    gradient="from-emerald-500/10 to-teal-500/10"
                />
            </motion.div>

            {/* Management Table Content */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
            >
                <Card className="bg-slate-900/40 backdrop-blur-3xl border-white/5 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden rounded-[2rem]">
                    <CardHeader className="border-b border-white/5 bg-white/5 p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                            <CardTitle className="text-2xl font-black text-white flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                                    <History className="h-6 w-6 text-blue-400" />
                                </div>
                                Token Inventory
                            </CardTitle>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative w-full sm:w-96">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <Input
                                        placeholder="Search ID or wallet address..."
                                        className="pl-12 h-14 bg-black/40 border-white/10 text-white placeholder:text-slate-500 focus:ring-blue-500/50 rounded-2xl text-lg"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-full sm:w-48 h-14 bg-black/40 border-white/10 text-white rounded-2xl text-lg">
                                            <div className="flex items-center gap-2">
                                                <Filter className="h-4 w-4 text-slate-400" />
                                                <SelectValue placeholder="All Assets" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                                            <SelectItem value="all">All Items</SelectItem>
                                            <SelectItem value="listed">Currently Listed</SelectItem>
                                            <SelectItem value="unlisted">Not Listed</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="w-full sm:w-52 h-14 bg-black/40 border-white/10 text-white rounded-2xl text-lg">
                                            <SelectValue placeholder="Sort By" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                                            <SelectItem value="recent">Most Recent</SelectItem>
                                            <SelectItem value="price-low">Price: Low to High</SelectItem>
                                            <SelectItem value="price-high">Price: High to Low</SelectItem>
                                            <SelectItem value="id-asc">ID: Ascending</SelectItem>
                                            <SelectItem value="id-desc">ID: Descending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-white/[0.02] border-b border-white/5">
                                        <th className="px-8 py-5 text-sm font-bold uppercase tracking-widest text-slate-500">Asset Identity</th>
                                        <th className="px-8 py-5 text-sm font-bold uppercase tracking-widest text-slate-500">Valuation</th>
                                        <th className="px-8 py-5 text-sm font-bold uppercase tracking-widest text-slate-500">Chain Context</th>
                                        <th className="px-8 py-5 text-sm font-bold uppercase tracking-widest text-slate-500">Status</th>
                                        <th className="px-8 py-5 text-sm font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <AnimatePresence mode="popLayout">
                                        {filteredNFTs.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-32 text-center">
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="flex flex-col items-center gap-4"
                                                    >
                                                        <div className="h-20 w-20 rounded-full bg-slate-800/30 flex items-center justify-center mb-2">
                                                            <Search className="h-10 w-10 text-slate-600" />
                                                        </div>
                                                        <h3 className="text-2xl font-bold text-slate-200">No assets matching criteria</h3>
                                                        <p className="text-slate-500 max-w-sm mx-auto">
                                                            We couldn't find any NFTs that match your current search or filter settings. Try resetting your filters.
                                                        </p>
                                                        <Button
                                                            variant="link"
                                                            className="text-blue-400 hover:text-blue-300 h-auto p-0 text-lg"
                                                            onClick={() => {
                                                                setSearchTerm('');
                                                                setStatusFilter('all');
                                                                setSortBy('recent');
                                                            }}
                                                        >
                                                            Clear all filters
                                                        </Button>
                                                    </motion.div>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedNFTs.map((token, index) => {
                                                return (
                                                    <motion.tr
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                                        key={token.tokenId.toString()}
                                                        className="hover:bg-white/[0.03] transition-all group"
                                                    >
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-6">
                                                                <div className="relative h-16 w-16 flex-shrink-0 rounded-2xl overflow-hidden border-2 border-white/5 bg-slate-800 shadow-xl group-hover:border-blue-500/30 transition-colors">
                                                                    {token.imageUrl ? (
                                                                        <Image
                                                                            src={token.imageUrl}
                                                                            alt={token.metadata?.name || 'NFT'}
                                                                            fill
                                                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                                        />
                                                                    ) : (
                                                                        <div className="h-full w-full flex items-center justify-center">
                                                                            <ImageIcon className="h-8 w-8 text-slate-600" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <div className="text-xl font-black text-white flex items-center gap-3">
                                                                        {token.metadata?.name || `Token #${token.tokenId}`}
                                                                        <span className="text-sm font-medium text-slate-500 px-2 py-1 bg-slate-800 rounded-lg group-hover:bg-blue-500/20 transition-colors">#{token.tokenId.toString()}</span>
                                                                    </div>
                                                                    <div className="text-sm text-slate-400 font-light line-clamp-1 max-w-[320px]">
                                                                        {token.metadata?.description || 'No descriptive metadata captured'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col">
                                                                <div className="text-2xl font-black text-blue-400 font-mono tracking-tighter">
                                                                    {token.formattedPrice} <span className="text-lg font-bold">ETH</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    <span className="h-2 w-2 rounded-full bg-blue-500/50" />
                                                                    <span className="text-[11px] text-slate-500 uppercase font-black tracking-widest">
                                                                        Market Valuation
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="px-2 py-1 bg-slate-800/40 rounded-lg text-[10px] uppercase font-black text-slate-500 min-w-[70px] text-center">Owner</div>
                                                                    <code className="text-slate-300 font-mono text-sm tracking-tighter hover:text-blue-400 cursor-pointer transition-colors">
                                                                        {formatAddress(token.owner)}
                                                                    </code>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="px-2 py-1 bg-slate-800/40 rounded-lg text-[10px] uppercase font-black text-slate-500 min-w-[70px] text-center">Seller</div>
                                                                    <code className="text-slate-300 font-mono text-sm tracking-tighter hover:text-purple-400 cursor-pointer transition-colors">
                                                                        {formatAddress(token.seller)}
                                                                    </code>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col gap-2">
                                                                {token.currentlyListed ? (
                                                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit">
                                                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                                        <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Listed</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/40 border border-white/5 rounded-full w-fit">
                                                                        <div className="h-2 w-2 rounded-full bg-slate-600" />
                                                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Inactive</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <a
                                                                    href={`https://sepolia.etherscan.io/token/${NFT_MARKETPLACE_ADDRESS}?a=${token.tokenId.toString()}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    title="View on Etherscan"
                                                                >
                                                                    <Button size="icon" variant="ghost" className="h-12 w-12 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                                                                        <ExternalLink className="h-6 w-6" />
                                                                    </Button>
                                                                </a>
                                                                <Button size="icon" variant="ghost" className="h-12 w-12 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10">
                                                                    <MoreVertical className="h-6 w-6" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="px-10 py-8 bg-black/20 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex flex-col sm:flex-row items-center gap-6 text-sm font-bold text-slate-500 uppercase tracking-widest">
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-200">{filteredNFTs.length}</span> Assets Tracked
                                </div>
                                <div className="hidden sm:block h-6 w-px bg-white/10" />
                                <div className="flex items-center gap-3 text-emerald-400/80">
                                    <span className="h-2 w-2 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                                    Live Network Feed
                                </div>
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-12 w-12 bg-white/5 border-white/10 text-white rounded-xl disabled:opacity-20 transition-all active:scale-90"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </Button>
                                    <div className="flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-lg font-black text-white min-w-[120px] justify-center">
                                        <span className="text-blue-400">{currentPage}</span>
                                        <span className="text-slate-600">/</span>
                                        <span className="text-slate-400">{totalPages}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-12 w-12 bg-white/5 border-white/10 text-white rounded-xl disabled:opacity-20 transition-all active:scale-90"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="h-6 w-6" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
