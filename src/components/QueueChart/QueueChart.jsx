import { useTranslation } from 'react-i18next';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import Card from '../Card/Card';
import EmptyState from '../EmptyState/EmptyState';
import { usePreferences } from '../../context/PreferencesContext';
import {
  CHART_CATEGORICAL,
  CHART_TEXT_MUTED,
  CHART_TEXT_MUTED_DARK,
  CHART_TOOLTIP_DARK,
  CHART_TOOLTIP_LIGHT,
} from '../../styles/chartColors';
import styles from './QueueChart.module.scss';

const RADIAN = Math.PI / 180;

// Classic Recharts "Pie Chart With Customized Label" pattern — percentage
// drawn outside the slice via a leader line, since a label inside a thin
// slice (e.g. 0%) would be clipped or unreadable. Curried on labelColor so
// it can follow the current theme without Recharts' own fill (the slice's
// own categorical color, unreadable as small outside-slice text) getting involved.
function makeCustomizedLabelRenderer(labelColor) {
  return function renderCustomizedLabel({ cx, cy, midAngle, outerRadius, percent, value }) {
    if (value === 0) return null;

    const radius = outerRadius + 18;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill={labelColor} fontSize={12} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
}

// Suppress the leader line for a 0-value slice too — otherwise it dangles
// with no label at the other end.
function renderCustomizedLabelLine(props) {
  if (props.value === 0) return null;
  const { points, stroke } = props;
  return <path d={`M${points[0].x},${points[0].y}L${points[1].x},${points[1].y}`} stroke={stroke} fill="none" />;
}

export default function QueueChart({ doctorCount, pharmacyCount }) {
  const { t } = useTranslation();
  const { theme } = usePreferences();
  const isDark = theme === 'dark';
  const labelColor = isDark ? CHART_TEXT_MUTED_DARK : CHART_TEXT_MUTED;
  const tooltipColors = isDark ? CHART_TOOLTIP_DARK : CHART_TOOLTIP_LIGHT;
  // Matches Card's surface color so the slice-separator ring reads as a
  // cutout down to the card background, not a fixed white glow on dark.
  const cellStroke = isDark ? '#262A33' : '#FFFFFF';

  const data = [
    { name: t('queueChart.doctorQueue'), value: doctorCount, color: CHART_CATEGORICAL[0] },
    { name: t('queueChart.pharmacyQueue'), value: pharmacyCount, color: CHART_CATEGORICAL[1] },
  ];

  if (doctorCount === 0 && pharmacyCount === 0) {
    return (
      <Card className={styles.wrapper}>
        <span className={styles.title}>{t('queueChart.title')}</span>
        <EmptyState message={t('queueChart.empty')} />
      </Card>
    );
  }

  return (
    <Card className={styles.wrapper}>
      <span className={styles.title}>{t('queueChart.title')}</span>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={70}
            label={makeCustomizedLabelRenderer(labelColor)}
            labelLine={renderCustomizedLabelLine}
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke={cellStroke} strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [value, t('queueChart.count')]}
            contentStyle={{ background: tooltipColors.background, border: `1px solid ${tooltipColors.border}` }}
            labelStyle={{ color: tooltipColors.text }}
            itemStyle={{ color: tooltipColors.text }}
          />
          <Legend verticalAlign="bottom" height={24} wrapperStyle={{ color: labelColor }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
