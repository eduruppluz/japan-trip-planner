import { ExternalLink, Clock } from 'lucide-react'
import type { Place } from '@/types'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Field'
import { PLACE_CATEGORIES, PLACE_PRIORITIES } from '@/data/constants'
import { mapsSearchUrl, money0 } from '@/utils/format'
import { cn } from '@/utils/cn'

export function PlaceCard({ place, onToggle, onEdit }: { place: Place; onToggle: (v: boolean) => void; onEdit: () => void }) {
  const cat = PLACE_CATEGORIES[place.category]
  const pr = PLACE_PRIORITIES[place.priority]
  const link = place.mapsLink || mapsSearchUrl(place.name, place.address, place.city, 'Japão')
  return (
    <Card className={cn('flex flex-col p-4 transition-opacity', place.visited && 'opacity-70')}>
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface-2 text-xl" aria-hidden>{cat.emoji}</span>
        <button onClick={onEdit} className="min-w-0 flex-1 text-left">
          <p className={cn('line-clamp-2 text-[15px] leading-snug font-semibold', place.visited && 'line-through decoration-faint')}>{place.name}</p>
          <p className="text-sm text-muted">{place.city || 'Cidade não definida'} · {cat.label}</p>
        </button>
        <Checkbox checked={place.visited} onChange={onToggle} label={`Marcar ${place.name} como conhecido`} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="rounded-full bg-surface-2 px-2.5 py-1">{pr.emoji} {pr.label}</span>
        {place.duration && <span className="inline-flex items-center gap-1"><Clock size={12} />{place.duration}</span>}
        {place.cost > 0 && <span className="tabular">{money0(place.cost)}</span>}
        {place.visited && <span className="font-medium text-success">✓ Conhecido</span>}
        <a href={link} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex h-8 items-center gap-1 rounded-lg px-2 font-medium text-ink hover:bg-surface-2">
          Mapa <ExternalLink size={12} />
        </a>
      </div>
      {place.notes && <p className="mt-2 line-clamp-2 text-sm text-muted">{place.notes}</p>}
    </Card>
  )
}
