import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from 'src/auth/get-user.decorator';
import { DirectoryCompany } from 'src/directory/entities/directory-company.entity';
import { User } from 'src/user/entities/user.entity';
import { CompanyService } from './company.service';
import {
  AddDirectoryToCompanyDto,
  RemoveDirectoryFromCompanyDto,
} from './dto/company-directory.dto';
import { CompanyResponseDto } from './dto/company-response.dto';

@ApiTags('company')
@Controller('company')
@ApiBearerAuth()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('my-companies')
  @ApiOperation({ summary: 'Récupérer mes companies' })
  @ApiResponse({
    status: 200,
    description: 'Mes companies',
    type: [CompanyResponseDto],
  })
  async findMyCompanies(@GetUser() user: User): Promise<CompanyResponseDto[]> {
    return await this.companyService.findUserCompanies(user.id);
  }

  @Post(':companyId/directories')
  @HttpCode(HttpStatus.CREATED)
  async addDirectoryToCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() addDirectoryDto: AddDirectoryToCompanyDto,
  ): Promise<DirectoryCompany> {
    return await this.companyService.addDirectoryToCompany(
      companyId,
      addDirectoryDto,
    );
  }

  @Delete(':companyId/directories')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDirectoryFromCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() removeDirectoryDto: RemoveDirectoryFromCompanyDto,
  ): Promise<void> {
    return await this.companyService.removeDirectoryFromCompany(
      companyId,
      removeDirectoryDto,
    );
  }

  @Patch(':companyId/directories/:directoryId/set-default')
  @HttpCode(HttpStatus.NO_CONTENT)
  async setDefaultDirectory(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('directoryId', ParseUUIDPipe) directoryId: string,
  ): Promise<void> {
    return await this.companyService.setDefaultDirectory(
      companyId,
      directoryId,
    );
  }
}
