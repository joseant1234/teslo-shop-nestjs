import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';


@Injectable()
export class FilesService {

    getStaticProductImage(imageName: string) {
        // el __dirname permite ubicarte en la carpeta actual
        const path = join(__dirname, '../../static/products', imageName);
        // si no existe el path
        if (!existsSync(path)) {
            throw new BadRequestException(`No product found with image ${imageName}`);
        }
        return path;
    }
}
