import { Type } from "class-transformer";
import { IsOptional, IsPositive, Min } from "class-validator";

export class PaginationDto {

    @IsOptional()
    @IsPositive()
    @Type(() => Number)// Transforma, es lo mismo que en el app.useGlobalPipes(new ValidationPipe({ enableImplicitConversitions: true })) del main
    limit?: number;

    @IsOptional()
    @Min(0)
    @Type(() => Number)
    offset?: number;
}
