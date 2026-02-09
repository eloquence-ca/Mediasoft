import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { FileService } from './file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Readable } from 'stream';
import { ROLES, Roles } from 'src/auth/role/roles.decorator';
import { RoleGuard } from 'src/auth/role/role.guard';
import { Public } from 'src/auth/jwt-auth.guard';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.fileService.remove(id);
    return { mesage: 'File delete' };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { dest: FileService.destination() }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.fileService.save(file);
  }

  @Public()
  @Get('download/:key')
  async download(@Param('key') key: string, @Res() res: Response) {
    const response = await this.fileService.download(key);
    res.setHeader('Content-disposition', `attachment; filename=${key}`);
    res.setHeader(
      'Content-type',
      response.ContentType ?? 'application/octet-stream',
    );
    const stream = new Readable();
    if (response.Body) {
      stream.push(await response.Body.transformToByteArray());
    } else {
      stream.push(null);
      res.status(HttpStatus.NOT_FOUND).json({ message: 'File not found' });
      return;
    }
    stream.push(null);
    stream.pipe(res);
  }
}
