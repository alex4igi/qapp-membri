import { supabase } from '@/lib/supabase'
import type { Enums } from '@/types/db'

// „Documente" — linkuri Google Drive tipizate (contracte, anexe, declarații…),
// scopate la membrul activ. Sursă: RPC get_documente_client.

export type DocumentRow = {
  id: string
  tip: Enums<'tip_document'> | null
  titlu: string | null
  link: string
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
    dataExpirarii: r.data_expirarii,
    observatii: r.observatii,
  }))
}
