import { Router } from "express";
import container from "../core/di/container";
import { TYPES } from "../core/types/types";
import { AITradingController } from "../controllers/aiChat/aiTrading.controller";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware";
import { validateBody, validateQuery, validateParams } from "../middlewares/validation.middleware";
import {
    SendMessageDto,
    ExecuteTradeDto,
    GetChatHistoryDto
} from "../dtos/aiTrading/AiTrading.dto";

const router = Router();

const aiTradingController = container.get<AITradingController>(
    TYPES.IAITradingController
);

// Public routes (no authentication required)
router.post(
    "/chat/message",
    validateBody(SendMessageDto),
    aiTradingController.sendMessage.bind(aiTradingController)
);

router.get(
    "/tokens",
    aiTradingController.getAvailableTokens.bind(aiTradingController)
);

router.get(
    "/prices",
    aiTradingController.getTokenPrices.bind(aiTradingController)
);

router.get(
    "/swap/estimate",
    aiTradingController.calculateSwapEstimate.bind(aiTradingController)
);

router.post(
    "/trade/analyze",
    aiTradingController.analyzeTradeOpportunity.bind(aiTradingController)
);

// Chat history (accessible without auth but sessionId required)
router.get(
    "/chat/history/:sessionId",
    validateParams(GetChatHistoryDto),
    aiTradingController.getChatHistory.bind(aiTradingController)
);

// Trade execution (no auth required since wallet connection handles security)
router.post(
    "/trade/execute",
    validateBody(ExecuteTradeDto),
    aiTradingController.executeTradeWithAI.bind(aiTradingController)
);

export default router;