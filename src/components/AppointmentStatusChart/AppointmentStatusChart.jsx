import { useTranslation } from 'react-i18next';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card from '../Card/Card';
import { usePreferences } from '../../context/PreferencesContext';
import {
  CHART_AXIS,
  CHART_AXIS_DARK,
  CHART_CATEGORICAL,
  CHART_TEXT_MUTED,
  CHART_TEXT_MUTED_DARK,
  CHART_TOOLTIP_DARK,
  CHART_TOOLTIP_LIGHT,
} from '../../styles/chartColors';
import styles from './AppointmentStatusChart.module.scss';

// appointments.status enum (02-data-model.md) -> i18n key in appointmentStatusChart.*
const STATUS_ORDER = [
  ['booked', 'booked'],
  ['checked_in', 'checkedIn'],
  ['in_consultation', 'inConsultation'],
  ['completed', 'completed'],
  ['cancelled', 'cancelled'],
  ['no_show', 'noShow'],
];

export default function AppointmentStatusChart({ appointmentsToday }) {
  const { t } = useTranslation();
  const { theme } = usePreferences();
  const isDark = theme === 'dark';
  const axisColor = isDark ? CHART_AXIS_DARK : CHART_AXIS;
  const labelColor = isDark ? CHART_TEXT_MUTED_DARK : CHART_TEXT_MUTED;
  const tooltipColors = isDark ? CHART_TOOLTIP_DARK : CHART_TOOLTIP_LIGHT;

  const data = STATUS_ORDER.map(([status, i18nKey], index) => ({
    status,
    label: t(`appointmentStatusChart.${i18nKey}`),
    count: appointmentsToday[status] ?? 0,
    color: CHART_CATEGORICAL[index],
  }));

  return (
    <Card className={styles.wrapper}>
      <span className={styles.title}>{t('appointmentStatusChart.title')}</span>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: axisColor }} axisLine={{ stroke: axisColor }} tickLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={90}
            tick={{ fontSize: 12, fill: axisColor }}
            axisLine={{ stroke: axisColor }}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [value, t('appointmentStatusChart.count')]}
            cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
            contentStyle={{ background: tooltipColors.background, border: `1px solid ${tooltipColors.border}` }}
            labelStyle={{ color: tooltipColors.text }}
            itemStyle={{ color: tooltipColors.text }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((entry) => (
              <Cell key={entry.status} fill={entry.color} />
            ))}
            <LabelList dataKey="count" position="right" style={{ fontSize: 12, fill: labelColor }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
