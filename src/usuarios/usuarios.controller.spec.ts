import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';
describe('UsuariosController', () => {
  let controller: UsuariosController;
  // Service falso: o controller é testado sem o Mongoose.
  const usuariosService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuariosController],
      providers: [
        {
          provide: UsuariosService,
          useValue: usuariosService,
        },
      ],
    }).compile();
    controller = module.get<UsuariosController>(UsuariosController);
  });
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  it('criar deve repassar os dados ao service', async () => {
    const dto = {
      nome: 'Bruno',
      email: 'b@empresa.com',
      senha: '123',
    };
    usuariosService.create.mockResolvedValue({
      _id: 'abc',
    });
    await expect(controller.criar(dto)).resolves.toEqual({
      _id: 'abc',
    });
    expect(usuariosService.create).toHaveBeenCalledWith(dto);
  });
  it('listar, buscar e atualizar repassam ao service', async () => {
    usuariosService.findAll.mockResolvedValue([]);
    usuariosService.findOne.mockResolvedValue({
      _id: 'abc',
    });
    usuariosService.update.mockResolvedValue({
      nome: 'Novo',
    });
    await expect(controller.listar()).resolves.toEqual([]);
    await expect(controller.buscar('abc')).resolves.toEqual({
      _id: 'abc',
    });
    await controller.atualizar('abc', { nome: 'Novo' });
    expect(usuariosService.update).toHaveBeenCalledWith('abc', {
      nome: 'Novo',
    });
  });
});
