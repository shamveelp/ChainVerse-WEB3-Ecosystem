"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Image, X, Globe, Calendar, MapPin, Smile, Hash, ChevronLeft } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'

export default function ComposeTweetPage() {
    const router = useRouter()
    const [content, setContent] = useState('')
    const currentUser = useSelector((state: RootState) => state.userAuth?.user)

    const handlePost = async () => {
        if (!content.trim()) return

        try {
            // TODO: Implement actual post creation logic here
            // await communityApiService.createPost({ content })

            router.back()
        } catch (error) {
            console.error("Failed to post", error)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center pt-safe">
            <div className="w-full max-w-2xl bg-slate-950 min-h-screen md:min-h-0 md:h-auto md:mt-10 md:rounded-2xl md:border md:border-slate-800 relative">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50">
                        <ChevronLeft className="h-6 w-6 md:hidden" />
                        <X className="h-6 w-6 hidden md:block" />
                    </Button>
                    <div className="flex gap-4">
                        <Button variant="ghost" className="text-cyan-400 font-bold hidden md:block" onClick={() => setContent('')}>Drafts</Button>
                        <Button
                            onClick={handlePost}
                            disabled={!content.trim()}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white capitalize font-bold rounded-full px-6"
                        >
                            Post
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 flex gap-4">
                    <Avatar className="w-12 h-12 ring-2 ring-slate-800">
                        <AvatarImage src={currentUser?.profilePic} />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold">
                            {currentUser?.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-h-[200px] flex flex-col">
                        {/* Public Dropdown stub */}
                        <div className="mb-4">
                            <Button variant="outline" size="sm" className="rounded-full border-cyan-500/30 text-cyan-400 h-6 text-xs px-3 hover:bg-cyan-900/10">
                                Public <Globe className="h-3 w-3 ml-2" />
                            </Button>
                        </div>

                        <Textarea
                            autoFocus
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What is happening?!"
                            className="flex-1 min-h-[150px] bg-transparent border-none focus-visible:ring-0 text-xl text-white placeholder:text-slate-500 p-0 resize-none"
                        />

                        {/* Media Previews would go here */}

                        <div className="border-t border-slate-800 pt-4 mt-4">
                            <div className="flex items-center justify-between text-cyan-500">
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="hover:bg-cyan-900/20 text-cyan-500 rounded-full">
                                        <Image className="h-5 w-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="hover:bg-cyan-900/20 text-cyan-500 rounded-full">
                                        <Hash className="h-5 w-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="hover:bg-cyan-900/20 text-cyan-500 rounded-full">
                                        <Smile className="h-5 w-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="hover:bg-cyan-900/20 text-cyan-500 rounded-full">
                                        <Calendar className="h-5 w-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="hover:bg-cyan-900/20 text-cyan-500 rounded-full">
                                        <MapPin className="h-5 w-5" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-4">
                                    {content.length > 0 && (
                                        <div className="text-xs text-slate-500 border-r border-slate-800 pr-4">
                                            {content.length}/280
                                        </div>
                                    )}
                                    {/* Circle progress indicator could go here */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
