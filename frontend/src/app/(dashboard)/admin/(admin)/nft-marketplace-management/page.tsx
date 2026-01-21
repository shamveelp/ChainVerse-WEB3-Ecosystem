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
    Loader2,
    TrendingUp,
    Layers,
    Zap,
    Plus,
    ArrowRight,
    Calendar,
    MoreHorizontal,
    LayoutGrid,
    List,
    DollarSign,
    Eye,
    EyeOff
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
import { ethers } from 'ethers';
import Link from 'next/link'; // Added Link import
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";

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
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = viewMode === 'grid' ? 12 : 10;

    const { getAllNFTs, getMarketplaceStats, enrichNFTsWithMetadata } = useNFTContract();

    // Convex Integration
    const hiddenTokenIds = useQuery(api.nft.getHiddenTokenIds, { contract: NFT_MARKETPLACE_ADDRESS });
    const setVisibility = useMutation(api.nft.setVisibility);

    const isHidden = (id: string) => hiddenTokenIds?.includes(id) ?? false;

    const toggleVisibility = async (e: React.MouseEvent, tokenId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const currentlyHidden = isHidden(tokenId);
        try {
            await setVisibility({
                chainId: 11155111,
                contract: NFT_MARKETPLACE_ADDRESS,
                tokenId: tokenId,
                hidden: !currentlyHidden
            });
            toast.success(`NFT ${!currentlyHidden ? 'Hidden' : 'Visible'}`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update visibility");
        }
    };

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
    }, [filteredNFTs, currentPage, itemsPerPage]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, sortBy, viewMode]);

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
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                        className="h-12 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center gap-2 px-6"
                    >
                        {viewMode === 'grid' ? (
                            <><List className="h-5 w-5" /> List View</>
                        ) : (
                            <><LayoutGrid className="h-5 w-5" /> Grid View</>
                        )}
                    </Button>

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

            {/* Management Content */}
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

                    <CardContent className="p-8">
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-32 space-y-4"
                                >
                                    <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                                    <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Synchronizing with Ethereum...</p>
                                </motion.div>
                            ) : filteredNFTs.length === 0 ? (
                                <motion.div
                                    key="no-results"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center gap-4 py-20 text-center"
                                >
                                    <div className="h-20 w-20 rounded-full bg-slate-800/30 flex items-center justify-center mb-2">
                                        <Search className="h-10 w-10 text-slate-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-200">No assets matching criteria</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto">
                                        Try changing your filters or searching for a different ID.
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
                            ) : viewMode === 'grid' ? (
                                <motion.div
                                    key="grid-view"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                                >
                                    {paginatedNFTs.map((token, index) => (
                                        <motion.div
                                            key={token.tokenId.toString()}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: index * 0.05 }}
                                        >
                                            <Link href={`/admin/nft-marketplace-management/${token.tokenId}`}>
                                                <div className="group relative bg-[#1A1D29] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-blue-500/50 hover:shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)] transition-all duration-500 cursor-pointer">
                                                    {/* Image Container */}
                                                    <div className="relative aspect-square overflow-hidden">
                                                        {token.imageUrl ? (
                                                            <img
                                                                src={token.imageUrl}
                                                                alt={token.metadata?.name || 'NFT'}
                                                                className="object-cover w-full h-full absolute inset-0 transition-transform duration-700 group-hover:scale-110"
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center bg-slate-900/50">
                                                                <ImageIcon className="h-12 w-12 text-slate-700" />
                                                            </div>
                                                        )}

                                                        {/* Status Overlay */}
                                                        <div className="absolute top-4 left-4 flex gap-2">
                                                            <Badge className={`${token.currentlyListed ? 'bg-blue-500' : 'bg-slate-700'} border-none px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase`}>
                                                                {token.currentlyListed ? 'Market Listed' : 'Vaulted'}
                                                            </Badge>
                                                            {isHidden(token.tokenId.toString()) && (
                                                                <Badge className="bg-red-500 border-none px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase">
                                                                    Hidden
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {/* ID Overlay */}
                                                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
                                                            <span className="text-xs font-mono text-white/80">TOKEN #{token.tokenId.toString()}</span>
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="p-6 space-y-4">
                                                        <div className="space-y-1">
                                                            <h3 className="text-xl font-black text-white truncate group-hover:text-blue-400 transition-colors">
                                                                {token.metadata?.name || `Asset #${token.tokenId}`}
                                                            </h3>
                                                            <p className="text-sm text-slate-500 truncate font-medium">
                                                                Owner: {token.owner.slice(0, 6)}...{token.owner.slice(-4)}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Inventory Price</span>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <span className="text-2xl font-black text-white">{token.formattedPrice}</span>
                                                                    <span className="text-xs font-bold text-slate-600">ETH</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isHidden(token.tokenId.toString()) ? 'bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white' : 'bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white'}`}
                                                                    onClick={(e) => toggleVisibility(e, token.tokenId.toString())}
                                                                >
                                                                    {isHidden(token.tokenId.toString()) ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                                                                </Button>
                                                                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 transition-all duration-500">
                                                                    <Eye className="h-6 w-6 text-blue-400 group-hover:text-white" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="table-view"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="overflow-hidden rounded-[2rem] border border-white/5 bg-white-[0.01]"
                                >
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Asset Identity</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Market Price</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Escrow Address</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {paginatedNFTs.map((token, index) => (
                                                <motion.tr
                                                    key={token.tokenId.toString()}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="group hover:bg-white/[0.03] transition-all"
                                                >
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-5">
                                                            <div className="relative h-14 w-14 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                                                                {token.imageUrl ? (
                                                                    <img src={token.imageUrl} alt="NFT" className="object-cover w-full h-full absolute inset-0" />
                                                                ) : (
                                                                    <div className="h-full w-full bg-slate-800 flex items-center justify-center">
                                                                        <ImageIcon className="h-6 w-6 text-slate-600" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="text-lg font-black text-white">{token.metadata?.name || `Token #${token.tokenId}`}</div>
                                                                <div className="text-xs text-slate-500 font-mono">ID: {token.tokenId.toString()}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex gap-2">
                                                            <Badge className={`${token.currentlyListed ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-800 text-slate-400 border-white/5'} px-4 py-1.5 rounded-full border shadow-sm`}>
                                                                {token.currentlyListed ? 'Active' : 'Private'}
                                                            </Badge>
                                                            {isHidden(token.tokenId.toString()) && (
                                                                <Badge className="bg-red-500/10 text-red-400 border-red-500/20 px-4 py-1.5 rounded-full border shadow-sm">
                                                                    Hidden
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-xl font-black text-white">
                                                        {token.formattedPrice} <span className="text-xs text-slate-500 font-bold uppercase ml-1">ETH</span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <code className="text-xs text-slate-500 font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                                            {token.owner.slice(0, 12)}...{token.owner.slice(-8)}
                                                        </code>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <Link href={`/admin/nft-marketplace-management/${token.tokenId}`}>
                                                            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl hover:bg-blue-500 hover:text-white transition-all">
                                                                <Eye className="h-5 w-5" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className={`h-10 w-10 rounded-xl transition-all ml-2 ${isHidden(token.tokenId.toString()) ? 'hover:bg-red-500 text-red-500 hover:text-white' : 'hover:bg-green-500 text-green-500 hover:text-white'}`}
                                                            onClick={(e) => toggleVisibility(e, token.tokenId.toString())}
                                                        >
                                                            {isHidden(token.tokenId.toString()) ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                        </Button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Pagination Section */}
                        {!loading && filteredNFTs.length > 0 && (
                            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                    Displaying <span className="text-white">{paginatedNFTs.length}</span> of <span className="text-white">{filteredNFTs.length}</span> Assets
                                </p>

                                {totalPages > 1 && (
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-12 w-12 bg-white/5 border-white/10 text-white rounded-2xl flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-6 w-6" />
                                        </Button>
                                        <div className="h-12 px-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2 font-black">
                                            <span className="text-blue-400">{currentPage}</span>
                                            <span className="text-slate-600">/</span>
                                            <span className="text-slate-400">{totalPages}</span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-12 w-12 bg-white/5 border-white/10 text-white rounded-2xl flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronRight className="h-6 w-6" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div >
    );
}
