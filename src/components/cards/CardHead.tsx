import { CircleHelp } from "lucide-react";
import type { ReactNode } from "react";

export type CardHeadProps = {
  title: string;
  help?: string;
  actions?: ReactNode;
};

export function CardHead({ title, help, actions }: CardHeadProps) {
  return (
    <div className="card-head">
      <div>
        <h3>{title}</h3>
        {help && (
          <button className="help-button" title={help} aria-label={help}>
            <CircleHelp size={13} />
          </button>
        )}
      </div>
      {actions}
    </div>
  );
}
