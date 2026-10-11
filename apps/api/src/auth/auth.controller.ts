import { Body, Controller, Get, HttpCode, Post, Res, UseGuards } from "@nestjs/common";
import type { AuthUser } from "@vetsync/shared";
import { AuthService } from "./auth.service";
import { AuthGuard } from "./auth.guard";
import { CurrentUser } from "./current-user";
import { clearSessionCookie, issueSession, setSessionCookie } from "./session";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  async register(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: { setHeader(name: string, value: string): void },
  ): Promise<AuthUser> {
    const user = await this.auth.register(body);
    setSessionCookie(res, issueSession(user.id, user.tenantId));
    return user;
  }

  @Post("login")
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: { setHeader(name: string, value: string): void },
  ): Promise<AuthUser> {
    const user = await this.auth.login(body);
    setSessionCookie(res, issueSession(user.id, user.tenantId));
    return user;
  }

  @Post("logout")
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: { setHeader(name: string, value: string): void }): { ok: true } {
    clearSessionCookie(res);
    return { ok: true };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
