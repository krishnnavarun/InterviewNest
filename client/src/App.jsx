import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicOnly, RequireAuth } from '@/components/layout/RouteGuards';
import { AppShell } from '@/components/layout/AppShell';
import { PageLoader } from '@/components/ui/spinner';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import LandingPage from '@/pages/LandingPage';

// Heavier pages are code-split so the public pages load fast.
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const SetupPage = lazy(() => import('@/pages/SetupPage'));
const InterviewPage = lazy(() => import('@/pages/InterviewPage'));
const ReportPage = lazy(() => import('@/pages/ReportPage'));
const HistoryPage = lazy(() => import('@/pages/HistoryPage'));
const PracticePage = lazy(() => import('@/pages/PracticePage'));
const CoachPage = lazy(() => import('@/pages/CoachPage'));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<PublicOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/interview/new" element={<SetupPage />} />
            <Route path="/interview/:id/report" element={<ReportPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/coach" element={<CoachPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Route>
          {/* The interview room is full-screen, without the navbar. */}
          <Route path="/interview/:id" element={<InterviewPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
