import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, Flame, Shield, Feather, Stamp, Scissors,
  MapPin, Mail, Phone, Star, Award, Sparkles, ChevronRight
} from 'lucide-react';

const ROLES = [
  { id: 1, title: 'Master Letterpress Operator', dept: 'Print Floor', loc: 'Florence Studio', type: 'Full-time', no: '№ 014' },
  { id: 2, title: 'Foil & Gilding Artisan', dept: 'Finishing', loc: 'Florence Studio', type: 'Full-time', no: '№ 015' },
  { id: 3, title: 'Studio Operations Captain', dept: 'Command', loc: 'New York Atelier', type: 'Full-time', no: '№ 016' },
  { id: 4, title: 'Paper Engineer — Cotton Lab', dept: 'Material R&D', loc: 'Florence Studio', type: 'Full-time', no: '№ 017' },
  { id: 5, title: 'Brand Storyteller, Print & Digital', dept: 'Legend Dept.', loc: 'Remote / NYC', type: 'Contract', no: '№ 018' },
];

export default function App() {
  const [flipped, setFlipped] = useState(false);
  const [hoveredRole, setHoveredRole] = useState(null);

  return (
    <div className="vp-root min-h-screen w-full bg-[#160B0A] text-[#F2E7CE] selection:bg-[#E2462C] selection:text-[#F8EFD9]">
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,700&family=Archivo:wght@500;700;800&family=Archivo+Black&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        .vp-root { font-family: 'Archivo', sans-serif; }
        .f-display { font-family: 'Fraunces', serif; }
        .f-black { font-family: 'Archivo Black', sans-serif; }
        .f-mono { font-family: 'Space Mono', monospace; }

        .bg-paper-grain {
          background-image:
            radial-gradient(rgba(22,11,10,0.06) 1px, transparent 1px),
            radial-gradient(rgba(22,11,10,0.04) 1px, transparent 1px);
          background-size: 5px 5px, 9px 9px;
          background-position: 0 0, 3px 4px;
        }
        .bg-pinstripe {
          background-image: repeating-linear-gradient(90deg, rgba(212,162,76,0.18) 0 1px, transparent 1px 7px);
        }
        .bg-crosshatch {
          background-image:
            repeating-linear-gradient(45deg, rgba(212,162,76,0.10) 0 1px, transparent 1px 9px),
            repeating-linear-gradient(-45deg, rgba(212,162,76,0.10) 0 1px, transparent 1px 9px);
        }
        .bg-sunburst {
          background:
            repeating-conic-gradient(from 0deg at 50% 50%, #E2462C 0deg 7.5deg, #8C1D18 7.5deg 15deg);
        }
        .bg-halftone {
          background-image: radial-gradient(rgba(242,231,206,0.35) 1.2px, transparent 1.3px);
          background-size: 8px 8px;
        }
        .bg-scallop {
          background-image: radial-gradient(circle at 50% 0%, transparent 9px, rgba(212,162,76,0.25) 9.5px, rgba(212,162,76,0.25) 10.5px, transparent 11px);
          background-size: 24px 24px;
        }
        .deckle {
          border-image: repeating-linear-gradient(90deg, #D4A24C 0 8px, transparent 8px 14px) 1;
        }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-track { animation: marquee 22s linear infinite; }
        .marquee-track-rev { animation: marquee 30s linear infinite reverse; }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .spin-slow { animation: spin-slow 24s linear infinite; }
        .card3d { perspective: 1600px; }
        .card-inner { transform-style: preserve-3d; transition: transform .8s cubic-bezier(.2,.8,.2,1); }
        .card-inner.flipped { transform: rotateY(180deg); }
        .card-face { backface-visibility: hidden; }
        .card-back { transform: rotateY(180deg); }
        .gold-edge { box-shadow: inset 0 0 0 1px rgba(212,162,76,0.55), inset 0 0 0 5px rgba(22,11,10,0), inset 0 0 0 6px rgba(212,162,76,0.25); }
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: #160B0A; }
        ::-webkit-scrollbar-thumb { background: #8C1D18; border: 2px solid #160B0A; border-radius: 8px; }
      `}} />

      {/* ======= TOP RULE ======= */}
      <div className="border-b-4 border-[#D4A24C]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-[#E2462C]" strokeWidth={2.5} />
            <span className="f-mono text-[11px] tracking-[0.3em] uppercase text-[#D4A24C]">Valiant Paper Co. — Recruitment Dossier 1987–2025</span>
          </div>
          <span className="f-mono text-[11px] tracking-[0.3em] uppercase hidden md:block text-[#F2E7CE]/60">Cotton · Foil · Courage</span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* ======= BENTO GRID ======= */}
        <div className="grid grid-cols-12 auto-rows-[minmax(90px,auto)] gap-4">

          {/* ---- HERO BRAND CARD ---- */}
          <motion.section
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="col-span-12 lg:col-span-7 row-span-2 relative overflow-hidden bg-[#8C1D18] gold-edge p-6 md:p-10 flex flex-col justify-between"
          >
            <div className="absolute inset-0 bg-crosshatch pointer-events-none" />
            <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-sunburst opacity-90 spin-slow" />
            <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-[#160B0A] border-4 border-[#D4A24C] flex items-center justify-center">
                <Flame size={40} className="text-[#E2462C]" />
              </div>
            </div>
            <div className="relative">
              <p className="f-mono text-[11px] md:text-xs tracking-[0.4em] uppercase text-[#D4A24C] mb-4">Est. MCMLXXXVII · Florence & New York</p>
              <h1 className="f-display font-black leading-[0.86] text-[#F8EFD9] text-[clamp(3rem,8vw,7.5rem)]">
                VALIANT<br />
                <span className="italic font-medium text-[#D4A24C]">Paper</span> CO.
              </h1>
            </div>
            <div className="relative mt-8 flex flex-wrap items-end justify-between gap-6">
              <p className="f-display italic text-lg md:text-2xl text-[#F2E7CE]/90 max-w-md leading-snug">
                “Every great story is signed in ink. We make the page worthy of the hand that dares to write it.”
              </p>
              <div className="flex items-center gap-2 f-mono text-[11px] tracking-[0.25em] uppercase border-2 border-[#D4A24C] px-4 py-2 text-[#D4A24C]">
                <Award size={14} /> 600gsm Cotton Standard
              </div>
            </div>
          </motion.section>

          {/* ---- THE BUSINESS CARD (FLIPPABLE) ---- */}
          <motion.section
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="col-span-12 lg:col-span-5 row-span-2 relative overflow-hidden bg-[#1F1210] gold-edge p-5 md:p-7 flex flex-col"
          >
            <div className="absolute inset-0 bg-pinstripe pointer-events-none" />
            <div className="relative flex items-center justify-between mb-4">
              <span className="f-mono text-[11px] tracking-[0.3em] uppercase text-[#D4A24C]">Specimen — Calling Card</span>
              <button
                onClick={() => setFlipped(!flipped)}
                className="f-mono text-[11px] tracking-[0.2em] uppercase bg-[#E2462C] text-[#160B0A] px-3 py-1.5 font-bold hover:bg-[#D4A24C] transition-colors"
              >
                Flip ↻
              </button>
            </div>

            <div className="relative flex-1 card3d cursor-pointer" onClick={() => setFlipped(!flipped)}>
              <div className={`card-inner relative w-full h-full min-h-[260px] ${flipped ? 'flipped' : ''}`}>
                {/* FRONT */}
                <div className="card-face absolute inset-0 bg-[#F2E7CE] bg-paper-grain text-[#2A1410] p-6 md:p-8 flex flex-col justify-between border-[6px] border-double border-[#8C1D18]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="f-mono text-[10px] tracking-[0.35em] uppercase text-[#8C1D18]">Valiant Paper Co.</p>
                      <h2 className="f-display font-black text-3xl md:text-4xl mt-2 leading-none">Margaux<br />Castellane</h2>
                      <p className="f-display italic text-[#8C1D18] text-base md:text-lg mt-2">Director of Talent & Apprenticeships</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[#8C1D18] flex items-center justify-center shrink-0">
                      <Feather size={20} className="text-[#F2E7CE]" />
                    </div>
                  </div>
                  <div className="border-t-2 border-[#2A1410] pt-3 flex flex-wrap gap-x-5 gap-y-1 f-mono text-[11px]">
                    <span className="flex items-center gap-1.5"><Mail size={12} /> join@valiantpaper.co</span>
                    <span className="flex items-center gap-1.5"><Phone size={12} /> +39 055 218 877</span>
                    <span className="flex items-center gap-1.5"><MapPin size={12} /> Via dei Fossi 14, Firenze</span>
                  </div>
                </div>
                {/* BACK */}
                <div className="card-face card-back absolute inset-0 bg-[#8C1D18] text-[#F2E7CE] p-6 md:p-8 flex flex-col items-center justify-center text-center border-[6px] border-double border-[#D4A24C] overflow-hidden">
                  <div className="absolute inset-0 bg-halftone opacity-40" />
                  <Stamp size={28} className="relative text-[#D4A24C] mb-3" />
                  <p className="relative f-display font-black text-2xl md:text-3xl leading-tight">FORTUNE FAVOURS<br />THE BOLDLY PRINTED</p>
                  <p className="relative f-mono text-[11px] tracking-[0.3em] uppercase mt-4 text-[#D4A24C]">Letterpress · Foil · Engraving · Edge-Gilding</p>
                  <p className="relative f-mono text-[10px] mt-6 opacity-70">Card stock: Heroic White 600gsm — Edition 2,500 of 10,000</p>
                </div>
              </div>
            </div>

            <p className="relative f-mono text-[10px] text-[#F2E7CE]/50 mt-4 tracking-[0.2em] uppercase">Foil-stamped in 23kt gold · duplexed by hand · Florence print floor</p>
          </motion.section>

          {/* ---- HIRING MARQUEE STRIP ---- */}
          <section className="col-span-12 overflow-hidden bg-[#D4A24C] text-[#160B0A] border-y-4 border-[#160B0A] py-3">
            <div className="marquee-track flex whitespace-nowrap w-max">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center">
                  {[...Array(6)].map((_, j) => (
                    <span key={j} className="f-black text-xl md:text-2xl tracking-tight uppercase flex items-center">
                      We are hiring heroes <Star size={16} className="mx-4 fill-[#160B0A]" /> Five seats at the press <Star size={16} className="mx-4 fill-[#160B0A]" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* ---- OPEN ROLES ---- */}
          <motion.section
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="col-span-12 lg:col-span-5 row-span-2 bg-[#F2E7CE] bg-paper-grain text-[#2A1410] gold-edge p-6 md:p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-3 bg-scallop" />
            <div className="flex items-baseline justify-between mb-5">
              <h3 className="f-display font-black text-3xl md:text-4xl">Open Quests</h3>
              <span className="f-mono text-[11px] tracking-[0.25em] uppercase text-[#8C1D18]">5 positions</span>
            </div>
            <div className="divide-y-2 divide-[#2A1410]/15 border-t-2 border-b-2 border-[#2A1410]">
              {ROLES.map((r) => (
                <div
                  key={r.id}
                  onMouseEnter={() => setHoveredRole(r.id)}
                  onMouseLeave={() => setHoveredRole(null)}
                  className={`group flex items-center gap-4 py-3.5 px-2 cursor-pointer transition-colors duration-200 ${hoveredRole === r.id ? 'bg-[#8C1D18] text-[#F2E7CE]' : ''}`}
                >
                  <span className={`f-mono text-[11px] w-12 shrink-0 ${hoveredRole === r.id ? 'text-[#D4A24C]' : 'text-[#8C1D18]'}`}>{r.no}</span>
                  <div className="flex-1 min-w-0">
                    <p className="f-display font-bold text-base md:text-lg leading-tight">{r.title}</p>
                    <p className={`f-mono text-[10px] tracking-[0.15em] uppercase mt-0.5 ${hoveredRole === r.id ? 'text-[#F2E7CE]/70' : 'text-[#2A1410]/60'}`}>
                      {r.dept} · {r.loc} · {r.type}
                    </p>
                  </div>
                  <ArrowUpRight size={20} className={`shrink-0 transition-transform duration-200 ${hoveredRole === r.id ? 'text-[#D4A24C] translate-x-1 -translate-y-1' : 'text-[#8C1D18]'}`} />
                </div>
              ))}
            </div>
            <p className="f-mono text-[10px] tracking-[0.2em] uppercase mt-4 text-[#2A1410]/60">Apprenticeships paid from day one · relocation to Florence covered</p>
          </motion.section>

          {/* ---- STATS ---- */}
          <section className="col-span-6 lg:col-span-3 bg-[#E2462C] text-[#160B0A] gold-edge p-5 md:p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-halftone opacity-25" />
            <p className="relative f-mono text-[10px] tracking-[0.3em] uppercase font-bold">The Press in Numbers</p>
            <div className="relative space-y-2 mt-4">
              <div><span className="f-black text-3xl md:text-4xl">38</span><span className="f-mono text-[11px] ml-2 uppercase">artisans</span></div>
              <div><span className="f-black text-3xl md:text-4xl">1.2M</span><span className="f-mono text-[11px] ml-2 uppercase">sheets / yr</span></div>
              <div><span className="f-black text-3xl md:text-4xl">23kt</span><span className="f-mono text-[11px] ml-2 uppercase">gold foil</span></div>
            </div>
          </section>

          {/* ---- MOTTO / SUNBURST ---- */}
          <section className="col-span-6 lg:col-span-4 relative overflow-hidden bg-[#160B0A] gold-edge p-5 md:p-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-sunburst opacity-20 spin-slow" />
            <div className="relative text-center">
              <Sparkles size={20} className="mx-auto text-[#D4A24C] mb-3" />
              <p className="f-display italic text-xl md:text-2xl leading-snug text-[#F8EFD9]">
                We don't fill positions.<br />
                <span className="text-[#E2462C] not-italic font-black">We arm protagonists.</span>
              </p>
              <p className="f-mono text-[10px] tracking-[0.3em] uppercase text-[#D4A24C] mt-3">— House Creed, Plate IX</p>
            </div>
          </section>

          {/* ---- CONTACT ---- */}
          <section className="col-span-6 lg:col-span-3 bg-[#1F1210] gold-edge p-5 md:p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-pinstripe pointer-events-none" />
            <p className="relative f-mono text-[10px] tracking-[0.3em] uppercase text-[#D4A24C]">Send Your Letter</p>
            <div className="relative space-y-2.5 mt-4 f-mono text-[12px] text-[#F2E7CE]/85">
              <p className="flex items-center gap-2"><Mail size={13} className="text-[#E2462C]" /> join@valiantpaper.co</p>
              <p className="flex items-center gap-2"><Scissors size={13} className="text-[#E2462C]" /> Portfolio by post preferred</p>
              <p className="flex items-center gap-2"><MapPin size={13} className="text-[#E2462C]" /> Via dei Fossi 14, 50123 FI</p>
            </div>
            <p className="relative f-display italic text-sm text-[#D4A24C] mt-4">Wax seals earn extra credit.</p>
          </section>

          {/* ---- APPLY CTA ---- */}
          <section className="col-span-6 lg:col-span-4 bg-[#D4A24C] text-[#160B0A] gold-edge p-5 md:p-6 flex flex-col justify-between group cursor-pointer hover:bg-[#F2E7CE] transition-colors duration-300 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <p className="f-black text-2xl md:text-3xl uppercase leading-[0.95]">Answer<br />the Call</p>
              <div className="w-11 h-11 rounded-full bg-[#160B0A] flex items-center justify-center group-hover:bg-[#E2462C] transition-colors">
                <ChevronRight size={20} className="text-[#F2E7CE]" />
              </div>
            </div>
            <div className="mt-4">
              <p className="f-mono text-[11px] tracking-[0.15em] uppercase">Applications close — 31 March 2025</p>
              <div className="mt-2 h-2 bg-[#160B0A]/20"><div className="h-full w-2/3 bg-[#8C1D18]" /></div>
            </div>
          </section>

          {/* ---- BOTTOM REVERSE MARQUEE ---- */}
          <section className="col-span-12 overflow-hidden bg-[#8C1D18] border-y-4 border-[#D4A24C] py-2.5">
            <div className="marquee-track-rev flex whitespace-nowrap w-max">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center">
                  {[...Array(8)].map((_, j) => (
                    <span key={j} className="f-mono text-xs md:text-sm tracking-[0.3em] uppercase text-[#F2E7CE]/90 flex items-center">
                      Letterpress · Foil Stamping · Edge Gilding · Engraving · Duplexing <span className="mx-5 text-[#D4A24C]">✦</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ======= FOOTER ======= */}
        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 f-mono text-[10px] tracking-[0.25em] uppercase text-[#F2E7CE]/40">
          <span>© MMXXV Valiant Paper Co. — Printed matter for the bold</span>
          <span>Recruitment Dossier · Plate 07 · Run of 10,000</span>
        </footer>
      </main>
    </div>
  );
}