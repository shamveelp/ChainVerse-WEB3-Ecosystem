"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ArrowLeft,
    Mail,
    ShieldCheck,
    ShieldAlert,
    Calendar,
    Users,
    MessageSquare,
    Globe,
    Settings,
    Loader2,
    Lock,
    Unlock,
    Wallet
} from "lucide-react";
import { toast } from "sonner";
import {
    getCommunityById,
    getCommunityMembers,
    updateCommunitySettings
} from "@/services/adminCommunityManagementApiService";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

// Interface Definitions
interface Community {
    _id: string;
    communityName: string;
    email: string;
    username: string;
    logo: string;
    banner: string;
    description: string;
    status: string;
    isVerified: boolean;
    createdAt: string;
    category: string;
    walletAddress: string;
    settings: {
        allowChainCast: boolean;
        allowGroupChat: boolean;
        allowPosts: boolean;
        allowQuests: boolean;
    };
    socialLinks: any[];
}

interface Member {
    _id: string;
    userId: {
        _id: string;
        username: string;
        email: string;
        profileImage?: string;
    };
    role: string;
    joinedAt: string;
    isActive: boolean;
}

export default function CommunityDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [community, setCommunity] = useState<Community | null>(null);
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<Member[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [memberPage, setMemberPage] = useState(1);
    const [memberTotal, setMemberTotal] = useState(0);
    const [memberSearch, setMemberSearch] = useState("");

    const [settingsLoading, setSettingsLoading] = useState(false);

    useEffect(() => {
        fetchCommunityDetails();
    }, [id]);

    useEffect(() => {
        if (community) {
            fetchMembers();
        }
    }, [community?._id, memberPage, memberSearch]);

    const fetchCommunityDetails = async () => {
        setLoading(true);
        try {
            const response = await getCommunityById(id);
            if (response.success) {
                setCommunity(response.data);
            } else {
                toast.error(response.error || "Failed to fetch community details");
                router.push("/admin/community-management");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        setMembersLoading(true);
        try {
            const response = await getCommunityMembers(id, memberPage, 10, memberSearch);
            if (response.success) {
                setMembers(response.members);
                setMemberTotal(response.total);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setMembersLoading(false);
        }
    }

    const handleSettingChange = async (key: string, value: boolean) => {
        if (!community) return;

        // Optimistic update
        const previousSettings = { ...community.settings };
        setCommunity({
            ...community,
            settings: {
                ...community.settings,
                [key]: value
            }
        });

        try {
            const response = await updateCommunitySettings(id, { ...community.settings, [key]: value });
            if (response.success) {
                toast.success("Settings updated successfully");
            } else {
                // Revert
                setCommunity({ ...community, settings: previousSettings });
                toast.error(response.error);
            }
        } catch (error) {
            setCommunity({ ...community, settings: previousSettings });
            toast.error("Failed to update settings");
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!community) return null;

    return (
        <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Back Button */}
            <Button
                variant="ghost"
                className="gap-2 pl-0 hover:pl-2 transition-all"
                onClick={() => router.back()}
            >
                <ArrowLeft className="h-4 w-4" /> Back to Communities
            </Button>

            {/* Hero Section */}
            <div className="relative rounded-xl overflow-hidden bg-card/50 border border-white/5">
                <div className="h-48 md:h-64 bg-muted/20 relative">
                    {community.banner ? (
                        <img src={community.banner} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-center text-gray-700">
                            No Banner
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                </div>

                <div className="px-6 md:px-10 pb-8 relative -mt-20 flex flex-col md:flex-row gap-6 items-start md:items-end">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                        <AvatarImage src={community.logo} />
                        <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                            {community.communityName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2 mb-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-bold text-white">{community.communityName}</h1>
                            {community.isVerified && (
                                <Badge variant="default" className="bg-blue-500/20 text-blue-400 border-blue-500/20">
                                    <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                                </Badge>
                            )}
                            <Badge variant="outline" className="uppercase text-xs tracking-wider">{community.status}</Badge>
                        </div>
                        <p className="text-muted-foreground text-lg">@{community.username}</p>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="gap-2" onClick={() => window.open(`/community/${community.username}`, '_blank')}>
                            <Globe className="h-4 w-4" /> View Public Page
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-card/50 border border-white/5 p-1">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="settings">Settings & Permissions</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="bg-card/30 border-white/5 backdrop-blur-sm lg:col-span-2">
                            <CardHeader>
                                <CardTitle>About Community</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-muted-foreground leading-relaxed">
                                    {community.description || "No description provided."}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                        <Mail className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase">Contact Email</p>
                                            <p className="text-sm truncate">{community.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                        <Wallet className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase">Wallet Address</p>
                                            <p className="text-sm font-mono truncate" title={community.walletAddress}>
                                                {community.walletAddress?.substring(0, 8)}...{community.walletAddress?.substring(community.walletAddress.length - 6)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                        <Calendar className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase">Created On</p>
                                            <p className="text-sm">{format(new Date(community.createdAt), "PPP")}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                        <Users className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase">Category</p>
                                            <p className="text-sm capitalize">{community.category}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card className="bg-card/30 border-white/5 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Quick Stats</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Placeholder for future stats */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Total Members</span>
                                        <span className="font-bold text-xl">{memberTotal}</span>
                                    </div>
                                    <div className="h-px bg-white/10" />
                                    <div className="text-sm text-muted-foreground text-center py-2">
                                        More analytics coming soon
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Members Tab */}
                <TabsContent value="members" className="space-y-6">
                    <Card className="bg-card/30 border-white/5 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Community Members</CardTitle>
                                <CardDescription>View all members and their roles</CardDescription>
                            </div>
                            <div className="w-[300px]">
                                <Input
                                    placeholder="Search members..."
                                    className="bg-background/50"
                                    value={memberSearch}
                                    onChange={(e) => {
                                        setMemberSearch(e.target.value);
                                        setMemberPage(1);
                                    }}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-white/5">
                                        <TableCell isHeader>User</TableCell>
                                        <TableCell isHeader>Role</TableCell>
                                        <TableCell isHeader>Joined Date</TableCell>
                                        <TableCell isHeader>Status</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {membersLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ) : members.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                No members found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        members.map((member) => (
                                            <TableRow key={member._id} className="hover:bg-white/5 border-white/5">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={member.userId?.profileImage} />
                                                            <AvatarFallback>{member.userId?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{member.userId?.username}</span>
                                                            <span className="text-xs text-muted-foreground">{member.userId?.email}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {member.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {format(new Date(member.joinedAt), "MMM d, yyyy")}
                                                </TableCell>
                                                <TableCell>
                                                    {member.isActive ? (
                                                        <span className="text-green-500 text-xs flex items-center gap-1">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-500 text-xs flex items-center gap-1">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-red-500" /> Inactive
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            {/* Simple Pagination */}
                            <div className="flex items-center justify-end space-x-2 py-4 mt-4 border-t border-white/5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setMemberPage(p => Math.max(1, p - 1))}
                                    disabled={memberPage === 1}
                                >
                                    Previous
                                </Button>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    Page {memberPage}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setMemberPage(p => p + 1)}
                                    disabled={members.length < 10}
                                >
                                    Next
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-6">
                    <Card className="bg-card/30 border-white/5 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" /> Feature Permissions
                            </CardTitle>
                            <CardDescription>
                                Control which features are available to this community.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                                <div className="space-y-0.5">
                                    <Label className="text-base">ChainCast Streaming</Label>
                                    <p className="text-sm text-muted-foreground">Allow community admins to host live streams.</p>
                                </div>
                                <Switch
                                    checked={community.settings?.allowChainCast}
                                    onCheckedChange={(checked) => handleSettingChange('allowChainCast', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Group Chat</Label>
                                    <p className="text-sm text-muted-foreground">Enable real-time group chat for members.</p>
                                </div>
                                <Switch
                                    checked={community.settings?.allowGroupChat}
                                    onCheckedChange={(checked) => handleSettingChange('allowGroupChat', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Community Feed & Posts</Label>
                                    <p className="text-sm text-muted-foreground">Allow members to create posts in the feed.</p>
                                </div>
                                <Switch
                                    checked={community.settings?.allowPosts}
                                    onCheckedChange={(checked) => handleSettingChange('allowPosts', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Quests & Rewards</Label>
                                    <p className="text-sm text-muted-foreground">Enable the quest system for gamification.</p>
                                </div>
                                <Switch
                                    checked={community.settings?.allowQuests}
                                    onCheckedChange={(checked) => handleSettingChange('allowQuests', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-500/20 bg-red-500/5">
                        <CardHeader>
                            <CardTitle className="text-red-500 flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5" /> Danger Zone
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Actions here can have severe consequences. Please proceed with caution.
                            </p>
                            {/* Add Ban/Delete/Suspend actions here if needed in future, currently hidden as per request */}
                            <div className="flex gap-4">
                                <Button variant="destructive" disabled className="opacity-50 cursor-not-allowed">
                                    Suspend Community (Coming Soon)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
