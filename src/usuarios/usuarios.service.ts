import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { Usuario } from './schemas/usuario.schema.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<Usuario>,
  ) {}
  async create(dto: CreateUsuarioDto) {
    try {
      // create() usa save() por baixo: o hook roda.
      await this.usuarioModel.create(dto);
    } catch (error) {
      this.tratarErro(error);
    }
    // Devolve sem a senha (nem o hash).
    return this.usuarioModel
      .findOne({
        email: dto.email.trim().toLowerCase(),
      })
      .select('-senha -__v');
  }

  findAll() {
    return this.usuarioModel.find().select('-senha -__v').exec();
  }

  async findOne(id: string) {
    let usuario: Usuario | null = null;
    try {
      usuario = await this.usuarioModel.findById(id).select('-senha -__v');
    } catch (error) {
      this.tratarErro(error);
    }
    if (!usuario) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }
    return usuario;
  }

  // Atenção: findByIdAndUpdate NÃO dispara o hook pre('save').
  // Por isso buscamos o documento, alteramos e usamos save().
  async update(id: string, dto: UpdateUsuarioDto) {
    let usuario;
    try {
      usuario = await this.usuarioModel.findById(id);
    } catch (error) {
      this.tratarErro(error);
    }
    if (!usuario) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }
    // Só os campos editáveis (o isModified decide a senha).
    if (dto.nome !== undefined) usuario.nome = dto.nome;
    if (dto.email !== undefined) usuario.email = dto.email;
    if (dto.senha !== undefined) usuario.senha = dto.senha;
    try {
      await usuario.save();
    } catch (error) {
      this.tratarErro(error);
    }
    return this.findOne(id);
  }
  
  // Converte erros do MongoDB/Mongoose em erros HTTP.
  private tratarErro(error: unknown): never {
    const e = error as {
      name?: string;
      code?: number;
      message?: string;
      errors?: Record<string, { message: string }>;
    };
    if (e.name === 'CastError') {
      throw new BadRequestException('O ID fornecido não é um ObjectId válido');
    }
    if (e.code === 11000) {
      throw new ConflictException('Já existe um usuário com este e-mail');
    }
    if (e.name === 'ValidationError' && e.errors) {
      throw new BadRequestException(
        Object.values(e.errors)
          .map((x) => x.message)
          .join(', '),
      );
    }
    throw error;
  }
}
