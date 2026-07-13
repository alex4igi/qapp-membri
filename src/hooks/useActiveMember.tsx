import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Switcher de membru familie: un cont de familie comută contextul între copii;
// un cont individual are un singur membru. Sursa: RPC get_membri_familie() care
// întoarce DOAR membrii familiei autentificate (RLS pe auth.uid()).

export type Member = {
  clientId: string
  nume: string
  prenume: string | null
  // Numele de referință în UI e PRENUMELE (decizie user 2026-07-13); nume = fallback.
  displayName: string
}

async function fetchMembers(): Promise<Member[]> {
  const { data, error } = await supabase.rpc('get_membri_familie')
  if (error) throw error
  return (data ?? []).map((m) => ({
    clientId: m.client_id,
    nume: m.nume ?? '—',
    prenume: m.prenume,
    displayName: m.prenume?.trim() || m.nume || '—',
  }))
}

type ActiveMemberValue = {
  members: Member[]
  activeClientId: string | null
  activeMember: Member | null
  setActiveClientId: (id: string) => void
  loading: boolean
}

const ActiveMemberContext = createContext<ActiveMemberValue | undefined>(undefined)

const LS_KEY = 'qapp-membri:activeClientId'

export function ActiveMemberProvider({ children }: { children: ReactNode }) {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['membri-familie'],
    queryFn: fetchMembers,
  })
  const [activeClientId, setActiveClientIdState] = useState<string | null>(
    () => localStorage.getItem(LS_KEY),
  )

  const setActiveClientId = (id: string) => {
    setActiveClientIdState(id)
    localStorage.setItem(LS_KEY, id)
  }

  // Validează selecția față de membrii încărcați: dacă cea salvată nu mai e a
  // familiei (sau lipsește), cade pe primul membru.
  useEffect(() => {
    if (members.length === 0) return
    const valid = activeClientId && members.some((m) => m.clientId === activeClientId)
    if (!valid) setActiveClientId(members[0].clientId)
  }, [members, activeClientId])

  const value = useMemo<ActiveMemberValue>(
    () => ({
      members,
      activeClientId,
      activeMember: members.find((m) => m.clientId === activeClientId) ?? null,
      setActiveClientId,
      loading: isLoading,
    }),
    [members, activeClientId, isLoading],
  )

  return <ActiveMemberContext.Provider value={value}>{children}</ActiveMemberContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useActiveMember(): ActiveMemberValue {
  const ctx = useContext(ActiveMemberContext)
  if (!ctx) throw new Error('useActiveMember trebuie folosit în interiorul <ActiveMemberProvider>')
  return ctx
}
