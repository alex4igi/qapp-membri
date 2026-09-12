import { useState } from 'react'
import { Button, Modal } from '@/components/ui'
import { useActiveMember } from '@/hooks/useActiveMember'
import { submitFeedback, TIP_OPTIONS, type FeedbackTip } from './api'

type Props = { open: boolean; onClose: () => void }

export function FeedbackModal({ open, onClose }: Props) {
  const { activeClientId } = useActiveMember()
  const [tip, setTip] = useState<FeedbackTip>('Bug')
  const [titlu, setTitlu] = useState('')
  const [detalii, setDetalii] = useState('')
  const [saving, setSaving] = useState(false)
  const [eroare, setEroare] = useState<string | null>(null)
  const [trimis, setTrimis] = useState(false)

  const inchide = () => {
    setTip('Bug'); setTitlu(''); setDetalii(''); setEroare(null); setTrimis(false)
    onClose()
  }

  const trimite = async () => {
    setSaving(true)
    setEroare(null)
    try {
      await submitFeedback({ tip, titlu, detalii, clientId: activeClientId })
      setTrimis(true)
    } catch (e) {
      setEroare(e instanceof Error ? e.message : 'Nu am putut trimite mesajul.')
    } finally {
      setSaving(false)
    }
  }

  const hint = TIP_OPTIONS.find((o) => o.value === tip)?.hint

  return (
    <Modal
      open={open}
      title={trimis ? 'Mulțumim!' : 'Spune-ne părerea ta'}
      onClose={inchide}
      footer={
        trimis ? (
          <Button onClick={inchide}>Închide</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={inchide}>Renunță</Button>
            <Button onClick={trimite} disabled={saving || !titlu.trim()}>
              {saving ? 'Se trimite…' : 'Trimite'}
            </Button>
          </>
        )
      }
    >
      {trimis ? (
        <p className="text-sm text-ink">
          Am primit mesajul tău și ajunge direct la echipa care se ocupă de portal.
          Dacă e nevoie de detalii, te căutăm pe email.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-sub">
            Portalul e nou și îl îmbunătățim pe măsură ce îl folosiți. Orice ți se pare
            ciudat sau lipsă, scrie-ne aici.
          </p>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-ink">Despre ce e vorba?</span>
            <div className="flex flex-wrap gap-2">
              {TIP_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setTip(o.value)}
                  className={
                    tip === o.value
                      ? 'rounded-full bg-acc px-3.5 py-2 text-[13px] font-bold text-acc-ink'
                      : 'rounded-full border border-line bg-surf px-3.5 py-2 text-[13px] font-bold text-sub'
                  }
                >
                  {o.label}
                </button>
              ))}
            </div>
            {hint && <span className="text-xs text-sub">Ex.: {hint}</span>}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-ink">Pe scurt</span>
            <input
              value={titlu}
              onChange={(e) => setTitlu(e.target.value)}
              maxLength={160}
              placeholder="Ex.: nu văd plata de luna trecută"
              className="rounded-xl border border-line bg-surf px-3 py-2.5 text-sm text-ink"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-ink">Detalii (opțional)</span>
            <textarea
              value={detalii}
              onChange={(e) => setDetalii(e.target.value)}
              rows={4}
              maxLength={4000}
              placeholder="Ce ai făcut înainte să apară problema, ce te așteptai să vezi…"
              className="rounded-xl border border-line bg-surf px-3 py-2.5 text-sm text-ink"
            />
          </label>

          {eroare && <p className="text-sm font-semibold text-danger">{eroare}</p>}
        </div>
      )}
    </Modal>
  )
}
