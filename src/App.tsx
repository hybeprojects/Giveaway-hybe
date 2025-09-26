import { Routes, Route } from 'react-router-dom';
import Navbar from './sections/Navbar';
import Hero from './sections/Hero';
import Prizes from './sections/Prizes';
import VIPExperience from './sections/VIPExperience';
import Entry from './sections/Entry';
import Trust from './sections/Trust';
import LiveUpdates from './sections/LiveUpdates';
import Footer from './sections/Footer';
import Login from './sections/Login';
import Dashboard from './sections/Dashboard';

function Landing() {
  return (
    <>
      <Navbar />
      <Hero />
      <Prizes />
      <VIPExperience />
      <Entry />
      <Trust />
      <LiveUpdates />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
