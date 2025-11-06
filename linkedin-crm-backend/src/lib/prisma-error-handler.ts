import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

/**
 * Prisma error codes reference:
 * P2002: Unique constraint violation
 * P2003: Foreign key constraint violation
 * P2025: Record not found (for update/delete operations)
 */

export interface PrismaErrorResponse {
  response: NextResponse;
  handled: boolean;
}

/**
 * Handles Prisma-specific errors and returns appropriate HTTP responses
 * @param error - The error object (can be Prisma error or generic Error)
 * @param corsHeaders - CORS headers to include in the response
 * @param defaultMessage - Default error message if error type is unknown
 * @returns Object with response and handled flag
 */
export function handlePrismaError(
  error: unknown,
  corsHeaders: Record<string, string>,
  defaultMessage: string = 'An unexpected error occurred'
): PrismaErrorResponse {
  // Handle Prisma known request errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2025':
        // Record not found (for update/delete operations)
        return {
          response: NextResponse.json(
            { error: 'Record not found' },
            { status: 404, headers: corsHeaders }
          ),
          handled: true,
        };

      case 'P2002':
        // Unique constraint violation
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] || 'field';
        return {
          response: NextResponse.json(
            { error: `A record with this ${field} already exists` },
            { status: 409, headers: corsHeaders }
          ),
          handled: true,
        };

      case 'P2003':
        // Foreign key constraint violation
        return {
          response: NextResponse.json(
            { error: 'Invalid reference or data' },
            { status: 400, headers: corsHeaders }
          ),
          handled: true,
        };

      case 'P2014':
        // Required relation violation
        return {
          response: NextResponse.json(
            { error: 'Required relation is missing' },
            { status: 400, headers: corsHeaders }
          ),
          handled: true,
        };

      case 'P2000':
        // Value too long for column
        return {
          response: NextResponse.json(
            { error: 'Value too long for field' },
            { status: 400, headers: corsHeaders }
          ),
          handled: true,
        };

      case 'P2001':
        // Record does not exist (for findUnique)
        return {
          response: NextResponse.json(
            { error: 'Record not found' },
            { status: 404, headers: corsHeaders }
          ),
          handled: true,
        };

      default:
        // Other Prisma errors
        console.error('Prisma error code:', error.code, error.message);
        return {
          response: NextResponse.json(
            { error: `Database error: ${error.message}` },
            { status: 500, headers: corsHeaders }
          ),
          handled: true,
        };
    }
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      response: NextResponse.json(
        { error: 'Invalid data provided' },
        { status: 400, headers: corsHeaders }
      ),
      handled: true,
    };
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Check if it's a Prisma error by code property (for cases where instanceof doesn't work)
    if ('code' in error) {
      const code = (error as { code?: string }).code;
      if (code === 'P2025') {
        return {
          response: NextResponse.json(
            { error: 'Record not found' },
            { status: 404, headers: corsHeaders }
          ),
          handled: true,
        };
      }
      if (code === 'P2002') {
        return {
          response: NextResponse.json(
            { error: 'A record with this value already exists' },
            { status: 409, headers: corsHeaders }
          ),
          handled: true,
        };
      }
    }

    // Generic error
    console.error('Error:', error.message);
    return {
      response: NextResponse.json(
        { error: error.message || defaultMessage },
        { status: 500, headers: corsHeaders }
      ),
      handled: true,
    };
  }

  // Unknown error type
  console.error('Unknown error:', error);
  return {
    response: NextResponse.json(
      { error: defaultMessage },
      { status: 500, headers: corsHeaders }
    ),
    handled: true,
  };
}

