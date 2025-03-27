// src/common/utils/check-permissions.util.ts
import { ForbiddenException } from '@nestjs/common';

export const checkPermissions = (requestUser: any, resourceUserId: number) => {
  if (requestUser.role === 'admin') return;
  if (requestUser.userId === resourceUserId) return;
  throw new ForbiddenException('Not authorized to access this route');
};
