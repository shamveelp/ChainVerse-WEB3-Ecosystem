'use client';

import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    MessageSquareWarning,
    AlertTriangle,
    Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function NFTMarketplaceEnquiries() {
    const reports = useQuery(api.nftReports.getReports);
    const resolveReport = useMutation(api.nftReports.resolveReport);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, pending, solved
    const [selectedReport, setSelectedReport] = useState<any>(null); // For details dialog
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    // Filtering logic
    const filteredReports = reports?.filter(report => {
        const matchesSearch =
            report.tokenId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.detailedReason?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

        return matchesSearch && matchesStatus;
    }) || [];

    const handleResolve = async (id: any) => {
        try {
            setResolvingId(id);
            await resolveReport({ id });
            toast.success("Report marked as solved");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        } finally {
            setResolvingId(null);
        }
    };

    if (!reports) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">NFT Enquiries & Reports</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage user complaints and reports regarding NFTs.
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                        <MessageSquareWarning className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reports.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Issues</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {reports.filter(r => r.status === 'pending').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {reports.filter(r => r.status === 'solved').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card className="border-none shadow-md">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by Token ID or Reason..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="solved">Solved</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Token ID</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReports.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No reports found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredReports.map((report) => (
                                        <TableRow key={report._id}>
                                            <TableCell>
                                                {report.status === 'pending' ? (
                                                    <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                                                        Pending
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                                        Solved
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">#{report.tokenId}</TableCell>
                                            <TableCell>
                                                <span className="font-medium block">{report.reason}</span>
                                                {report.detailedReason && (
                                                    <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                                                        {report.detailedReason}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDistanceToNow(report.createdAt, { addSuffix: true })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {/* View Details Dialog */}
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm">View Details</Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Report Details</DialogTitle>
                                                                <DialogDescription>ID: {report._id}</DialogDescription>
                                                            </DialogHeader>
                                                            <div className="py-4 space-y-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <h4 className="text-sm font-medium mb-1">Token ID</h4>
                                                                        <p className="text-sm">#{report.tokenId}</p>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-sm font-medium mb-1">Reported At</h4>
                                                                        <p className="text-sm">{new Date(report.createdAt).toLocaleString()}</p>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-medium mb-1">Reason</h4>
                                                                    <Badge variant="secondary">{report.reason}</Badge>
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-medium mb-1">Detailed Explanation</h4>
                                                                    <p className="text-sm p-3 bg-muted rounded-md min-h-[60px]">
                                                                        {report.detailedReason || "No additional details provided."}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                {report.status === 'pending' && (
                                                                    <Button
                                                                        onClick={() => handleResolve(report._id)}
                                                                        disabled={resolvingId === report._id}
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                    >
                                                                        {resolvingId === report._id ? 'Marking...' : 'Mark as Solved'}
                                                                    </Button>
                                                                )}
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>

                                                    {/* Quick Resolve Button */}
                                                    {report.status === 'pending' && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-green-500 hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20"
                                                            onClick={() => handleResolve(report._id)}
                                                            disabled={resolvingId === report._id}
                                                            title="Mark as Solved"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
