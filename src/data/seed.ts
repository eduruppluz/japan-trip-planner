// ============================================================
// Dados de EXEMPLO — fictícios e totalmente editáveis.
// Nenhuma reserva aqui é real. Não coloque dados pessoais neste
// arquivo: os dados do usuário vivem apenas no armazenamento local.
// ============================================================
import { addDays } from 'date-fns'
import type { AppData, BudgetPlan, Collections, Settings } from '@/types'
import { BUDGET_CATEGORY_KEYS, AUTO_BUDGET_SOURCES } from './constants'
import { toISODate } from '@/utils/dates'
import { uid } from '@/utils/id'

export const SCHEMA_VERSION = 1

export const DEFAULT_SETTINGS: Settings = {
  tripName: 'Minha viagem para o Japão',
  subtitle: 'Final de novembro de 2026',
  destinationFlag: '🇯🇵',
  startDate: '2026-11-28',
  endDate: '2026-12-10',
  departureTime: '00:00',
  totalBudget: 15000,
  savingsGoal: 15000,
  baggageLimitKg: 23,
  currency: 'BRL',
  exchangeRate: 0,
  exchangeRateUpdatedAt: null,
  theme: 'system',
  addressForm: 'preparada',
  hideSensitive: true,
  isSampleData: false,
}

export function defaultBudgetPlan(): BudgetPlan {
  return Object.fromEntries(
    BUDGET_CATEGORY_KEYS.map((k) => [k, { planned: 0, auto: k in AUTO_BUDGET_SOURCES }]),
  ) as BudgetPlan
}

const emptyCollections = (): Collections => ({
  itinerary: [],
  flights: [],
  hotels: [],
  expenses: [],
  savings: [],
  tasks: [],
  packing: [],
  places: [],
  restaurants: [],
  shopping: [],
  documents: [],
  info: [],
})

/** Estado inicial "do zero" — sem itens, só a estrutura e as informações úteis. */
export function createEmptyData(): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    budgetPlan: defaultBudgetPlan(),
    ...emptyCollections(),
    info: sampleInfo(),
    log: [],
  }
}

// ---------- helpers ----------
const stamp = () => {
  const now = new Date().toISOString()
  return { id: uid(), createdAt: now, updatedAt: now }
}
function list<T extends object>(rows: T[]): (T & ReturnType<typeof stamp>)[] {
  return rows.map((r) => ({ ...stamp(), ...r }))
}
/** Data relativa a hoje, para as tarefas de exemplo terem prazos próximos. */
const inDays = (n: number) => toISODate(addDays(new Date(), n))

function sampleInfo() {
  return list([
    { section: 'moeda' as const, title: 'Moeda oficial', content: 'Iene japonês (JPY, ¥). Configure a taxa de câmbio acima com o valor do dia em que for comprar ou pagar.' },
    { section: 'fuso' as const, title: 'Horário do Japão', content: 'JST (UTC+9), sem horário de verão. Em relação a Brasília (UTC−3), são normalmente 12 horas à frente.' },
    { section: 'tomadas' as const, title: 'Tomadas e voltagem', content: 'Padrão tipo A (dois pinos chatos), às vezes tipo B. Voltagem de 100 V. Confira se seus carregadores aceitam 100–240 V e leve adaptador.' },
    { section: 'emergencia' as const, title: 'Telefones de emergência', content: '110 — Polícia\n119 — Bombeiros e ambulância\nAnote também o telefone do seu seguro viagem e do consulado/embaixada.' },
    { section: 'transporte' as const, title: 'Transporte', content: 'Cartões recarregáveis de transporte (IC cards) funcionam em trens, metrôs e muitas lojas. Passes regionais e o JR Pass mudam de preço e regras — confira as condições atuais antes de comprar.' },
    { section: 'internet' as const, title: 'Internet', content: 'Opções comuns: eSIM, chip local ou roteador Wi‑Fi portátil. Compare preços e cobertura perto da data da viagem.' },
    { section: 'frases' as const, title: 'Frases úteis', content: 'Olá — Konnichiwa (こんにちは)\nObrigado(a) — Arigatou gozaimasu (ありがとうございます)\nCom licença / Desculpe — Sumimasen (すみません)\nQuanto custa? — Ikura desu ka? (いくらですか)\nOnde fica…? — … wa doko desu ka? (…はどこですか)\nA conta, por favor — Okaikei onegaishimasu (お会計お願いします)\nNão entendo — Wakarimasen (わかりません)' },
    { section: 'enderecos' as const, title: 'Endereços importantes (preencha)', content: 'Adicione aqui o endereço dos seus hotéis em japonês, o consulado/embaixada do Brasil e contatos do seguro. (Exemplo — edite com dados verificados.)' },
  ])
}

/** Checklist sugerido (sem prazos) para quem começa do zero. */
export const SUGGESTED_TASKS: { name: string; category: import('@/types').TaskCategory; priority: import('@/types').Priority }[] = [
  { name: 'Passaporte válido', category: 'documentos', priority: 'alta' },
  { name: 'Comprovante do seguro viagem', category: 'documentos', priority: 'media' },
  { name: 'Comprovantes de hospedagem', category: 'documentos', priority: 'media' },
  { name: 'Passagens salvas', category: 'documentos', priority: 'media' },
  { name: 'Reservas organizadas', category: 'documentos', priority: 'baixa' },
  { name: 'Documentos digitais no celular', category: 'documentos', priority: 'media' },
  { name: 'Cópias dos documentos', category: 'documentos', priority: 'baixa' },
  { name: 'Comprar ienes', category: 'dinheiro', priority: 'media' },
  { name: 'Separar cartão internacional', category: 'dinheiro', priority: 'alta' },
  { name: 'Avisar o banco sobre a viagem', category: 'dinheiro', priority: 'media' },
  { name: 'Separar dinheiro de emergência', category: 'dinheiro', priority: 'media' },
  { name: 'Adaptador de tomada', category: 'tecnologia', priority: 'media' },
  { name: 'Power bank', category: 'tecnologia', priority: 'baixa' },
  { name: 'Carregadores', category: 'tecnologia', priority: 'baixa' },
  { name: 'Cabos', category: 'tecnologia', priority: 'baixa' },
  { name: 'Fones', category: 'tecnologia', priority: 'baixa' },
  { name: 'Chip/eSIM', category: 'tecnologia', priority: 'media' },
  { name: 'Comprar passagens', category: 'viagem', priority: 'alta' },
  { name: 'Reservar hotéis', category: 'viagem', priority: 'alta' },
  { name: 'Planejar roteiro', category: 'viagem', priority: 'media' },
  { name: 'Comprar ingressos', category: 'viagem', priority: 'media' },
  { name: 'Conferir transporte entre cidades', category: 'viagem', priority: 'media' },
  { name: 'Contratar seguro viagem', category: 'saude', priority: 'alta' },
  { name: 'Medicamentos necessários', category: 'saude', priority: 'media' },
  { name: 'Kit básico de primeiros socorros', category: 'saude', priority: 'baixa' },
]

/** Dados de demonstração. Todos marcados como exemplo e editáveis. */
export function createSampleData(): AppData {
  const tag = ' (exemplo)'
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: { ...DEFAULT_SETTINGS, totalBudget: 18000, savingsGoal: 18000, exchangeRate: 0, isSampleData: true },
    budgetPlan: {
      ...defaultBudgetPlan(),
      alimentacao: { planned: 2200, auto: false },
      transporte: { planned: 1200, auto: false },
      internet: { planned: 150, auto: false },
      seguro: { planned: 350, auto: false },
      documentacao: { planned: 300, auto: false },
      taxas: { planned: 200, auto: false },
      emergencia: { planned: 1000, auto: false },
      outros: { planned: 200, auto: false },
    },
    itinerary: list([
      { date: '2026-11-28', time: '09:00', city: 'Tóquio', area: 'Aeroporto', title: 'Chegada no aeroporto', address: '', notes: 'Pegar o cartão de transporte e o eSIM.', cost: 0, status: 'planejado' as const, order: 0 },
      { date: '2026-11-28', time: '12:00', city: 'Tóquio', area: 'Shinjuku', title: 'Check-in no hotel', address: '', notes: '', cost: 0, status: 'planejado' as const, order: 1 },
      { date: '2026-11-28', time: '15:00', city: 'Tóquio', area: 'Shibuya', title: 'Cruzamento de Shibuya', address: '', notes: '', cost: 0, status: 'planejado' as const, order: 2 },
      { date: '2026-11-28', time: '19:30', city: 'Tóquio', area: 'Shibuya', title: 'Jantar', address: '', notes: '', cost: 90, status: 'planejado' as const, order: 3 },
      { date: '2026-11-29', time: '09:30', city: 'Tóquio', area: 'Asakusa', title: 'Templo Senso-ji', address: '', notes: 'Ir cedo para evitar filas.', cost: 0, status: 'planejado' as const, order: 0 },
      { date: '2026-11-29', time: '14:00', city: 'Tóquio', area: 'Akihabara', title: 'Akihabara — games e anime', address: '', notes: '', cost: 150, status: 'planejado' as const, order: 1 },
      { date: '2026-12-03', time: '10:00', city: 'Kyoto', area: 'Fushimi', title: 'Fushimi Inari', address: '', notes: '', cost: 0, status: 'planejado' as const, order: 0 },
      { date: '2026-12-03', time: '15:00', city: 'Kyoto', area: 'Higashiyama', title: 'Caminhada em Gion', address: '', notes: '', cost: 40, status: 'planejado' as const, order: 1 },
      { date: '2026-12-07', time: '11:00', city: 'Osaka', area: 'Namba', title: 'Dotonbori', address: '', notes: 'Comida de rua.', cost: 120, status: 'planejado' as const, order: 0 },
    ]),
    flights: list([
      {
        direction: 'ida' as const, airline: 'Companhia aérea' + tag, flightNumber: 'XX 0000', fromAirport: 'GRU', fromCity: 'São Paulo',
        toAirport: 'HND', toCity: 'Tóquio', date: '2026-11-26', departureTime: '23:00', arrivalDate: '2026-11-28', arrivalTime: '07:00',
        duration: '', terminal: '', bookingCode: '', seat: '', baggage: '1 × 23 kg', price: 5200, paymentStatus: 'pago' as const,
        notes: 'Voo fictício de demonstração — substitua pelos dados reais.',
      },
    ]),
    hotels: list([
      { name: 'Hotel em Shinjuku' + tag, city: 'Tóquio', address: '', checkIn: '2026-11-28', checkOut: '2026-12-02', pricePerNight: 420, bookingCode: '', bookingLink: '', paymentMethod: 'Cartão de crédito', paymentStatus: 'pago' as const, booked: true, notes: '' },
      { name: 'Ryokan em Kyoto' + tag, city: 'Kyoto', address: '', checkIn: '2026-12-02', checkOut: '2026-12-06', pricePerNight: 480, bookingCode: '', bookingLink: '', paymentMethod: '', paymentStatus: 'pendente' as const, booked: true, notes: '' },
      { name: 'Hotel em Namba' + tag, city: 'Osaka', address: '', checkIn: '2026-12-06', checkOut: '2026-12-09', pricePerNight: 380, bookingCode: '', bookingLink: '', paymentMethod: '', paymentStatus: 'pendente' as const, booked: false, notes: 'Comparar opções.' },
    ]),
    expenses: list([
      { date: inDays(-40), category: 'documentacao' as const, description: 'Passaporte' + tag, amount: 260, paymentMethod: 'Boleto', notes: '' },
      { date: inDays(-10), category: 'internet' as const, description: 'eSIM' + tag, amount: 120, paymentMethod: 'Cartão de crédito', notes: '' },
    ]),
    savings: list([
      { date: inDays(-90), amount: 5000, note: 'Valor inicial' + tag },
      { date: inDays(-60), amount: 2500, note: '' },
      { date: inDays(-30), amount: 2000, note: '' },
      { date: inDays(-7), amount: 1500, note: '' },
    ]),
    tasks: list([
      { name: 'Passaporte válido', category: 'documentos' as const, dueDate: inDays(-20), priority: 'alta' as const, done: true, completedAt: new Date().toISOString(), notes: '' },
      { name: 'Comprovante do seguro viagem', category: 'documentos' as const, dueDate: inDays(20), priority: 'media' as const, done: false, completedAt: null, notes: '' },
      { name: 'Comprovantes de hospedagem', category: 'documentos' as const, dueDate: inDays(30), priority: 'media' as const, done: false, completedAt: null, notes: '' },
      { name: 'Passagens salvas', category: 'documentos' as const, dueDate: '', priority: 'media' as const, done: true, completedAt: new Date().toISOString(), notes: '' },
      { name: 'Reservas organizadas', category: 'documentos' as const, dueDate: inDays(45), priority: 'baixa' as const, done: false, completedAt: null, notes: '' },
      { name: 'Documentos digitais no celular', category: 'documentos' as const, dueDate: inDays(50), priority: 'media' as const, done: false, completedAt: null, notes: '' },
      { name: 'Cópias dos documentos', category: 'documentos' as const, dueDate: inDays(50), priority: 'baixa' as const, done: false, completedAt: null, notes: '' },
      { name: 'Comprar ienes', category: 'dinheiro' as const, dueDate: inDays(40), priority: 'media' as const, done: false, completedAt: null, notes: '' },
      { name: 'Separar cartão internacional', category: 'dinheiro' as const, dueDate: inDays(35), priority: 'alta' as const, done: false, completedAt: null, notes: '' },
      { name: 'Avisar o banco sobre a viagem', category: 'dinheiro' as const, dueDate: inDays(52), priority: 'media' as const, done: false, completedAt: null, notes: '' },
      { name: 'Separar dinheiro de emergência', category: 'dinheiro' as const, dueDate: '', priority: 'media' as const, done: false, completedAt: null, notes: '' },
      { name: 'Adaptador de tomada', category: 'tecnologia' as const, dueDate: inDays(14), priority: 'media' as const, done: false, completedAt: null, notes: '' },
      { name: 'Power bank', category: 'tecnologia' as const, dueDate: '', priority: 'baixa' as const, done: true, completedAt: new Date().toISOString(), notes: '' },
      { name: 'Carregadores', category: 'tecnologia' as const, dueDate: '', priority: 'baixa' as const, done: false, completedAt: null, notes: '' },
      { name: 'Cabos', category: 'tecnologia' as const, dueDate: '', priority: 'baixa' as const, done: false, completedAt: null, notes: '' },
      { name: 'Fones', category: 'tecnologia' as const, dueDate: '', priority: 'baixa' as const, done: true, completedAt: new Date().toISOString(), notes: '' },
      { name: 'Chip/eSIM', category: 'tecnologia' as const, dueDate: inDays(-2), priority: 'media' as const, done: true, completedAt: new Date().toISOString(), notes: '' },
      { name: 'Comprar passagens', category: 'viagem' as const, dueDate: inDays(-30), priority: 'alta' as const, done: true, completedAt: new Date().toISOString(), notes: '' },
      { name: 'Reservar hotéis', category: 'viagem' as const, dueDate: inDays(1), priority: 'alta' as const, done: false, completedAt: null, notes: 'Falta Osaka.' },
      { name: 'Planejar roteiro', category: 'viagem' as const, dueDate: inDays(25), priority: 'media' as const, done: false, completedAt: null, notes: '' },
      { name: 'Comprar ingressos', category: 'viagem' as const, dueDate: inDays(3), priority: 'media' as const, done: false, completedAt: null, notes: '' },
      { name: 'Conferir transporte entre cidades', category: 'viagem' as const, dueDate: inDays(30), priority: 'media' as const, done: false, completedAt: null, notes: '' },
      { name: 'Contratar seguro viagem', category: 'saude' as const, dueDate: inDays(0), priority: 'alta' as const, done: false, completedAt: null, notes: '' },
      { name: 'Medicamentos necessários', category: 'saude' as const, dueDate: inDays(45), priority: 'media' as const, done: false, completedAt: null, notes: '' },
      { name: 'Kit básico de primeiros socorros', category: 'saude' as const, dueDate: '', priority: 'baixa' as const, done: false, completedAt: null, notes: '' },
    ]),
    packing: list([
      { name: 'Camisetas', quantity: 5, weightKg: 0.2, category: 'roupas' as const, packed: true },
      { name: 'Calças', quantity: 2, weightKg: 0.6, category: 'roupas' as const, packed: true },
      { name: 'Casaco', quantity: 1, weightKg: 1.2, category: 'frio' as const, packed: false },
      { name: 'Tênis confortável', quantity: 1, weightKg: 0.9, category: 'calcados' as const, packed: false },
      { name: 'Necessaire', quantity: 1, weightKg: 0.8, category: 'higiene' as const, packed: false },
      { name: 'Adaptador de tomada', quantity: 1, weightKg: 0.1, category: 'eletronicos' as const, packed: false },
      { name: 'Power bank', quantity: 1, weightKg: 0.3, category: 'eletronicos' as const, packed: false },
    ]),
    places: list([
      { name: 'Templo Senso-ji', city: 'Tóquio', category: 'cultura' as const, priority: 'imperdivel' as const, address: 'Asakusa', mapsLink: '', cost: 0, duration: '2h', notes: '', visited: false },
      { name: 'Akihabara', city: 'Tóquio', category: 'anime' as const, priority: 'imperdivel' as const, address: '', mapsLink: '', cost: 0, duration: 'meio dia', notes: '', visited: false },
      { name: 'Cruzamento de Shibuya', city: 'Tóquio', category: 'fotografia' as const, priority: 'quero-muito' as const, address: '', mapsLink: '', cost: 0, duration: '1h', notes: '', visited: false },
      { name: 'Fushimi Inari Taisha', city: 'Kyoto', category: 'cultura' as const, priority: 'imperdivel' as const, address: '', mapsLink: '', cost: 0, duration: '3h', notes: 'Subir até o mirante.', visited: false },
      { name: 'Bosque de bambu de Arashiyama', city: 'Kyoto', category: 'natureza' as const, priority: 'quero-muito' as const, address: '', mapsLink: '', cost: 0, duration: '2h', notes: '', visited: false },
      { name: 'Castelo de Osaka', city: 'Osaka', category: 'historia' as const, priority: 'se-der-tempo' as const, address: '', mapsLink: '', cost: 0, duration: '2h', notes: 'Confirmar ingresso e horário.', visited: false },
      { name: 'Dotonbori', city: 'Osaka', category: 'gastronomia' as const, priority: 'imperdivel' as const, address: '', mapsLink: '', cost: 0, duration: '3h', notes: '', visited: false },
    ]),
    restaurants: list([
      { name: 'Ramen perto do hotel' + tag, city: 'Tóquio', area: 'Shinjuku', category: 'ramen' as const, priceRange: '¥' as const, address: '', link: '', rating: 0, reservationDate: '' as const, reservationTime: '', notes: '', visited: false },
      { name: 'Izakaya em Gion' + tag, city: 'Kyoto', area: 'Gion', category: 'izakaya' as const, priceRange: '¥¥' as const, address: '', link: '', rating: 0, reservationDate: '' as const, reservationTime: '', notes: '', visited: false },
      { name: 'Okonomiyaki em Namba' + tag, city: 'Osaka', area: 'Namba', category: 'outros' as const, priceRange: '¥' as const, address: '', link: '', rating: 0, reservationDate: '' as const, reservationTime: '', notes: '', visited: false },
    ]),
    shopping: list([
      { product: 'Jogo de Switch (edição japonesa)', category: 'games' as const, estimatedPrice: 300, foundPrice: 0, store: '', priority: 'media' as const, status: 'desejado' as const, notes: '' },
      { product: 'Figure colecionável', category: 'colecionaveis' as const, estimatedPrice: 400, foundPrice: 0, store: '', priority: 'alta' as const, status: 'desejado' as const, notes: '' },
      { product: 'Skincare japonês', category: 'cosmeticos' as const, estimatedPrice: 200, foundPrice: 0, store: '', priority: 'media' as const, status: 'desejado' as const, notes: '' },
      { product: 'Lembrancinhas para a família', category: 'presentes' as const, estimatedPrice: 300, foundPrice: 0, store: '', priority: 'alta' as const, status: 'desejado' as const, notes: '' },
    ]),
    documents: list([
      { type: 'Passaporte', number: '', expiryDate: '' as const, link: '', notes: 'Preencha a validade para receber alertas.' },
      { type: 'Seguro viagem', number: '', expiryDate: '' as const, link: '', notes: '' },
    ]),
    info: sampleInfo(),
    log: [
      { id: uid(), at: new Date(Date.now() - 86400000 * 7).toISOString(), text: 'Adicionou R$ 1.500 à meta', kind: 'money' },
      { id: uid(), at: new Date(Date.now() - 86400000 * 3).toISOString(), text: 'Reservou hotel em Kyoto', kind: 'hotel' },
      { id: uid(), at: new Date(Date.now() - 86400000).toISOString(), text: 'Concluiu tarefa “Passaporte válido”', kind: 'task' },
    ],
  }
}
