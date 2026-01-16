import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import logger from '../utils/logger';

interface QuestSuggestion {
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedDuration: string;
  rewardPool: {
    type: 'token' | 'nft' | 'points' | 'custom';
    amount: number;
    description: string;
  };
  tasks: Array<{
    title: string;
    description: string;
    type: string;
    requirements?: Record<string, unknown>;
    points: number;
  }>;
}

export class GeminiAiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateQuestSuggestion(
    communityName: string,
    communityCategory: string,
    userPrompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant', content: string }> = []
  ): Promise<{ response: string; questSuggestion?: QuestSuggestion }> {
    try {
      // Build conversation context
      let contextPrompt = `You are QuestCraft AI, a specialized assistant for creating engaging blockchain community quests. You're helping the admin of "${communityName}" (category: ${communityCategory}) create quests.

QUEST STRUCTURE:
- Title: Engaging, clear title
- Description: Detailed explanation of the quest objective
- Category: Educational, Creative, Social, Technical, Governance, etc.
- Difficulty: Beginner/Intermediate/Advanced
- Duration: How long the quest runs (days/weeks)
- Selection Method: 'fcfs' (First Come First Serve) or 'random' (Random Pick)
- Participant Limit: Number of winners (not total participants)
- Reward Pool: Type (token/nft/points/custom) and amount
- Tasks: Array of specific tasks participants must complete

AVAILABLE TASK TYPES:
1. join_community - Join this community
2. follow_admin - Follow community admin
3. follow_user - Follow specific users
4. social_post - Post on social media (Twitter, Instagram, etc.) with screenshot
5. nft_hold - Hold specific NFTs
6. token_hold - Hold minimum amount of tokens
7. wallet_connect - Connect wallet and provide address
8. custom - Custom tasks with manual verification

CONVERSATION FLOW:
1. Understand quest objective
2. Ask clarifying questions about:
   - Quest theme/goal
   - Target difficulty
   - Duration preferences
   - Reward expectations
   - Task preferences
3. Generate complete quest structure when ready

Be conversational, helpful, and ask follow-up questions to create the perfect quest.

`;

      // Add conversation history
      if (conversationHistory.length > 0) {
        contextPrompt += "\n\nCONVERSATION HISTORY:\n";
        conversationHistory.forEach(msg => {
          contextPrompt += `${msg.role === 'user' ? 'Admin' : 'QuestCraft AI'}: ${msg.content}\n`;
        });
      }

      contextPrompt += `\nCurrent Admin Request: ${userPrompt}`;

      // Check if we should generate a complete quest structure
      const shouldGenerateQuest = userPrompt.toLowerCase().includes('generate') ||
        userPrompt.toLowerCase().includes('create quest') ||
        userPrompt.toLowerCase().includes('finalize') ||
        conversationHistory.length >= 3;

      if (shouldGenerateQuest) {
        contextPrompt += `\n\nPLEASE PROVIDE:
1. A conversational response acknowledging the request
2. A complete JSON quest structure in this exact format:

QUEST_JSON_START
{
  "title": "Quest Title",
  "description": "Detailed description",
  "category": "Category",
  "difficulty": "Beginner|Intermediate|Advanced",
  "estimatedDuration": "7 days",
  "rewardPool": {
    "type": "points|token|nft|custom",
    "amount": 100,
    "description": "100 Community Points + Special Badge"
  },
  "tasks": [
    {
      "title": "Task 1 Title",
      "description": "Task description",
      "type": "join_community",
      "points": 20
    },
    {
      "title": "Task 2 Title", 
      "description": "Task description",
      "type": "social_post",
      "requirements": {
        "platform": "twitter",
        "postContent": "Check out @${communityName}! #Web3Community",
        "requireScreenshot": true
      },
      "points": 30
    }
  ]
}
QUEST_JSON_END`;
      }

      const result = await this.model.generateContent(contextPrompt);
      const response = result.response.text();

      // Extract quest JSON if present
      let questSuggestion: QuestSuggestion | undefined;
      const jsonMatch = response.match(/QUEST_JSON_START\s*([\s\S]*?)\s*QUEST_JSON_END/);

      if (jsonMatch) {
        try {
          questSuggestion = JSON.parse(jsonMatch[1].trim());
        } catch (error) {
          logger.warn('Failed to parse quest JSON from AI response', error);
        }
      }

      return {
        response: response.replace(/QUEST_JSON_START[\s\S]*?QUEST_JSON_END/, '').trim(),
        questSuggestion
      };

    } catch (error) {
      logger.error('Gemini AI Service error:', error);
      return {
        response: "I apologize, but I'm having trouble connecting to my AI services right now. You can still create quests manually using the form below. Here are some quest ideas:\n\n• **Community Growth**: Join community + follow admin + invite friends\n• **Social Engagement**: Share on Twitter + post screenshot + use hashtags\n• **DeFi Education**: Complete quiz + hold tokens + provide wallet\n• **NFT Challenge**: Hold specific NFT + create art + submit creation\n\nWould you like me to help you structure any of these quest types?"
      };
    }
  }

  async improveQuestDescription(questData: QuestSuggestion): Promise<string> {
    try {
      const prompt = `Improve this quest description to be more engaging and clear:
      
Title: ${questData.title}
Current Description: ${questData.description}
Category: ${questData.category}
Difficulty: ${questData.difficulty}

Make it exciting, clear about objectives, and include what participants will learn or gain. Keep it under 300 words.`;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      logger.error('Error improving quest description:', error);
      return questData.description;
    }
  }
}

export const geminiAiService = new GeminiAiService();