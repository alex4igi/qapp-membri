import { SKILLS } from './api'
import { STELE_MAX, TREPTE_PE_STEA, formatStele } from './scale'
import type { EvaluareRow } from './api'

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )

/**
 * Raportul copilului, printabil / salvabil ca PDF. Fereastră nouă → print, ca la
 * adeverința de frecvență: fără dependință de generare PDF.
 *
 * Stelele sunt glife (◆ ◈ ◇), nu SVG — supraviețuiesc print-ului alb-negru și
 * setării „fără grafică de fundal".
 */
export function printEvaluare(e: EvaluareRow, numeCopil: string) {
  const w = window.open('', '_blank', 'width=800,height=1000')
  if (!w) return

  const randuri = SKILLS.map((s) => {
    const trepte = e.skills[s.key]
    const glife = Array.from({ length: STELE_MAX }, (_, i) => {
      const intreaga = (i + 1) * TREPTE_PE_STEA
      if (trepte == null) return '◇'
      if (trepte >= intreaga) return '◆'
      if (trepte >= intreaga - 1) return '◈'
      return '◇'
    }).join(' ')
    return `<tr><td class="crit">${esc(s.label)}</td><td class="stele">${glife}</td><td class="nota">${formatStele(trepte)}</td></tr>`
  }).join('')

  const valori = SKILLS.map((s) => e.skills[s.key]).filter((v): v is number => v != null)
  const media = valori.length ? valori.reduce((a, b) => a + b, 0) / valori.length : null

  const subtitlu = [e.cursNume, e.nivelGrupa, e.teacherNume ? `instructor ${e.teacherNume}` : null]
    .filter(Boolean)
    .map((x) => esc(String(x)))
    .join(' · ')

  w.document.write(`<!doctype html><html lang="ro"><head><meta charset="utf-8">
<title>Evaluare — ${esc(numeCopil)}</title>
<style>
  body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; margin: 32px; color: #1a1814; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color: #666; font-size: 13px; margin-bottom: 4px; }
  .data { color: #888; font-size: 12px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 7px 0; border-bottom: 1px solid #ece8e0; vertical-align: middle; }
  .crit { font-size: 13px; }
  .stele { width: 110px; text-align: right; letter-spacing: 2px; font-size: 15px; white-space: nowrap; }
  .nota { width: 48px; text-align: right; font-size: 13px; font-weight: 600; }
  .medie { margin-top: 16px; font-size: 15px; font-weight: 700; text-align: right; }
  .fb { margin-top: 22px; padding: 12px 16px; background: #f7f5f0; border-radius: 8px; page-break-inside: avoid; }
  .fb h2 { font-size: 14px; margin: 0 0 6px; }
  .fb p { margin: 0; font-size: 13px; line-height: 1.5; }
  .legenda { margin-top: 24px; color: #888; font-size: 11px; }
  @media print { body { margin: 14mm; } }
</style></head>
<body>
  <h1>${esc(numeCopil)}</h1>
  <div class="sub">${subtitlu}</div>
  <div class="data">Raport de evaluare · ${esc(e.data ? new Date(e.data).toLocaleDateString('ro-RO') : '')}</div>
  <table>${randuri}</table>
  ${media != null ? `<div class="medie">Medie generală: ${formatStele(media)} / ${STELE_MAX}</div>` : ''}
  ${e.feedbackGeneral ? `<div class="fb"><h2>Feedback de la instructor</h2><p>${esc(e.feedbackGeneral)}</p></div>` : ''}
  <div class="legenda">◆ stea întreagă · ◈ jumătate de stea · ◇ neacordat — scala e de la 0,5 la ${STELE_MAX} stele.</div>
  <script>window.onload = () => window.print()</script>
</body></html>`)
  w.document.close()
}
