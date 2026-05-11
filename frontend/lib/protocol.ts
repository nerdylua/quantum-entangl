export type UiProtocol = "bell_state" | "bb84" | "e91" | "casqka";

function isTwoPartyProtocol(protocol: string): protocol is "bell_state" | "bb84" | "e91" {
  return protocol === "bell_state" || protocol === "bb84" || protocol === "e91";
}

export function normalizeProtocol(protocol: string | undefined): UiProtocol {
  if (!protocol) return "casqka";
  return isTwoPartyProtocol(protocol) ? protocol : "casqka";
}

export function getProtocolLabel(
  protocol: string | undefined,
  variant: "default" | "compact" | "upper" = "default"
): string {
  const normalized = normalizeProtocol(protocol);

  const labels = {
    default: {
      bell_state: "Bell State (T22)",
      bb84: "BB84",
      e91: "E91",
      casqka: "CASQKA Multi-Party",
    },
    compact: {
      bell_state: "Bell State",
      bb84: "BB84",
      e91: "E91",
      casqka: "CASQKA",
    },
    upper: {
      bell_state: "BELL STATE (T22)",
      bb84: "BB84",
      e91: "E91",
      casqka: "CASQKA MULTI-PARTY",
    },
  } as const;

  return labels[variant][normalized];
}

export function getProtocolColor(protocol: string | undefined): string {
  const normalized = normalizeProtocol(protocol);
  const colors: Record<UiProtocol, string> = {
    bell_state: "hsl(259, 67%, 59%)",
    bb84: "hsl(199, 89%, 48%)",
    e91: "hsl(142, 76%, 46%)",
    casqka: "hsl(25, 95%, 53%)",
  };

  return colors[normalized];
}
