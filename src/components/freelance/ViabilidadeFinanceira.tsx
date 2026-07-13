"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Props {
  budgetMin?: number | null;
  budgetMax?: number | null;
  hourlyRateMin?: number | null;
  hourlyRateMax?: number | null;
  duration?: string | null;
  platform?: string;
}

const PLATFORM_FEES: Record<string, (amount: number) => number> = {
  upwork: (amount: number) => amount < 500 ? 0.20 : amount < 10000 ? 0.10 : 0.05,
  contra: () => 0.08,
  peopleperhour: () => 0.20,
  freelancer: () => 0.10,
  malt: () => 0.15,
};

export function ViabilidadeFinanceira({ budgetMin, budgetMax, hourlyRateMin, hourlyRateMax, duration, platform = "upwork" }: Props) {
  const [hoursPerWeek, setHoursPerWeek] = useState(20);
  const [weeks, setWeeks] = useState(4);
  const [exchangeRate, setExchangeRate] = useState(5.2);

  useEffect(() => {
    const cached = localStorage.getItem("usd_brl_rate");
    if (cached) {
      try { setExchangeRate(parseFloat(cached)); } catch {}
    }
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((d) => {
        const rate = d?.rates?.BRL;
        if (rate) {
          setExchangeRate(rate);
          localStorage.setItem("usd_brl_rate", String(rate));
        }
      })
      .catch(() => {});
  }, []);

  const hourlyRate = hourlyRateMin || (budgetMin ? budgetMin / (hoursPerWeek * weeks) : null);
  const totalValue = hourlyRate ? hourlyRate * hoursPerWeek * weeks : budgetMax || budgetMin || 0;
  const platformFeeFn = PLATFORM_FEES[platform] || (() => 0.10);
  const feeRate = platformFeeFn(totalValue);
  const feeAmount = totalValue * feeRate;
  const afterPlatform = totalValue - feeAmount;
  const taxRate = 0.06;
  const taxAmount = afterPlatform * taxRate;
  const netInUSD = afterPlatform - taxAmount;
  const netInBRL = netInUSD * exchangeRate;
  const effectiveHourlyUSD = hoursPerWeek * weeks > 0 ? netInUSD / (hoursPerWeek * weeks) : 0;
  const equivalentCLTMonthly = netInBRL * 0.75;

  if (!hourlyRate && !budgetMin) return null;

  return (
    <Card>
      <CardHeader><h2 className="text-sm font-semibold text-text-primary">💰 Viabilidade Financeira</h2></CardHeader>
      <CardContent className="pt-0 px-5 pb-4 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-text-tertiary">Valor bruto</span>
          <span className="text-text-secondary font-medium">${totalValue.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary">Taxa {platform} ({(feeRate * 100).toFixed(0)}%)</span>
          <span className="text-red-400">-${feeAmount.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary">Imposto estimado ({(taxRate * 100).toFixed(0)}%)</span>
          <span className="text-red-400">-${taxAmount.toFixed(0)}</span>
        </div>
        <div className="border-t border-border pt-2 flex justify-between">
          <span className="text-text-primary font-medium">Líquido (USD)</span>
          <span className="text-text-primary font-medium">${netInUSD.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary">Líquido (BRL) @ R${exchangeRate.toFixed(2)}</span>
          <span className="text-green-400 font-medium">R$ {netInBRL.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span>
        </div>
        {effectiveHourlyUSD > 0 && (
          <div className="flex justify-between">
            <span className="text-text-tertiary">Taxa horária efetiva</span>
            <span className="text-amber-400">${effectiveHourlyUSD.toFixed(1)}/hr</span>
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-2">
          <span className="text-text-tertiary">≈ Equivalente CLT/mês</span>
          <span className="text-text-secondary font-medium">R$ {equivalentCLTMonthly.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span>
        </div>
        <div className="flex gap-2 pt-1">
          <input type="number" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(Number(e.target.value))} className="w-16 text-xs px-1 py-0.5 rounded bg-bg-elevated border border-border text-text-secondary" placeholder="h/sem" />
          <input type="number" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="w-14 text-xs px-1 py-0.5 rounded bg-bg-elevated border border-border text-text-secondary" placeholder="semanas" />
          <span className="text-text-tertiary text-[10px] self-center">h/sem × semanas</span>
        </div>
      </CardContent>
    </Card>
  );
}
