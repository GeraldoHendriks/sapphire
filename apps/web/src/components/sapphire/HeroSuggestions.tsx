import { useGT } from "gt-react";
import { BugIcon, CompassIcon, FlaskConicalIcon, ScanSearchIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Starting points under the home composer. Choosing one writes its prompt into the composer, so
 * the user can still edit it before sending.
 */
export function HeroSuggestions(props: { readonly onChoose: (prompt: string) => void }) {
  const gt = useGT();
  const suggestions: ReadonlyArray<{ icon: ReactNode; label: string; prompt: string }> = [
    {
      icon: <CompassIcon />,
      label: gt("Explain this project"),
      prompt: gt("Explain how this project fits together."),
    },
    {
      icon: <BugIcon />,
      label: gt("Fix a bug"),
      prompt: gt("Find a bug in this project and fix it."),
    },
    {
      icon: <FlaskConicalIcon />,
      label: gt("Add tests"),
      prompt: gt("Add tests for the recent changes."),
    },
    {
      icon: <ScanSearchIcon />,
      label: gt("Review my changes"),
      prompt: gt("Review my uncommitted changes."),
    },
  ];
  return (
    <div data-sapphire-hero-suggestions className="flex flex-wrap justify-center gap-2">
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.prompt}
          type="button"
          className="sapphire-suggestion"
          style={{ animationDelay: `${180 + index * 50}ms` }}
          onClick={() => props.onChoose(suggestion.prompt)}
        >
          {suggestion.icon}
          <span>{suggestion.label}</span>
        </button>
      ))}
    </div>
  );
}
