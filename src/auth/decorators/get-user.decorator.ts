import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";

// en el data es lo q se envia al llamar el decorator
// GetUser('email'), data tendria: 'email'
// para multiples valores GetUser(['email', 'role', 'name'])
export const GetUser = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        // en este caso la data solo va recibir un string, va ser la prop del user q se quiere mostrar
        // el ctx es donde se está ejecutando la app en el momento de la llamada al decorador
        const req = ctx.switchToHttp().getRequest()
        const user = req.user;
        // error 500 porque se tenia q tener el user al usar el authguard
        if (!user)
            throw new InternalServerErrorException('User not found (request)')
        return !data ? user : user[data];
    }
);
