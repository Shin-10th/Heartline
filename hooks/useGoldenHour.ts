// TODO: subscribe to couples/{coupleId}/goldenHour and expose lockedSlot + candidates.
export function useGoldenHour() {
  return { lockedSlot: null, candidates: [], loading: true };
}
