'use client';

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

type Point = { totalValue: number; cardCount: number; recordedAt: string };
type ApiResponse = {
  days: number;
  points: Point[];
  live: { totalValue: number; cardCount: number; asOf: string };
};

const RANGE_OPTIONS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

function fmtCurrency(n: number) {
  return `€${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { month: 'short', day: '2-digit' });
}

export default function CollectionValueChart() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aborted = false;
    setLoading(true);
    fetch(`/api/collection/value-history?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ApiResponse | null) => {
        if (!aborted) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!aborted) setLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, [days]);

  const points = data?.points ?? [];
  const live = data?.live;

  // Always append the live "now" point at the end so the chart never looks empty
  const chartData = [
    ...points.map((p) => ({
      date: p.recordedAt,
      value: p.totalValue,
      cards: p.cardCount,
    })),
    ...(live
      ? [{ date: live.asOf, value: live.totalValue, cards: live.cardCount }]
      : []),
  ];

  const first = chartData[0]?.value ?? 0;
  const last = chartData[chartData.length - 1]?.value ?? 0;
  const delta = last - first;
  const deltaPct = first > 0 ? (delta / first) * 100 : 0;
  const up = delta >= 0;

  return (
    <div
      data-testid="collection-value-chart"
      className="relative bg-slate-900 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden"
    >
      <div
        className="pointer-events-none absolute -inset-1 bg-gradient-to-br from-cyan-500/10 via-transparent to-fuchsia-500/10 blur-2xl"
        aria-hidden
      />
      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 gap-4">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
              Collection Value
            </p>
            <div className="flex items-end gap-3">
              <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                {live ? fmtCurrency(live.totalValue) : '—'}
              </h3>
              {chartData.length > 1 && (
                <span
                  className={`flex items-center gap-1 font-bold text-sm pb-2 ${
                    up ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {up ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {up ? '+' : ''}
                  {fmtCurrency(delta)} ({deltaPct.toFixed(2)}%)
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-2">
              {live?.cardCount ?? 0} cards tracked · Snapshots run daily at 03:00 UTC
            </p>
          </div>

          <div className="flex gap-1 bg-slate-950 border border-white/5 rounded-full p-1 self-start">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                data-testid={`chart-range-${opt.label}`}
                onClick={() => setDays(opt.days)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  days === opt.days
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-[260px] -mx-2">
          {loading ? (
            <div className="h-full flex items-center justify-center text-cyan-400">
              <Loader2 className="animate-spin" size={28} />
            </div>
          ) : chartData.length < 2 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
              <p className="font-bold text-white mb-1">No price history yet.</p>
              <p>The first snapshot will be recorded at 03:00 UTC by the daily Vercel cron.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  stroke="#475569"
                  fontSize={11}
                  tickMargin={8}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={11}
                  width={56}
                  tickFormatter={(v) => `€${Math.round(v)}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(2,6,23,0.95)',
                    border: '1px solid rgba(6,182,212,0.4)',
                    borderRadius: 12,
                    color: 'white',
                  }}
                  labelFormatter={(v) => new Date(v).toLocaleString('en-GB')}
                  formatter={(value: number, _name: string, props: any) => [
                    fmtCurrency(value),
                    `${props.payload.cards} cards`,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fill="url(#valueGradient)"
                  activeDot={{ r: 5, fill: '#d946ef', stroke: 'white', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
