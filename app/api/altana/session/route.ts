import { NextRequest, NextResponse } from 'next/server'
import { grantHireSession, verifierLinksForGrant, getOrCreateAgentWallet, type SkillPresetId } from '@/lib/altana'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const presetId = (body.presetId as SkillPresetId) || undefined
    const ttlSec = body.ttlSec ? Number(body.ttlSec) : undefined
    const spendUsdt = body.spendUsdt as string | undefined

    // Fail fast with actionable message if env missing
    if (!process.env.ALTANA_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'ALTANA_PRIVATE_KEY missing. Set it in .env.local on the server (or Vercel env). See .env.example.' },
        { status: 500 },
      )
    }

    const grant = await grantHireSession({ presetId, ttlSec, spendUsdt })
    const links = verifierLinksForGrant(grant)

    // Never leak signer private key — return only public verifier fields
    const { publicKey: _pk, expiry: _exp, permissions: _perms, walletAddress: _wa } = grant.session as any
    const safeSession = JSON.parse(JSON.stringify({
      publicKey: grant.publicKey,
      expiry: Number(grant.session.expiry),
      permissions: grant.session.permissions,
      walletAddress: grant.walletAddress,
    }, (_, v) => typeof v === 'bigint' ? v.toString() : v))
    return NextResponse.json({
      ok: true,
      walletAddress: grant.walletAddress,
      keyId: grant.keyId,
      publicKey: grant.publicKey,
      session: safeSession,
      network: grant.network,
      expiry: Number(grant.session.expiry),
      transactionHash: grant.transactionHash,
      presetId: grant.presetId,
      links,
      message: 'Session granted onchain (KeyStore). Verify at links.accountUrl and links.keyUrl. Testnet counts for the track — mainnet is stronger.',
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const wallet = await getOrCreateAgentWallet()
    const { getNetworkId, accountExplorerUrl, explorerBase } = await import('@/lib/altana')
    return NextResponse.json({
      walletAddress: wallet.address,
      network: getNetworkId(),
      accountUrl: accountExplorerUrl(wallet.address),
      explorerBase: explorerBase(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
