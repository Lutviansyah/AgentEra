# Altana Track — implementation checklist (ready to execute before 9 Sep)

Dibuat untuk: **AgentEra**, hackathon BNB Build the Era, partner track **Best Built with Altana (50k XP winner-takes-all)**.
Repo: `~/AgentEra` · Node24 pnpm · Vercel `agentera-kappa.vercel.app` · Chain `BNB_TESTNET (97)` default.

---

## 0) What was built (scaffold)

- `lib/altana.ts` — single Altana integration layer (extends existing `lib/x402.ts` + `lib/8004scan.ts`):
  network selector, wallet factory (`getOrCreateAgentWallet`), 4 session presets (Wallet Tracker read-only + PancakeSwap Trading + Liquidity + x402 Payments), `grantHireSession` / `revokeHireSession` / `executeViaSession` / x402 `ensureX402Ready`+`payWithX402`, explorer URL builders, verifier helpers.
- `app/api/altana/session/route.ts` — `POST /api/altana/session` grants onchain session + returns `walletAddress`, `keyId`, `transactionHash`, `links.{accountUrl,keyUrl,txUrl}`. `GET` returns wallet + account URL without a grant.
- `app/api/altana/revoke/route.ts` — `POST /api/altana/revoke` revokes by `keyId|publicKey|session`.
- `app/components/AltanaHirePanel.tsx` — client panel: Hire → grant (shows wallet/key/tx + explorer links) → Revoke → flipped state. Satisfies **"revocation visible in product"**.
- `app/agent/[id]/page.tsx` — wired panel into hire flow (`AltanaHirePanel` replaces static button).
- `.env.example` + `tsconfig` bumped to `ES2020` (BigInt required by viem).

## 1) Architecture mini (reviewer pitch — 60s)

```
User (browser)                       Server (Next.js + Altana SDK)          Onchain
  │  POST /api/altana/session         │  ALTANA_PRIVATE_KEY (admin EOA)       │  KeyStore (97: 0x6b83...)
  ├── Hire click ───────────────────►  │  createWallet(signer) ───────────────►│  walletAddress = EOA (same across chains)
  │                                   │  grantSession({calls:[Router],       │  registerKey(session) + authorize
  │◄─ {wallet, keyId, tx, links} ──── │   spend:[{USDT 10/day}], expiry})    │  spend cap + expiry stored onchain
  │                                   │  fee: KeyStore registration (≈ 2×    │  tx visible on testnet.bscscan + testnet.altana.network
  │   Explorer links (account/key/tx) │   first time)                         │
  │   Revoke button ─────────────────► │  revokeSession(admin, keyId) ───────►│  key → revoked (monotonic, instant)
  │◄─ revoked status ────────────────  │                                       │
  │  agent acts via session only      │  execute(session, [approve, swap])   │  validator enforces calls+spend+expiry
  │                                   │  fetchWithX402(session, url)          │  Permit2 + ERC-1271 settlement
```

Chosen 3 skills (why judges love them — clean spend narration):

| # | Skill (skills.altana.network) | What it proves onchain | Scope in preset |
|---|-------------------------------|------------------------|-----------------|
| 1 | **Wallet Tracker** (research-only) | Revocation + expiry without spend: session has **0 calls / 0 spend**, revoke still lands in KeyStore. Honest "research boundary" from SKILL.md. | `calls: []`, no spend, 6h TTL |
| 2 | **PancakeSwap Trading** (+ x402 combined as "Hire") | Real swaps capped by `spend: 10 USDT/day` + `calls:[Router, USDT.approve]` visible at `/account/<wallet>` and `/key/<keyId>`. | Router + USDT approve, 1h TTL |
| 3 | **x402 API Payments** | `Permit2` rail: one-time `approveTokenForPermit2` + `approveSignatureChecker(PERMIT2)` then `fetchWithX402` per hire/data. Counted against same spend cap. | Permit2 + USDT approve, 1h TTL |

PancakeSwap Liquidity is also scaffolded as 4th preset (Factory + WBNB approve) — swap in if you want LP track instead of trading.

Payout rails: Binance x402 (`lib/x402.ts` mock kept) + Altana x402 co-exist; hire now goes through Altana session → judge sees both boxes ticked.

## 2) Flow that satisfies "all 4 Altana requirements"

1. **Live onchain tx in Altana explorer** — every `grantSession`/`revokeSession`/`execute` yields `transactionHash`; UI + API response surfaces `links.{accountUrl,keyUrl,txUrl}`. Testnet counts (testnet.altana.network), mainnet stronger.
2. **Agent uses its own Altana wallet** — `ALTANA_PRIVATE_KEY` → `createWallet(signer)`; address is deterministic EOA, shown as `NEXT_PUBLIC_ALTANA_WALLET_ADDRESS` + in every response.
3. **Sessions with spend caps & expiry onchain** — `grantHireSession` writes `{spend:{limit,period,token:USDT(18d)}, expiry}` via relay; visible in explorer key page.
4. **Revocation visible in product** — `AltanaHirePanel` Revoke button + `POST /api/altana/revoke` → key page flips to **Revoked** (monotonic). Required evidence link is the key URL.
5. **Include wallet address in submission** — copy `walletAddress` from any grant response into DoraHacks form + pin `/account/<wallet>` link in README/submission.

## 3) Testnet execution checklist — run in order before 9 Sep

Every step produces an explorer/BscScan link. Do Steps 1-5 in one sitting; keep the wallet address constant.

```bash
# 0. Install + env
cd ~/AgentEra
pnpm install   # already has @altananetwork/sdk@0.7.1 + viem
cp .env.example .env.local  # fill ALTANA_PRIVATE_KEY
cat .env.local  # must contain:
# ALTANA_PRIVATE_KEY=0x...
# ALTANA_NETWORK=bnbTestnet
# ALTANA_SESSION_TTL_SEC=3600
# ALTANA_DEFAULT_SPEND_USDT=5
```

### Step 1 — Faucet (fund wallet)
- Generate a throwaway Metamask key, put its private key in `ALTANA_PRIVATE_KEY` (never reuse mainnet key).
- Derive address: `cast wallet address --private-key $ALTANA_PRIVATE_KEY` (or call `GET /api/altana/session` after setting env — it returns `walletAddress` without granting).
- Faucet: https://testnet.bnbchain.org/faucet-smart → paste wallet address → request **0.1 tBNB**. Need ~0.002 tBNB per grant (first grant costs ~2× KeyStore fee, per SDK changelog). Also request via Altana relay helper if needed: `fundNative` is available in SDK (testnet relay only).
- Verify: `https://testnet.bscscan.com/address/<WALLET>` shows balance, and `GET /api/altana/session` shows same address.

### Step 2 — Create wallet (counterfactual, idempotent)
```bash
curl http://localhost:3000/api/altana/session | jq
# → { walletAddress, network:"bnbTestnet", accountUrl:"https://testnet.altana.network/account/0x..." }
open https://testnet.altana.network/account/<WALLET>
# Expect: account page exists (may show 0 keys before first grant) — confirms network + address.
```

### Step 3 — Create session (grant) — spend cap + expiry onchain
```bash
# Wallet Tracker (read-only, cheapest sanity check)
curl -X POST http://localhost:3000/api/altana/session \
  -H 'content-type: application/json' \
  -d '{"presetId":"wallet-tracker"}' | jq
# → { walletAddress, keyId, transactionHash, links:{accountUrl,keyUrl,txUrl} }

# Hire preset (trading + x402) — the one submission should cite
curl -X POST http://localhost:3000/api/altana/session \
  -H 'content-type: application/json' \
  -d '{"presetId":"pancakeswap-trading","spendUsdt":"5","ttlSec":3600}' | jq
# Copy: walletAddress, keyId, transactionHash, links.*
```
- Verify (required screenshots for submission):
  - Open `links.accountUrl` (e.g. `https://testnet.altana.network/account/0xYourWallet`) → keys table shows new session key with **expiry** column.
  - Open `links.keyUrl` (e.g. `https://testnet.altana.network/key/0xKeyId`) → state **Active**, scope shows `calls: [Router]` + `spend: 5 USDT/day, USDT 0x55d3...`, `expiry: <ISO>`.
  - Open `links.txUrl` on `https://testnet.bscscan.com/tx/<HASH>` → status Success, shows `KeyStoreController` + `KeyStore` calls. Altana explorer activity feed shows Registration event.

### Step 4 — Tx via session (proves the cap is enforced)
Two options — at least one tx before submission. Easiest: do the **read-only tracker play** to avoid needing USDT, or request test USDT then swap a tiny amount.

```bash
# Option A (zero-funds): exercise Wallet Tracker skill via SDK directly
# Add a script scripts/altana-tracker.ts that uses Wallet Tracker getLogs logic
# with the granted session's public RPC — no execute needed, proves session scoping.

# Option B (with funds): get test USDT then do one small swap through the session
# Faucet USDT on BSC testnet via Pancake test faucet or bridge, then:
# Use grant from Step 3's session (keep its JSON), then SDK execute:
# sessions are enforced by validator — calls outside preset will REVERT as proof of least privilege.
```

- Verify: after `execute` returns `transactionHash`, open BscScan tx + `links.accountUrl` again. Spend remaining should reflect under session caps (relay tracks period spend).

### Step 5 — Revoke (visible in product — judge clicks this)
```bash
curl -X POST http://localhost:3000/api/altana/revoke \
  -H 'content-type: application/json' \
  -d '{"keyId":"0xKEY_FROM_STEP3"}' | jq
# → { status:"CONFIRMED", transactionHash:"0x...", revokedKeyUrl:"https://testnet.altana.network/key/0x..." }

# Or from UI: on /agent/8004-002 click "Revoke session" — should show red "Revoked ✓"
open https://testnet.altana.network/key/0xKEY_FROM_STEP3
# Expect: state flips to **Revoked** (not Expired). Revoked ≠ expired in explorer.
# Try execute with same session again → must FAIL (validator rejects revoked key). That's your demo's kill-switch.
```

### Step 6 — Capture evidence for submission (DoraHacks + Vercel)
- Record: `NEXT_PUBLIC_ALTANA_WALLET_ADDRESS = <WALLET>` ; pin in `vercel env` + `.env.local`.
- Screenshot set: (a) `testnet.altana.network/account/<WALLET>` keys table, (b) `testnet.altana.network/key/<KEY>` Active, (c) same key Revoked after Step 5, (d) BscScan grant tx, (e) UI panel with Hire → Revoked state.
- Push links into README + submission: `Altana wallet: 0x... — account: https://testnet.altana.network/account/0x... — example key: https://testnet.altana.network/key/0x... — grant tx: https://testnet.bscscan.com/tx/0x...`
- Deploy: `pnpm build && vercel --prod` ; set `ALTANA_PRIVATE_KEY` in Vercel env (Preview+Production), redeploy.
- Sanity live: `curl https://agentera-kappa.vercel.app/api/altana/session | jq` shows wallet; grant+revoke endpoints work live (use tBNB-funded wallet same as local).

## 4) Gotchas (from docs + SDK source — don't lose points)

- **USDT decimals = 18 on BSC** (not 6). `usdtToWei` in `lib/altana.ts` already handles it. Using 6d values will look like you didn't read the skill playbooks.
- **First grant costs ~2× KeyStore fee** (initial admin register + session register). Fund wallet with ≥0.05 tBNB before first grant or it reverts on fee.
- **Approve before swap direction**: `approve(USDT, router, amount)` before buy, `approve(TOKEN, router, amount)` before sell. Preset already includes USDT approve; add token approve per swap.
- **Fee-on-transfer tokens** need `swapExactTokensForTokensSupportingFeeOnTransferTokens` variant — detect by standard swap revert.
- **Router quoting**: quote direct `[USDT, TOKEN]` AND hop `[USDT, WBNB, TOKEN]` via `getAmountsOut`, pick better. Already documented in skill; show you know it in README.
- **BEP-677**: some BSC tokens use scaled UI amount (read `SCALED_UI_AMOUNT_INTERFACE_ID` check). `client.balances` already does this; don't reformat raw amounts yourself.
- **Relay only on mainnets + BSC testnet**. Sepolia has no relay — don't switch to it.
- **Private key safety**: `ALTANA_PRIVATE_KEY` must never reach the client bundle. Only `NEXT_PUBLIC_*` vars go to the browser. The scaffold enforces this via `getAdminSigner()` server-only.
- **Session key visibility race**: SDK already waits for `waitForSessionKeyVisible` + extra buffer after grant; don't skip ahead to `execute` in the same tick without awaiting grant.
- **Explorer is not the authority** — for code, do `isValidKey` contract read; for judges, explorer links are fine as evidence.

## 5) Submission copy snippet (paste into DoraHacks Altana field)

> AgentEra — Altana wallet `0x…` on BNB Testnet (97). Agent-owned wallet via `createWallet(signer)` (address = admin EOA). Hire grants a scoped session onchain: `calls:[PancakeV2 Router, USDT approve]` + `spend: 10 USDT/day (18d)` + `expiry: now+1h` (KeyStore `0x6b83…/0xb530…`). Explorer: account https://testnet.altana.network/account/0x… | example key https://testnet.altana.network/key/0x… (Active → Revoked after one revocation tx) | grant tx https://testnet.bscscan.com/tx/0x… . Skills exercised: Wallet Tracker (read-only, block-window logs) + PancakeSwap Trading (swap via session `execute`) + x402 API Payments (Permit2 rail, `fetchWithX402`). Revocation visible in product: Hire panel → Revoke flips key to Revoked in explorer and validator rejects further executes.

## 6) File map (what to review)

- `lib/altana.ts` ................... core (this PR)
- `app/api/altana/session/route.ts` grant + wallet GET
- `app/api/altana/revoke/route.ts`  revoke
- `app/components/AltanaHirePanel.tsx`  hire/revoke UI + explorer links
- `app/agent/[id]/page.tsx`        wired panel
- `.env.example` .................... env template
- `lib/8004scan.ts` / `lib/x402.ts` untouched (mock fallbacks remain)

---

Tested: `npx tsc --noEmit --target ES2020` passes, deps installed (`@altananetwork/sdk 0.7.1 + viem 2.55.17`). Not yet executed on testnet — requires funding Step 1 above and a live run of Steps 2-5 (estimated 5 min once faucet arrives).
