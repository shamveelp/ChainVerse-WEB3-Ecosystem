import { AccessToken } from 'livekit-server-sdk';
import { injectable } from 'inversify';
import { ILiveKitService } from '../../core/interfaces/services/livekit/ILiveKit.service';

@injectable()
export class LiveKitService implements ILiveKitService {
    private apiKey: string;
    private apiSecret: string;

    constructor() {
        this.apiKey = process.env.LIVE_KIT_API_KEY || '';
        this.apiSecret = process.env.LIVE_KIT_API_SECRET || '';
    }

    async generateToken(roomName: string, identity: string, name?: string): Promise<string> {
        const at = new AccessToken(this.apiKey, this.apiSecret, {
            identity: identity,
            name: name,
        });

        at.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true
        });

        return at.toJwt();
    }
}
