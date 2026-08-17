import { fetchAgents, Agent } from '@/lib/8004scan'
import AgentCard from './components/AgentCard'
import FilterBar from './components/FilterBar'

export default async function Page({searchParams}:{searchParams:{q?:string,cat?:string}}){
  const agents = await fetchAgents({q: searchParams.q, category: searchParams.cat})
  return (<main>
    <header className="py-8">
      <div className="inline-flex items-center gap-2 text-xs border rounded-full px-3 py-1 bg-white">Multiple providers bidding side by side · Prices and live success rates in the open</div>
      <h1 className="text-4xl font-bold mt-4">One model, many providers bidding.<br/>Multi-channel automatic failover, prices and success rates in the open.</h1>
      <p className="text-[#5C5F6A] mt-3 max-w-2xl">AgentEra is the discoverability layer for 200k ERC-8004 agents on BSC (60% of all chains). Find → Compare → Hire in 3 clicks. Powered by 8004scan + Binance x402 + Altana sessions.</p>
      <div className="flex gap-3 mt-4"><a href="#market" className="bg-[#181A1E] text-white px-5 py-2 rounded-full">Browse the market</a><a href="https://www.bnbchain.org/en/hackathons/smart-money-era" target="_blank" className="border px-5 py-2 rounded-full">Hackathon →</a></div>
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
    <p className="text-xs text-[#8C8F9B] mt-6">Data: 8004scan Pro API (mock fallback). Replace 8004SCAN_API_KEY for live 200k. See lib/8004scan.ts</p>
  </main>)
}
