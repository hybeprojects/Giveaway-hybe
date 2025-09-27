import { useState } from 'react';

type Item = { q: string; a: string };

function QA({ item }: { item: Item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card card-pad">
      <button className="nav-link full-width text-start" onClick={() => setOpen(v => !v)} aria-expanded={open}>
        {item.q}
      </button>
      {open && <p className="subtle mt-8">{item.a}</p>}
    </div>
  );
}

export default function FAQ() {
  const items: Item[] = [
    { q: 'How are winners selected?', a: 'Winners are drawn randomly using a provably fair method, verified by third-party cryptographic proofs.' },
    { q: 'When are winners announced?', a: 'Winners are announced live on stream at the countdown end. Notifications are also sent via email.' },
    { q: 'What are the legal terms?', a: 'Participation is subject to HYBE Corp terms and conditions and local regulations.' }
  ];
  return (
    <div className="grid" style={{ gap: 12 }}>
      {items.map((it, i) => <QA key={i} item={it} />)}
    </div>
  );
}
