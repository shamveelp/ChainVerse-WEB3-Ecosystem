import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class BaseResponseDto {
  @IsBoolean()
  success: boolean;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  error?: string;

  constructor(success: boolean, message?: string, error?: string) {
    this.success = success;
    this.message = message;
    this.error = error;
  }
}

export class PaginatedResponseDto<T> extends BaseResponseDto {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  constructor(
    data: T[],
    total: number,
    page: number,
    limit: number,
    success: boolean = true,
    message?: string
  ) {
    super(success, message);
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}