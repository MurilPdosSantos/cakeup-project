import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("protected")
export class ProtectedController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getProtected(@Req() req: Request) {
    return {
      ok: true,
      user: req.user
    };
  }
}
