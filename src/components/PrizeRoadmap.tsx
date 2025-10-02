import React from 'react';
import { UserEntry } from '../utils/auth';
import ShippingForm from './ShippingForm';

interface PrizeRoadmapProps {
  user: UserEntry | null;
  onDataRefresh: (address?: string) => void;
  demoMode?: boolean;
}

interface Step {
  title: string;
  description: string;
  isComplete: boolean;
}

const PrizeRoadmap: React.FC<PrizeRoadmapProps> = ({ user, onDataRefresh, demoMode = false }) => {
  const steps: Step[] = [
    {
      title: 'Step 1: Confirm Your Details',
      description: 'We need your shipping information to send you your prize.',
      isComplete: Boolean(user?.shipping_address),
    },
    {
      title: 'Step 2: Awaiting Verification',
      description: 'Our team is verifying your entry. This may take 2-3 business days.',
      isComplete: false, // This would be driven by a new DB field in a real app
    },
    {
      title: 'Step 3: Prize Shipped!',
      description: 'Your prize is on its way. Check your email for tracking information.',
      isComplete: false, // This would also be a server-driven status
    },
  ];

  return (
    <div className="card card-pad">
      <h3>Prize Claim Roadmap</h3>
      <ul className="roadmap">
        {steps.map((step, index) => (
          <li key={index} className={step.isComplete ? 'complete' : 'incomplete'}>
            <div className="roadmap-marker"></div>
            <div className="roadmap-content">
              <p className="text-bold">{step.title}</p>
              <p className="subtle">{step.description}</p>
              {index === 0 && !step.isComplete && (
                <ShippingForm onSuccess={onDataRefresh} />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PrizeRoadmap;
