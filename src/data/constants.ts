import type {
  ActivityStatus,
  BudgetCategory,
  FlightDirection,
  FoodCategory,
  InfoSection,
  PackingCategory,
  PaymentStatus,
  PlaceCategory,
  PlacePriority,
  PriceRange,
  Priority,
  ShoppingCategory,
  ShoppingStatus,
  TaskCategory,
} from '@/types'

export interface Option<T extends string = string> {
  value: T
  label: string
  emoji?: string
}

const opts = <T extends string>(o: Record<T, { label: string; emoji?: string }>): Option<T>[] =>
  (Object.keys(o) as T[]).map((value) => ({ value, ...o[value] }))

export const BUDGET_CATEGORIES = {
  passagens: { label: 'Passagens', emoji: '✈️' },
  hospedagem: { label: 'Hospedagem', emoji: '🏨' },
  alimentacao: { label: 'Alimentação', emoji: '🍜' },
  transporte: { label: 'Transporte', emoji: '🚇' },
  passeios: { label: 'Passeios', emoji: '🎟️' },
  compras: { label: 'Compras', emoji: '🛍️' },
  internet: { label: 'Internet/Chip', emoji: '📱' },
  seguro: { label: 'Seguro', emoji: '🛡️' },
  documentacao: { label: 'Documentação', emoji: '📄' },
  taxas: { label: 'Taxas', emoji: '💳' },
  emergencia: { label: 'Reserva de emergência', emoji: '💰' },
  outros: { label: 'Outros', emoji: '•' },
} satisfies Record<BudgetCategory, { label: string; emoji: string }>
export const BUDGET_CATEGORY_OPTIONS = opts(BUDGET_CATEGORIES)
export const BUDGET_CATEGORY_KEYS = Object.keys(BUDGET_CATEGORIES) as BudgetCategory[]

/** Categorias cujo "planejado" pode ser calculado a partir de outros cadastros. */
export const AUTO_BUDGET_SOURCES: Partial<Record<BudgetCategory, string>> = {
  passagens: 'soma dos voos cadastrados',
  hospedagem: 'soma das hospedagens (noites × diária)',
  passeios: 'soma dos custos do roteiro',
  compras: 'soma da lista de compras',
}

export const TASK_CATEGORIES = {
  documentos: { label: 'Documentos', emoji: '📄' },
  dinheiro: { label: 'Dinheiro', emoji: '💴' },
  tecnologia: { label: 'Tecnologia', emoji: '🔌' },
  viagem: { label: 'Viagem', emoji: '✈️' },
  saude: { label: 'Saúde', emoji: '💊' },
  outros: { label: 'Outros', emoji: '•' },
} satisfies Record<TaskCategory, { label: string; emoji: string }>
export const TASK_CATEGORY_OPTIONS = opts(TASK_CATEGORIES)

export const PRIORITIES = {
  alta: { label: 'Alta' },
  media: { label: 'Média' },
  baixa: { label: 'Baixa' },
} satisfies Record<Priority, { label: string }>
export const PRIORITY_OPTIONS = opts(PRIORITIES)
export const PRIORITY_WEIGHT: Record<Priority, number> = { alta: 0, media: 1, baixa: 2 }

export const PACKING_CATEGORIES = {
  roupas: { label: 'Roupas', emoji: '👕' },
  calcados: { label: 'Calçados', emoji: '👟' },
  higiene: { label: 'Higiene', emoji: '🧴' },
  saude: { label: 'Saúde', emoji: '💊' },
  eletronicos: { label: 'Eletrônicos', emoji: '🔌' },
  documentos: { label: 'Documentos', emoji: '📄' },
  acessorios: { label: 'Acessórios', emoji: '🎒' },
  frio: { label: 'Frio', emoji: '🧥' },
} satisfies Record<PackingCategory, { label: string; emoji: string }>
export const PACKING_CATEGORY_OPTIONS = opts(PACKING_CATEGORIES)

export const PLACE_CATEGORIES = {
  cultura: { label: 'Cultura', emoji: '⛩️' },
  historia: { label: 'História', emoji: '🏯' },
  compras: { label: 'Compras', emoji: '🛍️' },
  gastronomia: { label: 'Gastronomia', emoji: '🍜' },
  natureza: { label: 'Natureza', emoji: '🌸' },
  anime: { label: 'Anime/Games', emoji: '🎮' },
  fotografia: { label: 'Fotografia', emoji: '📸' },
  entretenimento: { label: 'Entretenimento', emoji: '🎡' },
} satisfies Record<PlaceCategory, { label: string; emoji: string }>
export const PLACE_CATEGORY_OPTIONS = opts(PLACE_CATEGORIES)

export const PLACE_PRIORITIES = {
  imperdivel: { label: 'Imperdível', emoji: '🔴' },
  'quero-muito': { label: 'Quero muito', emoji: '🟡' },
  'se-der-tempo': { label: 'Se der tempo', emoji: '🟢' },
} satisfies Record<PlacePriority, { label: string; emoji: string }>
export const PLACE_PRIORITY_OPTIONS = opts(PLACE_PRIORITIES)
export const PLACE_PRIORITY_WEIGHT: Record<PlacePriority, number> = { imperdivel: 0, 'quero-muito': 1, 'se-der-tempo': 2 }

export const FOOD_CATEGORIES = {
  sushi: { label: 'Sushi', emoji: '🍣' },
  ramen: { label: 'Ramen', emoji: '🍜' },
  yakiniku: { label: 'Yakiniku', emoji: '🥩' },
  izakaya: { label: 'Izakaya', emoji: '🍱' },
  sobremesas: { label: 'Sobremesas', emoji: '🍰' },
  cafes: { label: 'Cafés', emoji: '☕' },
  fastfood: { label: 'Fast food', emoji: '🍔' },
  outros: { label: 'Outros', emoji: '🥢' },
} satisfies Record<FoodCategory, { label: string; emoji: string }>
export const FOOD_CATEGORY_OPTIONS = opts(FOOD_CATEGORIES)

export const PRICE_RANGE_OPTIONS: Option<PriceRange>[] = [
  { value: '¥', label: '¥ · econômico' },
  { value: '¥¥', label: '¥¥ · moderado' },
  { value: '¥¥¥', label: '¥¥¥ · caro' },
  { value: '¥¥¥¥', label: '¥¥¥¥ · especial' },
]

export const SHOPPING_CATEGORIES = {
  games: { label: 'Games', emoji: '🎮' },
  anime: { label: 'Anime', emoji: '🎌' },
  roupas: { label: 'Roupas', emoji: '👕' },
  tecnologia: { label: 'Tecnologia', emoji: '📱' },
  presentes: { label: 'Presentes', emoji: '🎁' },
  colecionaveis: { label: 'Colecionáveis', emoji: '🧸' },
  cosmeticos: { label: 'Cosméticos', emoji: '💄' },
  outros: { label: 'Outros', emoji: '•' },
} satisfies Record<ShoppingCategory, { label: string; emoji: string }>
export const SHOPPING_CATEGORY_OPTIONS = opts(SHOPPING_CATEGORIES)

export const SHOPPING_STATUS = {
  desejado: { label: 'Desejado' },
  encontrado: { label: 'Encontrado' },
  comprado: { label: 'Comprado' },
  desistido: { label: 'Desisti' },
} satisfies Record<ShoppingStatus, { label: string }>
export const SHOPPING_STATUS_OPTIONS = opts(SHOPPING_STATUS)

export const ACTIVITY_STATUS = {
  planejado: { label: 'Planejado' },
  confirmado: { label: 'Confirmado' },
  concluido: { label: 'Feito' },
  cancelado: { label: 'Cancelado' },
} satisfies Record<ActivityStatus, { label: string }>
export const ACTIVITY_STATUS_OPTIONS = opts(ACTIVITY_STATUS)

export const PAYMENT_STATUS = {
  pendente: { label: 'Pendente' },
  parcial: { label: 'Parcial' },
  pago: { label: 'Pago' },
} satisfies Record<PaymentStatus, { label: string }>
export const PAYMENT_STATUS_OPTIONS = opts(PAYMENT_STATUS)

export const FLIGHT_DIRECTIONS = {
  ida: { label: 'Voo de ida' },
  volta: { label: 'Voo de volta' },
  interno: { label: 'Voo interno / conexão' },
} satisfies Record<FlightDirection, { label: string }>
export const FLIGHT_DIRECTION_OPTIONS = opts(FLIGHT_DIRECTIONS)

export const INFO_SECTIONS = {
  moeda: { label: 'Moeda', emoji: '💴' },
  fuso: { label: 'Fuso horário', emoji: '🕘' },
  tomadas: { label: 'Tomadas', emoji: '🔌' },
  emergencia: { label: 'Emergência', emoji: '🚨' },
  transporte: { label: 'Transporte', emoji: '🚆' },
  internet: { label: 'Internet', emoji: '📶' },
  frases: { label: 'Frases úteis', emoji: '💬' },
  enderecos: { label: 'Endereços importantes', emoji: '📍' },
  outros: { label: 'Outros', emoji: '💡' },
} satisfies Record<InfoSection, { label: string; emoji: string }>
export const INFO_SECTION_OPTIONS = opts(INFO_SECTIONS)

export const PAYMENT_METHOD_SUGGESTIONS = ['Cartão de crédito', 'Cartão de débito', 'Pix', 'Dinheiro', 'Cartão internacional', 'Boleto']
