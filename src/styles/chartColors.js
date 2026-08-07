// Mirrors the $chart-* categorical palette in styles/variables.scss — SCSS
// variables aren't readable from JS, so Recharts fill props need this copy.
// Keep both in sync; never reorder (the slot order is the CVD-safety mechanism).
export const CHART_CATEGORICAL = ['#2A78D6', '#EB6834', '#1BAF7A', '#EDA100', '#E87BA4', '#008300'];
export const CHART_GRID = '#E1E0D9';
export const CHART_AXIS = '#C3C2B7';
export const CHART_TEXT_MUTED = '#6B7280';

// Recharts renders axis/label/tooltip text as SVG `fill`/inline-style props
// it controls, not through our SCSS modules, so these can't ride the
// var(--color-*) tokens in theme.scss — they need an explicit dark set,
// picked at render time based on the current theme (see usePreferences).
export const CHART_AXIS_DARK = '#5B6472';
export const CHART_TEXT_MUTED_DARK = '#9AA1AC';
export const CHART_TOOLTIP_LIGHT = { background: '#FFFFFF', border: '#E5E7EB', text: '#111827' };
export const CHART_TOOLTIP_DARK = { background: '#262A33', border: '#383D48', text: '#E4E6EB' };
