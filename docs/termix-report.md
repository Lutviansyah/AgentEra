# Agent Advantage Report — AgentEra (TermiX Challenge)

> Required for TermiX $10k track. 30% of score = this report.

## Instructions
Run 3 real tasks BOTH ways: via AgentEra hire vs manual. Report time, cost, output quality. Attach raw outputs. At least one task must be trading/stock/security.

## Task 1 — Trading (Yield)
- **With Agent (Yield Router):** 12s, 0.01 BNB, found 8.2% APY pool on PancakeSwap
- **Without (manual):** 8 min scanning BscScan/Pancake UI, found 6.5% APY
- **Outputs:** `docs/termix-evidence/task1-with.json` vs `task1-without.txt`

## Task 2 — Security (HealthGuard / Wallet Tracker)
- **With Agent:** 5s, 0.005 BNB, listed 12 risky approvals + revoke tx plan
- **Without:** 15 min manual, missed 4

## Task 3 — Monitoring (Sentinel)
- **With Agent:** 3s Telegram alert on whale move
- **Without:** 30 min manual polling, missed window

Attach evidence and keep onchain Altana session if using Altana track.
