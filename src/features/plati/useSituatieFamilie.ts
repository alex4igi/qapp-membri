import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { acumBucuresti } from '@/lib/format'
import {
  getDatoriiClient,
  getPlatiClient,
  getPlatiInCurs,
  previewPlataFamilie,
  type SelectieMembru,
} from './api/payments'
import { context, cos, randuriDinDatorii, randuriDinRate, selectieImplicita, type Rand } from './familie'

// Toate ratele și datoriile familiei, pe rânduri, + plățile în curs. Folosit de Acasă și de Plăți,
// ca ambele să pornească de la aceleași date (cheile de query sunt cele vechi, deci
// CHEI_DUPA_PLATA le reîmprospătează după o plată).
export function useSituatieFamilie() {
  const { members, loading } = useActiveMember()
  const azi = acumBucuresti().zi

  const plati = useQueries({
    queries: members.map((m) => ({ queryKey: ['plati', m.clientId], queryFn: () => getPlatiClient(m.clientId) })),
  })
  const datorii = useQueries({
    queries: members.map((m) => ({ queryKey: ['datorii', m.clientId], queryFn: () => getDatoriiClient(m.clientId) })),
  })
  const inCursQ = useQuery({ queryKey: ['plati-in-curs'], queryFn: getPlatiInCurs, refetchInterval: 60_000 })

  const isLoading = loading || plati.some((q) => q.isLoading) || datorii.some((q) => q.isLoading) || inCursQ.isLoading
  const isError = plati.some((q) => q.isError) || datorii.some((q) => q.isError) || inCursQ.isError
  const gata = !isLoading && !isError

  // useQueries întoarce un array nou la fiecare randare; semnătura pe dataUpdatedAt ține memo-ul stabil.
  const semnatura = [...plati, ...datorii].map((q) => q.dataUpdatedAt).join(',')
  const rows = useMemo<Rand[]>(() => {
    if (!gata) return []
    return members.flatMap((m, i) => [
      ...randuriDinRate(plati[i]?.data ?? [], m.clientId, m.displayName),
      ...randuriDinDatorii(datorii[i]?.data ?? [], m.clientId, m.displayName),
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gata, members, semnatura])

  const inCurs = useMemo(() => new Set((inCursQ.data ?? []).flatMap((p) => p.randuri)), [inCursQ.data])
  const ctx = useMemo(() => context(rows, azi, inCurs), [rows, azi, inCurs])
  const implicita = useMemo(() => selectieImplicita(rows, ctx), [rows, ctx])
  const ordine = useMemo(() => members.map((m) => m.clientId), [members])
  const cosImplicit = useMemo(() => cos(rows, implicita, ctx, ordine), [rows, implicita, ctx, ordine])

  const refetch = () => {
    for (const q of [...plati, ...datorii]) void q.refetch()
    void inCursQ.refetch()
  }

  return {
    members,
    rows,
    ctx,
    implicita,
    ordine,
    cosImplicit,
    platiInCurs: inCursQ.data ?? [],
    isLoading,
    isError,
    refetch,
  }
}

// Suma exactă a unui coș, de la server. `cheie` stabilă = aceeași selecție nu cere de două ori.
export function usePreviewPlata(selectie: SelectieMembru[], enabled = true) {
  const cheie = JSON.stringify(selectie)
  return useQuery({
    queryKey: ['preview-plata', cheie],
    queryFn: () => previewPlataFamilie(selectie),
    enabled: enabled && selectie.length > 0,
    retry: false,
    staleTime: 15_000,
    meta: { erroareAfisata: true },
  })
}
