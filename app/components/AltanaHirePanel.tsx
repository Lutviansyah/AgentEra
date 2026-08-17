'use client'
import { useState } from 'react'

type GrantResp = {
  ok?: boolean
  walletAddress?: string
  keyId?: string
  publicKey?: string
  session?: any
  transactionHash?: string
  network?: string
  expiry?: number
  links?: { accountUrl: string; keyUrl: string; txUrl?: string }
  error?: string
}

export default function AltanaHirePanel({ agentId, price }: { agentId: string; price: string }) {
  const [loading, setLoading] = useState(false)
  const [resp, setResp] = useState<GrantResp | null>(null)
  const [revoked, setRevoked] = useState(false)

  async function hire() {
    setLoading(true)
    setResp(null)
    try {
      const r = await fetch('/api/altana/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ presetId: 'pancakeswap-trading' }),
      })
      const j = await r.json()
      setResp(j)
    } catch (e: any) {
      setResp({ error: String(e?.message || e) })
    } finally {
      setLoading(false)
    }
  }

  async function revoke() {
    if (!resp?.publicKey && !resp?.session) return
    setLoading(true)
    try {
      const r = await fetch('/api/altana/revoke', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(resp.session ? { session: resp.session } : { publicKey: resp.publicKey }),
      })
      const j = await r.json()
      if (j.ok) setRevoked(true)
      setResp((prev) => ({ ...prev, ...j }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-2xl p-4 bg-white mt-4">
      <div className="text-sm font-semibold">Hire via Altana — agent-owned wallet + spend cap onchain</div>
      <p className="text-xs text-[#5C5F6A] mt-1">
        Creates a scoped session: spend cap + expiry recorded in KeyStore (explorer-verifiable). Revocation is one tx.
        <span className="ml-1">Price {price} · agent {agentId}</span>
      </p>
      <div className="flex gap-2 mt-3">
        <button onClick={hire} disabled={loading} className="bg-[#181A1E] text-white px-5 py-2 rounded-full text-sm disabled:opacity-50">
          {loading ? 'Granting…' : 'Hire — grant session (onchain)'}
        </button>
        {(resp?.publicKey || resp?.session) && !revoked && (
          <button onClick={revoke} disabled={loading} className="border px-5 py-2 rounded-full text-sm disabled:opacity-50">
            Revoke session
          </button>
        )}
        {revoked && <span className="text-xs px-3 py-2 rounded-full bg-red-50 border text-red-700">Revoked ✓ — check explorer key page</span>}
      </div>

      {resp && (
        <div className="mt-3 text-xs font-mono bg-[#F7F8FA] border rounded-xl p-3 break-all">
          {resp.error ? (
            <span className="text-red-600">{resp.error}</span>
          ) : (
            <>
              <div>Wallet <b>{resp.walletAddress}</b> ({resp.network})</div>
              <div>KeyId {resp.keyId}</div>
              {resp.publicKey && <div>PubKey {resp.publicKey.slice(0,18)}…{resp.publicKey.slice(-8)}</div>}
              {resp.transactionHash && <div>Grant tx {resp.transactionHash}</div>}
              {resp.expiry && <div>Expiry {new Date(resp.expiry * 1000).toLocaleString()} (Unix {resp.expiry})</div>}
              {resp.links && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <a href={resp.links.accountUrl} target="_blank" className="underline">Explorer — account</a>
                  <a href={resp.links.keyUrl} target="_blank" className="underline">Explorer — key</a>
                  {resp.links.txUrl && <a href={resp.links.txUrl} target="_blank" className="underline">BscScan tx</a>}
                </div>
              )}
              <div className="text-[11px] text-[#8C8F9B] mt-2">Copy the wallet address into your submission. The judge verifies via explorer.altana.network links.</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
