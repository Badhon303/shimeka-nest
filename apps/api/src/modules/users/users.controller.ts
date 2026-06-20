import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser, CustomerAuth } from '../../common/decorators';
import {
  AddressDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from './dto/users.dto';
import { UsersService } from './users.service';

@CustomerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('me/change-password')
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(userId, dto);
  }

  @Get('me/addresses')
  listAddresses(@CurrentUser('id') userId: string) {
    return this.usersService.listAddresses(userId);
  }

  @Post('me/addresses')
  createAddress(@CurrentUser('id') userId: string, @Body() dto: AddressDto) {
    return this.usersService.createAddress(userId, dto);
  }

  @Put('me/addresses/:id')
  updateAddress(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AddressDto,
  ) {
    return this.usersService.updateAddress(userId, id, dto);
  }

  @Delete('me/addresses/:id')
  deleteAddress(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.usersService.deleteAddress(userId, id);
  }
}
