import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { vi } from 'vitest';
import { ProdutosService } from './produtos.service.js';
import { Produto } from './schemas/produto.schema.js';
describe('ProdutosService', () => {
  let service: ProdutosService;
  // Model falso: os testes não precisam do MongoDB.
  const produtoModel = {
    create: vi.fn(),
    find: vi.fn(),
  };
  // Cadeia find().select().sort().skip().limit().exec() falsa.
  const consulta = {
    select: vi.fn(),
    sort: vi.fn(),
    skip: vi.fn(),
    limit: vi.fn(),
    exec: vi.fn(),
  };
  const dto = {
    nome: 'Torno CNC X200',
    preco: 15000,
    categoria: 'Ferramentas',
  };
  beforeEach(async () => {
    produtoModel.create.mockReset();
    produtoModel.find.mockReset().mockReturnValue(consulta);
    for (const metodo of ['select', 'sort', 'skip', 'limit']) {
      consulta[metodo as 'select'].mockReset().mockReturnValue(consulta);
    }
    consulta.exec.mockReset().mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProdutosService,
        {
          provide: getModelToken(Produto.name),
          useValue: produtoModel,
        },
      ],
    }).compile();
    service = module.get<ProdutosService>(ProdutosService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('create deve devolver o documento gravado', async () => {
    produtoModel.create.mockResolvedValue({
      _id: 'abc123',
      ...dto,
    });
    const criado = await service.create(dto);
    expect(produtoModel.create).toHaveBeenCalledWith(dto);
    expect(criado).toMatchObject({ _id: 'abc123' });
  });
  it('create deve lançar 409 para nome duplicado (11000)', async () => {
    produtoModel.create.mockRejectedValue({
      code: 11000,
    });
    await expect(service.create(dto)).rejects.toThrow(
      new ConflictException('Este equipamento já está registrado no sistema'),
    );
  });
  it('create deve lançar 400 para ValidationError', async () => {
    produtoModel.create.mockRejectedValue({
      name: 'ValidationError',
      errors: {
        categoria: { message: 'categoria inválida' },
      },
    });
    await expect(service.create(dto)).rejects.toThrow(
      new BadRequestException('categoria inválida'),
    );
  });
  it('create deve repassar outros erros', async () => {
    const falha = new Error('banco fora do ar');
    produtoModel.create.mockRejectedValue(falha);
    await expect(service.create(dto)).rejects.toBe(falha);
  });
  it('findAll deve filtrar, ordenar e paginar', async () => {
    await service.findAll({
      categoria: 'EPI',
      ordenar: 'preco_asc',
      pagina: '2',
    });
    expect(produtoModel.find).toHaveBeenCalledWith({
      categoria: 'EPI',
    });
    expect(consulta.select).toHaveBeenCalledWith('-__v');
    expect(consulta.sort).toHaveBeenCalledWith({
      preco: 1,
    });
    expect(consulta.skip).toHaveBeenCalledWith(5);
    expect(consulta.limit).toHaveBeenCalledWith(5);
  });
  it('findAll sem filtros usa a página 1 e não filtra', async () => {
    await service.findAll({});
    expect(produtoModel.find).toHaveBeenCalledWith({});
    expect(consulta.sort).toHaveBeenCalledWith({});
    expect(consulta.skip).toHaveBeenCalledWith(0);
  });
  it('findAll ordena por preço decrescente', async () => {
    await service.findAll({ ordenar: 'preco_desc' });
    expect(consulta.sort).toHaveBeenCalledWith({
      preco: -1,
    });
  });
  it('findAll volta à página 1 se a página for inválida', async () => {
    await service.findAll({ pagina: 'abc' });
    expect(consulta.skip).toHaveBeenCalledWith(0);
    await service.findAll({ pagina: '-3' });
    expect(consulta.skip).toHaveBeenLastCalledWith(0);
  });
  it('findOne deve retornar o produto encontrado', () => {
    expect(service.findOne('1')).toEqual({
      id: 1,
      nome: 'Notebook',
      preco: 3500,
    });
  });
  it('findOne deve lançar BadRequestException para ID não numérico', () => {
    expect(() => service.findOne('abc')).toThrow(
      new BadRequestException('O ID fornecido deve ser do tipo inteiro'),
    );
  });
  it('findOne deve lançar NotFoundException para ID inexistente', () => {
    expect(() => service.findOne('999')).toThrow(
      new NotFoundException('Produto com ID 999 não encontrado'),
    );
  });
});
