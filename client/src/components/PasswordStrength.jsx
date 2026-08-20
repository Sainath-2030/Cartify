import { getPasswordStrength } from '../utils/validators.js';

const COLORS = ['bg-slate-200', 'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-lime-500', 'bg-emerald-500'];

export default function PasswordStrength({ password }) {
  const { score, label } = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? COLORS[score] : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
