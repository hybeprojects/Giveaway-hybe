import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

export default function Entry() {
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate('/entry');
  };

  return (
    <section id="enter" className="section entry-section" aria-label="Entry">
      <div className="container">
        <h2 className="section-title">Join the Ultimate Giveaway</h2>
        <p className="section-subtitle">Complete the form to enter and boost your chances by sharing with friends.</p>
        <div className="entry-cta-group">
          <button onClick={handleEnter} className="button-primary cta-button-wide" aria-label="Enter the giveaway">
            <PageTransition>ENTER THE GIVEAWAY</PageTransition>
          </button>
          <button onClick={handleEnter} className="button-primary cta-button-wide" aria-label="Enter now for a chance to win">
            <PageTransition>ENTER NOW FOR A CHANCE TO WIN</PageTransition>
          </button>
          <button onClick={handleEnter} className="button-primary cta-button-wide" aria-label="Enter now">
            <PageTransition>ENTER NOW</PageTransition>
          </button>
        </div>
      </div>
    </section>
  );
}
