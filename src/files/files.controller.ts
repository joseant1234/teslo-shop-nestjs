import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FilesService } from './files.service';
import { fileFilter, fileNamer } from './helpers';


@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

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
    // el originalname cambio al pasar por el fileNamer
    return { fileName: file.originalname };
  }

}
