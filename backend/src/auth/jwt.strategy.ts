import { Injectable, NotFoundException } from "@nestjs/common";
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt,Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy,'jwt'){
    constructor(
        private configService: ConfigService,
        private prismaService: PrismaService
    ){
        super({
            // 从请求头的Authorization中提取Token
            jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken(),
            // 忽略Token过期
            ignoreExpiration:false,
            // JWT 密钥
            secretOrKey:configService.get('JWT_ACCESS_SECRET')
        })
    }
    // payload 是解码后的 JWT (JSON Web Token) 对象
    // sub 用来存储用户的唯一标识符
    async validte(payload:{sub:string}){
        // 根据userId查询用户，排除密码字段
        const user = await this.prismaService.user.findUnique({
            where:{id:payload.sub},
            select:{id:true,username:true,avatar:true}
        });
        if(!user){
            throw new NotFoundException('User Not Found');
        }
        return user;
    }
}