import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Button, Spinner } from '@/components/ui'
import { FIRMA } from '@/features/legal/firma'
import { getGrupeClient, type GrupaRow } from '@/features/grupa/api'
import { getProfilClient } from '@/features/profil/api'

const ZI_SCURT: Record<string, string> = {
  Luni: 'Lun', Marti: 'Mar', Miercuri: 'Mie', Joi: 'Joi',
  Vineri: 'Vin', Sambata: 'Sâm', Duminica: 'Dum',
}

function formatOra(ora: string | null): string {
  return ora ? ora.slice(0, 5) : ''
}

// Dată în format lung românesc pentru corpul oficial al adeverinței.
function formatDataLunga(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDataScurta(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function programText(g: GrupaRow): string {
  const zile = g.zile.map((z) => ZI_SCURT[z] ?? z).join(', ')
  const ora = formatOra(g.ora)
  return [zile, ora].filter(Boolean).join(' · ')
}

function perioadaText(g: GrupaRow): string {
  const start = g.dataIncepere ? formatDataScurta(g.dataIncepere) : null
  const final = g.dataFinal ? formatDataScurta(g.dataFinal) : null
  if (start && final) return `${start} – ${final}`
  if (start) return `din ${start}`
  if (final) return `până la ${final}`
  return '—'
}

export function AdeverintaPage() {
  const { activeMember, activeClientId } = useActiveMember()

  const profilQ = useQuery({
    queryKey: ['profil', activeClientId],
    queryFn: () => getProfilClient(activeClientId!),
    enabled: Boolean(activeClientId),
  })
  const grupeQ = useQuery({
    queryKey: ['grupe', activeClientId],
    queryFn: () => getGrupeClient(activeClientId!),
    enabled: Boolean(activeClientId),
  })

  if (!activeMember) {
    return (
      <div className="rounded-lg border border-quasar-gray-light bg-white p-6 text-sm text-quasar-gray">
        Selectează un membru pentru a genera adeverința.
      </div>
    )
  }

  if (profilQ.isLoading || grupeQ.isLoading) return <Spinner />

  const profil = profilQ.data
  const grupe = grupeQ.data ?? []
  const numeComplet =
    [profil?.nume, profil?.prenume].filter(Boolean).join(' ') ||
    [activeMember.nume, activeMember.prenume].filter(Boolean).join(' ')

  const dataAzi = formatDataLunga(new Date().toISOString())

  return (
    <div className="space-y-4">
      {/* Controale — nu se tipăresc */}
      <div className="no-print rounded-lg border border-quasar-gray-light bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Adeverință de frecvență</h1>
            <p className="text-sm text-quasar-gray">
              Pentru <strong>{numeComplet}</strong>. Verifică datele, apoi
              tipărește sau salvează ca PDF și adu documentul la studio pentru
              semnătură și ștampilă.
            </p>
          </div>
          <Button
            onClick={() => window.print()}
            disabled={grupe.length === 0}
          >
            🖨️ Tipărește / Salvează PDF
          </Button>
        </div>
        {grupe.length === 0 && (
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {numeComplet} nu are nicio înrolare activă, deci nu se poate emite o
            adeverință de frecvență. Contactează recepția dacă e o eroare.
          </p>
        )}
      </div>

      {/* Documentul printabil */}
      {grupe.length > 0 && (
        <div className="print-area rounded-lg border border-quasar-gray-light bg-white p-8 text-quasar-black">
          {/* Antet firmă */}
          <header className="border-b border-quasar-black/20 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-black uppercase tracking-wide">
                  {FIRMA.denumire}
                </p>
                <p className="text-xs text-quasar-gray">
                  CUI {FIRMA.cui} · Reg. Com. {FIRMA.regCom}
                </p>
                <p className="text-xs text-quasar-gray">{FIRMA.adresa}</p>
                <p className="text-xs text-quasar-gray">
                  {FIRMA.email} · {FIRMA.website}
                </p>
              </div>
              <span className="rounded bg-quasar-yellow px-2 py-1 text-sm font-black text-quasar-black">
                QUASAR
              </span>
            </div>
          </header>

          {/* Titlu + dată */}
          <div className="mt-6 text-center">
            <h2 className="text-xl font-bold uppercase tracking-wide">
              Adeverință de frecvență
            </h2>
          </div>
          <p className="mt-4 text-right text-sm">Iași, {dataAzi}</p>

          {/* Corp */}
          <div className="mt-2 space-y-4 text-sm leading-relaxed">
            <p>
              Prin prezenta se adeverește că{' '}
              <strong>{numeComplet}</strong>
              {profil?.dataNasterii && (
                <>, născut(ă) la data de{' '}
                  <strong>{formatDataLunga(profil.dataNasterii)}</strong></>
              )}{' '}
              este înscris(ă) și frecventează cursurile de dans organizate de{' '}
              {FIRMA.denumire}, după cum urmează:
            </p>

            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-quasar-black/30 text-left">
                  <th className="py-1.5 pr-2">Curs</th>
                  <th className="py-1.5 pr-2">Nivel / Grupă</th>
                  <th className="py-1.5 pr-2">Locație</th>
                  <th className="py-1.5 pr-2">Program</th>
                  <th className="py-1.5">Perioadă</th>
                </tr>
              </thead>
              <tbody>
                {grupe.map((g) => (
                  <tr key={g.enrollmentId} className="border-b border-quasar-gray-light">
                    <td className="py-1.5 pr-2 font-medium">{g.cursNume ?? 'Curs'}</td>
                    <td className="py-1.5 pr-2">
                      {[g.nivel, g.varsta].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="py-1.5 pr-2">
                      {[g.locatie, g.sala].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="py-1.5 pr-2">{programText(g) || '—'}</td>
                    <td className="py-1.5">{perioadaText(g)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p>
              Prezenta adeverință a fost eliberată la cererea persoanei
              interesate, pentru a-i servi la nevoie.
            </p>
          </div>

          {/* Semnătură */}
          <div className="mt-12 flex justify-end">
            <div className="w-64 text-center text-sm">
              <p className="font-semibold">Din partea {FIRMA.denumire}</p>
              <p className="text-quasar-gray">{FIRMA.administrator}</p>
              <div className="mt-10 border-t border-quasar-black/40 pt-1 text-xs text-quasar-gray">
                Semnătură și ștampilă
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
