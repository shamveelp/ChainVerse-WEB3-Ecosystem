import { StatusCode } from "../enums/statusCode.enum"

export class CustomError extends Error {
  statusCode: StatusCode

  constructor(message: string, statusCode: StatusCode = StatusCode.INTERNAL_SERVER_ERROR) {
    super(message)
    this.name = "CustomError"
    this.statusCode = statusCode
    Object.setPrototypeOf(this, CustomError.prototype)
  }
}
