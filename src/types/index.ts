// ============================================================
// Modelo de dados do Japan Trip Planner
// Tudo é serializável em JSON — facilita export/import e uma
// futura migração para Supabase/Firebase (cada coleção = tabela).
// ============================================================

export type ID = string

/** Datas sempre em ISO local "YYYY-MM-DD"; horários em "HH:mm". */
export type ISODate = string
export type Time = string

export interface BaseEntity {
  id: ID
  createdAt: string // ISO datetime
  updatedAt: string
}

export type Theme = 'light' | 'dark' | 'system'
export type AddressForm = 'preparada' | 'preparado' | 'neutro'

export interface Settings {
  tripName: string
  subtitle: string
  destinationFlag: string
  startDate: ISODate
  endDate: ISODate
  departureTime: Time
  totalBudget: number
  savingsGoal: number
  baggageLimitKg: number
  currency: 'BRL'
  /** Quantos ienes vale 1 unidade da moeda local (configurado manualmente). */
  exchangeRate: number
  exchangeRateUpdatedAt: ISODate | null
  theme: Theme
  addressForm: AddressForm
  hideSensitive: boolean
  isSampleData: boolean
}

export type ActivityStatus = 'planejado' | 'confirmado' | 'concluido' | 'cancelado'
export interface Activity extends BaseEntity {
  date: ISODate
  time: Time
  city: string
  area: string
  title: string
  address: string
  notes: string
  cost: number
  status: ActivityStatus
  order: number
}

export type FlightDirection = 'ida' | 'volta' | 'interno'
export type PaymentStatus = 'pendente' | 'parcial' | 'pago'
export interface Flight extends BaseEntity {
  direction: FlightDirection
  airline: string
  flightNumber: string
  fromAirport: string
  fromCity: string
  toAirport: string
  toCity: string
  date: ISODate
  departureTime: Time
  arrivalDate: ISODate
  arrivalTime: Time
  duration: string
  terminal: string
  bookingCode: string
  seat: string
  baggage: string
  price: number
  paymentStatus: PaymentStatus
  notes: string
}

export interface Hotel extends BaseEntity {
  name: string
  city: string
  address: string
  checkIn: ISODate
  checkOut: ISODate
  pricePerNight: number
  bookingCode: string
  bookingLink: string
  paymentMethod: string
  paymentStatus: PaymentStatus
  booked: boolean
  notes: string
}

export type BudgetCategory =
  | 'passagens'
  | 'hospedagem'
  | 'alimentacao'
  | 'transporte'
  | 'passeios'
  | 'compras'
  | 'internet'
  | 'seguro'
  | 'documentacao'
  | 'taxas'
  | 'emergencia'
  | 'outros'

export interface BudgetPlanEntry {
  /** Valor planejado manualmente. */
  planned: number
  /** Quando true e a categoria tem fonte automática, o planejado vem dos cadastros. */
  auto: boolean
}
export type BudgetPlan = Record<BudgetCategory, BudgetPlanEntry>

export interface Expense extends BaseEntity {
  date: ISODate
  category: BudgetCategory
  description: string
  amount: number
  paymentMethod: string
  notes: string
}

export interface SavingsEntry extends BaseEntity {
  date: ISODate
  amount: number // pode ser negativo (retirada)
  note: string
}

export type TaskCategory = 'documentos' | 'dinheiro' | 'tecnologia' | 'viagem' | 'saude' | 'outros'
export type Priority = 'alta' | 'media' | 'baixa'
export interface Task extends BaseEntity {
  name: string
  category: TaskCategory
  dueDate: ISODate | ''
  priority: Priority
  done: boolean
  completedAt: string | null
  notes: string
}

export type PackingCategory =
  | 'roupas'
  | 'calcados'
  | 'higiene'
  | 'saude'
  | 'eletronicos'
  | 'documentos'
  | 'acessorios'
  | 'frio'
export interface PackingItem extends BaseEntity {
  name: string
  quantity: number
  /** Peso estimado por unidade, em kg. */
  weightKg: number
  category: PackingCategory
  packed: boolean
}

export type PlaceCategory =
  | 'cultura'
  | 'historia'
  | 'compras'
  | 'gastronomia'
  | 'natureza'
  | 'anime'
  | 'fotografia'
  | 'entretenimento'
export type PlacePriority = 'imperdivel' | 'quero-muito' | 'se-der-tempo'
export interface Place extends BaseEntity {
  name: string
  city: string
  category: PlaceCategory
  priority: PlacePriority
  address: string
  mapsLink: string
  cost: number
  duration: string
  notes: string
  visited: boolean
}

export type FoodCategory = 'sushi' | 'ramen' | 'yakiniku' | 'izakaya' | 'sobremesas' | 'cafes' | 'fastfood' | 'outros'
export type PriceRange = '¥' | '¥¥' | '¥¥¥' | '¥¥¥¥'
export interface Restaurant extends BaseEntity {
  name: string
  city: string
  area: string
  category: FoodCategory
  priceRange: PriceRange
  address: string
  link: string
  rating: number // 0 = sem nota, 1..5
  reservationDate: ISODate | ''
  reservationTime: Time
  notes: string
  visited: boolean
}

export type ShoppingCategory = 'games' | 'anime' | 'roupas' | 'tecnologia' | 'presentes' | 'colecionaveis' | 'cosmeticos' | 'outros'
export type ShoppingStatus = 'desejado' | 'encontrado' | 'comprado' | 'desistido'
export interface ShoppingItem extends BaseEntity {
  product: string
  category: ShoppingCategory
  estimatedPrice: number
  foundPrice: number
  store: string
  priority: Priority
  status: ShoppingStatus
  notes: string
}

export interface TravelDocument extends BaseEntity {
  type: string
  number: string
  expiryDate: ISODate | ''
  link: string
  notes: string
}

export type InfoSection = 'moeda' | 'fuso' | 'tomadas' | 'emergencia' | 'transporte' | 'internet' | 'frases' | 'enderecos' | 'outros'
export interface InfoNote extends BaseEntity {
  section: InfoSection
  title: string
  content: string
}

export interface LogEntry {
  id: ID
  at: string
  text: string
  kind: 'money' | 'task' | 'hotel' | 'flight' | 'place' | 'expense' | 'general'
}

/** Coleções de entidades (tudo que tem CRUD genérico). */
export interface Collections {
  itinerary: Activity[]
  flights: Flight[]
  hotels: Hotel[]
  expenses: Expense[]
  savings: SavingsEntry[]
  tasks: Task[]
  packing: PackingItem[]
  places: Place[]
  restaurants: Restaurant[]
  shopping: ShoppingItem[]
  documents: TravelDocument[]
  info: InfoNote[]
}
export type CollectionKey = keyof Collections
export type EntityOf<K extends CollectionKey> = Collections[K][number]
/** Dados de entrada para criar uma entidade (sem campos de sistema). */
export type Draft<K extends CollectionKey> = Omit<EntityOf<K>, keyof BaseEntity>

export interface AppData extends Collections {
  schemaVersion: number
  settings: Settings
  budgetPlan: BudgetPlan
  log: LogEntry[]
}
