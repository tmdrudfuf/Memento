// Plain formatting helpers (no UI imports, so the headless widget task can use them too).
export const formatDate = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
