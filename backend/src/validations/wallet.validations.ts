import { z } from "zod";

export const walletSchema = z.object({
  walletAddress: z.string().min(1, "Wallet address is required"),
  type: z.string().min(1, "Wallet type is required"),
  chainId: z.number().optional(),
  authMethod: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});