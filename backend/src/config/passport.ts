import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { inject, injectable } from "inversify";
import { TYPES } from "../core/types/types";
import { IUserRepository } from "../core/interfaces/repositories/IUser.repository";
import logger from "../utils/logger";


@injectable()
export class PassportConfig {
    constructor(
        @inject(TYPES.IUserRepository) private _userRepository: IUserRepository
    ) {
        logger.info("Passport initialized");

        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID!,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                    callbackURL: process.env.GOOGLE_CALLBACK_URL!,
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        logger.info("Google Strategy: Profile", profile.id); // debug log
                        let user = await this._userRepository.findByGoogleId(profile.id);
                        if (!user) {
                            user = await this._userRepository.createUser({
                                googleId: profile.id,
                                email: profile.emails![0].value,
                                name: profile.displayName,
                                role: "user",
                            })
                        }
                        return done(null, user);
                    } catch (error) {
                        logger.error("Google Strategy: Error", error);
                        return done(error);
                    }
                }
            )
        );

        passport.serializeUser((user: any, done) => {
            done(null, user.id);
        });

        passport.deserializeUser(async (id: string, done) => {
            try {
                const user = await this._userRepository.findById(id);
                done(null, user);
            } catch (error) {
                done(error);
            }
        });
    }
}

