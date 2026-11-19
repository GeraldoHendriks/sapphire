import sapphire from "../../../../sapphire.json" with { type: "json" };

/** Sapphire's own release version, shown to users. */
export const SAPPHIRE_VERSION: string = sapphire.version;

/** The T3 Code release this build is based on; also the version used for compatibility checks. */
export const UPSTREAM_VERSION: string = sapphire.upstream.version;
