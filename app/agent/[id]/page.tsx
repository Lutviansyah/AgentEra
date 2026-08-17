import { fetchAgents } from '@/lib/8004scan'
export default async function AgentPage({params}:{params:{id:string}}){
  const agents=await fetchAgents({}); const a=agents.find(x=>x.id===params.id) || agents[0]
  return (<main className="py-6">
    <a href="/" className="text-sm border rounded-full px-3 py-1">← Back to market</a>
    <div className="card p-6 mt-4">
      <div className="text-xs border rounded-full inline-block px-2 py-1">{a.category} · {a.live?'Live':'Offline'} · ERC-8004 #{a.id}</div>
      <h1 className="text-2xl font-bold mt-3">{a.name}</h1>
      <p className="text-[#5C5F6A] mt-2">{a.description}</p>
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="border rounded-xl p-4"><div className="text-xs text-[#8C8F9B]">Success rate</div><div className="text-xl font-mono">{a.successRate}%</div></div>
        <div className="border rounded-xl p-4"><div className="text-xs text-[#8C8F9B]">TTFT</div><div className="text-xl font-mono">{a.ttft}ms</div></div>
        <div className="border rounded-xl p-4"><div className="text-xs text-[#8C8F9B]">Price / hire</div><div className="text-xl font-mono">{a.price}</div></div>
      </div>
      <div className="mt-6 flex gap-3"><button className="bg-[#181A1E] text-white px-6 py-3 rounded-full">Hire via Binance x402 — {a.price}</button><button className="border px-6 py-3 rounded-full">View on 8004scan</button></div>
      <p className="text-xs text-[#8C8F9B] mt-3">Altana session: agent-owned wallet · spend cap onchain · expiry + revocation visible. Tx verifiable in Altana explorer (testnet ok, mainnet stronger). PancakeSwap: non-custodial swaps.</p>
    </div>
    <div className="card p-4 mt-4 text-sm"><b>TermiX Advantage Report</b> — 3 real tasks (agent vs manual) with time/cost/quality + outputs attached. See <code>docs/termix-report.md</code> and <code>lib/termix-report.ts</code>.</div>
  </main>)
}
