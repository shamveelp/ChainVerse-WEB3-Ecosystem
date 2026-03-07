import { useState, useEffect, useCallback, useRef } from 'react';
import { Room, RoomEvent, DataPacket_Kind, Participant, RemoteParticipant, LocalParticipant } from 'livekit-client';
import { communityApiService } from '@/services/communityApiService';
import { toast } from 'sonner';

export interface LiveKitMessage {
    id: string;
    senderId: string;
    content: string;
    timestamp: number;
}

export const useLiveKit = (receiverId: string | undefined) => {
    const [room, setRoom] = useState<Room | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [roomName, setRoomName] = useState<string | null>(null);
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);

    const connect = useCallback(async () => {
        if (!receiverId) return;

        try {
            const { token, roomName, serverUrl } = await communityApiService.getLiveKitToken(receiverId);
            setToken(token);
            setRoomName(roomName);
            setServerUrl(serverUrl);

            const liveKitRoom = new Room({
                // AdaptiveStream: true,
                // Dynacast: true,
            });

            await liveKitRoom.connect(serverUrl, token);
            setRoom(liveKitRoom);
            setIsConnected(true);
            setParticipants(Array.from(liveKitRoom.remoteParticipants.values()));

            // Event listeners
            liveKitRoom
                .on(RoomEvent.ParticipantConnected, (p) => {
                    setParticipants(prev => [...prev, p]);
                })
                .on(RoomEvent.ParticipantDisconnected, (p) => {
                    setParticipants(prev => prev.filter(participant => participant.sid !== p.sid));
                })
                .on(RoomEvent.Disconnected, () => {
                    setIsConnected(false);
                    setRoom(null);
                });

            return liveKitRoom;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to connect to LiveKit';
            setError(message);
            toast.error(message);
            return null;
        }
    }, [receiverId]);

    const disconnect = useCallback(async () => {
        if (room) {
            await room.disconnect();
            setRoom(null);
            setIsConnected(false);
        }
    }, [room]);

    const sendMessage = useCallback(async (content: string) => {
        if (!room || !isConnected) {
            // toast.error('Not connected to chat room');
            return;
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify({
            type: 'chat',
            content,
            timestamp: Date.now(),
        }));

        try {
            await room.localParticipant.publishData(data, { reliable: true });
        } catch (err) {
            console.error('Failed to publish data:', err);
            // toast.error('Failed to send real-time message');
        }
    }, [room, isConnected]);

    useEffect(() => {
        if (receiverId) {
            connect();
        }
        return () => {
            disconnect();
        };
    }, [receiverId]);

    return {
        room,
        isConnected,
        participants,
        error,
        sendMessage,
        connect,
        disconnect
    };
};
