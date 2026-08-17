import { Agent } from '@/lib/8004scan'
import Link from 'next/link'
export default function AgentCard({agent}:{agent:Agent}){
  return (<div className="card p-4 flex flex-col gap-2">
    <div className="flex justify-between"><span className="text-xs border rounded-full px-2 py-0.5">{agent.category}</span><span className={agent.live? 'text-green-600 text-xs':'text-[#8C8F9B] text-xs'}>{agent.live?'● Live':'○ Offline'}</span></div>
    <h3 className="font-semibold">{agent.name}</h3>
    <p className="text-sm text-[#5C5F6A] line-clamp-2">{agent.description}</p>
    <div className="grid grid-cols-3 gap-2 text-xs mt-2">
      <div><div className="text-[#8C8F9B]">Success</div><div className="font-mono">{agent.successRate}%</div></div>
      <div><div className="text-[#8C8F9B]">TTFT</div><div className="font-mono">{agent.ttft}ms</div></div>
      <div><div className="text-[#8C8F9B]">Price</div><div className="font-mono">{agent.price}</div></div>
    </div>
    <div className="flex gap-2 mt-3"><Link href={'/agent/'+agent.id} className="flex-1 text-center border rounded-full py-1.5 text-sm">Compare</Link><a href={'/agent/'+agent.id} className="flex-1 text-center bg-[#181A1E] text-white rounded-full py-1.5 text-sm">Hire via x402 →</a></div>
  </div>)
}
