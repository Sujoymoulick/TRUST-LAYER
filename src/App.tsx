import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GuestProvider } from './context/GuestContext';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Web3Provider } from './providers/Web3Provider';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';
import Identity from './pages/Identity';
import Passport from './pages/Passport';
import ConnectedApps from './pages/ConnectedApps';
import VerificationCenter from './pages/VerificationCenter';
import RiskAnalysis from './pages/RiskAnalysis';
import ApiDashboard from './pages/ApiDashboard';
import PersonalKeys from './pages/PersonalKeys';
import Admin from './pages/Admin';
import { AdminGuard } from './components/AdminGuard';
import Settings from './pages/Settings';
import WalletDashboard from './pages/WalletDashboard';
import ConsentVault from './pages/ConsentVault';
import PublicProfile from './pages/PublicProfile';
import Logout from './pages/Logout';
import Feedback from './pages/Feedback';
import OauthConsent from './pages/OauthConsent';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { ConsentBanner } from './components/ConsentBanner';

function App() {
  return (
    <ThemeProvider>
      <Web3Provider>
        <GuestProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/profile" element={<PublicProfile />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="/oauth/consent" element={<OauthConsent />} />

              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/verification-center" element={<VerificationCenter />} />
                <Route path="/wallet" element={<WalletDashboard />} />
                <Route path="/identity" element={<Identity />} />
                <Route path="/passport" element={<Passport />} />
                <Route path="/connected-apps" element={<ConnectedApps />} />
                <Route path="/analytics" element={<RiskAnalysis />} />
                <Route path="/api" element={<Navigate to="/developer/portal" replace />} />
                <Route path="/developer/portal" element={<ApiDashboard />} />
                <Route path="/developer/keys" element={<PersonalKeys />} />
                <Route path="/vault" element={<ConsentVault />} />
                <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/feedback" element={<Feedback />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
             <ConsentBanner />
             <Analytics />
             <SpeedInsights />
          </BrowserRouter>
        </GuestProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;
