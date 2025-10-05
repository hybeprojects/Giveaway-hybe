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

        <div className="two-col-grid" style={{marginTop: '1rem'}}>
          <div className="gamify-box">
            <h3 style={{marginTop:0, marginBottom:8}}>How to Enter</h3>
            <ol style={{margin: 0, paddingLeft: '1.25rem', lineHeight: 1.7}}>
              <li>Click the button below to open the entry form.</li>
              <li>Complete the simple form with your details.</li>
            </ol>
            <div className="mt-12">
              <button onClick={handleEnter} className="button-primary btn-lg cta-button-wide" aria-label="Enter the giveaway now">
                <PageTransition>Enter the Giveaway Now</PageTransition>
              </button>
            </div>
          </div>

          <div className="gamify-box">
            <h3 style={{marginTop:0, marginBottom:8}}>Why You Should Enter</h3>
            <p className="subtle" style={{marginTop: 8}}>This is your shot to win big and experience something extraordinary—whether it’s cruising in a sleek Tesla, securing a crypto fortune, or enjoying a VIP moment with HYBE. Don’t miss out!</p>
            <h4 style={{margin:'12px 0 6px'}}>Key Rules</h4>
            <ul style={{margin: 0, paddingLeft: '1.1rem', lineHeight: 1.6}}>
              <li>One entry per person.</li>
              <li>Must be 18+ to enter.</li>
              <li>Winners announced via email.</li>
            </ul>
            <div className="mt-10">
              <a href="/rules" className="button-secondary btn-sm">Read full terms</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
