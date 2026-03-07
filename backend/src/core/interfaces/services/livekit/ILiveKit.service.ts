export interface ILiveKitService {
    generateToken(roomName: string, identity: string, name?: string): Promise<string>;
}
