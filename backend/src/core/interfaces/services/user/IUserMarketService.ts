import { ICoin } from "../../../../models/coins.model";

export interface IUserMarketService {
  getListedCoins(): Promise<ICoin[]>;
}


