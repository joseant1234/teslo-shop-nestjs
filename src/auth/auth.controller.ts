import { Controller, Get, Post, Body, UseGuards, Headers, SetMetadata, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IncomingHttpHeaders } from 'http';
import { AuthService } from './auth.service';
import { Auth, GetUser, RawHeaders, RoleProtected } from './decorators';
import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';
import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { ValidRoles } from './interfaces';



@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('check-status')
  @Auth()
  checkAuthStatus(
    @GetUser() user: User,
  ) {
    return this.authService.checkAuthStatus(user);
  }

  // si puede usar un pipe parse... GetUser('isActive', ParseBoolean)
  @Get('private')
  @UseGuards(AuthGuard())
  testingPrivateRoute(
    @GetUser() user: User,
    @GetUser('email') userEmail: string,
    @RawHeaders() rawHeaders: string[],
    @Headers() headers: IncomingHttpHeaders,
  ) {
    return {
      ok: true,
      message: 'Private',
      user,
      userEmail,
      rawHeaders,
      headers,
    }
  }

  // set metadata adiciona informacion extra al metodo, controlador a ejecutar
  // AuthGuard internamente crea una instancia q la retorna es por eso q no se usa new AuthGuard
  // no se usa new UserRoleGuard() porque eso haría q cada vez q entre una nueva solicitud crea una nueva instancia
  @Get('private2')
  @SetMetadata('roles', ['admin', 'super-user'])
  @UseGuards(AuthGuard(), UserRoleGuard)
  testingAnotherPrivateRoute(
    @GetUser() user: User,
    @Req() req,
  ) {
    return {
      ok: true,
      user,
    }
  }

  @Get('private3')
  @RoleProtected(ValidRoles.superUser, ValidRoles.admin)
  @UseGuards(AuthGuard(), UserRoleGuard)
  testingAnotherPrivate3Route(
    @GetUser() user: User,
  ) {
    return {
      ok: true,
      user,
    }
  }

  @Get('private4')
  @Auth(ValidRoles.admin, ValidRoles.superUser)
  testingAnotherPrivate4Route(
    @GetUser() user: User,
  ) {
    return {
      ok: true,
      user,
    }
  }
}
