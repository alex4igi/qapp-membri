import { supabase } from '@/lib/supabase'

export const MARIMI_TRICOU = [
  '110cm/4ani', '122cm/6ani', '134cm/8ani', '146cm/10ani', '158cm/12ani',
  'XS', 'S', 'M', 'L', 'XL', 'XXL',
] as const

export type ProfilFamilie = {
  familieId: string
  numeFamilie: string | null
  numeReprezentant: string | null
  prenumeReprezentant: string | null
  telefon: string | null
  telefon2: string | null
  email: string | null
  metodaComunicare: string | null
  optOutMarketing: boolean
  dorestePoze: boolean
  facturaPeFirma: boolean
  firmaDenumire: string | null
  firmaCif: string | null
  firmaRegCom: string | null
  firmaAdresa: string | null
  firmaBanca: string | null
  firmaIban: string | null
}

export async function getProfilFamilie(): Promise<ProfilFamilie | null> {
  const { data, error } = await supabase.rpc('get_profil_familie')
  if (error) throw error
  const r = data?.[0]
  if (!r) return null
  return {
    familieId: r.familie_id,
    numeFamilie: r.nume_familie,
    numeReprezentant: r.nume_reprezentant,
    prenumeReprezentant: r.prenume_reprezentant,
    telefon: r.telefon,
    telefon2: r.telefon_2,
    email: r.email,
    metodaComunicare: r.metoda_comunicare,
    optOutMarketing: r.opt_out_marketing ?? false,
    dorestePoze: r.doreste_sa_apara_in_poze ?? false,
    facturaPeFirma: r.factura_pe_firma ?? false,
    firmaDenumire: r.firma_denumire,
    firmaCif: r.firma_cif,
    firmaRegCom: r.firma_reg_com,
    firmaAdresa: r.firma_adresa,
    firmaBanca: r.firma_banca,
    firmaIban: r.firma_iban,
  }
}

// Toți parametrii text au default null în DB → trimitem `undefined` pt câmpurile
// goale (supabase-js îi tipează opțional, nu nullable); rezultatul în DB e tot null.
const u = (v: string | null): string | undefined => v ?? undefined

export async function updateProfilFamilie(p: ProfilFamilie): Promise<void> {
  const { error } = await supabase.rpc('update_profil_familie', {
    p_nume_reprezentant: u(p.numeReprezentant),
    p_prenume_reprezentant: u(p.prenumeReprezentant),
    p_telefon: u(p.telefon),
    p_telefon_2: u(p.telefon2),
    p_email: u(p.email),
    p_metoda_comunicare: u(p.metodaComunicare),
    p_opt_out_marketing: p.optOutMarketing,
    p_doreste_poze: p.dorestePoze,
    p_factura_pe_firma: p.facturaPeFirma,
    p_firma_denumire: u(p.firmaDenumire),
    p_firma_cif: u(p.firmaCif),
    p_firma_reg_com: u(p.firmaRegCom),
    p_firma_adresa: u(p.firmaAdresa),
    p_firma_banca: u(p.firmaBanca),
    p_firma_iban: u(p.firmaIban),
  })
  if (error) throw error
}

export type ProfilClient = {
  clientId: string
  nume: string | null
  prenume: string | null
  dataNasterii: string | null
  email: string | null
  telefon: string | null
  telefonul2: string | null
  marimeTricou: string | null
  unitateInvatamant: string | null
}

export async function getProfilClient(clientId: string): Promise<ProfilClient | null> {
  const { data, error } = await supabase.rpc('get_profil_client', { p_client: clientId })
  if (error) throw error
  const r = data?.[0]
  if (!r) return null
  return {
    clientId: r.client_id,
    nume: r.nume,
    prenume: r.prenume,
    dataNasterii: r.data_nasterii,
    email: r.email,
    telefon: r.telefon,
    telefonul2: r.telefonul_2,
    marimeTricou: r.marime_tricou,
    unitateInvatamant: r.unitate_invatamant,
  }
}

export async function updateProfilClient(p: ProfilClient): Promise<void> {
  const { error } = await supabase.rpc('update_profil_client', {
    p_client: p.clientId,
    p_email: u(p.email),
    p_telefon: u(p.telefon),
    p_telefonul_2: u(p.telefonul2),
    p_marime_tricou: u(p.marimeTricou),
    p_unitate_invatamant: u(p.unitateInvatamant),
  })
  if (error) throw error
}
