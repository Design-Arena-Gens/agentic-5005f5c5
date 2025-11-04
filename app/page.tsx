'use client';

import { useMemo, useState } from 'react';
import { generateSectorDataset, SectorKey } from '@/lib/data';
import { MegaTrendSemiRadar } from '@/components/MegaTrendSemiRadar';

const SECTORS: { label: string; value: SectorKey }[] = [
  { label: 'Life Sciences', value: 'life_sciences' },
  { label: 'Finance', value: 'finance' },
  { label: '?nergie', value: 'energy' },
  { label: 'Retail', value: 'retail' },
  { label: 'Mobilit?', value: 'mobility' },
];

export default function Page() {
  const [sector, setSector] = useState<SectorKey>('life_sciences');
  const dataset = useMemo(() => generateSectorDataset(sector), [sector]);

  return (
    <main>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <label className="text-sm text-muted/90" htmlFor="sector">Secteur</label>
        <select
          id="sector"
          className="bg-transparent border border-muted/40 rounded px-3 py-2 outline-none focus:border-accent"
          value={sector}
          onChange={(e) => setSector(e.target.value as SectorKey)}
        >
          {SECTORS.map((s) => (
            <option key={s.value} value={s.value} className="bg-background">
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 bg-white/5 rounded-xl p-4 border border-white/10">
          <MegaTrendSemiRadar data={dataset} width={900} height={520} />
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-medium mb-2">L?gende</h2>
            <ul className="space-y-1 text-sm text-muted">
              <li><span className="inline-block w-3 h-3 rounded-sm bg-accent mr-2"></span>Arc: score agr?g? d'une m?ga-tendance</li>
              <li><span className="inline-block w-3 h-3 rounded-full border border-white/40 mr-2"></span>Cercle: sous-tendance</li>
              <li className="ml-5">- Rayon du cercle = maturit?</li>
              <li className="ml-5">- Taille du cercle = importance (investissements / # startups)</li>
            </ul>
          </section>

          <section className="text-sm text-muted">
            <p>Les scores sont normalis?s par rapport aux autres m?ga-tendances du secteur s?lectionn?. Donn?es g?n?r?es al?atoirement mais coh?rentes par secteur pour cette d?mo.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
