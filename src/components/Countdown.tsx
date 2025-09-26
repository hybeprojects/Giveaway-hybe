import { useEffect, useMemo, useState } from 'react';

type Props = { target: string | Date };

function diffToParts(target: number) {
  const now = Date.now();
  const total = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { total, days, hours, minutes, seconds };
}

export default function Countdown({ target }: Props) {
  const stamp = useMemo(() => (typeof target === 'string' ? new Date(target).getTime() : target.getTime()), [target]);
  const [parts, setParts] = useState(() => diffToParts(stamp));
  useEffect(() => {
    const id = setInterval(() => setParts(diffToParts(stamp)), 1000);
    return () => clearInterval(id);
  }, [stamp]);
  return (
    <div className="timer" aria-live="polite">
      <div className="unit"><div className="h1">{parts.days}</div><div className="subtle">Days</div></div>
      <div className="unit"><div className="h1">{parts.hours}</div><div className="subtle">Hours</div></div>
      <div className="unit"><div className="h1">{parts.minutes}</div><div className="subtle">Minutes</div></div>
      <div className="unit"><div className="h1">{parts.seconds}</div><div className="subtle">Seconds</div></div>
    </div>
  );
}
