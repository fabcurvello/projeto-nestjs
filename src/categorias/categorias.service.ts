import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCategoriaDto } from './dto/create-categoria.dto.js';
import { Categoria } from './schemas/categoria.schema.js';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectModel(Categoria.name)
    private readonly categoriaModel: Model<Categoria>,
  ) {}
  async create(dto: CreateCategoriaDto) {
    try {
      return await this.categoriaModel.create(dto);
    } catch (error) {
      if ((error as Error).name === 'ValidationError') {
        throw new BadRequestException((error as Error).message);
      }
      throw error;
    }
  }
  findAll() {
    return this.categoriaModel.find().select('-__v').sort({ nome: 1 }).exec();
  }
}
