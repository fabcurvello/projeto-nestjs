import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { UsuarioSchema } from './usuario.schema.js';
// Testa o hook pre('save') sem precisar do MongoDB: os hooks
// registrados no Schema são chamados diretamente.
describe('UsuarioSchema (hook pre-save)', () => {
  const Modelo = mongoose.model('UsuarioTeste', UsuarioSchema);
  // Roda os hooks "pre save" registrados no Schema.
  const rodarHook = async (doc: InstanceType<typeof Modelo>) => {
    const hooks =
      (
        UsuarioSchema as unknown as {
          s: {
            hooks: {
              _pres: Map<string, { fn: () => Promise<void> }[]>;
            };
          };
        }
      ).s.hooks._pres.get('save') ?? [];
    for (const h of hooks) await h.fn.call(doc);
  };
  // Documento "já gravado" (como se viesse do banco).
  const doBanco = (senha: string) =>
    Modelo.hydrate({
      _id: new mongoose.Types.ObjectId(),
      nome: 'Ana',
      email: 'ana@empresa.com',
      senha,
    });
  it('deve criptografar a senha de um usuário novo', async () => {
    const doc = new Modelo({
      nome: 'Ana',
      email: 'ana@empresa.com',
      senha: 'minhaSenha123',
    });
    await rodarHook(doc);
    expect(doc.senha).not.toBe('minhaSenha123');
    expect(doc.senha.startsWith('$2')).toBe(true);
    await expect(bcrypt.compare('minhaSenha123', doc.senha)).resolves.toBe(
      true,
    );
  });
  it('não deve criptografar de novo se a senha não mudou', async () => {
    const hash = await bcrypt.hash('minhaSenha123', 4);
    const doc = doBanco(hash);
    doc.nome = 'Ana Maria';
    await rodarHook(doc);
    expect(doc.senha).toBe(hash);
  });
  it('deve gerar hash novo quando a senha muda', async () => {
    const hash = await bcrypt.hash('minhaSenha123', 4);
    const doc = doBanco(hash);
    doc.senha = 'outraSenha456';
    await rodarHook(doc);
    expect(doc.senha).not.toBe(hash);
    await expect(bcrypt.compare('outraSenha456', doc.senha)).resolves.toBe(
      true,
    );
  });
});
