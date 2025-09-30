import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Entry from './Entry';
import OnboardingModal from '../components/OnboardingModal';

export default function EnterPage() {
  const [open, setOpen] = useState(false);
  useEffect(() => { const id = setTimeout(() => setOpen(true), 50); return () => clearTimeout(id); }, []);

  return (
    <>
      <Navbar />
      <OnboardingModal isOpen={open} onClose={() => setOpen(false)} />
      {!open && <Entry />}
      <Footer />
    </>
  );
}
