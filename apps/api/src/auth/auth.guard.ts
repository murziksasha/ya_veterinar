import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { readSession, sessionCookieHeader } from "./session";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { cookie?: string };
      user?: unknown;
    }>();
    const claims = readSession(sessionCookieHeader(request.headers.cookie));
    if (!claims) {
      throw new UnauthorizedException("invalid_credentials");
    }
    request.user = await this.auth.me(claims.tenantId, claims.sub);
    return true;
  }
}
