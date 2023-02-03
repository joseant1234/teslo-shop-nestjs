import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException, Get, Param, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { FilesService } from './files.service';
import { fileFilter, fileNamer } from './helpers';


@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
  ) {}

  @Get('product/:imageName')
  findProductImage(
    @Res() res: Response,
    @Param('imageName') imageName: string
  ) {
    const path = this.filesService.getStaticProductImage(imageName);
    // en el momento q se usa el decorador @Res, se rompe el flujo de respuesta de nest para q manualmente se emita la respuesta
    // para retornar algo se usa res
    // de esta forma se saltan interceptores globales y el ciclo de vida de nest
    // res.status(403).json({
    //   ok: false,
    //   path,
    // })
    res.sendFile(path);
  }

  // el file dentro de FileInterceptor es el nombre de llave en el body q envia la imagen
  @Post('product')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: fileFilter,
    // limits: { fileSize: 1000 }
    storage: diskStorage({
      // ./ hace referencia al root del proyecto
      destination: './static/products',
      filename: fileNamer
    })
  }))
  uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
  ) {
    // el file es el resultado si paso o no en el interceptor
    if (!file) {
      throw new BadRequestException('Make sure that the file is an image');
    }

    const secureUrl = `${this.configService.get('HOST_API')}/files/product/${file.filename}`;
    // el originalname cambio al pasar por el fileNamer
    return { secureUrl };
  }

}
