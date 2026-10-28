import { DEAL_STEPS, SIDE_LABEL, stepIndex, type DealState, type SideState } from "@/lib/record";

/** A linha do contrato: seis passos, o atual em tinta; No ar em vermelho. */
export function DealSteps({ state, wide }: { state: DealState; wide?: boolean }) {
  const s = stepIndex(state);
  return (
    <div className={`deal-steps ${wide ? "full" : ""}`} role="img" aria-label={`Estado: ${DEAL_STEPS[s].label}`}>
      <div className="bar">
        {DEAL_STEPS.map((step, j) => (
          <i key={step.key} className={j < s ? "on" : j === s ? (state === "live" ? "live" : "on") : ""} title={step.label} />
        ))}
      </div>
      {wide ? (
        <div className="labels rec">
          {DEAL_STEPS.map((step, j) => (
            <span key={step.key} className={j === s ? "" : "quiet"}>
              {step.label}
            </span>
          ))}
        </div>
      ) : (
        <div className="rec">{DEAL_STEPS[s].label}</div>
      )}
    </div>
  );
}

export function SideTags({ side }: { side: SideState[] }) {
  if (!side.length) return null;
  return (
    <span className="side-tags">
      {side.map((s) => (
        <span key={s} className="status bad rec">
          {SIDE_LABEL[s]}
        </span>
      ))}
    </span>
  );
}

/** 2026-11-16 vira 16.11.26. */
export function day(isoDate: string | null) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.slice(0, 10).split("-");
  return `${d}.${m}.${y.slice(2)}`;
}
