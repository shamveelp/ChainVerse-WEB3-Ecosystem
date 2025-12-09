import { inject, injectable } from "inversify";
import { IUserMarketService } from "../../core/interfaces/services/user/IUserMarket.service";
import { TYPES } from "../../core/types/types";
import { IDexRepository } from "../../core/interfaces/repositories/IDex.repository";
import { ICoin } from "../../models/coins.model";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";

@injectable()
export class UserMarketService implements IUserMarketService {
  constructor(
    @inject(TYPES.IDexRepository) private _dexRepository: IDexRepository
  ) {}

  async getListedCoins(): Promise<ICoin[]> {
    try {
      return await this._dexRepository.getListedCoins();
    } catch (error) {
      logger.error("Error getting listed market coins:", error);
      throw new CustomError(
        "Failed to get market coins",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}


