// lib/altana.ts — Altana track scaffold for AgentEra (BNB Build the Era)
// Covers: agent-owned wallet, sessions w/ spend cap & expiry onchain, x402 hire, explorer verifier
// SDK: @altananetwork/sdk 0.7.1 · docs.altana.network · skills.altana.network
// Chain: BNB Testnet (97) default for hackathon, flip ALTANA_NETWORK=bnb to go mainnet.
// Env expected (see .env.example):
//   ALTANA_PRIVATE_KEY=0x...            <- agent-owner / admin EOA private key (KEEP SECRET, server only)
//   ALTANA_NETWORK=bnbTestnet|bnb        <- default bnbTestnet
//   ALTANA_SESSION_TTL_SEC=3600          <- default 1h
//   ALTANA_DEFAULT_SPEND_USDT=5          <- default 5 USDT (BSC USDT = 18 decimals)
//   NEXT_PUBLIC_ALTANA_WALLET_ADDRESS=   <- filled after first createWallet, expose in submission
//   NEXT_PUBLIC_ALTANA_EXPLORER_BASE=https://testnet.altana.network

import {
  createClient,
  signerFromPrivateKey,
  BNB,
  BNB_TESTNET,
  type Session,
  type GrantSessionResult,
  type Wallet,
  type NetworkConfig,
  PERMIT2_ADDRESS,
} from '@altananetwork/sdk'
import type { Address, Hex } from 'viem'

// ── Network selector ──────────────────────────────────────────────
export const ALTANA_NETWORKS = { bnbTestnet: BNB_TESTNET, bnb: BNB } as const
export type AltanaNetworkId = keyof typeof ALTANA_NETWORKS

export function getNetworkId(): AltanaNetworkId {
  const v = (process.env.ALTANA_NETWORK || process.env.NEXT_PUBLIC_ALTANA_NETWORK || 'bnbTestnet').toLowerCase()
  if (v === 'bnb' || v === 'mainnet' || v === '56') return 'bnb'
  return 'bnbTestnet'
}
export function getNetwork(): NetworkConfig {
  return ALTANA_NETWORKS[getNetworkId()]
}
export function isTestnet(): boolean {
  return getNetworkId() === 'bnbTestnet'
}
export function explorerBase(): string {
  if (process.env.NEXT_PUBLIC_ALTANA_EXPLORER_BASE) return process.env.NEXT_PUBLIC_ALTANA_EXPLORER_BASE.replace(/\/$/, '')
  return isTestnet() ? 'https://testnet.altana.network' : 'https://explorer.altana.network'
}
export function accountExplorerUrl(walletAddress: string): string {
  return `${explorerBase()}/account/${walletAddress}`
}
export function keyExplorerUrl(keyIdOrPublicKey: string): string {
  return `${explorerBase()}/key/${keyIdOrPublicKey}`
}
export function txExplorerUrl(txHash: string): string {
  const base = getNetwork().explorer // bscscan / testnet.bscscan
  return `${base}/tx/${txHash}`
}

// ── Client singleton ──────────────────────────────────────────────
let _client: ReturnType<typeof createClient> | null = null
export function getAltanaClient() {
  if (_client) return _client
  const network = getNetwork()
  _client = createClient({ chains: [network] })
  return _client
}

// ── Admin signer (server only — never expose to client bundle) ───
export function getAdminSigner() {
  const pk = process.env.ALTANA_PRIVATE_KEY || process.env.PRIVATE_KEY
  if (!pk) throw new Error('ALTANA_PRIVATE_KEY missing — set it in .env.local (server only)')
  const normalized = pk.startsWith('0x') ? pk : `0x${pk}`
  return signerFromPrivateKey(normalized as `0x${string}`)
}

// Skill contracts (BSC mainnet == testnet addresses for same codepaths)
export const ADDR = {
  PANCAKE_ROUTER: '0x10ED43C718714eb63d5aA57B78B54704E256024E' as Address,
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' as Address,
  USDT: '0x55d398326f99059fF775485246999027B3197955' as Address, // 18 decimals on BSC !
  PANCAKE_FACTORY: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73' as Address,
} as const

// USDT on BSC: 18 decimals (not 6). Helper so reviewers don't mis-read.
export function usdtToWei(n: number | string): bigint {
  const s = String(n)
  const [whole, frac = ''] = s.split('.')
  const padded = (frac + '000000000000000000').slice(0, 18)
  return BigInt(whole) * 10n ** 18n + BigInt(padded)
}

// ── Agent-owned wallet ───────────────────────────────────────────
// The wallet address IS the EOA derived from ALTANA_PRIVATE_KEY.
// No new deploy needed — registerAccount is handled inside first grantSession/execute.
export async function getOrCreateAgentWallet(): Promise<Wallet> {
  const client = getAltanaClient()
  const signer = getAdminSigner()
  // createWallet is counterfactual + idempotent; same pk => same address across chains
  const wallet = await client.createWallet({ signer })
  return wallet
}

// ── Session presets — 3 skills with least-privilege scopes ────────
// winner-takes-all tip: scopes must be tight. Reviewer checks "permissions" column in explorer.
// Wallet Tracker is read-only -> no calls permission (session with empty calls = read-only).
// Trading / Liquidity / x402 each get minimal to:/spend caps.

export type SkillPresetId = 'wallet-tracker' | 'pancakeswap-trading' | 'pancakeswap-liquidity' | 'x402-payments'

export type SessionPreset = {
  id: SkillPresetId
  label: string
  spendCapUsdt: string      // human USDT, converted to wei (18d)
  period: 'day' | 'hour'
  calls: { to?: Address; signature?: string }[]
  ttlSec: number
}

export const SESSION_PRESETS: Record<SkillPresetId, SessionPreset> = {
  // Research only: no onchain calls, spend cap 0 — proves revocation/expiry path without spend
  'wallet-tracker': {
    id: 'wallet-tracker',
    label: 'Wallet Tracker (read-only)',
    spendCapUsdt: '0',
    period: 'day',
    calls: [], // no calls allowed — SDK interprets empty as "no writes"
    ttlSec: 3600 * 6,
  },
  'pancakeswap-trading': {
    id: 'pancakeswap-trading',
    label: 'PancakeSwap Trading',
    spendCapUsdt: process.env.ALTANA_DEFAULT_SPEND_USDT || '10',
    period: 'day',
    // Only Router + USDT approve; token address is filled per-hire if you want tighter.
    calls: [
      { to: ADDR.PANCAKE_ROUTER },
      { to: ADDR.USDT, signature: 'approve(address,uint256)' },
    ],
    ttlSec: Number(process.env.ALTANA_SESSION_TTL_SEC || 3600),
  },
  'pancakeswap-liquidity': {
    id: 'pancakeswap-liquidity',
    label: 'PancakeSwap Liquidity (V2)',
    spendCapUsdt: '20',
    period: 'day',
    calls: [
      { to: ADDR.PANCAKE_ROUTER },
      { to: ADDR.PANCAKE_FACTORY },
      { to: ADDR.USDT, signature: 'approve(address,uint256)' },
      { to: ADDR.WBNB, signature: 'approve(address,uint256)' },
    ],
    ttlSec: 3600 * 2,
  },
  'x402-payments': {
    id: 'x402-payments',
    label: 'x402 API Payments',
    spendCapUsdt: '5',
    period: 'day',
    // Permit2 approval + x402 settlement path
    calls: [
      { to: ADDR.USDT, signature: 'approve(address,uint256)' },
      { to: PERMIT2_ADDRESS },
    ],
    ttlSec: 3600,
  },
}

// Full hire preset — trading + x402 combined so one session can pay for data + swap
export function hireSessionPreset(): SessionPreset {
  return {
    id: 'pancakeswap-trading',
    label: 'Hire (trading + x402)',
    spendCapUsdt: '10',
    period: 'day',
    calls: [
      { to: ADDR.PANCAKE_ROUTER },
      { to: ADDR.USDT, signature: 'approve(address,uint256)' },
      { to: PERMIT2_ADDRESS },
    ],
    ttlSec: Number(process.env.ALTANA_SESSION_TTL_SEC || 3600),
  }
}

// ── Grant / Revoke / Execute wrappers ────────────────────────────
export type GrantResult = {
  session: GrantSessionResult
  walletAddress: Address
  keyId: Hex
  publicKey: Hex
  explorerAccountUrl: string
  explorerKeyUrl: string
  transactionHash?: Hex
  network: AltanaNetworkId
  presetId: SkillPresetId
}

export async function grantHireSession(opts?: {
  presetId?: SkillPresetId
  ttlSec?: number
  spendUsdt?: string
  wallet?: Wallet
}): Promise<GrantResult> {
  const client = getAltanaClient()
  const network = getNetwork()
  const chainId = network.chainId
  const signer = getAdminSigner()
  const wallet = opts?.wallet ?? (await getOrCreateAgentWallet())
  const preset: SessionPreset = opts?.presetId ? SESSION_PRESETS[opts.presetId] : hireSessionPreset()
  const spendUsdt = opts?.spendUsdt ?? preset.spendCapUsdt
  const ttl = opts?.ttlSec ?? preset.ttlSec
  const expiry = Math.floor(Date.now() / 1000) + ttl

  const spendWei = spendUsdt === '0' ? 0n : usdtToWei(spendUsdt)
  // Wallet Tracker (read-only) needs no spend entry; others get capped.
  const spendPermissions = spendWei === 0n ? [] : [{ limit: spendWei, period: preset.period as 'day', token: ADDR.USDT }]

  // `calls` empty => account validator allows nothing — perfect for tracker demo.
  // Non-empty => scoped to those targets only.
  // Narrow preset.calls to SDK's CallPermission union (needs at least one of {to,signature})
  const callPerms = preset.calls.length
    ? (preset.calls.filter(c => c.to || c.signature) as { to: Address }[] | { signature: string }[] | { to: Address; signature: string }[])
    : undefined
  const permissions: { calls?: readonly { to: Address }[]; spend?: readonly { limit: bigint; period: 'day'; token?: Address }[] } = {
    ...(callPerms ? { calls: callPerms as any } : {}),
    ...(spendPermissions.length ? { spend: spendPermissions } : {}),
  }

  const result: GrantSessionResult = await client.grantSession({
    wallet,
    signer,
    permissions,
    expiry,
    chainId,
    // register:true (default) => KeyStore onchain, visible in explorer — required for track
  })

  // Derive keyId for explorer link (keccak256(publicKey))
  const { keccak256 } = await import('viem')
  const keyId = keccak256(result.publicKey) as Hex

  return {
    session: result,
    walletAddress: wallet.address,
    keyId,
    publicKey: result.publicKey as Hex,
    explorerAccountUrl: accountExplorerUrl(wallet.address),
    explorerKeyUrl: keyExplorerUrl(keyId),
    transactionHash: result.transactionHash,
    network: getNetworkId(),
    presetId: preset.id,
  }
}

export async function revokeHireSession(sessionOrKeyId: Session | Hex, wallet?: Wallet) {
  const client = getAltanaClient()
  const signer = getAdminSigner()
  const w = wallet ?? (await getOrCreateAgentWallet())
  const chainId = getNetwork().chainId
  const res = await client.revokeSession({ wallet: w, signer, session: sessionOrKeyId, chainId })
  return res // { callsId, status, transactionHash? }
}

export async function executeViaSession(
  session: Session,
  calls: { to: Address; data?: Hex; value?: bigint }[],
) {
  const client = getAltanaClient()
  const chainId = getNetwork().chainId
  return client.execute({ session, calls, chainId })
}

// x402: agent-owned wallet pays for hire/data via session (Permit2 rail)
// One-time setup: approve USDT -> Permit2 + allow Permit2 as signature checker
export async function ensureX402Ready(session: Session, wallet: Wallet) {
  const client = getAltanaClient()
  const signer = getAdminSigner()
  const chainId = getNetwork().chainId
  // Idempotent — safe to call before every x402 flow; no-ops if already approved
  await client.approveTokenForPermit2({ wallet, signer, token: ADDR.USDT, chainId })
  await client.approveSignatureChecker({ wallet, signer, session, checker: PERMIT2_ADDRESS, chainId })
}

export async function payWithX402(session: Session, url: string, init?: RequestInit) {
  const client = getAltanaClient()
  const chainId = getNetwork().chainId
  return client.fetchWithX402({ session, url, init, chainId })
}

// ── Verifier helpers (for UI + submission evidence) ──────────────
export type AltanaVerifierLinks = {
  walletAddress: Address
  network: AltanaNetworkId
  chainId: number
  accountUrl: string
  keyUrl?: string
  txUrl?: string
  bscScanTxUrl?: string
}

export function verifierLinksForGrant(g: GrantResult): AltanaVerifierLinks {
  return {
    walletAddress: g.walletAddress,
    network: g.network,
    chainId: getNetwork().chainId,
    accountUrl: g.explorerAccountUrl,
    keyUrl: g.explorerKeyUrl,
    txUrl: g.transactionHash ? txExplorerUrl(g.transactionHash) : undefined,
    bscScanTxUrl: g.transactionHash ? txExplorerUrl(g.transactionHash) : undefined,
  }
}

// Lightweight balances helper for demo cards
export async function getWalletBalances(walletAddressOrWallet: Wallet | Address) {
  const client = getAltanaClient()
  const chainId = getNetwork().chainId
  return client.balances({ wallet: walletAddressOrWallet as any, tokens: [ADDR.USDT, ADDR.WBNB], chainId })
}

// Re-export hire flow used by API routes
// Existing lib/x402.ts mock stays for backward compat; new hire should go through Altana x402.
export { createX402Payment } from './x402'
