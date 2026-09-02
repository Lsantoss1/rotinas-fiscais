export type RegimeTributario = 'lucro_real' | 'lucro_presumido' | 'simples_nacional'
export type Esfera = 'federal' | 'estadual' | 'municipal'
export type Periodicidade = 'mensal' | 'trimestral' | 'anual' | 'evento' | 'parcela'
export type StatusObrigacao = 'pendente' | 'assumida' | 'em_revisao' | 'entregue' | 'atrasada'
export type TipoAlerta = 'prazo_10d' | 'prazo_3d' | 'prazo_hoje' | 'atrasado' | 'prazo_alterado'
export type Abrangencia = 'federal' | 'estadual' | 'municipal'

export interface Usuario {
  id: string
  nome: string
  email: string
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface Grupo {
  id: string
  nome: string
  ativo: boolean
  criado_em: string
  atualizado_em: string
  estabelecimentos?: Estabelecimento[]
}

export interface Estabelecimento {
  id: string
  grupo_id: string
  cnpj: string
  razao_social: string
  nome_fantasia: string | null
  regime_tributario: RegimeTributario
  is_matriz: boolean
  municipio: string
  uf: string
  ativo: boolean
  criado_em: string
  atualizado_em: string
  grupo?: Grupo
}

export interface TipoObrigacao {
  id: string
  nome: string
  descricao: string | null
  esfera: Esfera
  regime_tributario: RegimeTributario | 'todos'
  periodicidade: Periodicidade
  requer_consolidacao_matriz: boolean
  ativo: boolean
  criado_em: string
  atualizado_em: string
  regras_vencimento?: RegraVencimento[]
}

export interface RegraVencimento {
  id: string
  tipo_obrigacao_id: string
  valida_de: string
  valida_ate: string | null
  tipo_regra: 'formula' | 'data_fixa'
  formula: string | null
  formula_parametro: number | null
  datas_fixas: string[] | null
  motivo: string | null
  criado_por: string | null
  criado_em: string
}

export interface Feriado {
  id: string
  data: string
  descricao: string
  abrangencia: Abrangencia
  uf: string | null
  municipio: string | null
  criado_em: string
}

export interface Obrigacao {
  id: string
  estabelecimento_id: string
  tipo_obrigacao_id: string
  competencia: string
  prazo_vencimento: string
  prazo_vencimento_original: string
  status: StatusObrigacao
  responsavel_id: string | null
  assumida_em: string | null
  entregue_em: string | null
  observacoes: string | null
  criado_em: string
  atualizado_em: string
  estabelecimento?: Estabelecimento
  tipo_obrigacao?: TipoObrigacao
  responsavel?: Usuario
  anexos?: Anexo[]
}

export interface ObrigacaoHistorico {
  id: string
  obrigacao_id: string
  status_anterior: StatusObrigacao | null
  status_novo: StatusObrigacao
  responsavel_id: string | null
  observacao: string | null
  criado_em: string
  responsavel?: Usuario
}

export interface Anexo {
  id: string
  obrigacao_id: string
  nome_original: string
  nome_storage: string
  storage_path: string
  mime_type: string
  tamanho_bytes: number
  enviado_por: string | null
  criado_em: string
  enviado_por_usuario?: Usuario
}

export interface Alerta {
  id: string
  usuario_id: string
  obrigacao_id: string | null
  tipo: TipoAlerta
  mensagem: string
  lido: boolean
  criado_em: string
  obrigacao?: Obrigacao
}

export interface Configuracao {
  id: string
  chave: string
  valor: string
  descricao: string | null
  atualizado_em: string
}
