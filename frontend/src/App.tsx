import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ContractProvider } from './context/ContractContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Landing } from './pages/Landing';
import { Upload } from './pages/Upload';
import { DomainDetection } from './pages/DomainDetection';
import { RiskDashboard } from './pages/RiskDashboard';
import { Reports } from './pages/Reports';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  if (isLandingPage) {
    return <Landing />;
  }

  return (
    <div className="min-h-screen bg-pastel-lavender text-slate-800 flex flex-col selection:bg-pastel-indigo selection:text-slate-900">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-pastel-lavender">
          <Routes>
            <Route path="/upload" element={<Upload />} />
            <Route path="/domain-detection" element={<DomainDetection />} />
            <Route path="/analysis" element={<RiskDashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<Upload />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ContractProvider>
      <Router>
        <AppLayout />
      </Router>
    </ContractProvider>
  );
};

export default App;
