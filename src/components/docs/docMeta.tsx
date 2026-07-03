import {
  FileCode2,
  Sigma,
  Table2,
  Rocket,
  GitBranch,
  Terminal,
  Globe,
  Container,
  ShieldCheck,
  BrainCircuit,
  Languages,
  Network,
  Calculator,
  Database,
  ScanEye,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

const iconRegistry: Record<string, LucideIcon> = {
  FileCode2,
  Sigma,
  Table2,
  Rocket,
  GitBranch,
  Terminal,
  Globe,
  Container,
  ShieldCheck,
  BrainCircuit,
  Languages,
  Network,
  Calculator,
  Database,
  ScanEye,
};

export function docIcon(name: string): LucideIcon {
  return iconRegistry[name] ?? BookOpen;
}

const accentMap: Record<string, { ring: string; bg: string; text: string; glow: string; bar: string }> = {
  amber: { ring: 'ring-amber-500/30', bg: 'bg-amber-500/12', text: 'text-amber-300', glow: 'shadow-[0_16px_40px_oklch(0.76_0.16_70/0.22)]', bar: 'bg-amber-400' },
  sky: { ring: 'ring-sky-500/30', bg: 'bg-sky-500/12', text: 'text-sky-300', glow: 'shadow-[0_16px_40px_oklch(0.7_0.14_220/0.22)]', bar: 'bg-sky-400' },
  indigo: { ring: 'ring-indigo-500/30', bg: 'bg-indigo-500/12', text: 'text-indigo-300', glow: 'shadow-[0_16px_40px_oklch(0.55_0.2_270/0.22)]', bar: 'bg-indigo-400' },
  emerald: { ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/12', text: 'text-emerald-300', glow: 'shadow-[0_16px_40px_oklch(0.72_0.17_160/0.22)]', bar: 'bg-emerald-400' },
  orange: { ring: 'ring-orange-500/30', bg: 'bg-orange-500/12', text: 'text-orange-300', glow: 'shadow-[0_16px_40px_oklch(0.72_0.17_50/0.22)]', bar: 'bg-orange-400' },
  yellow: { ring: 'ring-yellow-500/30', bg: 'bg-yellow-500/12', text: 'text-yellow-300', glow: 'shadow-[0_16px_40px_oklch(0.82_0.16_90/0.22)]', bar: 'bg-yellow-400' },
  teal: { ring: 'ring-teal-500/30', bg: 'bg-teal-500/12', text: 'text-teal-300', glow: 'shadow-[0_16px_40px_oklch(0.7_0.12_190/0.22)]', bar: 'bg-teal-400' },
  blue: { ring: 'ring-blue-500/30', bg: 'bg-blue-500/12', text: 'text-blue-300', glow: 'shadow-[0_16px_40px_oklch(0.6_0.18_250/0.22)]', bar: 'bg-blue-400' },
  rose: { ring: 'ring-rose-500/30', bg: 'bg-rose-500/12', text: 'text-rose-300', glow: 'shadow-[0_16px_40px_oklch(0.65_0.22_10/0.22)]', bar: 'bg-rose-400' },
  violet: { ring: 'ring-violet-500/30', bg: 'bg-violet-500/12', text: 'text-violet-300', glow: 'shadow-[0_16px_40px_oklch(0.6_0.22_300/0.22)]', bar: 'bg-violet-400' },
  fuchsia: { ring: 'ring-fuchsia-500/30', bg: 'bg-fuchsia-500/12', text: 'text-fuchsia-300', glow: 'shadow-[0_16px_40px_oklch(0.65_0.25_320/0.22)]', bar: 'bg-fuchsia-400' },
  cyan: { ring: 'ring-cyan-500/30', bg: 'bg-cyan-500/12', text: 'text-cyan-300', glow: 'shadow-[0_16px_40px_oklch(0.7_0.13_200/0.22)]', bar: 'bg-cyan-400' },
  green: { ring: 'ring-green-500/30', bg: 'bg-green-500/12', text: 'text-green-300', glow: 'shadow-[0_16px_40px_oklch(0.72_0.18_145/0.22)]', bar: 'bg-green-400' },
  red: { ring: 'ring-red-500/30', bg: 'bg-red-500/12', text: 'text-red-300', glow: 'shadow-[0_16px_40px_oklch(0.63_0.22_25/0.22)]', bar: 'bg-red-400' },
  purple: { ring: 'ring-purple-500/30', bg: 'bg-purple-500/12', text: 'text-purple-300', glow: 'shadow-[0_16px_40px_oklch(0.6_0.2_290/0.22)]', bar: 'bg-purple-400' },
};

export function docAccent(name: string) {
  return accentMap[name] ?? accentMap.amber;
}