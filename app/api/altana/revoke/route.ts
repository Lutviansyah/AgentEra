import { NextRequest, NextResponse } from 'next/server'
import { revokeHireSession, getOrCreateAgentWallet, keyExplorerUrl, accountExplorerUrl } from '@/lib/altana'
import type { Address, Hex } from 'viem'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const keyId = body.keyId as Hex | undefined
    const publicKey = body.publicKey as Hex | undefined
    const session = body.session // optional full session object forwarded from grant
    if (!keyId && !publicKey && !session) {
      return NextResponse.json({ error: 'Provide one of: keyId, publicKey, or session' }, { status: 400 })
    }
    if (!process.env.ALTANA_PRIVATE_KEY) {
      return NextResponse.json({ error: 'ALTANA_PRIVATE_KEY missing' }, { status: 500 })
    }
    const wallet = await getOrCreateAgentWallet()
    const target: any = session || keyId || publicKey
    const res: any = await revokeHireSession(target, wallet)
    const idForLink = keyId || publicKey || session?.publicKey || ''
    return NextResponse.json({
      ok: true,
      status: res.status,
      callsId: res.callsId,
      transactionHash: res.transactionHash,
      revokedKeyUrl: idForLink ? keyExplorerUrl(idForLink as string) : undefined,
      accountUrl: accountExplorerUrl(wallet.address),
      message: 'Revoked onchain — key page should flip to Revoked. This is the "revocation visible in product" requirement.',
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
