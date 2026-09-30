import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LazyMotion, MotionConfig } from 'motion/react';
import { AuthProvider } from '@/context/AuthContext';
import App from './App';
import './index.css';

const loadMotionFeatures = () => import('@/lib/motionFeatures').then((module) => module.default);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LazyMotion features={loadMotionFeatures}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AuthProvider>
            <App />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3500,
                style: { background: '#120e17', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '14px' },
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </MotionConfig>
    </LazyMotion>
  </StrictMode>
);
