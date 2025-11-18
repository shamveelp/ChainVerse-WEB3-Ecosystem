import { IsOptional, IsString, IsBoolean, IsNumber, Min } from "class-validator";
import { Transform, Type } from "class-transformer";

export class GetCoinsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Page must be a number" })
  @Min(1, { message: "Page must be at least 1" })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Limit must be a number" })
  @Min(1, { message: "Limit must be at least 1" })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: "Search must be a string" })
  @Transform(({ value }) => value?.trim())
  search?: string = "";

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: "includeUnlisted must be a boolean" })
  includeUnlisted?: boolean = true;
}


