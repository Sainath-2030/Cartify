import { Sparkles, ShieldCheck, Truck, RotateCcw, Zap, Lock } from 'lucide-react';

const TICKER_ITEMS = [
  { icon: Sparkles, text: 'New season drops live now' },
  { icon: Truck, text: 'Free express shipping on orders over ₹999' },
  { icon: ShieldCheck, text: '100% verified authentic catalogue' },
  { icon: RotateCcw, text: '30-day effortless returns' },
  { icon: Lock, text: 'End-to-end encrypted checkout' },
  { icon: Zap, text: 'Instant 10% off first order with code WELCOME10' },
];

export default function MarqueeTicker() {
  return (
    <div className="relative w-full overflow-hidden bg-surface py-2.5 text-muted border-y border-border-subtle pause-marquee select-none">
      <div className="flex w-max animate-marquee items-center gap-8">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-2.5 text-xs font-medium text-muted"
            >
              <Icon className="h-3.5 w-3.5 text-accent shrink-0" />
              <span>{item.text}</span>
              <span className="text-ink-subtle text-xs ml-5">•</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
