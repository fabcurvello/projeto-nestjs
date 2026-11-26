import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Produto as ProdutoMemoria } from './interfaces/produto.interface.js';
import { CreateProdutoDto } from './dto/create-produto.dto.js';
import { FiltrosProdutoDto } from './dto/filtros-produto.dto.js';
import { Produto } from './schemas/produto.schema.js';

// Aula 22: tamanho fixo da página.
const ITENS_POR_PAGINA = 5;

@Injectable()
export class ProdutosService {
  // Aula 15: acervo simulado em memória (GET por ID).
  // As buscas só migram para o MongoDB na próxima aula.
  private readonly produtos: ProdutoMemoria[] = [
    { id: 1, nome: 'Notebook', preco: 3500 },
    { id: 2, nome: 'Mouse', preco: 80 },
    { id: 3, nome: 'Teclado', preco: 150 },
  ];

  // Aula 21: o Model do Mongoose é injetado no Service.
  constructor(
    @InjectModel(Produto.name)
    private readonly produtoModel: Model<Produto>,
  ) {}

  // Aula 21: Atividade Prática "Cadastro de Maquinário
  // Industrial". Grava de verdade no MongoDB.
  async create(createProdutoDto: CreateProdutoDto) {
    try {
      return await this.produtoModel.create(createProdutoDto);
    } catch (error) {
      // Duplicidade (nome com unique: true): código 11000.
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException(
          'Este equipamento já está registrado no sistema',
        );
      }
      // Regras do Schema (enum, min...): ValidationError.
      if ((error as Error).name === 'ValidationError') {
        const mensagens = Object.values(
          (
            error as unknown as {
              errors: Record<string, { message: string }>;
            }
          ).errors,
        ).map((e) => e.message);
        throw new BadRequestException(mensagens.join(', '));
      }
      throw error;
    }
  }

  // Aula 22: filtro por categoria, ordenação por preço e
  // paginação de 5 itens. select('-__v') impede que o campo
  // de versão do Mongoose apareça na resposta.
  async findAll(filtros: FiltrosProdutoDto) {
    const pagina = Number(filtros.pagina) > 0 ? Number(filtros.pagina) : 1;
    const skip = (pagina - 1) * ITENS_POR_PAGINA;
    
    const query: { categoria?: string } = {};
    if (filtros.categoria) {
      query.categoria = filtros.categoria;
    }

    const sort: Record<string, 1 | -1> = {};
    if (filtros.ordenar === 'preco_asc') sort.preco = 1;
    if (filtros.ordenar === 'preco_desc') sort.preco = -1;
    return this.produtoModel
      .find(query)
      .select('-__v')
      .sort(sort)
      .skip(skip)
      .limit(ITENS_POR_PAGINA)
      .exec();
  }
  findOne(idParam: string): ProdutoMemoria {
    // Erro 1: o ID da rota não é um número inteiro.
    if (!/^\d+$/.test(idParam)) {
      throw new BadRequestException('O ID fornecido deve ser do tipo inteiro');
    }
    const id = Number(idParam);
    const produto = this.produtos.find((p) => p.id === id);

    // Erro 2: ID válido, mas nenhum produto com ele.
    if (!produto) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado`);
    }
    return produto;
  }
}
