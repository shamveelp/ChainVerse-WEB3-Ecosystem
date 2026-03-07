import { VideoGrant } from "livekit-server-sdk";

export interface ILiveKitService {
    generateToken(roomName: string, identity: string, name?: string, grants?: VideoGrant): Promise<string>;
}
