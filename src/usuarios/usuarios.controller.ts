import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
@ApiTags('usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // POST /usuarios
  @Post()
  @ApiOperation({ summary: 'Cadastra um usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado.',
  })

  @ApiResponse({
    status: 400,
    description: 'Dados inválidos.',
  })

  @ApiResponse({
    status: 409,
    description: 'E-mail já cadastrado.',
  })

  criar(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  // GET /usuarios
  @Get()
  @ApiOperation({
    summary: 'Lista os usuários (sem a senha)',
  })
  listar() {
    return this.usuariosService.findAll();
  }

  // GET /usuarios/:id
  @Get(':id')
  @ApiOperation({ summary: 'Busca um usuário pelo ID' })
  @ApiResponse({
    status: 404,
    description: 'Não encontrado.',
  })

  buscar(@Param('id') id: string) {
    return this.usuariosService.findOne(id);
  }

  // PATCH /usuarios/:id
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza parcialmente um usuário',
  })

  @ApiResponse({
    status: 404,
    description: 'Não encontrado.',
  })

  @ApiResponse({
    status: 409,
    description: 'E-mail já cadastrado.',
  })
  
  atualizar(@Param('id') id: string, @Body() dto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, dto);
  }
}
