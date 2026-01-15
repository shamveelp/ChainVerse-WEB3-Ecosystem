import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
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

export const validateDto = (
  dtoClass: any,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let dataToValidate = req[source];

      // Handle multipart form data
      if (req.headers['content-type']?.includes('multipart/form-data') && source === 'body') {
        dataToValidate = { ...req.body };

        // Parse JSON strings back to objects/arrays
        if (dataToValidate.rules && typeof dataToValidate.rules === 'string') {
          try {
            dataToValidate.rules = JSON.parse(dataToValidate.rules);
          } catch {
            dataToValidate.rules = [dataToValidate.rules];
          }
        }

        if (dataToValidate.socialLinks && typeof dataToValidate.socialLinks === 'string') {
          try {
            dataToValidate.socialLinks = JSON.parse(dataToValidate.socialLinks);
          } catch {
            dataToValidate.socialLinks = {};
          }
        }

        // Handle file fields - set to empty string if not provided
        if (req.files) {
          const files = req.files as { [fieldname: string]: Express.Multer.File[] };
          if (!files.logo) dataToValidate.logo = '';
          if (!files.banner) dataToValidate.banner = '';
        }
      }

      const dto = plainToClass(dtoClass, dataToValidate, {
        enableImplicitConversion: true,
        excludeExtraneousValues: false,
      });

      logger.debug(`Validating DTO for ${req.path} [${source}]`, { dto });

      const errors: ValidationError[] = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: false,
        skipMissingProperties: false,
        validationError: { target: false, value: false },
      });

      if (errors.length > 0) {
        const errorDetails = errors.map((error) => {
          const constraints = error.constraints || {};
          return {
            field: error.property,
            value: error.value,
            constraints,
          };
        });

        const firstError = errors[0];
        const firstConstraint = Object.values(firstError.constraints || {})[0];

        const response: ValidationErrorResponse = {
          success: false,
          error: firstConstraint || 'Validation failed',
          details: errorDetails,
        };

        logger.warn('DTO Validation failed:', {
          endpoint: req.path,
          method: req.method,
          errors: errorDetails,
        });

        return res.status(StatusCode.BAD_REQUEST).json(response);
      }

      if (source === 'body') {
        req.body = dto;
      } else {
        Object.assign(req[source], dto);
      }

      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Internal validation error',
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