/** The Sapphire gem in one colour (the accent), its facets told apart by opacity. */
export function SapphireMark(props: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 500 570" aria-hidden className={props.className} fill="currentColor">
      <polygon points="0,120 140,0 360,0 500,120" fillOpacity={0.75} />
      <polygon points="140,0 250,120 360,0" fillOpacity={0.45} />
      <polygon points="0,120 140,0 250,120" fillOpacity={0.9} />
      <polygon points="500,120 360,0 250,120" fillOpacity={0.7} />
      <polygon points="0,120 250,120 250,570" />
      <polygon points="500,120 250,120 250,570" fillOpacity={0.62} />
      <polygon points="0,120 155,120 250,570" fillOpacity={0.85} />
      <polygon points="500,120 345,120 250,570" fillOpacity={0.5} />
    </svg>
  );
}
