type Props = { value: number; max: number };
export default function ProgressBar({ value, max }: Props) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="progress-outer" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <div className="progress-inner" style={{ width: pct + '%' }} />
    </div>
  );
}
