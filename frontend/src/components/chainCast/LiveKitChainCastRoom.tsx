"use client"

import { useState, useEffect } from 'react'
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
    ControlBar,
    ParticipantTile,
    useTracks,
    LayoutContextProvider,
    Chat,
    ChatToggle,
    DisconnectButton,
    FocusLayout,
    FocusLayoutContainer,
    GridLayout,
    ParticipantLoop,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Track, RoomEvent, Participant } from 'livekit-client'
import { Loader2, Users, Crown, Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, MessageSquare } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from 'framer-motion'
import type { ChainCast } from '@/types/comms-admin/chaincast.types'

interface LiveKitChainCastRoomProps {
    token: string
    serverUrl: string
    chainCast: ChainCast
    onLeave: () => void
    onDisconnected?: () => void
}

export default function LiveKitChainCastRoom({
    token,
    serverUrl,
    chainCast,
    onLeave,
    onDisconnected
}: LiveKitChainCastRoomProps) {
    const [isChatOpen, setIsChatOpen] = useState(false)

    if (!token || !serverUrl) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-950">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto" />
                    <p className="text-slate-400">Connecting to ChainCast...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-50">
            <LiveKitRoom
                video={chainCast.userRole === 'admin'}
                audio={chainCast.userRole === 'admin'}
                token={token}
                serverUrl={serverUrl}
                onDisconnected={onDisconnected || onLeave}
                data-lk-theme="default"
                className="flex flex-col h-full overflow-hidden"
            >
                {/* Custom Premium Header */}
                <header className="flex items-center justify-between px-6 py-4 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 z-20">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                {chainCast.title}
                            </h1>
                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 px-2 py-0">LIVE</Badge>
                        </div>
                        <div className="h-4 w-px bg-slate-800" />
                        <div className="flex items-center gap-1.5 text-slate-400 text-sm font-medium">
                            <Users className="h-4 w-4" />
                            <span>{chainCast.currentParticipants || 1} watching</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`text-slate-300 hover:text-white hover:bg-slate-800 ${isChatOpen ? 'bg-slate-800' : ''}`}
                            onClick={() => setIsChatOpen(!isChatOpen)}
                        >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Chat
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={onLeave}
                            className="bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-900/20"
                        >
                            <PhoneOff className="h-4 w-4 mr-2" />
                            Leave Room
                        </Button>
                    </div>
                </header>

                <main className="flex-1 flex min-h-0 relative overflow-hidden">
                    {/* Main Video Layout */}
                    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 p-4">
                        <LayoutContextProvider>
                            <VideoConference
                                style={{ height: '100%', border: 'none' }}
                            />
                        </LayoutContextProvider>
                    </div>

                    {/* Premium Chat Sidebar */}
                    <AnimatePresence>
                        {isChatOpen && (
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="w-80 md:w-96 bg-slate-900/80 backdrop-blur-2xl border-l border-slate-800/50 flex flex-col z-10"
                            >
                                <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
                                    <h3 className="font-semibold text-slate-200">Community Chat</h3>
                                    <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="h-8 w-8 text-slate-500 hover:text-white">
                                        <Maximize2 className="h-4 w-4 rotate-45" />
                                    </Button>
                                </div>
                                <div className="flex-1 flex flex-col min-h-0">
                                    <Chat />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

                <RoomAudioRenderer />
            </LiveKitRoom>

            <style jsx global>{`
        .lk-video-conference {
            border: none !important;
            background: transparent !important;
        }
        .lk-control-bar {
            background: rgba(15, 23, 42, 0.8) !important;
            backdrop-filter: blur(12px) !important;
            border: 1px solid rgba(51, 65, 85, 0.5) !important;
            border-radius: 9999px !important;
            margin-bottom: 2rem !important;
            padding: 0.5rem 1rem !important;
            width: fit-content !important;
            margin-left: auto !important;
            margin-right: auto !important;
        }
        .lk-button {
            border-radius: 9999px !important;
            background: rgba(30, 41, 59, 0.5) !important;
            border: 1px solid rgba(51, 65, 85, 0.3) !important;
            transition: all 0.2s ease !important;
        }
        .lk-button:hover {
            background: rgba(51, 65, 85, 0.8) !important;
        }
        .lk-chat {
            background: transparent !important;
            border: none !important;
            height: 100% !important;
        }
        .lk-chat-form {
            padding: 1rem !important;
            border-top: 1px solid rgba(51, 65, 85, 0.3) !important;
        }
        .lk-chat-form input {
            background: rgba(15, 23, 42, 0.5) !important;
            border: 1px solid rgba(51, 65, 85, 0.5) !important;
            border-radius: 0.75rem !important;
            color: white !important;
        }
        .lk-participant-tile {
            border-radius: 1rem !important;
            overflow: hidden !important;
            border: 1px solid rgba(51, 65, 85, 0.3) !important;
            background: rgba(15, 23, 42, 0.5) !important;
        }
        .lk-grid-layout {
            gap: 1rem !important;
            padding: 0 !important;
        }
      `}</style>
        </div>
    )
}
