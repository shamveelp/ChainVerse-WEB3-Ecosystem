"use client";

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Check, ChevronsUpDown, X } from 'lucide-react';
import { communityAdminQuestApiService } from '@/services/quests/communityAdminQuestApiService';
import { toast } from '@/components/ui/use-toast';

interface TaskConfig {
  communityId?: string;
  communityName?: string;
  communityUsername?: string;
  targetUserId?: string;
  targetUsername?: string;
  twitterText?: string;
  twitterHashtags?: string[];
  contractAddress?: string;
  tokenId?: string;
  tokenAddress?: string;
  minimumAmount?: number;
  customInstructions?: string;
  requiresProof?: boolean;
  proofType?: 'text' | 'image' | 'link';
  websiteUrl?: string;
  discordServerId?: string;
  telegramGroupId?: string;
}

interface Community {
  _id: string;
  communityName: string;
  username: string;
  logo?: string;
}

interface User {
  _id: string;
  username: string;
  name: string;
  profilePic?: string;
}

interface TaskConfigurationProps {
  taskType: string;
  config: TaskConfig;
  onChange: (config: TaskConfig) => void;
}

export function TaskConfiguration({ taskType, config, onChange }: TaskConfigurationProps) {
  const [communitySearch, setCommunitySearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchingCommunities, setSearchingCommunities] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const searchCommunities = async (query: string) => {
    if (query.length < 2) {
      setCommunities([]);
      return;
    }

    setSearchingCommunities(true);
    try {
      const response = await communityAdminQuestApiService.searchCommunities(query);
      if (response.success && response.data) {
        setCommunities(response.data);
      }
    } catch (error) {
      console.error('Error searching communities:', error);
    } finally {
      setSearchingCommunities(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const response = await communityAdminQuestApiService.searchUsers(query);
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (communitySearch) {
        searchCommunities(communitySearch);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [communitySearch]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (userSearch) {
        searchUsers(userSearch);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [userSearch]);

  const updateConfig = (updates: Partial<TaskConfig>) => {
    onChange({ ...config, ...updates });
  };

  const addHashtag = (hashtag: string) => {
    if (hashtag && !config.twitterHashtags?.includes(hashtag)) {
      updateConfig({
        twitterHashtags: [...(config.twitterHashtags || []), hashtag]
      });
    }
  };

  const removeHashtag = (hashtag: string) => {
    updateConfig({
      twitterHashtags: config.twitterHashtags?.filter(h => h !== hashtag) || []
    });
  };

  const renderTaskSpecificConfig = () => {
    switch (taskType) {
      case 'join_community':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Community to Join *</Label>
              <Popover open={communityOpen} onOpenChange={setCommunityOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={communityOpen}
                    className="w-full justify-between bg-gray-800 border-gray-600 text-white"
                  >
                    {config.communityName || "Select community..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-gray-800 border-gray-600">
                  <Command className="bg-gray-800">
                    <CommandInput
                      placeholder="Search communities..."
                      value={communitySearch}
                      onValueChange={setCommunitySearch}
                      className="text-white"
                    />
                    <CommandEmpty className="text-gray-400">
                      {searchingCommunities ? "Searching..." : "No communities found."}
                    </CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {communities.map((community) => (
                        <CommandItem
                          key={community._id}
                          value={community.communityName}
                          onSelect={() => {
                            updateConfig({
                              communityId: community._id,
                              communityName: community.communityName,
                              communityUsername: community.username,
                            });
                            setCommunityOpen(false);
                          }}
                          className="text-white hover:bg-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            {community.logo && (
                              <img src={community.logo} alt="" className="w-6 h-6 rounded-full" />
                            )}
                            <div>
                              <p className="font-medium">{community.communityName}</p>
                              <p className="text-xs text-gray-400">@{community.username}</p>
                            </div>
                          </div>
                          <Check
                            className={`ml-auto h-4 w-4 ${
                              config.communityId === community._id ? "opacity-100" : "opacity-0"
                            }`}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );

      case 'follow_user':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>User to Follow *</Label>
              <Popover open={userOpen} onOpenChange={setUserOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={userOpen}
                    className="w-full justify-between bg-gray-800 border-gray-600 text-white"
                  >
                    {config.targetUsername || "Select user..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-gray-800 border-gray-600">
                  <Command className="bg-gray-800">
                    <CommandInput
                      placeholder="Search users..."
                      value={userSearch}
                      onValueChange={setUserSearch}
                      className="text-white"
                    />
                    <CommandEmpty className="text-gray-400">
                      {searchingUsers ? "Searching..." : "No users found."}
                    </CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {users.map((user) => (
                        <CommandItem
                          key={user._id}
                          value={user.username}
                          onSelect={() => {
                            updateConfig({
                              targetUserId: user._id,
                              targetUsername: user.username,
                            });
                            setUserOpen(false);
                          }}
                          className="text-white hover:bg-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            {user.profilePic && (
                              <img src={user.profilePic} alt="" className="w-6 h-6 rounded-full" />
                            )}
                            <div>
                              <p className="font-medium">{user.name || user.username}</p>
                              <p className="text-xs text-gray-400">@{user.username}</p>
                            </div>
                          </div>
                          <Check
                            className={`ml-auto h-4 w-4 ${
                              config.targetUserId === user._id ? "opacity-100" : "opacity-0"
                            }`}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );

      case 'twitter_post':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Twitter Post Content</Label>
              <Textarea
                value={config.twitterText || ''}
                onChange={(e) => updateConfig({ twitterText: e.target.value })}
                placeholder="Enter the required Twitter post content..."
                rows={3}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Required Hashtags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {config.twitterHashtags?.map((hashtag, index) => (
                  <Badge key={index} variant="secondary" className="bg-purple-600 text-white">
                    #{hashtag}
                    <button
                      onClick={() => removeHashtag(hashtag)}
                      className="ml-1 hover:text-red-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter hashtag (without #)"
                  className="bg-gray-700 border-gray-600 text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const target = e.target as HTMLInputElement;
                      addHashtag(target.value);
                      target.value = '';
                    }
                  }}
                />
              </div>
              <p className="text-xs text-gray-400">Press Enter to add hashtags</p>
            </div>
          </div>
        );

      case 'upload_screenshot':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Screenshot Instructions</Label>
              <Textarea
                value={config.customInstructions || ''}
                onChange={(e) => updateConfig({ customInstructions: e.target.value })}
                placeholder="Describe what screenshot users need to upload..."
                rows={3}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Website URL (Optional)</Label>
              <Input
                value={config.websiteUrl || ''}
                onChange={(e) => updateConfig({ websiteUrl: e.target.value })}
                placeholder="https://example.com"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
        );

      case 'nft_mint':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NFT Contract Address *</Label>
                <Input
                  value={config.contractAddress || ''}
                  onChange={(e) => updateConfig({ contractAddress: e.target.value })}
                  placeholder="0x..."
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Token ID (Optional)</Label>
                <Input
                  value={config.tokenId || ''}
                  onChange={(e) => updateConfig({ tokenId: e.target.value })}
                  placeholder="Specific token ID"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Additional Instructions</Label>
              <Textarea
                value={config.customInstructions || ''}
                onChange={(e) => updateConfig({ customInstructions: e.target.value })}
                placeholder="Any additional minting instructions..."
                rows={3}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
        );

      case 'token_hold':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Token Contract Address *</Label>
                <Input
                  value={config.tokenAddress || ''}
                  onChange={(e) => updateConfig({ tokenAddress: e.target.value })}
                  placeholder="0x..."
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Amount *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.000001"
                  value={config.minimumAmount || ''}
                  onChange={(e) => updateConfig({ minimumAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="100"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          </div>
        );

      case 'wallet_connect':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Connection Instructions</Label>
              <Textarea
                value={config.customInstructions || ''}
                onChange={(e) => updateConfig({ customInstructions: e.target.value })}
                placeholder="Instructions for wallet connection (e.g., connect to ChainVerse, sign a message, etc.)"
                rows={3}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
        );

      case 'custom':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Custom Task Instructions *</Label>
              <Textarea
                value={config.customInstructions || ''}
                onChange={(e) => updateConfig({ customInstructions: e.target.value })}
                placeholder="Detailed instructions for the custom task..."
                rows={4}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Reference URL (Optional)</Label>
              <Input
                value={config.websiteUrl || ''}
                onChange={(e) => updateConfig({ websiteUrl: e.target.value })}
                placeholder="https://example.com"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {renderTaskSpecificConfig()}
      
      {/* Common Settings */}
      <div className="border-t border-gray-600 pt-4 space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="requiresProof"
            checked={config.requiresProof !== false}
            onCheckedChange={(checked) => updateConfig({ requiresProof: checked })}
          />
          <Label htmlFor="requiresProof">Requires Proof Submission</Label>
        </div>

        {config.requiresProof !== false && (
          <div className="space-y-2">
            <Label>Proof Type</Label>
            <Select
              value={config.proofType || 'image'}
              onValueChange={(value: 'text' | 'image' | 'link') => updateConfig({ proofType: value })}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="image">Screenshot/Image</SelectItem>
                <SelectItem value="text">Text Description</SelectItem>
                <SelectItem value="link">URL/Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}