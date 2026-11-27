import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';

// Custo do hash: cada +1 dobra o tempo de cálculo.
const SALT_ROUNDS = 10;

// Aula 26: Atividade Prática "O Guardião de Acessos".
@Schema({ timestamps: true })
export class Usuario {

  @Prop({ required: true, trim: true })
  nome: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  email: string;

  @Prop({ required: true })
  senha: string;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);

// Hook pre('save'): roda ANTES de gravar o documento.
// function (e não arrow): precisa do "this" do documento.
UsuarioSchema.pre('save', async function () {
  // Só criptografa se a senha foi criada ou alterada.
  // Sem isto, o hash seria "hasheado" de novo a cada save.
  if (!this.isModified('senha')) return;
  
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  this.senha = await bcrypt.hash(this.senha, salt);
});
