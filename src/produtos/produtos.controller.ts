import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProdutosService } from './produtos.service.js';
import { CreateProdutoDto } from './dto/create-produto.dto.js';
import { FiltrosProdutoDto } from './dto/filtros-produto.dto.js';
@ApiTags('produtos')
@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}
  // POST /produtos
  @Post()
  @ApiOperation({ summary: 'Cria um novo produto' })
  @ApiResponse({
    status: 201,
    description: 'Produto criado com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados recusados pelo Schema.',
  })
  @ApiResponse({
    status: 409,
    description: 'Produto já registrado.',
  })
  async criar(@Body() createProdutoDto: CreateProdutoDto) {
    return this.produtosService.create(createProdutoDto);
  }
  // GET /produtos?categoria=EPI&ordenar=preco_asc&pagina=2
  @Get()
  @ApiOperation({
    summary: 'Lista produtos com filtro, ordenação e paginação (5 por página)',
  })
  @ApiQuery({
    name: 'categoria',
    required: false,
    enum: ['Eletrônicos', 'Ferramentas', 'EPI'],
  })
  @ApiQuery({
    name: 'ordenar',
    required: false,
    enum: ['preco_asc', 'preco_desc'],
  })
  @ApiQuery({
    name: 'pagina',
    required: false,
    example: '1',
  })
  findAll(@Query() filtros: FiltrosProdutoDto) {
    return this.produtosService.findAll(filtros);
  }
  // GET /produtos/:id
  @Get(':id')
  @ApiOperation({ summary: 'Busca um produto pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Produto encontrado.',
  })
  @ApiResponse({
    status: 400,
    description: 'ID em formato inválido.',
  })
  @ApiResponse({
    status: 404,
    description: 'Produto não encontrado.',
  })
  buscarPorId(@Param('id') id: string) {
    return this.produtosService.findOne(id);
  }
}
