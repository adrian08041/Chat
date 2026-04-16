import { Fragment, type ReactNode } from "react";

const VARIABLE_PATTERN = /\{\{[^{}]+\}\}/g;

export function highlightVariables(text: string): ReactNode {
  const parts = text.split(VARIABLE_PATTERN);
  const matches = text.match(VARIABLE_PATTERN) ?? [];

  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {matches[i] && (
        <span className="inline-block px-1.5 rounded bg-primary-50 text-primary-600 font-medium">
          {matches[i]}
        </span>
      )}
    </Fragment>
  ));
}
