import { useTranslation } from 'react-i18next';
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card from '../Card/Card';
import EmptyState from '../EmptyState/EmptyState';
import { usePreferences } from '../../context/PreferencesContext';
import {
  CHART_AXIS,
  CHART_AXIS_DARK,
  CHART_TEXT_MUTED,
  CHART_TEXT_MUTED_DARK,
  CHART_TOOLTIP_DARK,
  CHART_TOOLTIP_LIGHT,
} from '../../styles/chartColors';
import styles from './LowStockChart.module.scss';

// Single hue (danger) — every item here is already a warning by definition
// (stock_qty <= min_stock_alert), not a multi-category breakdown.
const DANGER_HEX = '#DC2626';

export default function LowStockChart({ items }) {
  const { t } = useTranslation();
  const { theme } = usePreferences();
  const isDark = theme === 'dark';
  const axisColor = isDark ? CHART_AXIS_DARK : CHART_AXIS;
  const labelColor = isDark ? CHART_TEXT_MUTED_DARK : CHART_TEXT_MUTED;
  const tooltipColors = isDark ? CHART_TOOLTIP_DARK : CHART_TOOLTIP_LIGHT;

  if (items.length === 0) {
    return (
      <Card className={styles.wrapper}>
        <span className={styles.title}>{t('lowStockChart.title')}</span>
        <EmptyState message={t('lowStockChart.empty')} />
      </Card>
    );
  }

  // A stock_qty of 0 (the most alarming case) renders as an invisible
  // zero-width bar — give it a small visible stub while keeping the label
  // and tooltip on the real value, so "out of stock" never looks like "no data".
  const maxStock = Math.max(...items.map((item) => item.stock_qty), 1);
  const stub = Math.max(maxStock * 0.03, 0.2);
  const data = items.map((item) => ({
    name: item.name,
    stock_qty: item.stock_qty,
    display: item.stock_qty > 0 ? item.stock_qty : stub,
  }));

  return (
    <Card className={styles.wrapper}>
      <span className={styles.title}>{t('lowStockChart.title')}</span>
      <ResponsiveContainer width="100%" height={Math.max(140, data.length * 32)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: axisColor }} axisLine={{ stroke: axisColor }} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 12, fill: axisColor }}
            axisLine={{ stroke: axisColor }}
            tickLine={false}
          />
          <Tooltip
            formatter={(_value, _name, props) => [props.payload.stock_qty, t('lowStockChart.remainingStock')]}
            cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
            contentStyle={{ background: tooltipColors.background, border: `1px solid ${tooltipColors.border}` }}
            labelStyle={{ color: tooltipColors.text }}
            itemStyle={{ color: tooltipColors.text }}
          />
          <Bar dataKey="display" radius={[0, 4, 4, 0]} maxBarSize={18} fill={DANGER_HEX}>
            <LabelList dataKey="stock_qty" position="right" style={{ fontSize: 12, fill: labelColor }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
