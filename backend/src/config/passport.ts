import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { injectable, inject } from 'inversify';
import { TYPES } from '../core/types/types';
import { IUserRepository } from '../core/interfaces/repositories/IUserRepository';

@injectable()
export class PassportConfig {
    constructor(
        @inject(TYPES.IUserRepository) private userRepository: IUserRepository
    ) {
        this.initializeGoogleStrategy();
    }

    private initializeGoogleStrategy(): void {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID || '',
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
                    callbackURL: "/api/auth/google/callback"
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        const email = profile.emails?.[0]?.value;
                        if (!email) {
                            return done(new Error('No email found in Google profile'), undefined);
                        }

                        let user = await this.userRepository.findByEmail(email);
                        
                        if (!user) {
                            user = await this.userRepository.create({
                                firstName: profile.name?.givenName || '',
                                lastName: profile.name?.familyName || '',
                                email: email,
                                password: '', // No password for OAuth users
                                isVerified: true,
                                googleId: profile.id
                            });
                        } else if (!user.googleId) {
                            user = await this.userRepository.update(user.id, {
                                googleId: profile.id,
                                isVerified: true
                            });
                        }

                        return done(null, user);
                    } catch (error) {
                        return done(error, undefined);
                    }
                }
            )
        );

        passport.serializeUser((user: any, done) => {
            done(null, user.id);
        });

        passport.deserializeUser(async (id: string, done) => {
            try {
                const user = await this.userRepository.findById(id);
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        });
    }
}
