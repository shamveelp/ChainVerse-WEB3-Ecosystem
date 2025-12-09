import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IUserMarketController } from "../../core/interfaces/controllers/user/IUserMarket.controller";
import { IUserMarketService } from "../../core/interfaces/services/user/IUserMarketService";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";

@injectable()
export class UserMarketController implements IUserMarketController {
  constructor(
    @inject(TYPES.IUserMarketService)
    private _userMarketService: IUserMarketService
  ) { }

  async getListedCoins(req: Request, res: Response): Promise<void> {
    try {
      const coins = await this._userMarketService.getListedCoins();

      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.LISTED_MARKET_COINS_FETCHED,
        coins,
      });
    } catch (error) {
      logger.error(LoggerMessages.GET_LISTED_MARKET_COINS_ERROR, error);
      const err = error as any;
      const statusCode =
        err instanceof CustomError ? err.statusCode : StatusCode.BAD_REQUEST;
      const message =
        err instanceof CustomError
          ? err.message
          : ErrorMessages.FAILED_FETCH_LISTED_MARKET_COINS;

      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }
}


