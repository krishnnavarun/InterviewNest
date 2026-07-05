// ============================================
// App.jsx - Root Component with Routing
// ============================================
// Reference: Routes, Route, Navigate - reference-react.md
// ============================================

import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// TODO: Import pages as you build them
// import HomePage from './pages/HomePage';
// import InterviewSetupPage from './pages/InterviewSetupPage';
// import InterviewPage from './pages/InterviewPage';
// import FeedbackPage from './pages/FeedbackPage';
// import HistoryPage from './pages/HistoryPage';

function App() {
  return (
    <div className="app-shell">
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes - require authentication */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navbar />
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Welcome! Build the HomePage to get started.</h2>
              </div>
            </ProtectedRoute>
          }
        />

        {/* TODO: Add more protected routes as you build the pages */}
        {/* /setup, /interview/:id, /feedback/:id, /history */}

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
