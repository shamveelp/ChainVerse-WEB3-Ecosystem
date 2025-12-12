"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
    MoreHorizontal,
    Search,
    ShieldCheck,
    ShieldAlert,
    Trash2,
    ExternalLink,
    Filter,
    Users,
    Eye,
    CheckCircle2,
    XCircle,
    Loader2,
    Globe,
    Mail
} from "lucide-react";
import {
    getAllCommunities,
    getCommunityById,
    updateCommunityStatus,
    updateVerificationStatus,
    deleteCommunity
} from "@/services/adminCommunityManagementApiService";
import { format } from "date-fns";

interface Community {
    _id: string;
    communityName: string;
    email: string;
    username: string;
    logo: string;
    banner: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    isVerified: boolean;
    createdAt: string;
    communityAdmins: any[];
    category: string;
    walletAddress: string;
}

export default function AdminCommunityManagementPage() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [verifiedFilter, setVerifiedFilter] = useState("all");

    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const router = useRouter();


    const fetchCommunities = async () => {
        setLoading(true);
        try {
            const response = await getAllCommunities(page, limit, search, statusFilter, verifiedFilter);
            if (response.success) {
                setCommunities(response.data);
                setTotal(response.total);
            } else {
                toast.error(response.error || "Failed to fetch communities");
            }
        } catch (error) {
            toast.error("An error occurred while fetching communities");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCommunities();
        }, 500); // Debounce search
        return () => clearTimeout(timer);
    }, [page, limit, search, statusFilter, verifiedFilter]);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const response = await updateCommunityStatus(id, newStatus);
            if (response.success) {
                toast.success(`Community status updated to ${newStatus}`);
                fetchCommunities();
                if (selectedCommunity?._id === id) {
                    setSelectedCommunity({ ...selectedCommunity, status: newStatus as any });
                }
            } else {
                toast.error(response.error);
            }
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleVerificationUpdate = async (id: string, isVerified: boolean) => {
        try {
            const response = await updateVerificationStatus(id, isVerified);
            if (response.success) {
                toast.success(`Community ${isVerified ? 'verified' : 'unverified'}`);
                fetchCommunities();
                if (selectedCommunity?._id === id) {
                    setSelectedCommunity({ ...selectedCommunity, isVerified });
                }
            } else {
                toast.error(response.error);
            }
        } catch (error) {
            toast.error("Failed to update verification");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this community? This action cannot be undone.")) return;

        try {
            const response = await deleteCommunity(id);
            if (response.success) {
                toast.success("Community deleted successfully");
                fetchCommunities();
                setDetailsOpen(false);
            } else {
                toast.error(response.error);
            }
        } catch (error) {
            toast.error("Failed to delete community");
        }
    };

    const handleViewDetails = async (community: Community) => {
        setSelectedCommunity(community);
        setDetailsOpen(true);
        // Optionally fetch full details if not already present
        const res = await getCommunityById(community._id);
        if (res.success) {
            setSelectedCommunity(res.data);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">Approved</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20">Pending</Badge>;
            case 'rejected':
                return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 p-6 pb-20 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header & Stats */}
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-white">Community Management</h1>
                <p className="text-muted-foreground">Manage and oversee all communities, their statuses, and verifications.</p>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-card/50 backdrop-blur-sm border-white/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Communities</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{total}</div>
                        </CardContent>
                    </Card>
                    {/* Add more stats cards later if backend supports aggregation stats */}
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search communities..."
                            className="pl-9 bg-background/50 border-white/10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] bg-background/50 border-white/10">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                        <SelectTrigger className="w-[140px] bg-background/50 border-white/10">
                            <SelectValue placeholder="Verification" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="true">Verified</SelectItem>
                            <SelectItem value="false">Unverified</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button onClick={() => fetchCommunities()} variant="outline" size="icon" className="shrink-0">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            {/* Main Table */}
            <div className="rounded-xl border border-white/10 bg-card/30 backdrop-blur-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="hover:bg-transparent border-white/5">
                            <TableCell isHeader className="w-[300px]">Community</TableCell>
                            <TableCell isHeader>Owner / Info</TableCell>
                            <TableCell isHeader>Status</TableCell>
                            <TableCell isHeader>Verified</TableCell>
                            <TableCell isHeader>Created</TableCell>
                            <TableCell isHeader className="text-right">Actions</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Loading communities...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : communities.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No communities found matching your criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            communities.map((community) => (
                                <TableRow key={community._id} className="hover:bg-white/5 border-white/5 group">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border border-white/10">
                                                <AvatarImage src={community.logo} alt={community.communityName} />
                                                <AvatarFallback>{community.communityName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-white group-hover:text-primary transition-colors">{community.communityName}</span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{community.username}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                                <Mail className="h-3 w-3" />
                                                <span className="truncate max-w-[150px]">{community.email}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Badge variant="secondary" className="text-[10px] h-4 px-1">{community.category}</Badge>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(community.status)}</TableCell>
                                    <TableCell>
                                        {community.isVerified ? (
                                            <Badge variant="default" className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/20 gap-1">
                                                <ShieldCheck className="h-3 w-3" /> Verified
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <ShieldAlert className="h-3 w-3" /> Unverified
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {format(new Date(community.createdAt), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px]">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => router.push(`/admin/community-management/${community._id}`)}>
                                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => window.open(`/community/${community.username}`, '_blank')}>
                                                    <ExternalLink className="mr-2 h-4 w-4" /> Visit Page
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {community.isVerified ? (
                                                    <DropdownMenuItem onClick={() => handleVerificationUpdate(community._id, false)}>
                                                        <ShieldAlert className="mr-2 h-4 w-4" /> Revoke Verify
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleVerificationUpdate(community._id, true)}>
                                                        <ShieldCheck className="mr-2 h-4 w-4" /> Verify
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => handleDelete(community._id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    Previous
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Page {page} of {Math.ceil(total / limit)}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * limit >= total}
                >
                    Next
                </Button>
            </div>

            {/* Details Sheet */}
            <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                    {selectedCommunity && (
                        <>
                            <SheetHeader className="mb-6">
                                <SheetTitle>Community Details</SheetTitle>
                                <SheetDescription>View and manage {selectedCommunity.communityName}</SheetDescription>
                            </SheetHeader>

                            <div className="space-y-6">
                                {/* Banner & Logo */}
                                <div className="relative h-32 rounded-lg overflow-hidden bg-muted">
                                    {selectedCommunity.banner ? (
                                        <img src={selectedCommunity.banner} alt="Banner" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-700">No Banner</div>
                                    )}
                                    <div className="absolute -bottom-10 left-6">
                                        <Avatar className="h-20 w-20 border-4 border-background">
                                            <AvatarImage src={selectedCommunity.logo} />
                                            <AvatarFallback className="text-lg">{selectedCommunity.communityName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                </div>
                                <div className="pt-10 px-1">
                                    <h2 className="text-2xl font-bold">{selectedCommunity.communityName}</h2>
                                    <p className="text-muted-foreground text-sm">@{selectedCommunity.username}</p>
                                </div>

                                {/* Stats/Status */}
                                <div className="flex flex-wrap gap-2">
                                    {getStatusBadge(selectedCommunity.status)}
                                    {selectedCommunity.isVerified ? (
                                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>
                                    ) : (
                                        <Badge variant="outline"><ShieldAlert className="h-3 w-3 mr-1" />Unverified</Badge>
                                    )}
                                    <Badge variant="outline">{selectedCommunity.category}</Badge>
                                </div>

                                {/* Info Grid */}
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase text-muted-foreground">Description</label>
                                        <p className="text-sm leading-relaxed">{selectedCommunity.description}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold uppercase text-muted-foreground">Email</label>
                                            <p className="text-sm flex items-center gap-2"><Mail className="h-3 w-3" /> {selectedCommunity.email}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold uppercase text-muted-foreground">Wallet</label>
                                            <p className="text-sm font-mono truncate" title={selectedCommunity.walletAddress}>
                                                {selectedCommunity.walletAddress?.substring(0, 6)}...{selectedCommunity.walletAddress?.substring(selectedCommunity.walletAddress.length - 4)}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold uppercase text-muted-foreground">Created At</label>
                                            <p className="text-sm">{format(new Date(selectedCommunity.createdAt), "PPP")}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Management Actions */}
                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <h3 className="font-semibold text-lg">Management</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedCommunity.status !== 'approved' && (
                                            <Button
                                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleStatusUpdate(selectedCommunity._id, 'approved')}
                                            >
                                                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                                            </Button>
                                        )}
                                        {selectedCommunity.status !== 'rejected' && (
                                            <Button
                                                variant="destructive"
                                                className="w-full"
                                                onClick={() => handleStatusUpdate(selectedCommunity._id, 'rejected')}
                                            >
                                                <XCircle className="mr-2 h-4 w-4" /> Reject/Ban
                                            </Button>
                                        )}

                                        <Button
                                            variant={selectedCommunity.isVerified ? "secondary" : "default"}
                                            className="w-full"
                                            onClick={() => handleVerificationUpdate(selectedCommunity._id, !selectedCommunity.isVerified)}
                                        >
                                            <ShieldCheck className="mr-2 h-4 w-4" />
                                            {selectedCommunity.isVerified ? "Revoke Verification" : "Verify Community"}
                                        </Button>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        className="w-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                        onClick={() => handleDelete(selectedCommunity._id)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Community Permanently
                                    </Button>
                                </div>

                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
