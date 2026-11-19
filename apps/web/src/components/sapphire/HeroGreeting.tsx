import { useGT } from "gt-react";
import { useState } from "react";

import { heroGreetingFor } from "~/sapphire/motion";
import { SapphireMark } from "./SapphireMark";

/** A quiet time-of-day greeting above the home headline. */
export function HeroGreeting() {
  const gt = useGT();
  // Read once, so the greeting doesn't flip while the page is open.
  const [part] = useState(() => heroGreetingFor(new Date().getHours()));
  const text = {
    morning: gt("Good morning"),
    afternoon: gt("Good afternoon"),
    evening: gt("Good evening"),
    night: gt("Working late"),
  }[part];
  return (
    <p className="sapphire-hero-greeting mb-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
      <SapphireMark className="size-3.5 text-primary" />
      <span>{text}</span>
    </p>
  );
}
