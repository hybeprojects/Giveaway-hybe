import React, { useState } from 'react';
import { useToast } from './Toast';
import { getMe } from '../utils/auth';

interface ShippingFormProps {
  onSuccess: () => void;
}

const ShippingForm: React.FC<ShippingFormProps> = ({ onSuccess }) => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim().length < 10) {
      toast.error('Please enter a full, valid shipping address.');
      return;
    }
    setLoading(true);
    try {
      const sessionToken = localStorage.getItem('local_session') || '';
      const res = await fetch(`/.netlify/functions/confirm-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
        body: JSON.stringify({ shipping_address: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save address.');

      toast.success('Your shipping details have been saved!');
      onSuccess(); // Notify parent component to refresh data
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="shipping-form">
      <textarea
        className="input"
        rows={4}
        placeholder="Enter your full name, street address, city, state, zip code, and country."
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        disabled={loading}
      />
      <button type="submit" className="button-primary mt-12" disabled={loading}>
        {loading ? 'Saving...' : 'Save Shipping Details'}
      </button>
    </form>
  );
};

export default ShippingForm;