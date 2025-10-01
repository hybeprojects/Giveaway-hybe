import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect } from 'react';
import Navbar from './sections/Navbar';
import PageTransition from './components/PageTransition';
import OnboardingModal from './components/OnboardingModal';
import RouteLoader from './components/RouteLoader';
import LazyVisible from './components/LazyVisible';
import ProtectedRoute from './components/ProtectedRoute';

const Hero = lazy(() => import('./sections/Hero'));
const Prizes = lazy(() => import('./sections/Prizes'));
const VIPExperience = lazy(() => import('./sections/VIPExperience'));
const Entry = lazy(() => import('./sections/Entry'));
const Trust = lazy(() => import('./sections/Trust'));
const LiveUpdates = lazy(() => import('./sections/LiveUpdates'));
const Footer = lazy(() => import('./sections/Footer'));
const Login = lazy(() => import('./sections/Login'));
const Dashboard = lazy(() => import('./sections/Dashboard'));
const EntryFormPage = lazy(() => import('./pages/EntryFormPage'));
const EntrySuccessPage = lazy(() => import('./pages/EntrySuccessPage'));
const OtpVerifyPage = lazy(() => import('./pages/OtpVerifyPage'));
const MagicLinkSignupPage = lazy(() => import('./pages/MagicLinkSignupPage'));

function Landing() {
  const [showOnboard, setShowOnboard] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const { state } = location;
    if (state?.scrollTo) {
      const el = document.getElementById(state.scrollTo);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location]);

  return (
    <>
      <OnboardingModal isOpen={showOnboard} onClose={() => setShowOnboard(false)} />
      <Navbar />
      <Suspense fallback={null}>
        <Hero />
      </Suspense>
      <LazyVisible>
        <Suspense fallback={null}>
          <Prizes />
        </Suspense>
      </LazyVisible>
      <LazyVisible>
        <Suspense fallback={null}>
          <VIPExperience />
        </Suspense>
      </LazyVisible>
      <LazyVisible>
        <Suspense fallback={null}>
          <Entry />
        </Suspense>
      </LazyVisible>
      <LazyVisible>
        <Suspense fallback={null}>
          <Trust />
        </Suspense>
      </LazyVisible>
      <LazyVisible>
        <Suspense fallback={null}>
          <LiveUpdates />
        </Suspense>
      </LazyVisible>
      <LazyVisible>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </LazyVisible>
    </>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <>
      <RouteLoader />
      <Routes location={location}>
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Suspense fallback={null}><Login /></Suspense></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><ProtectedRoute><Suspense fallback={null}><Dashboard /></Suspense></ProtectedRoute></PageTransition>} />
        <Route path="/entry" element={<PageTransition><Suspense fallback={null}><EntryFormPage /></Suspense></PageTransition>} />
        <Route path="/verify" element={<PageTransition><Suspense fallback={null}><OtpVerifyPage /></Suspense></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Suspense fallback={null}><MagicLinkSignupPage /></Suspense></PageTransition>} />
        <Route path="/entry/success" element={<PageTransition><Suspense fallback={null}><EntrySuccessPage /></Suspense></PageTransition>} />
        <Route path="*" element={<PageTransition><Landing /></PageTransition>} />
      </Routes>
    </>
  );
}
