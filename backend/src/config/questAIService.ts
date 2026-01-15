import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

export interface QuestGenerationRequest {
  prompt: string;
  communityTheme?: string;
  targetAudience?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  expectedWinners?: number;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface QuestGenerationResponse {
  questData?: any;
  response: string;
  needsMoreInfo?: boolean;
  suggestedQuestions?: string[];
}

class QuestAIService {
  private model: ChatGoogleGenerativeAI;
  private questGenerationChain: RunnableSequence;

  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY!,
      model: "gemini-2.5-flash",
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 3000,
    });

    this.questGenerationChain = this.createQuestGenerationChain();
  }

  private createQuestGenerationChain() {
    const systemPrompt = SystemMessagePromptTemplate.fromTemplate(`
You are ChainVerse AI, an expert quest designer for Web3 communities. Your role is to help create engaging, valuable quests that grow communities and provide meaningful rewards.

**Your Capabilities:**
- Create comprehensive quest structures with multiple tasks
- Design rewards that match community goals
- Suggest optimal difficulty levels and completion times
- Generate task configurations for various Web3 activities

**Available Task Types:**
1. join_community - Join a specific community
2. follow_user - Follow a community admin or creator
3. twitter_post - Share content on X/Twitter with specific messaging
4. upload_screenshot - Provide visual proof of completion
5. nft_mint - Mint from a specific NFT collection
6. token_hold - Hold minimum token amounts
7. wallet_connect - Connect wallet to dApps
8. custom - Any other creative task

**Response Format:**
If you have enough information to create a quest, respond with JSON:
{
  "questData": {
    "title": "Quest Title",
    "description": "Detailed description",
    "startDate": "2024-12-27T10:00:00.000Z",
    "endDate": "2025-01-03T10:00:00.000Z",
    "selectionMethod": "random",
    "participantLimit": 10,
    "rewardPool": {
      "amount": 100,
      "currency": "USDT",
      "rewardType": "token"
    },
    "tasks": [
      {
        "title": "Task Title",
        "description": "What users need to do",
        "taskType": "join_community",
        "isRequired": true,
        "order": 1,
        "config": {
          "requiresProof": true,
          "proofType": "image"
        }
      }
    ],
    "isAIGenerated": true,
    "aiPrompt": "user's original request"
  },
  "response": "I've created an exciting quest for you! Here's what I designed...",
  "needsMoreInfo": false
}

If you need more information, respond with:
{
  "response": "I'd love to help create that quest! Could you tell me more about...",
  "needsMoreInfo": true,
  "suggestedQuestions": [
    "What's your community's main focus?",
    "What type of rewards work best for your members?"
  ]
}

Always be enthusiastic, helpful, and focus on creating value for the community.
`);

    const humanPrompt = HumanMessagePromptTemplate.fromTemplate(`
User Request: {userMessage}

Community Context:
- Theme: {communityTheme}
- Target Audience: {targetAudience} 
- Difficulty Preference: {difficulty}
- Expected Winners: {expectedWinners}

Conversation History: {conversationHistory}

Create a quest that matches these requirements or ask clarifying questions if needed.
`);

    const chatPrompt = ChatPromptTemplate.fromMessages([
      systemPrompt,
      humanPrompt
    ]);

    return RunnableSequence.from([
      chatPrompt,
      this.model,
      new StringOutputParser()
    ]);
  }

  async generateQuestResponse(request: QuestGenerationRequest): Promise<QuestGenerationResponse> {
    try {
      const response = await this.questGenerationChain.invoke({
        userMessage: request.prompt,
        communityTheme: request.communityTheme || 'Web3 Community',
        targetAudience: request.targetAudience || 'Crypto enthusiasts',
        difficulty: request.difficulty || 'medium',
        expectedWinners: request.expectedWinners || 10,
        conversationHistory: JSON.stringify(request.conversationHistory || [])
      });

      // Try to parse as JSON
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            questData: parsed.questData,
            response: parsed.response,
            needsMoreInfo: parsed.needsMoreInfo || false,
            suggestedQuestions: parsed.suggestedQuestions
          };
        }
      } catch {
        // If JSON parsing fails, treat as conversational response
      }

      return {
        response: response,
        needsMoreInfo: true,
        suggestedQuestions: [
          "What type of quest are you looking to create?",
          "What's your community's main focus?",
          "What rewards would motivate your members?"
        ]
      };
    } catch (error) {
      console.error('Quest AI generation error:', error);
      throw new Error('Failed to generate quest response');
    }
  }

  async verifyTaskCompletion(taskType: string, submissionData: any, taskConfig: any): Promise<{
    isValid: boolean;
    autoVerified: boolean;
    message: string;
  }> {
    const prompt = `
Verify if this task submission is valid:

Task Type: ${taskType}
Task Config: ${JSON.stringify(taskConfig)}
Submission Data: ${JSON.stringify(submissionData)}

Analyze the submission and respond with JSON:
{
  "isValid": boolean,
  "autoVerified": boolean,
  "message": "explanation of verification result"
}
    `;

    try {
      const response = await this.model.invoke(prompt);
      const jsonMatch = response.content.toString().match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          isValid: result.isValid || false,
          autoVerified: result.autoVerified || false,
          message: result.message || 'Verification completed'
        };
      }
    } catch (error) {
      console.error('Task verification error:', error);
    }

    return {
      isValid: false,
      autoVerified: false,
      message: 'Unable to verify task automatically'
    };
  }
}

export const questAIService = new QuestAIService();