import { Controller, Delete, Get, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { NovelService } from './novel.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';

@Controller('novel')
@UseGuards(AuthGuard('jwt'))
export class NovelController {
  constructor(private readonly novelService: NovelService) {}

  // 上传小说接口
  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // 拦截名为file的文件字段
  async uploadNovel(
    @UploadedFile() file:Express.Multer.File, // 获取上传的文件
    @Req() req:any // 请求对象，req.user由JwtStrategy验证后挂载
  ){
    return this.novelService.uploadNovel(file,req.user.id)
  }

  // 查询用户的小说列表
  @Get('list')
  async getNovels(@Req() req:any){
    return this.novelService.getNovelsByUsersId(req.user.id);
  }

  // 删除小说
  @Delete(':id')
  async deleteNovel(
    @Param('id') novelId:string,// 路径参数：小说ID
    @Req() req:any
  ){
    return this.novelService.deleteNovel(novelId,req.user.id);
  }
}
