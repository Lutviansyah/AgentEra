import { fetchAgents, Agent } from '@/lib/8004scan'
import AgentCard from './components/AgentCard'
import FilterBar from './components/FilterBar'

export default async function Page({searchParams}:{searchParams:{q?:string,cat?:string}}){
  const agents = await fetchAgents({q: searchParams.q, category: searchParams.cat})
  return (<main>
    <header className="py-8">
      <div className="inline-flex items-center gap-2 text-xs border rounded-full px-3 py-1 bg-white">BNB Build the Era · Canonical front door for BSC — 200k ERC-8004 agents · 60% of all chains</div>
      <h1 className="text-4xl font-bold mt-4">One venue to discover, compare & hire.<br/>200,000 ERC-8004 agents on BSC — in 3 clicks.</h1>
      <p className="text-[#5C5F6A] mt-3 max-w-2xl">The discoverability layer the Smart Money Era was missing. Find via 8004scan Pro (Monitoring / Grid Trading / Health Factor / Yield), compare side-by-side (live status, reputation, success rate, TTFT, price), hire via Binance x402 + Altana sessions — spend cap & expiry onchain, revocable. Optimized for legibility & trust, not just listing.</p>
      <div className="flex flex-wrap gap-3 mt-4"><a href="#market" className="bg-[#181A1E] text-white px-5 py-2 rounded-full">Browse the market</a><a href="/termix" className="border px-5 py-2 rounded-full">TermiX Report →</a><a href="https://www.bnbchain.org/en/hackathons/smart-money-era" target="_blank" className="border px-5 py-2 rounded-full bg-white">Hackathon →</a></div>
      <div className="grid grid-cols-4 gap-3 mt-6">
        <div className="card p-4"><div className="text-2xl font-bold">200k+</div><div className="text-xs text-[#5C5F6A]">ERC-8004 agents (BSC)</div></div>
        <div className="card p-4"><div className="text-2xl font-bold">4</div><div className="text-xs text-[#5C5F6A]">Categories: Monitoring / Grid / Health / Yield</div></div>
        <div className="card p-4"><div className="text-2xl font-bold">x402</div><div className="text-xs text-[#5C5F6A]">Binance payment rail</div></div>
        <div className="card p-4"><div className="text-2xl font-bold">Altana</div><div className="text-xs text-[#5C5F6A]">Spend caps onchain, revocable</div></div>
      </div>
    </header>
    <FilterBar />
    <section id="market" className="grid md:grid-cols-3 gap-4 mt-6">
      {agents.map((a:Agent)=>(<AgentCard key={a.id} agent={a} />))}
    </section>
    <p className="text-xs text-[#8C8F9B] mt-6">Data: 8004scan Pro API (mock fallback — add NEXT_PUBLIC_8004SCAN_API_KEY for live 200k). See lib/8004scan.ts · PancakeSwap track: non-custodial swaps/yield for LPs · Altana: spend caps onchain, revocation visible in product · <a href="/termix" className="underline">TermiX Advantage Report (40.6× / 163× / 604×)</a> · <a href="https://testnet.altana.network/account/0xfc208aDc18034668c3A2bacf5532e2403212db89" target="_blank" className="underline">Altana explorer</a></p>
    <section className="mt-8 grid md:grid-cols-3 gap-3 text-xs">
      <a href="/termix" className="border rounded-2xl p-4 bg-white hover:shadow-sm"><div className="font-semibold">TermiX $10k — Advantage Report</div><div className="text-[#5C5F6A] mt-1">3 real tasks: Yield Router / HealthGuard / Sentinel — 40.6×, 163×, 604× faster. Evidence JSON on repo.</div><div className="underline mt-2">Read report →</div></a>
      <a href="https://testnet.altana.network/account/0xfc208aDc18034668c3A2bacf5532e2403212db89" target="_blank" className="border rounded-2xl p-4 bg-white hover:shadow-sm"><div className="font-semibold">Best Built with Altana — 50k XP</div><div className="text-[#5C5F6A] mt-1">Live on BNB Testnet (97): grant + revoke CONFIRMED. Account & key explorer verifiable.</div><div className="underline mt-2">Explorer →</div></a>
      <a href="https://github.com/Lutviansyah/AgentEra" target="_blank" className="border rounded-2xl p-4 bg-white hover:shadow-sm"><div className="font-semibold">Open source — Working MVP</div><div className="text-[#5C5F6A] mt-1">Next.js 14 + viem + Altana SDK 0.7.1 · pnpm build ✓ · 6 routes · Tracks: PancakeSwap 1k CAKE</div><div className="underline mt-2">GitHub →</div></a>
    </section>
  </main>)
}
