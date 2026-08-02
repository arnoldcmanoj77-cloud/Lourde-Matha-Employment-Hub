import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import LandingPage from '@/pages/LandingPage';
import AuthPage from '@/pages/AuthPage';
import ApplicantDashboard from '@/pages/ApplicantDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import Layout from '@/components/layout/Layout';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<ApplicantDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
