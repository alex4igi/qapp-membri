import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Spinner } from '@/components/ui'
import { contractReady, downloadContract, loadContract, submitContract, type LoadResult } from './api'
import { SignatureCanvas } from './SignatureCanvas'

// Un checkbox nebifat (`false`) e o valoare validă, nu o „lipsă" — nu-l tratăm
// ca gol la fel ca un string netăiat.
function hasValue(v: string | boolean | undefined): boolean {
  return typeof v === 'boolean' ? v : !!(v ?? '').trim()
}

// Pagină PUBLICĂ (fără login): părintele deschide linkul din SMS/email,
// verifică datele precompletate, completează ce lipsește, desenează semnătura.
export function SemnarePage() {
  const { token = '' } = useParams()
  const [state, setState] = useState<'loading' | 'form' | 'done' | 'error'>('loading')
  const [data, setData] = useState<LoadResult | null>(null)
  const [errMsg, setErrMsg] = useState('')
  const [valori, setValori] = useState<Record<string, string | boolean>>({})
  const [semnatura, setSemnatura] = useState<string | null>(null)
  const [consimtamant, setConsimtamant] = useState(false)
  const [marketingOptin, setMarketingOptin] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState('')
  const [doneMsg, setDoneMsg] = useState('')
  const [gata, setGata] = useState(false)
  const [descarcare, setDescarcare] = useState(false)
  const [descarcareErr, setDescarcareErr] = useState('')
  // Linkul public dă documentul semnat doar o vreme; după aceea rămâne portalul.
  const [descExpirata, setDescExpirata] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadContract(token).then((res) => {
      if (cancelled) return
      if (res.alreadySigned) {
        setDoneMsg(res.message ?? 'Documentul a fost deja semnat.')
        setGata(res.canDownload === true)
        setDescExpirata(res.descarcareExpirata === true)
        setState('done')
      } else if (res.error) {
        setErrMsg(res.error)
        setState('error')
      } else {
        setData(res)
        const checkboxKeys = new Set(
          (res.fields ?? []).filter((f) => f.type === 'checkbox').map((f) => f.key),
        )
        // checkbox-urile pornesc nebifate — sursa lor e aproape mereu 'manual',
        // deci practic nu vin niciodată din prefill (care e mereu string oricum).
        const initial: Record<string, string | boolean> = {}
        for (const key of checkboxKeys) initial[key] = false
        for (const [k, v] of Object.entries(res.prefill ?? {})) {
          if (!checkboxKeys.has(k)) initial[k] = String(v ?? '')
        }
        setValori(initial)
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

  // După semnare, contract-finalize generează și arhivează PDF-ul în fundal:
  // întrebăm din 2 în 2 secunde până e gata (max ~1 minut).
  useEffect(() => {
    if (state !== 'done' || gata || descExpirata || !token) return
    let cancelled = false
    let incercari = 0
    const id = setInterval(async () => {
      incercari += 1
      const stare = await contractReady(token)
      if (cancelled) return
      if (stare.descarcareExpirata) {
        setDescExpirata(true)
        clearInterval(id)
      } else if (stare.ready) {
        setGata(true)
        clearInterval(id)
      } else if (incercari >= 30) {
        clearInterval(id)
      }
    }, 2000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [state, gata, descExpirata, token])

  async function descarca() {
    setDescarcareErr('')
    setDescarcare(true)
    try {
      const res = await downloadContract(token)
      if (res.url) {
        const a = document.createElement('a')
        a.href = res.url
        a.rel = 'noopener'
        document.body.appendChild(a)
        a.click()
        a.remove()
      } else if (res.pending) {
        setDescarcareErr('Documentul încă se pregătește. Mai încearcă în câteva secunde.')
      } else if (res.descarcareExpirata) {
        setDescExpirata(true)
        setGata(false)
        setDescarcareErr(res.error ?? '')
      } else {
        setDescarcareErr(res.error ?? 'Documentul nu poate fi descărcat acum.')
      }
    } catch {
      setDescarcareErr('Nu am putut descărca documentul. Verifică conexiunea.')
    } finally {
      setDescarcare(false)
    }
  }

  // Cheile venite mascate de la server (CNP, CI). Un astfel de câmp lăsat gol nu e
  // o lipsă: serverul pune valoarea din fișă înainte să valideze și să semneze.
  const mascate = useMemo(() => data?.mascate ?? {}, [data])

  // câmpurile de completat de părinte: editabile sau goale
  const inputFields = useMemo(
    () =>
      (data?.fields ?? []).filter(
        (f) =>
          f.type !== 'signature' &&
          f.type !== 'copii_table' &&
          f.source !== 'azi' &&
          (f.editable || !hasValue(valori[f.key])),
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
          hasValue(valori[f.key]),
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
      if (!f.required) continue
      if (f.type === 'checkbox') {
        if (valori[f.key] !== true) {
          setSubmitErr(`Bifează „${f.label}".`)
          return
        }
      } else if (!hasValue(valori[f.key]) && !(f.key in mascate)) {
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
            {descExpirata ? (
              <p className="mt-4 text-sm text-sub">
                Documentul nu se mai descarcă de pe acest link. Îl găsești în contul tău de
                membru, la secțiunea Documente.
              </p>
            ) : gata ? (
              <button
                type="button"
                onClick={descarca}
                disabled={descarcare}
                className="mt-4 w-full rounded-xl bg-acc px-4 py-3 text-sm font-extrabold text-acc-ink disabled:opacity-60"
              >
                {descarcare ? 'Se pregătește…' : 'Descarcă documentul semnat (PDF)'}
              </button>
            ) : (
              <p className="mt-4 text-sm text-sub">Pregătim documentul pentru descărcare…</p>
            )}
            {descarcareErr && !descExpirata && (
              <p className="mt-2 text-sm text-danger">{descarcareErr}</p>
            )}
            {!descExpirata && (
              <p className="mt-3 text-sm text-sub">
                Îl găsești oricând în contul tău de membru, la secțiunea Documente. Linkul acesta
                rămâne bun pentru descărcare 90 de zile.
              </p>
            )}
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
                {readonlyFields.some((f) => f.key in mascate) && (
                  <p className="mb-3 text-xs text-sub">
                    CNP-ul și actul de identitate le afișăm parțial — le avem în fișa ta și intră
                    întregi în contract la semnare.
                  </p>
                )}
                <dl className="space-y-1.5">
                  {readonlyFields.map((f) => (
                    <div key={f.key} className="flex justify-between gap-4 text-sm">
                      <dt className="text-sub">{f.label}</dt>
                      <dd className="font-medium text-ink">
                        {typeof valori[f.key] === 'boolean' ? (valori[f.key] ? 'Da' : 'Nu') : valori[f.key]}
                      </dd>
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
                  {inputFields.map((f) =>
                    f.type === 'checkbox' ? (
                      <label key={f.key} className="flex items-start gap-3 text-sm text-ink">
                        <input
                          type="checkbox"
                          checked={valori[f.key] === true}
                          onChange={(e) =>
                            setValori((v) => ({ ...v, [f.key]: e.target.checked }))
                          }
                          className="mt-0.5 h-4 w-4"
                        />
                        <span>
                          {f.label}
                          {f.required && <span className="text-danger"> *</span>}
                        </span>
                      </label>
                    ) : (
                      (() => {
                        const val = valori[f.key]
                        return (
                          <label key={f.key} className="block">
                            <span className="mb-1 block text-sm text-ink">
                              {f.label}
                              {f.required && <span className="text-danger"> *</span>}
                            </span>
                            <input
                              type={f.type === 'date' ? 'date' : 'text'}
                              value={typeof val === 'string' ? val : ''}
                              placeholder={mascate[f.key] ? 'Lasă gol ca să folosim datele din fișă' : undefined}
                              onChange={(e) =>
                                setValori((v) => ({ ...v, [f.key]: e.target.value }))
                              }
                              className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-acc focus:ring-2 focus:ring-acc/30"
                            />
                            {mascate[f.key] && (
                              <span className="mt-1 block text-xs text-sub">
                                Avem în fișă: {mascate[f.key]} — lasă câmpul gol ca să-l folosim,
                                sau scrie altă valoare.
                              </span>
                            )}
                          </label>
                        )
                      })()
                    ),
                  )}
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
