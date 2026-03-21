import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() body:LoginDto
  ){
    return this.authService.register(body.username,body.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body:LoginDto
  ){
    return this.authService.login(body.username,body.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body:{refresh:string}
  ){
    return this.authService.refreshToken(body.refresh)
  }
}
