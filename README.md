# 🇯🇵 Japan Trip Planner

Central pessoal de planejamento da viagem ao Japão: contagem regressiva, roteiro, voos, hospedagem, orçamento, meta financeira, checklist, mala, lugares, restaurantes, compras, documentos, calendário e informações úteis — tudo conectado e salvo automaticamente.

## Como rodar

```bash
npm install
npm run dev            # desenvolvimento (http://localhost:5173)
npm run build          # build de produção em dist/
npm run build:preview  # um único HTML autocontido em dist-preview/index.html
npm test               # testes dos cálculos, persistência e importação
npm run typecheck      # checagem de TypeScript
```

O `dist/` pode ser publicado em qualquer hospedagem estática (Vercel, Netlify, GitHub Pages). As rotas usam hash (`#/orcamento`), então não precisa configurar o servidor.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Lucide · Recharts · date-fns. Nenhuma API externa é chamada.

## Estrutura

```
src/
  components/
    ui/        Button, Card, Modal, Field (Input/Select/Checkbox/Toggle), ProgressBar, Badge,
               Calendar, Timeline, BudgetChart, EntityForm (formulário por schema), Toast…
    cards/     TaskCard, PlaceCard, HotelCard, FlightCard, ExpenseCard
    layout/    AppLayout (sidebar no desktop, bottom nav + menu "Mais" no celular)
    decor/     elementos visuais em SVG (sol nascente, Fuji, torii, sakura)
  pages/       uma página por rota (/dashboard, /roteiro, /voos, …, /configuracoes)
  services/    storage.ts (camada de armazenamento), schema.ts (validação), store.tsx (estado + ações)
  hooks/       useHashRoute, useCountdown, useEntityEditor, useTheme, useNow…
  utils/       calc.ts (todos os cálculos), alerts.ts, events.ts, dates.ts, format.ts
  data/        constants.ts (categorias), navigation.ts, seed.ts (dados de exemplo)
  types/       modelo de dados
```

## Como tudo se conecta

Nenhum valor derivado é salvo — tudo é recalculado a partir dos dados em `utils/calc.ts`:

| Ação | Efeito |
|---|---|
| Registrar gasto | Gasto da categoria, restante e barra do orçamento |
| Voo/hospedagem marcado como **pago** | Entra como gasto em Passagens/Hospedagem |
| Adicionar hospedagem | Planejado de Hospedagem (noites × diária), alerta de noites descobertas |
| Custos do roteiro | Planejado de Passeios e custo por dia |
| Compra marcada como comprada | Gasto em Compras |
| Concluir tarefa | Progresso de preparação e mensagem do dashboard |
| Adicionar dinheiro | Meta, percentual e histórico |
| Alterar data da viagem | Contagem regressiva, dias do roteiro, alertas |

Orçamento separa três conceitos: **Planejado** (quanto pretende gastar por categoria), **Gasto** (o que já foi pago) e **Restante** (orçamento total − gasto).

## Dados e privacidade

- Os dados ficam no `localStorage` do navegador, acessado **apenas** por `services/storage.ts`.
- Exporte/importe um backup JSON em Configurações. A importação é validada e normalizada.
- Números de documentos e códigos de reserva ficam mascarados por padrão.
- Os dados de exemplo são fictícios e marcados como “(exemplo)”.
- Câmbio e informações que mudam com o tempo são configuráveis pelo usuário — o app não inventa cotações.

## Migrar para Supabase/Firebase

Crie uma classe que implemente `StorageAdapter` (`load`, `save`, `clear`) e retorne-a em `createStorage()` em `services/storage.ts`. Cada coleção de `AppData` (itinerary, flights, hotels, expenses…) mapeia para uma tabela; os IDs já são UUIDs e todo item tem `createdAt`/`updatedAt`.
