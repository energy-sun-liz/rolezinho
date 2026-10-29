// Pix copia-e-cola (BR Code, padrão EMV do Banco Central).
//
// O organizador cola UMA vez o próprio Pix estático, sem valor. Para cada
// convidado remontamos o código com o valor exato e um identificador, e
// recalculamos o CRC. Nenhum dinheiro passa pelo Rolêzinho.

export type CampoEmv = { id: string; valor: string };

export type DadosPix = {
  chave: string;
  nome: string;
  cidade: string;
  valor?: string;
  identificador?: string;
};

export class PixInvalido extends Error {}

export function lerCampos(codigo: string): CampoEmv[] {
  const campos: CampoEmv[] = [];
  let i = 0;
  while (i < codigo.length) {
    const id = codigo.slice(i, i + 2);
    const tamanho = Number(codigo.slice(i + 2, i + 4));
    if (id.length < 2 || !Number.isInteger(tamanho) || i + 4 + tamanho > codigo.length) {
      throw new PixInvalido('Código Pix mal formado.');
    }
    campos.push({ id, valor: codigo.slice(i + 4, i + 4 + tamanho) });
    i += 4 + tamanho;
  }
  return campos;
}

function campo(id: string, valor: string): string {
  if (valor.length > 99) throw new PixInvalido(`Campo ${id} longo demais.`);
  return id + String(valor.length).padStart(2, '0') + valor;
}

/** CRC16-CCITT (polinômio 0x1021, início 0xFFFF), exigido pelo BR Code. */
export function crc16(texto: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(texto)) {
    crc ^= byte << 8;
    for (let k = 0; k < 8; k++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function crcConfere(codigo: string): boolean {
  return codigo.length > 8 && crc16(codigo.slice(0, -4)) === codigo.slice(-4).toUpperCase();
}

function porId(campos: CampoEmv[]): Record<string, string> {
  return Object.fromEntries(campos.map((c) => [c.id, c.valor]));
}

/** Confere o código colado pelo organizador e extrai os dados. */
export function lerPixEstatico(codigoColado: string): DadosPix {
  const codigo = codigoColado.trim();
  if (!crcConfere(codigo)) throw new PixInvalido('Código Pix inválido. Copie de novo no app do banco.');
  const f = porId(lerCampos(codigo));
  if (!f['26']) throw new PixInvalido('Esse código não é um Pix.');
  const conta = porId(lerCampos(f['26']));
  if (conta['00']?.toUpperCase() !== 'BR.GOV.BCB.PIX') throw new PixInvalido('Esse código não é um Pix.');
  if (!conta['01']) {
    throw new PixInvalido('Esse é um Pix de cobrança (dinâmico). Gere um Pix copia e cola sem valor, com a sua chave.');
  }
  const adicionais = f['62'] ? porId(lerCampos(f['62'])) : {};
  return {
    chave: conta['01'],
    nome: f['59'] ?? '',
    cidade: f['60'] ?? '',
    valor: f['54'],
    identificador: adicionais['05'],
  };
}

/** Nome e cidade no BR Code: maiúsculas, sem acento, 25 e 15 caracteres. */
function limparTexto(texto: string, max: number): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase()
    .trim()
    .slice(0, max);
}

/** Identificador do Pix (txid): até 25 letras e números. */
export function limparIdentificador(ref: string): string {
  const limpo = ref.replace(/[^A-Za-z0-9]/g, '').slice(0, 25);
  return limpo || '***';
}

/** Monta um Pix estático com valor (em centavos) e identificador. */
export function montarPix(dados: { chave: string; nome: string; cidade: string }, centavos: number, referencia: string): string {
  if (!Number.isInteger(centavos) || centavos <= 0) throw new PixInvalido('Valor do Pix precisa ser maior que zero.');
  const conta = campo('00', 'BR.GOV.BCB.PIX') + campo('01', dados.chave.trim());
  const semCrc =
    campo('00', '01') +
    campo('26', conta) +
    campo('52', '0000') +
    campo('53', '986') +
    campo('54', (centavos / 100).toFixed(2)) +
    campo('58', 'BR') +
    campo('59', dados.nome.slice(0, 25) || 'RECEBEDOR') +
    campo('60', dados.cidade.slice(0, 15) || 'BRASIL') +
    campo('62', campo('05', limparIdentificador(referencia))) +
    '6304';
  return semCrc + crc16(semCrc);
}

/** A partir do código colado pelo organizador, gera o Pix do convidado. */
export function pixDoConvidado(codigoDoOrganizador: string, centavos: number, referencia: string): string {
  const dados = lerPixEstatico(codigoDoOrganizador);
  return montarPix(dados, centavos, referencia);
}

/** Plano B: o banco não gera copia-e-cola estático, o organizador digita os dados. */
export function pixPorDadosDigitados(chave: string, nome: string, cidade: string, centavos: number, referencia: string): string {
  return montarPix({ chave, nome: limparTexto(nome, 25), cidade: limparTexto(cidade, 15) }, centavos, referencia);
}
