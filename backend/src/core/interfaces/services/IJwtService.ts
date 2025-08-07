import { Response } from "express";

export interface JwtPayload {
    id: string;
    role: string;
    iat?: number;
    exp?: number;
}

export interface IJwtService {
    generateAccessToken(id: string, role: string): string;
    generateRefreshToken(id: string, role: string): string;
    verifyRefreshToken(token: string): any;
    setTokens(res: Response, accessToken: string, refreshToken: string): void;
    setAccessToken(res: Response, accessToken: string): void;
    clearTokens(res: Response): void;
}

