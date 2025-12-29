import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from './tenant.interface';

export const Tenant = createParamDecorator(
  (data: keyof TenantContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request.tenant as TenantContext;

    return data ? tenant?.[data] : tenant;
  },
);
