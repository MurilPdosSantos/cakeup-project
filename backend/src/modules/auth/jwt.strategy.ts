import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "./auth.service";

function cookieExtractor(req: { cookies?: Record<string, string> }) {
  if (req?.cookies?.["access_token"]) {
    return req.cookies["access_token"];
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken()
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "dev_secret_change_me"
    });
  }

  async validate(payload: { sub: string; domain: string; jti: string }) {
    const isBlacklisted = await this.authService.isTokenBlacklisted(payload.jti);
    if (isBlacklisted) {
      throw new UnauthorizedException("Token revogado");
    }
    return { storeId: payload.sub, domain: payload.domain, jti: payload.jti };
  }
}
