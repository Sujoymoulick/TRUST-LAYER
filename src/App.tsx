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
import RiskAnalysis from './pages/RiskAnalysis';
import ApiDashboard from './pages/ApiDashboard';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import WalletDashboard from './pages/WalletDashboard';
import ConsentVault from './pages/ConsentVault';
import PublicProfile from './pages/PublicProfile';
import Logout from './pages/Logout';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

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

              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/wallet" element={<WalletDashboard />} />
                <Route path="/identity" element={<Identity />} />
                <Route path="/passport" element={<Passport />} />
                <Route path="/analytics" element={<RiskAnalysis />} />
                <Route path="/api" element={<ApiDashboard />} />
                <Route path="/vault" element={<ConsentVault />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Analytics />
            <SpeedInsights />
          </BrowserRouter>
        </GuestProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;
