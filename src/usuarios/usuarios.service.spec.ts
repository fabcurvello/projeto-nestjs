import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { vi } from 'vitest';
import { UsuariosService } from './usuarios.service.js';
import { Usuario } from './schemas/usuario.schema.js';
describe('UsuariosService', () => {
  let service: UsuariosService;
  // Model falso: os testes não precisam do MongoDB.
  const usuarioModel = {
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
  };
  const ID = '64f3a1b2c9e0d1f2a3b4c5d6';
  const dto = {
    nome: 'Bruno Lima',
    email: 'Bruno.Lima@empresa.com ',
    senha: 'minhaSenha123',
  };
  // Consulta falsa: x().select(...) devolve o valor.
  const comSelect = (valor: unknown, erro = false) => ({
    select: erro
      ? vi.fn().mockRejectedValue(valor)
      : vi.fn().mockResolvedValue(valor),
  });
  beforeEach(async () => {
    for (const m of Object.values(usuarioModel)) m.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: getModelToken(Usuario.name),
          useValue: usuarioModel,
        },
      ],
    }).compile();
    service = module.get<UsuariosService>(UsuariosService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('create deve gravar e devolver sem a senha', async () => {
    usuarioModel.create.mockResolvedValue({});
    const sel = comSelect({
      _id: ID,
      nome: 'Bruno Lima',
    });
    usuarioModel.findOne.mockReturnValue(sel);
    await expect(service.create(dto)).resolves.toMatchObject({
      _id: ID,
    });
    expect(usuarioModel.create).toHaveBeenCalledWith(dto);
    expect(usuarioModel.findOne).toHaveBeenCalledWith({
      email: 'bruno.lima@empresa.com',
    });
    expect(sel.select).toHaveBeenCalledWith('-senha -__v');
  });
  it('create deve lançar 409 para e-mail duplicado', async () => {
    usuarioModel.create.mockRejectedValue({
      code: 11000,
    });
    await expect(service.create(dto)).rejects.toThrow(
      new ConflictException('Já existe um usuário com este e-mail'),
    );
  });
  it('create deve lançar 400 para ValidationError', async () => {
    usuarioModel.create.mockRejectedValue({
      name: 'ValidationError',
      errors: {
        nome: { message: 'nome é obrigatório' },
      },
    });
    await expect(service.create(dto)).rejects.toThrow(
      new BadRequestException('nome é obrigatório'),
    );
  });
  it('findAll nunca deve pedir a senha', async () => {
    const consulta = {
      select: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    };
    usuarioModel.find.mockReturnValue(consulta);
    await service.findAll();
    expect(consulta.select).toHaveBeenCalledWith('-senha -__v');
  });
  it('findOne deve lançar 404 se não existir', async () => {
    usuarioModel.findById.mockReturnValue(comSelect(null));
    await expect(service.findOne(ID)).rejects.toThrow(NotFoundException);
  });
  it('findOne deve lançar 400 para ID inválido', async () => {
    usuarioModel.findById.mockReturnValue(
      comSelect({ name: 'CastError' }, true),
    );
    await expect(service.findOne('abc')).rejects.toThrow(BadRequestException);
  });
  describe('update', () => {
    it('deve usar save() (para disparar o hook), não findByIdAndUpdate', async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      const doc = { nome: 'Velho', save };
      // 1a chamada: findById() puro; 2a: findOne() com select.
      usuarioModel.findById
        .mockReturnValueOnce(Promise.resolve(doc))
        .mockReturnValueOnce(comSelect({ _id: ID, nome: 'Novo' }));
      const r = await service.update(ID, {
        nome: 'Novo',
      });
      expect(doc.nome).toBe('Novo');
      expect(save).toHaveBeenCalledTimes(1);
      expect(r).toMatchObject({ nome: 'Novo' });
    });
    it('só altera os campos enviados', async () => {
      const doc = {
        nome: 'A',
        email: 'a@a.com',
        senha: 'hash',
        save: vi.fn().mockResolvedValue(undefined),
      };
      usuarioModel.findById
        .mockReturnValueOnce(Promise.resolve(doc))
        .mockReturnValueOnce(comSelect({}));
      await service.update(ID, { nome: 'B' });
      expect(doc.email).toBe('a@a.com');
      expect(doc.senha).toBe('hash');
    });
    it('deve lançar 404 se o usuário não existir', async () => {
      usuarioModel.findById.mockReturnValue(Promise.resolve(null));
      await expect(service.update(ID, { nome: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
    it('deve lançar 409 se o novo e-mail já existir', async () => {
      const doc = {
        save: vi.fn().mockRejectedValue({ code: 11000 }),
      };
      usuarioModel.findById.mockReturnValue(Promise.resolve(doc));
      await expect(
        service.update(ID, { email: 'repetido@a.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
