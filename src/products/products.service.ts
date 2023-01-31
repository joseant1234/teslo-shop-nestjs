import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { DataSource, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { validate as isUUID } from 'uuid';
import { Product, ProductImage } from './entities';

@Injectable()
export class ProductsService {

  // lo que está en logger 'ProductsService' es el contexto, donde se está ejecutando el logger
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productDetails } = createProductDto;
      // solo crea la instancia del producto, aun no lo graba en la bd
      // las images deben de ser instancias de ProductImage
      // como se está creando dentro del create de productRepository, typeorm infiere q al crear una imagen el product property es el q se está creando
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map(image => this.productImageRepository.create({ url: image })),
      });
      // con el save se graba en bd
      await this.productRepository.save(product)

      return {...product, images };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true
      }
    });
    return products.map(({ images, ...rest }) => ({
      ...rest,
      images: images.map(img => img.url),
    }));
  }

  async findOne(term: string) {
    let product: Product;
    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
      // findOne({ where: { id: term }, relations: { images: true }})
    } else {
      // product = await this.productRepository.findOneBy({ slug: term });
      // prod es el alias
      // prodImages es el alias si requiero hacer otro join
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();
    }
    if (!product) {
      throw new NotFoundException(`Product with ${term} not found`);
    }
    // si hago el spread para mapear las imagenes, el problema es en el metodo de remove q al ejecutar el findOne espera una instancia y no un objeto q tenga la forma del Product
    return product;
  }
  async findOnePlain(term: string) {
    const { images = [], ...rest } = await this.findOne(term);
    return {
      ...rest,
      images: images.map(image => image.url),
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const { images, ...toUpdate } = updateProductDto;
    // busca un producto por el id, y le coloca las propiedades definidas en el dto, eso no actualiza
    const product = await this.productRepository.preload({
      id,
      ...toUpdate,
    });
    if (!product) throw new NotFoundException(`Product with id ${id} not found`);

    // Create query runner
    // el datasource conoce la cadena de conexion
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // si hay valores en la prop de imagenes que se envie en el dto, se borran
      if (images) {
        // el id es el del producto
        // se borra todas las imagenes cuyo productId sea el del id
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        // crea nuevas imagenes, pero sin impactar la bd
        product.images = images.map(image => this.productImageRepository.create({ url: image }));
      }
      // else {
      //   product.images = await this.productImageRepository.findBy({ product: { id }});
        // faltaria mapear para q solo sea un array de cadena
      // }
      await queryRunner.manager.save(product);
      // await this.productRepository.save(product);
      // hace el commit, impactando la bd
      await queryRunner.commitTransaction();
      // libera el queryRunner
      await queryRunner.release();
      return this.findOnePlain(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505')
      throw new BadRequestException(error.detail);
    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');
    try {
      return await query
        .delete()
        .where({})
        .execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
}
