import { AccessToken, VideoGrant } from 'livekit-server-sdk';
import { injectable } from 'inversify';
import { ILiveKitService } from '../../core/interfaces/services/livekit/ILiveKit.service';

@injectable()
export class LiveKitService implements ILiveKitService {
    private apiKey: string;
    private apiSecret: string;

    constructor() {
        this.apiKey = process.env.LIVE_KIT_API_KEY || process.env.LIVEKIT_API_KEY || '';
        this.apiSecret = process.env.LIVE_KIT_API_SECRET || process.env.LIVEKIT_API_SECRET || '';
    }

    async generateToken(roomName: string, identity: string, name?: string, grants?: VideoGrant): Promise<string> {
        const at = new AccessToken(this.apiKey, this.apiSecret, {
            identity: identity,
            name: name,
        });

        const videoGrant: VideoGrant = grants || {
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true
        };

        at.addGrant({
            ...videoGrant,
            room: roomName,
        });

        return at.toJwt();
    }
}
