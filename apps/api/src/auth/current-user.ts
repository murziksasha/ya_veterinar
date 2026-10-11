import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthUser } from "@vetsync/shared";

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
  return request.user;
});
