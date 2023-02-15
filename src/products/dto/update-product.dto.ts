// import { PartialType } from '@nestjs/mapped-types';
import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

// si se va documentar se importa el partialType de la lib de swagger
export class UpdateProductDto extends PartialType(CreateProductDto) {}
