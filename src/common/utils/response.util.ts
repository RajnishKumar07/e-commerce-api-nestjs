import { HttpStatus } from '@nestjs/common';

export interface ResponseStructure<T> {
  statusCode: number;
  message: string;
  data?: T;
}

export function createResponse<T>(
  statusCode: HttpStatus,
  message: string,
  data?: T,
): ResponseStructure<T> {
  return { statusCode, message, data };
}

export function createListResponse<T>(
  items: T,
  totalItems: number,
  currentPage: number,
  pageSize: number,
  totalPages: number,
) {
  return {
    statusCode: HttpStatus.OK,
    message: 'Data fetched successfully',
    data: {
      items,
      pagination: {
        totalItems,
        currentPage,
        pageSize,
        totalPages,
      },
    },
  };
}
