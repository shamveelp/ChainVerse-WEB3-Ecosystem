import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToClass, Transform } from 'class-transformer';
import { StatusCode } from '../enums/statusCode.enum';
import logger from '../utils/logger';

export interface ValidationErrorResponse {
  success: false;
  error: string;
  details?: Array<{
    field: string;
    value: any;
    constraints: Record<string, string>;
  }>;
}

export const validateDto = (dtoClass: any, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Transform plain object to class instance
      const dto = plainToClass(dtoClass, req[source], {
        enableImplicitConversion: true,
        excludeExtraneousValues: false,
      });

      // Validate the DTO
      const errors: ValidationError[] = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: false, // Allow extra properties for now
        skipMissingProperties: false,
        validationError: { target: false, value: false }
      });

      if (errors.length > 0) {
        const errorDetails = errors.map(error => {
          const constraints = error.constraints || {};
          return {
            field: error.property,
            value: error.value,
            constraints
          };
        });

        // Get the first error message
        const firstError = errors[0];
        const firstConstraint = Object.values(firstError.constraints || {})[0];
        
        const response: ValidationErrorResponse = {
          success: false,
          error: firstConstraint || 'Validation failed',
          details: errorDetails
        };

        logger.warn('DTO Validation failed:', { 
          endpoint: req.path, 
          method: req.method, 
          errors: errorDetails 
        });

        return res.status(StatusCode.BAD_REQUEST).json(response);
      }

      // Replace the request data with the validated DTO
      req[source] = dto;
      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Internal validation error'
      });
    }
  };
};

export const validateQuery = (dtoClass: any) => validateDto(dtoClass, 'query');
export const validateParams = (dtoClass: any) => validateDto(dtoClass, 'params');
export const validateBody = (dtoClass: any) => validateDto(dtoClass, 'body');

// Helper function to create validation decorators
export const createValidationMiddleware = (dtoClass: any) => {
  return validateBody(dtoClass);
};