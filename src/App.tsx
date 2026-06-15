import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { AcasaPage } from '@/features/dashboard/AcasaPage'
import { PlatiPage } from '@/features/plati/PlatiPage'
import { PrezentePage } from '@/features/prezente/PrezentePage'
import { RezervariPage } from '@/features/rezervari/RezervariPage'
import { ProfilPage } from '@/features/profil/ProfilPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<AcasaPage />} />
            <Route path="plati" element={<PlatiPage />} />
            <Route path="prezente" element={<PrezentePage />} />
            <Route path="rezervari" element={<RezervariPage />} />
            <Route path="profil" element={<ProfilPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
