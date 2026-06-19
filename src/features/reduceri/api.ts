import { supabase } from '@/lib/supabase'

export type ReducereRow = {
  clientId: string
  clientNume: string | null
  cursNume: string | null
  sumaBaza: number
  suma: number
  reducere: number
  codVoucher: string | null
}

export async function getReduceriFamilie(): Promise<ReducereRow[]> {
  const { data, error } = await supabase.rpc('get_reduceri_familie')
  if (error) throw error
  return (data ?? []).map((r) => ({
    clientId: r.client_id,
    clientNume: r.client_nume,
    cursNume: r.curs_nume,
    sumaBaza: Number(r.suma_baza ?? 0),
    suma: Number(r.suma ?? 0),
    reducere: Number(r.reducere ?? 0),
    codVoucher: r.cod_voucher,
  }))
}
