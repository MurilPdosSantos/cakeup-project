import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards
} from "@nestjs/common";
import { Response, Request } from "express";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

interface AuthedRequest extends Request {
  user: { storeId: string; domain: string; jti: string };
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService
  ) {}

  @Post("login")
  async login(@Body() body: LoginDto, @Res() res: Response) {
    const { accessToken, modules } = await this.authService.login(
      body.domain,
      body.password
    );

    const isProd = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax" as const,
      maxAge: 1000 * 60 * 60,
      path: "/"
    };
    res.cookie("access_token", accessToken, {
      ...cookieOptions
    });

    return res.json({ ok: true, modules });
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@Req() req: AuthedRequest) {
    const modules = await this.authService.getStoreModules(req.user.storeId);
    return { modules };
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(@Req() req: Request, @Res() res: Response) {
    const token =
      req.cookies?.["access_token"] ||
      (req.headers.authorization || "").replace("Bearer ", "");

    const payload = token ? this.jwtService.decode(token) : null;
    if (payload && typeof payload === "object" && "jti" in payload) {
      const { jti, exp } = payload as { jti: string; exp: number };
      await this.authService.logout(jti, exp);
    }

    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/"
    });
    return res.json({ ok: true });
  }
}
