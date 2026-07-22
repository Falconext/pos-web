import { ReactNode } from 'react';
import { Icon } from '@iconify/react';

interface InventoryPageProps {
  children: ReactNode;
}

interface InventoryHeroProps {
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
  actions?: ReactNode;
}

interface InventoryToolbarProps {
  children: ReactNode;
  className?: string;
}

interface InventoryEmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
}

export function InventoryPage({ children }: InventoryPageProps) {
  return (
    <div className="min-h-screen bg-[#f5f7fb] px-3 pb-6 pt-1 dark:bg-[#0A0D14] sm:px-2">
      {children}
    </div>
  );
}

export function InventoryHero({
  icon,
  title,
  subtitle,
  badge,
  actions,
}: InventoryHeroProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/90 shadow-[0_20px_45px_-30px_rgba(91,104,255,0.45)] dark:border-slate-800 dark:bg-[#111827]">
          <Icon icon={icon} className="text-[22px] text-[#6A5AF9]" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-[2rem]">
              {title}
            </h1>
            {badge ? (
              <span className="inline-flex items-center rounded-full bg-[#6A5AF9] px-3 py-1 text-xs font-black text-white shadow-[0_16px_30px_-22px_rgba(106,90,249,0.9)]">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-medium text-slate-400 dark:text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>

      {actions ? <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">{actions}</div> : null}
    </div>
  );
}

export function InventoryCard({
  children,
  className = '',
}: InventoryToolbarProps) {
  return (
    <section className={`overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_40px_90px_-60px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-[#111827] ${className}`}>
      {children}
    </section>
  );
}

export function InventoryToolbar({
  children,
  className = '',
}: InventoryToolbarProps) {
  return (
    <div className={`flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      {children}
    </div>
  );
}

export function InventoryToolbarButton({
  icon,
  label,
  onClick,
  tone = 'default',
  className = '',
  type = 'button',
}: {
  icon: string;
  label: string;
  onClick?: () => void;
  tone?: 'default' | 'primary';
  className?: string;
  type?: 'button' | 'submit';
}) {
  const toneClass =
    tone === 'primary'
      ? 'border-[#cfc9ff] bg-[#6A5AF9] text-white shadow-[0_18px_32px_-24px_rgba(106,90,249,0.9)] hover:bg-[#5b4cf0]'
      : 'border-slate-200 bg-white text-slate-600 hover:border-[#d7d2ff] hover:text-[#6A5AF9] dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200';

  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black transition-all ${toneClass} ${className}`}
    >
      <Icon icon={icon} className="text-base" />
      <span>{label}</span>
    </button>
  );
}

export function InventorySearchBox({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={`flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 ${className}`}>
      <Icon icon="solar:magnifer-linear" className="text-xl text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
      />
    </label>
  );
}

export function InventoryInfoPill({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <div className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
      <Icon icon={icon} className="text-base text-slate-400" />
      <span>{label}</span>
    </div>
  );
}

export function InventoryEmptyState({
  icon,
  title,
  subtitle,
}: InventoryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
        <Icon icon={icon} className="text-[30px] text-slate-300 dark:text-slate-600" />
      </div>
      <p className="text-base font-black text-slate-500 dark:text-slate-200">{title}</p>
      <p className="mt-1 max-w-md text-sm font-medium text-slate-400 dark:text-slate-500">{subtitle}</p>
    </div>
  );
}
