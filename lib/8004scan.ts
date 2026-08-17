export type Agent = {id:string; name:string; category:string; description:string; live:boolean; successRate:number; ttft:number; price:string}
const MOCK: Agent[] = [
  {id:'8004-001', name:'MarketWatch Sentinel', category:'Monitoring', description:'Watches markets, wallets, and positions 24/7 with alerts via Telegram.', live:true, successRate:98.2, ttft:420, price:'0.02 BNB'},
  {id:'8004-002', name:'GridMaster Pro', category:'Grid Trading', description:'Automated grid strategies within set ranges on PancakeSwap.', live:true, successRate:96.5, ttft:580, price:'0.015 BNB'},
  {id:'8004-003', name:'HealthGuard', category:'Health Factor', description:'Tracks loan positions on Venus/Aave and acts before liquidation.', live:true, successRate:99.1, ttft:310, price:'0.01 BNB'},
  {id:'8004-004', name:'Yield Router', category:'Yield', description:'Moves capital to highest yield across BSC DeFi.', live:false, successRate:94.0, ttft:720, price:'0.025 BNB'},
  {id:'8004-005', name:'CopyTrade Alpha', category:'Grid Trading', description:'Copy top traders on BSC with risk limits.', live:true, successRate:97.3, ttft:450, price:'0.018 BNB'},
  {id:'8004-006', name:'Wallet Tracker+', category:'Monitoring', description:'Real-time wallet tracker + Token Radar skills from Altana.', live:true, successRate:98.8, ttft:390, price:'0.012 BNB'},
]

export async function fetchAgents(opts:{q?:string, category?:string}): Promise<Agent[]>{
  const key = process.env.NEXT_PUBLIC_8004SCAN_API_KEY || process.env['8004SCAN_API_KEY']
  // TODO: replace with real 8004scan Pro API when key available: https://8004scan.io
  // Example: const r=await fetch('https://api.8004scan.io/agents?chain=bsc&q='+opts.q, {headers:{'x-api-key':key}})
  let list = MOCK
  if(opts.category) list = list.filter(a=>a.category===opts.category)
  if(opts.q) { const q=opts.q.toLowerCase(); list = list.filter(a=>a.name.toLowerCase().includes(q)||a.description.toLowerCase().includes(q)) }
  // Simulate 8004scan live fetch if key present
  if(key){ try{ /* real fetch here */ }catch{} }
  return list
}
