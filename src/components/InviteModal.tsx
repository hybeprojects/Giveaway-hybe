import { useState } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string) => void;
};

export default function InviteModal({ isOpen, onClose, onInvite }: Props) {
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInvite(email);
    setEmail('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Invite a Friend</h3>
        <p className="subtle">Enter your friend's email to send them an invite.</p>
        <form onSubmit={handleSubmit}>
          <label className="label mt-10">Friend's Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="friend@example.com"
            required
          />
          <div className="button-row mt-14">
            <button type="submit" className="button-primary">Send Invite</button>
            <button type="button" className="button-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}