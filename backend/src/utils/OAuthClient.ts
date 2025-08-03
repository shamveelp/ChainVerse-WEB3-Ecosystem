import { injectable } from "inversify"
import { OAuth2Client } from "google-auth-library"
import dotenv from "dotenv"
dotenv.config()

@injectable()
export class OAuthClient {
  private client: OAuth2Client

  constructor() {
    // Corrected typo: GOOGLE_CLIENT_ID
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error("GOOGLE_CLIENT_ID is not defined in .env file")
    }
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  }

  async verifyIdToken(token: string) {
    const ticket = await this.client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, // Corrected typo
    })
    return ticket.getPayload()
  }
}
