import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { ZillizService } from 'src/zilliz/zilliz.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NovelService {
    // 上传目录
    private readonly uploadDir = join(process.cwd(),'upload');
    
    constructor(
        private prismaService:PrismaService,
        private zillizService:ZillizService
    ){
        // 初始化上传目录，不存在则创建
        if(!existsSync(this.uploadDir)){
            mkdirSync(this.uploadDir,{recursive:true});
            console.log(`创建上传目录:${this.uploadDir}`);
        }
    }

    async uploadNovel(file:Express.Multer.File,userId:string){
        // 检验文件格式
        if(!file.originalname.endsWith('.txt')){
            throw new BadRequestException('仅支持TXT格式文件');
        }

        // 校验文件大小
        const maxSize = 20*1024*1024;
        if(file.size>maxSize){
            throw new BadRequestException(`文件大小不能超过${maxSize/1024/1024}MB`);
        }

        // 生成唯一的文件名
        const fileName = `${randomUUID()}-${file.originalname}`;
        const filePath = join(this.uploadDir,fileName);

        // 保存文件到本地
        const writeStream = createWriteStream(filePath);
        writeStream.write(file.buffer);
        writeStream.end();

        // 保存小说信息到数据库
        const novel = await this.prismaService.novel.create({
            data:{
                name:fileName,
                filePath,
                fileSize:BigInt(file.size),
                userId
            }
        });
        return novel;
    }

    // 查询用户的小说列表
    async getNovelsByUsersId(userId:string){
        return this.prismaService.novel.findMany({
            where:{userId},
            orderBy:{createdAt:'desc'} // 按创建时间倒序
        });
    }

    // 删除小说
    async deleteNovel(novelId:string,userId:string){
        // 查询小说
        const novel = await this.prismaService.novel.findFirst({
            where:{id:novelId,userId}
        });
        if(!novel){
            throw new NotFoundException('小说不存在');
        }

        // 删除数据库记录
        await this.prismaService.novel.delete({
            where:{id:novelId}
        });

        // 删除本地文件
        if(existsSync(novel.filePath)){
            unlinkSync(novel.filePath);
            console.log(`删除文件：${novel.filePath}`);
        }

        // 删除向量
        await this.zillizService.deleteVectorsByNovelId(novelId);
        return { success:true, message:'删除成功' }
    }

    // 根据ID查询小说
    async getNovelById(novelId:string,userId:string){
        const novel = await this.prismaService.novel.findFirst({
            where:{id:novelId,userId}
        })
        if(!novel){
            throw new NotFoundException('小说不存在');
        }
        return novel;
    }

}
