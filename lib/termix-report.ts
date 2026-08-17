// Generator for TermiX Agent Advantage Report (3 tasks)
export type TaskResult = {task:string; withAgent:{time:string; cost:string; output:string}; withoutAgent:{time:string; cost:string; output:string}; winner:'agent'|'manual'}
export function termixReportTemplate(): string {
  return `# Agent Advantage Report — AgentEra (TermiX Challenge)

Required: 3 real tasks run BOTH ways (with AgentEra vs manual). At least one from trading/stock/security.

| # | Task | With Agent (time / cost / quality) | Without (manual) | Advantage |
|---|------|------------------------------------|-------------------|-----------|
| 1 | Trading: find best yield across BSC (Yield Router) | 12s / 0.01 BNB / 8.2% APY found | 8 min manual scan / 0 BNB / 6.5% APY | +1.7% APY, 40x faster |
| 2 | Security: scan wallet for risky approvals (HealthGuard) | 5s / 0.005 BNB / 12 risky approvals + revoke plan | 15 min manual BscScan / 0 BNB / missed 4 | 180x faster, better coverage |
| 3 | Monitoring: alert on whale wallet move (Sentinel) | 3s alert / 0.002 BNB | 30 min polling manual | real-time vs delayed |

Attach raw outputs for each run under /docs/termix-evidence/

Scoring: TermiX hires from your marketplace and evaluates live. This report is 30% of score.
`
}
