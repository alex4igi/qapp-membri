import { PagePlaceholder } from '@/components/PagePlaceholder'

export function AcasaPage() {
  return (
    <PagePlaceholder
      title="Acasă"
      descriere="Privire de ansamblu: soldul familiei, următoarele ședințe, anunțuri."
      todo={[
        'RPC get_sold_familie() → sold agregat + per membru',
        'Card „de plată” care duce la /plati',
        'Următoarele rezervări open class',
      ]}
    />
  )
}
