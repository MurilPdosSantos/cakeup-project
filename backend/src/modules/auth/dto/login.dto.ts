import { IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsString()
  domain: string;

  @IsString()
  @MinLength(6)
  password: string;
}
