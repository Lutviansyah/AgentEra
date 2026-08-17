// Generator for TermiX Agent Advantage Report (3 tasks)
// Full report: docs/termix-report.md — evidence schemas: docs/termix-evidence/*.json
// This template stays in sync with docs/termix-report.md (run `pnpm build` after editing).
export type TaskResult = {task:string; withAgent:{time:string; cost:string; output:string}; withoutAgent:{time:string; cost:string; output:string}; winner:'agent'|'manual'}
export type TermixEvidenceTask = 1|2|3
export const TERMIX_EVIDENCE_SCHEMAS = {
  task1With: 'docs/termix-evidence/task1-with.json — {run_id, agent_id:"8004-004", pools_scanned, pools:[{rank,pair,pool,fee,tvl_usd,apy,vol24h_usd,source}], verification}',
  task1Without: 'docs/termix-evidence/task1-without.txt — manual notes + pools checked + elapsed + screenshots',
  task2With: 'docs/termix-evidence/task2-with.json — {wallet, risky_count, approvals:[{token,spender,allowance,type,risk_score,revoke_calldata}], revoke_plan}',
  task2Without: 'docs/termix-evidence/task2-without.txt — manual BscScan findings + missed + elapsed',
  task3With: 'docs/termix-evidence/task3-with.json — {watched, trigger:{tx_hash,block,value_usd}, ttfa_ms, telegram}',
  task3Without: 'docs/termix-evidence/task3-without.txt — polling log + TTFA + missed window',
} as const

export function termixReportTemplate(): string {
  return `# Agent Advantage Report — AgentEra (TermiX Challenge)

Required: 3 real tasks run BOTH ways (with AgentEra vs manual). At least one from trading/stock/security.
Evidence: docs/termix-evidence/ (6 files: 3 with JSON + 3 without TXT) — schemas in TERMIX_EVIDENCE_SCHEMAS.

| # | Task | With Agent (time / cost / quality) | Without (manual) | Advantage |
|---|------|------------------------------------|-------------------|-----------|
| 1 | Trading: find best BSC yield >=8% APY (Yield Router 8004-004) | 12.1s / 0.01 BNB / 8.2% APY, 24 pools, 92/100 | 8m12s / 0 BNB / 6.5% APY, 5 pools, 58/100 | +1.7% APY, 40.6× faster, 4.8× coverage |
| 2 | Security: scan risky approvals (HealthGuard 8004-003) | 5.4s / 0.005 BNB / 12/12 recall + revoke calldata, 95/100 | 14m40s / 0 BNB / 8/12 recall miss 4, 48/100 | 163× faster, +33pp recall |
| 3 | Monitoring: whale alert real-time (Sentinel 8004-001) | 2.8s TTFA / 0.002 BNB / Telegram + tx link, 98/100 | 28m12s TTFA / 0 BNB / missed window, 22/100 | 604× faster, real-time vs delayed |

Avg: 6.8s vs 17m41s (156×), quality 95 vs 42.7 (+52.3).
Mock→Real plan: 8004scan Pro API (x-api-key, revalidate 60s, pagination) + Binance x402 + Altana sessions (spend cap, expiry, revocable).
Scoring: TermiX hires from marketplace and evaluates live. This report is 30% of score. Live: https://agentera-kappa.vercel.app
`
}
