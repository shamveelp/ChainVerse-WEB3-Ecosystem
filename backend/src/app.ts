import express from 'express';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import communityAdminRoutes from './routes/communityAdmin.routes';
import walletRoutes from './routes/wallet.routes';
import aiTradingRoutes from './routes/aiTrading.routes';
// import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
// import { initAdmin } from './createAdmin/initAdmin';

// dotenv.config();

const app = express();

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://chainverse.shamveelp.xyz',
    'https://www.chainverse.shamveelp.xyz',
    process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/community-admin', communityAdminRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/ai-trading', aiTradingRoutes);

app.get("/", (req, res) => {
    res.send("ChainVerse Backend is running!");
})

// initAdmin()

export default app;
