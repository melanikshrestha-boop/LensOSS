import type { AdobeHint } from "../../lib/adobe";

type Props = {
  hint: AdobeHint;
  /** Optional class override; defaults to existing app hint styles. */
  className?: string;
};

/**
 * Renders the Adobe handoff title + ordered import steps.
 * Parent (App / store UI) passes `hint` from handoffToAdobe / openAdobeHint.
 */
export function AdobeHintBox({ hint, className = "hint-box" }: Props) {
  return (
    <div className={className} role="region" aria-label={hint.title}>
      <h3>{hint.title}</h3>
      <ol>
        {hint.steps.map((step, i) => (
          // Index key: steps can repeat wording across modes
          <li key={`${i}-${step.slice(0, 24)}`}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
