import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { ResetPage } from '@/features/auth/ResetPage'
import { AcasaPage } from '@/features/dashboard/AcasaPage'
import { PlatiPage } from '@/features/plati/PlatiPage'
import { PrezentePage } from '@/features/prezente/PrezentePage'
import { RezervariPage } from '@/features/rezervari/RezervariPage'
import { GrupaPage } from '@/features/grupa/GrupaPage'
import { ActivitatePage } from '@/features/activitate/ActivitatePage'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { DocumentePage } from '@/features/documente/DocumentePage'
import { NotificariPage } from '@/features/notificari/NotificariPage'
import { ProfilPage } from '@/features/profil/ProfilPage'
import { LegalLayout } from '@/features/legal/LegalLayout'
import { ServiciiPage } from '@/features/legal/ServiciiPage'
import { TermeniPage } from '@/features/legal/TermeniPage'
import { ConfidentialitatePage } from '@/features/legal/ConfidentialitatePage'
import { ReturPage } from '@/features/legal/ReturPage'
import { LivrarePage } from '@/features/legal/LivrarePage'
import { CookiesPage } from '@/features/legal/CookiesPage'
import { ContactPage } from '@/features/legal/ContactPage'
import { SemnarePage } from '@/features/semnare/SemnarePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset" element={<ResetPage />} />
        {/* Semnare contracte — PUBLICĂ, cu token unic din SMS/email (fără login) */}
        <Route path="/semneaza/:token" element={<SemnarePage />} />
        <Route path="/s/:token" element={<SemnarePage />} />
        {/* Pagini legale PUBLICE (necesare la validarea punctului de lucru Netopia) */}
        <Route element={<LegalLayout />}>
          <Route path="/servicii" element={<ServiciiPage />} />
          <Route path="/termeni" element={<TermeniPage />} />
          <Route path="/confidentialitate" element={<ConfidentialitatePage />} />
          <Route path="/retur" element={<ReturPage />} />
          <Route path="/livrare" element={<LivrarePage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<AcasaPage />} />
            <Route path="grupa" element={<GrupaPage />} />
            <Route path="activitate" element={<ActivitatePage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="plati" element={<PlatiPage />} />
            <Route path="prezente" element={<PrezentePage />} />
            <Route path="rezervari" element={<RezervariPage />} />
            <Route path="documente" element={<DocumentePage />} />
            {/* Adeverința e consolidată în Documente; păstrăm redirect pentru linkuri vechi */}
            <Route path="adeverinta" element={<Navigate to="/documente" replace />} />
            <Route path="notificari" element={<NotificariPage />} />
            <Route path="profil" element={<ProfilPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
