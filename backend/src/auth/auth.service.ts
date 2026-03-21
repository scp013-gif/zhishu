import { Injectable,UnauthorizedException,BadRequestException, Body } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prismaService:PrismaService,
        private configService:ConfigService,
        private jwtService:JwtService
    ){}

    private generateTokens(userId:string){
        const accessToken = this.jwtService.sign(
            {sub:userId},
            {
                secret:this.configService.get('JWT_ACCESS_SECRET'),
                expiresIn:'15m' // 过期时间
            }
        )

        const refreshToken = this.jwtService.sign(
            {sub:userId},
            {
                secret:this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn:'7d'
            }
        )

        return {accessToken,refreshToken}

    }

    async register(username:string,password:string){
        const existingUser = await this.prismaService.user.findUnique({
            where:{
                username
            }
        });

        if(existingUser){
            throw new BadRequestException('用户已存在');
        }

        const hashPassword = await bcrypt.hash(password,10);

        const user = await this.prismaService.user.create({
            data:{
                username,
                password:hashPassword
            },
            select:{id:true,username:true,avatar:true}
        })

        const tokens = this.generateTokens(user.id);

        return {user,...tokens};

    }

   async login(username:string,password:string){
    const user = await this.prismaService.user.findUnique({
        where:{username}
    })

    if(!user) {
        throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password,user.password)
    if(!isPasswordValid) {
        throw new UnauthorizedException('用户名或密码错误');
    }

    const tokens = this.generateTokens(user.id);
    return {
        user:{id:user.id,username:user.username,avatar:user.avatar},
        ...tokens
    }
   }

   async refreshToken(refreshToken:string){
    try{
        // 验证refreshToken合法性
        const payload = this.jwtService.verify(refreshToken,{
            secret: this.configService.get('JWT_REFRESH_SECRET')
        });

        const newAccessToken = this.jwtService.sign(
            {sub:payload.sub},
            {
                secret:this.configService.get('JWT_ACCESS_SECRET'),
                expiresIn:'15m'
            }
        )
        return {accesstoken:newAccessToken}
    }catch(err){
        throw new UnauthorizedException('刷新token无效，请重新登录')
    }
   }
}
