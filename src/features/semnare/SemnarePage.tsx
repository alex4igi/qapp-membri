import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Spinner } from '@/components/ui'
import { loadContract, submitContract, type LoadResult } from './api'
import { SignatureCanvas } from './SignatureCanvas'

// Pagină PUBLICĂ (fără login): părintele deschide linkul din SMS/email,
// verifică datele precompletate, completează ce lipsește, desenează semnătura.
export function SemnarePage() {
  const { token = '' } = useParams()
  const [state, setState] = useState<'loading' | 'form' | 'done' | 'error'>('loading')
  const [data, setData] = useState<LoadResult | null>(null)
  const [errMsg, setErrMsg] = useState('')
  const [valori, setValori] = useState<Record<string, string>>({})
  const [semnatura, setSemnatura] = useState<string | null>(null)
  const [consimtamant, setConsimtamant] = useState(false)
  const [marketingOptin, setMarketingOptin] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState('')
  const [doneMsg, setDoneMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    loadContract(token).then((res) => {
      if (cancelled) return
      if (res.alreadySigned) {
        setDoneMsg(res.message ?? 'Documentul a fost deja semnat.')
        setState('done')
      } else if (res.error) {
        setErrMsg(res.error)
        setState('error')
      } else {
        setData(res)
        setValori(
          Object.fromEntries(
            Object.entries(res.prefill ?? {}).map(([k, v]) => [k, String(v ?? '')]),
          ),
        )
        setState('form')
      }
    }).catch(() => {
      if (!cancelled) {
        setErrMsg('Nu am putut încărca documentul. Verifică conexiunea și reîncearcă.')
        setState('error')
      }
    })
    return () => {
      cancelled = true
    }
  }, [token])

  // câmpurile de completat de părinte: editabile sau goale
  const inputFields = useMemo(
    () =>
      (data?.fields ?? []).filter(
        (f) =>
          f.type !== 'signature' &&
          f.type !== 'copii_table' &&
          f.source !== 'azi' &&
          (f.editable || !(valori[f.key] ?? '').trim()),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  )
  const readonlyFields = useMemo(
    () =>
      (data?.fields ?? []).filter(
        (f) =>
          f.type !== 'signature' &&
          f.type !== 'copii_table' &&
          f.source !== 'azi' &&
          !f.editable &&
          (valori[f.key] ?? '').trim(),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  )

  async function onSubmit() {
    setSubmitErr('')
    if (!consimtamant) {
      setSubmitErr('Bifează acordul pentru semnarea electronică.')
      return
    }
    if (!semnatura) {
      setSubmitErr('Desenează semnătura înainte de trimitere.')
      return
    }
    for (const f of inputFields) {
      if (f.required && !(valori[f.key] ?? '').trim()) {
        setSubmitErr(`Completează câmpul „${f.label}".`)
        return
      }
    }
    setSubmitting(true)
    try {
      const res = await submitContract({
        token,
        valori,
        semnaturaPng: semnatura,
        consimtamant,
        marketingOptin,
      })
      if (res.ok) {
        setDoneMsg(res.message ?? 'Documentul a fost semnat. Mulțumim!')
        setState('done')
      } else {
        setSubmitErr(res.error ?? 'Eroare la trimitere. Reîncearcă.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surf px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <img src="/logo.png" alt="Quasar Dance" className="h-8 w-auto" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
          <div>
            <p className="text-sm font-semibold text-ink">Quasar Dance</p>
            <p className="text-xs text-sub">Semnare document</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        {state === 'loading' && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {state === 'error' && (
          <div className="rounded-2xl border border-line bg-surf p-6 text-center">
            <p className="text-3xl">😕</p>
            <p className="mt-2 font-medium text-ink">{errMsg}</p>
            <p className="mt-2 text-sm text-sub">
              Dacă ai nevoie de un link nou, sună la recepție: 0730 534 172 / 0770 227 580.
            </p>
          </div>
        )}

        {state === 'done' && (
          <div className="rounded-2xl border border-line bg-surf p-6 text-center">
            <p className="text-3xl">✅</p>
            <p className="mt-2 text-lg font-semibold text-ink">{doneMsg}</p>
            <p className="mt-2 text-sm text-sub">
              Documentul semnat va apărea în contul tău de membru, la secțiunea Documente.
            </p>
          </div>
        )}

        {state === 'form' && data && (
          <>
            <div className="rounded-2xl border border-line bg-surf p-5">
              <h1 className="text-lg font-semibold text-ink">{data.contract?.nume}</h1>
              {data.pdfUrl && (
                <a
                  href={data.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm font-medium text-ink underline"
                >
                  Citește documentul complet (PDF) ↗
                </a>
              )}
              {(data.copii?.length ?? 0) > 0 && (
                <p className="mt-2 text-sm text-sub">
                  Cursanți: {data.copii!.map((c) => c.nume).join(', ')}
                </p>
              )}
            </div>

            {readonlyFields.length > 0 && (
              <div className="rounded-2xl border border-line bg-surf p-5">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sub">
                  Datele tale (verifică-le)
                </h2>
                <dl className="space-y-1.5">
                  {readonlyFields.map((f) => (
                    <div key={f.key} className="flex justify-between gap-4 text-sm">
                      <dt className="text-sub">{f.label}</dt>
                      <dd className="font-medium text-ink">{valori[f.key]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {inputFields.length > 0 && (
              <div className="rounded-2xl border border-line bg-surf p-5">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sub">
                  Completează
                </h2>
                <div className="space-y-3">
                  {inputFields.map((f) => (
                    <label key={f.key} className="block">
                      <span className="mb-1 block text-sm text-ink">
                        {f.label}
                        {f.required && <span className="text-danger"> *</span>}
                      </span>
                      <input
                        type={f.type === 'date' ? 'date' : 'text'}
                        value={valori[f.key] ?? ''}
                        onChange={(e) =>
                          setValori((v) => ({ ...v, [f.key]: e.target.value }))
                        }
                        className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-acc focus:ring-2 focus:ring-acc/30"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-line bg-surf p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sub">
                Semnătura
              </h2>
              <SignatureCanvas onChange={setSemnatura} />
            </div>

            <div className="rounded-2xl border border-line bg-surf p-5 space-y-3">
              <label className="flex items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={consimtamant}
                  onChange={(e) => setConsimtamant(e.target.checked)}
                  className="mt-0.5 h-4 w-4"
                />
                <span>
                  Sunt de acord să semnez acest document electronic și confirm că datele
                  completate sunt corecte. <span className="text-danger">*</span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-sub">
                <input
                  type="checkbox"
                  checked={marketingOptin}
                  onChange={(e) => setMarketingOptin(e.target.checked)}
                  className="mt-0.5 h-4 w-4"
                />
                <span>
                  (Opțional) Doresc să primesc noutăți și oferte Quasar Dance prin SMS/email.
                </span>
              </label>
            </div>

            {submitErr && (
              <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                {submitErr}
              </p>
            )}

            <button
              type="button"
              onClick={() => void onSubmit()}
              disabled={submitting}
              className="w-full rounded-xl bg-acc px-4 py-3.5 text-base font-semibold text-acc-ink shadow-sm transition hover:brightness-95 disabled:opacity-60"
            >
              {submitting ? 'Se trimite…' : 'Semnează documentul'}
            </button>
            <p className="pb-6 text-center text-xs text-sub">
              Semnarea este înregistrată cu dată, oră și adresa IP, conform Legii 214/2024.
            </p>
          </>
        )}
      </main>
    </div>
  )
}
