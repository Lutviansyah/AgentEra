'use client'
import {useRouter, useSearchParams} from 'next/navigation'
const cats=['All','Monitoring','Grid Trading','Health Factor','Yield']
export default function FilterBar(){
  const r=useRouter(); const sp=useSearchParams();
  return (<div className="flex gap-2 flex-wrap">
    {cats.map(c=>{
      const active=(sp.get('cat')||'All')===c
      return <button key={c} onClick={()=>{const p=new URLSearchParams(sp.toString()); if(c==='All')p.delete('cat'); else p.set('cat',c); r.push('/?'+p.toString())}} className={active? 'bg-[#181A1E] text-white px-4 py-1.5 rounded-full text-sm':'border bg-white px-4 py-1.5 rounded-full text-sm'}>{c}</button>
    })}
    <input placeholder="Search agents / skills..." defaultValue={sp.get('q')||''} onKeyDown={e=>{if(e.key==='Enter'){const p=new URLSearchParams(sp.toString()); const v=(e.target as HTMLInputElement).value; if(v)p.set('q',v); else p.delete('q'); r.push('/?'+p.toString())}}} className="ml-auto border rounded-full px-4 py-1.5 text-sm bg-white w-64" />
  </div>)
}
