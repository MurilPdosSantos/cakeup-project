import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { StoresService } from "../stores/stores.service";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly storesService: StoresService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService
  ) {}

  async validateStore(domain: string, password: string) {
    const store = await this.storesService.findByDomain(domain);
    if (!store) {
      throw new UnauthorizedException("Credenciais invalidas");
    }
    const ok = await bcrypt.compare(password, store.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Credenciais invalidas");
    }
    return store;
  }

  async login(domain: string, password: string) {
    const store = await this.validateStore(domain, password);
    const jti = randomUUID();
    const payload = { sub: store.id, domain: store.domain, jti };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  async logout(jti: string, exp: number) {
    const client = this.redisService.getClient();
    const ttl = Math.max(exp - Math.floor(Date.now() / 1000), 0);
    if (ttl > 0) {
      await client.set(`bl:${jti}`, "1", "EX", ttl);
    }
  }

  async isTokenBlacklisted(jti: string) {
    const client = this.redisService.getClient();
    const value = await client.get(`bl:${jti}`);
    return Boolean(value);
  }
}
