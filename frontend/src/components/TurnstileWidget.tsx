import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export function TurnstileWidget({ onVerify, onError, onExpire }: TurnstileWidgetProps) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

  if (!siteKey) {
    return (
      <div className="p-3 my-4 border border-slate-200 dark:border-zinc-800 bg-brutal-pink text-white font-bold text-xs uppercase text-center shadow-md">
        ⚠️ Missing VITE_TURNSTILE_SITE_KEY
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full my-6 bg-black p-2 border border-slate-200 dark:border-zinc-800 shadow-md">
      <Turnstile
        siteKey={siteKey}
        options={{
          theme: 'dark',
          size: 'normal'
        }}
        onSuccess={(token) => onVerify(token)}
        onError={() => onError?.()}
        onExpire={() => onExpire?.()}
      />
    </div>
  );
}
