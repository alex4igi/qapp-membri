import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Button, Spinner } from '@/components/ui'
import { formatData } from '@/lib/format'
import { DocumenteSection } from '@/features/documente/DocumenteSection'
import {
  MARIMI_TRICOU,
  getProfilFamilie,
  updateProfilFamilie,
  getProfilClient,
  updateProfilClient,
  type ProfilFamilie,
  type ProfilClient,
} from './api'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-sub">{label}</span>
      {children}
    </label>
  )
}

const inputCls =
  'w-full rounded-xl border border-line bg-surf px-3 py-2 text-sm text-ink disabled:bg-surf2 disabled:opacity-60'

function Text({
  value,
  onChange,
  disabled,
}: {
  value: string | null
  onChange?: (v: string) => void
  disabled?: boolean
}) {
  return (
    <input
      className={inputCls}
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
    />
  )
}

function SavedHint({ saved }: { saved: boolean }) {
  if (!saved) return null
  return <span className="text-xs font-medium text-ok">✓ salvat</span>
}

// ───────────────────────── Schimbă parola ─────────────────────────
function SchimbaParola() {
  const { updatePassword } = useAuth()
  const [pwd, setPwd] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const { error } = await updatePassword(pwd)
    setBusy(false)
    setMsg(error ? `Eroare: ${error}` : 'Parola a fost schimbată.')
    if (!error) setPwd('')
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-2 rounded-2xl border border-line bg-surf p-5 shadow-card"
    >
      <h2 className="text-base font-extrabold text-ink">Schimbă parola</h2>
      <input
        type="password"
        placeholder="Parolă nouă"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        minLength={6}
        required
        className={inputCls}
      />
      {msg && <p className="text-sm text-sub">{msg}</p>}
      <Button type="submit" disabled={busy}>
        {busy ? 'Se salvează…' : 'Salvează'}
      </Button>
    </form>
  )
}

// ───────────────────────── Fișă familie ─────────────────────────
function FisaFamilie() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['profil-familie'], queryFn: getProfilFamilie })
  const [form, setForm] = useState<ProfilFamilie | null>(null)
  const [saved, setSaved] = useState(false)
  useEffect(() => setForm(data ?? null), [data])

  const mut = useMutation({
    mutationFn: updateProfilFamilie,
    onSuccess: () => {
      setSaved(true)
      qc.invalidateQueries({ queryKey: ['profil-familie'] })
      qc.invalidateQueries({ queryKey: ['membri-familie'] })
      setTimeout(() => setSaved(false), 2500)
    },
  })

  if (isLoading) return <Spinner />
  if (!form) return null // cont individual fără familie
  const set = <K extends keyof ProfilFamilie>(k: K, v: ProfilFamilie[K]) =>
    setForm({ ...form, [k]: v })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        mut.mutate(form)
      }}
      className="space-y-3 rounded-2xl border border-line bg-surf p-5 shadow-card"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-ink">Datele mele (familia {form.numeFamilie})</h2>
        <SavedHint saved={saved} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nume reprezentant">
          <Text value={form.numeReprezentant} onChange={(v) => set('numeReprezentant', v)} />
        </Field>
        <Field label="Prenume reprezentant">
          <Text value={form.prenumeReprezentant} onChange={(v) => set('prenumeReprezentant', v)} />
        </Field>
        <Field label="Telefon">
          <Text value={form.telefon} onChange={(v) => set('telefon', v)} />
        </Field>
        <Field label="Telefon 2">
          <Text value={form.telefon2} onChange={(v) => set('telefon2', v)} />
        </Field>
        <Field label="Email">
          <Text value={form.email} onChange={(v) => set('email', v)} />
        </Field>
        <Field label="Metodă comunicare">
          <Text value={form.metodaComunicare} onChange={(v) => set('metodaComunicare', v)} />
        </Field>
      </div>

      <div className="flex flex-col gap-2 border-t border-line pt-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-acc"
            checked={form.dorestePoze}
            onChange={(e) => set('dorestePoze', e.target.checked)}
          />
          Sunt de acord cu apariția în poze/video
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-acc"
            checked={form.optOutMarketing}
            onChange={(e) => set('optOutMarketing', e.target.checked)}
          />
          Nu doresc mesaje de marketing (rămân doar cele tranzacționale)
        </label>
      </div>

      <div className="border-t border-line pt-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="accent-acc"
            checked={form.facturaPeFirma}
            onChange={(e) => set('facturaPeFirma', e.target.checked)}
          />
          Vreau factură pe firmă
        </label>
        {form.facturaPeFirma && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Denumire firmă">
              <Text value={form.firmaDenumire} onChange={(v) => set('firmaDenumire', v)} />
            </Field>
            <Field label="CIF">
              <Text value={form.firmaCif} onChange={(v) => set('firmaCif', v)} />
            </Field>
            <Field label="Reg. Com.">
              <Text value={form.firmaRegCom} onChange={(v) => set('firmaRegCom', v)} />
            </Field>
            <Field label="IBAN">
              <Text value={form.firmaIban} onChange={(v) => set('firmaIban', v)} />
            </Field>
            <Field label="Bancă">
              <Text value={form.firmaBanca} onChange={(v) => set('firmaBanca', v)} />
            </Field>
            <Field label="Adresă firmă">
              <Text value={form.firmaAdresa} onChange={(v) => set('firmaAdresa', v)} />
            </Field>
          </div>
        )}
      </div>

      {mut.isError && <p className="text-sm text-danger">Eroare la salvare.</p>}
      <Button type="submit" disabled={mut.isPending}>
        {mut.isPending ? 'Se salvează…' : 'Salvează datele'}
      </Button>
    </form>
  )
}

// ───────────────────────── Fișă membru ─────────────────────────
function FisaMembru() {
  const qc = useQueryClient()
  const { activeMember } = useActiveMember()
  const { data, isLoading } = useQuery({
    queryKey: ['profil-client', activeMember?.clientId],
    queryFn: () => getProfilClient(activeMember!.clientId),
    enabled: !!activeMember,
  })
  const [form, setForm] = useState<ProfilClient | null>(null)
  const [saved, setSaved] = useState(false)
  useEffect(() => setForm(data ?? null), [data])

  const mut = useMutation({
    mutationFn: updateProfilClient,
    onSuccess: () => {
      setSaved(true)
      qc.invalidateQueries({ queryKey: ['profil-client'] })
      setTimeout(() => setSaved(false), 2500)
    },
  })

  if (!activeMember) return null
  if (isLoading) return <Spinner />
  if (!form) return null
  const set = <K extends keyof ProfilClient>(k: K, v: ProfilClient[K]) => setForm({ ...form, [k]: v })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        mut.mutate(form)
      }}
      className="space-y-3 rounded-2xl border border-line bg-surf p-5 shadow-card"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-ink">
          Fișă — {[form.prenume, form.nume].filter(Boolean).join(' ')}
        </h2>
        <SavedHint saved={saved} />
      </div>
      <p className="text-xs text-sub">
        Nume și data nașterii ({formatData(form.dataNasterii)}) se modifică doar prin recepție.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email">
          <Text value={form.email} onChange={(v) => set('email', v)} />
        </Field>
        <Field label="Telefon">
          <Text value={form.telefon} onChange={(v) => set('telefon', v)} />
        </Field>
        <Field label="Telefon 2">
          <Text value={form.telefonul2} onChange={(v) => set('telefonul2', v)} />
        </Field>
        <Field label="Unitate de învățământ">
          <Text value={form.unitateInvatamant} onChange={(v) => set('unitateInvatamant', v)} />
        </Field>
        <Field label="Mărime tricou">
          <select
            className={inputCls}
            value={form.marimeTricou ?? ''}
            onChange={(e) => set('marimeTricou', e.target.value || null)}
          >
            <option value="">—</option>
            {MARIMI_TRICOU.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {mut.isError && <p className="text-sm text-danger">Eroare la salvare.</p>}
      <Button type="submit" disabled={mut.isPending}>
        {mut.isPending ? 'Se salvează…' : 'Salvează'}
      </Button>
    </form>
  )
}

function Logout() {
  const { signOut } = useAuth()
  return (
    <button
      onClick={signOut}
      className="w-full rounded-2xl border border-danger bg-surf px-4 py-3 text-sm font-extrabold text-danger shadow-card"
    >
      Ieșire din cont
    </button>
  )
}

export function ProfilPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <FisaFamilie />
      <FisaMembru />
      <DocumenteSection />
      <SchimbaParola />
      <Logout />
    </div>
  )
}
