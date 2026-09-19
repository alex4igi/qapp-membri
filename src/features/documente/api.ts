import { supabase, edgeFunctionError } from '@/lib/supabase'
import type { Enums } from '@/types/db'

// „Documente" — contracte, anexe, declarații…, scopate la membrul activ.
// Sursă: RPC get_documente_client.
//
// Două feluri de documente, după proveniență:
//  • generate de aplicație (contract semnat) — arhivate în bucketul PRIVAT
//    `contracte`; `storagePath` e setat, descărcarea trece prin portal-document.
//  • atașate manual de recepție — doar `link` (Google Drive).

export type DocumentRow = {
  id: string
  tip: Enums<'tip_document'> | null
  titlu: string | null
  link: string
  storagePath: string | null
  dataExpirarii: string | null
  observatii: string | null
}

export async function getDocumenteClient(clientId: string): Promise<DocumentRow[]> {
  const { data, error } = await supabase.rpc('get_documente_client', { p_client: clientId })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    tip: r.tip,
    titlu: r.titlu,
    link: r.link,
    storagePath: r.storage_path,
    dataExpirarii: r.data_expirarii,
    observatii: r.observatii,
  }))
}

// Signed URL de 5 minute pentru documentul arhivat. Se cere la click, nu la
// afișarea listei: un link semnat pus în pagină ar circula mai departe.
export async function getDocumentDownloadUrl(documentId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('portal-document', {
    body: { documentId },
  })
  if (error) throw await edgeFunctionError(error)
  const url = (data as { url?: string }).url
  if (!url) throw new Error('Documentul nu poate fi descărcat acum.')
  return url
}
