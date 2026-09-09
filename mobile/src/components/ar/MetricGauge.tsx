import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface MetricGaugeProps {
  label: string;
  value?: number;
  unit: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  icon?: string;
  formattedSubtext?: string;
}

export const MetricGauge: React.FC<MetricGaugeProps> = ({
  label,
  value,
  unit,
  warningThreshold = 80,
  criticalThreshold = 90,
  icon,
  formattedSubtext,
}) => {
  const safeVal = value !== undefined && value !== null && !isNaN(value) ? value : 0;
  const isCritical = safeVal >= criticalThreshold;
  const isWarning = !isCritical && safeVal >= warningThreshold;

  let gaugeColor = '#10B981'; // Xanh lá
  if (isCritical) {
    gaugeColor = '#EF4444'; // Đỏ
  } else if (isWarning) {
    gaugeColor = '#F59E0B'; // Vàng cam
  }

  // Giới hạn thanh tiến trình từ 0 - 100%
  const progressPercent = Math.min(Math.max(safeVal, 0), 100);

  return (
    <View style={[styles.container, isCritical && styles.criticalContainer]}>
      <View style={styles.headerRow}>
        <View style={styles.labelGroup}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={[styles.valueText, { color: gaugeColor }]}>
          {value !== undefined ? `${value.toFixed(1)}${unit}` : '--'}
        </Text>
      </View>

      {/* Thanh tiến trình % đo đạc */}
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            { width: `${progressPercent}%`, backgroundColor: gaugeColor },
          ]}
        />
      </View>

      {formattedSubtext ? (
        <Text style={styles.subtext}>{formattedSubtext}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  criticalContainer: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 12,
    marginRight: 4,
  },
  label: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  valueText: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  barBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  subtext: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 3,
    textAlign: 'right',
  },
});
