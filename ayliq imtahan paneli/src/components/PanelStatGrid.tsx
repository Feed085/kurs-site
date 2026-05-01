import {
  StyleSheet,
  Text,
  View
} from 'react-native-web';

import { panelTheme, panelToneToColor } from '../theme/panelTheme';
import type { StatCard } from '../types/panel';

type PanelStatGridProps = {
  items: StatCard[];
  columns?: 2 | 3 | 4;
};

export function PanelStatGrid({ items, columns = 2 }: PanelStatGridProps) {
  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const toneColor = panelToneToColor[item.tone];
        return (
          <View key={item.id} style={[styles.card, columns === 4 ? styles.quarter : styles.half]}>
            <View style={[styles.accentBar, { backgroundColor: toneColor }]} />
            <Text style={[styles.value, { color: toneColor }]}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
            {item.helper ? <Text style={styles.helper}>{item.helper}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: panelTheme.spacing.lg
  },
  card: {
    backgroundColor: panelTheme.colors.surface,
    borderRadius: panelTheme.radius.md,
    borderWidth: 1,
    borderColor: panelTheme.colors.border,
    padding: panelTheme.spacing.md,
    marginBottom: panelTheme.spacing.md,
    minHeight: 104,
    ...panelTheme.shadow.card
  },
  half: {
    width: '48%'
  },
  quarter: {
    width: '48%'
  },
  accentBar: {
    width: 36,
    height: 4,
    borderRadius: 999,
    marginBottom: panelTheme.spacing.sm
  },
  value: {
    fontFamily: panelTheme.typography.heading,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 4
  },
  label: {
    fontFamily: panelTheme.typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: panelTheme.colors.text,
    lineHeight: 18
  },
  helper: {
    marginTop: 4,
    fontFamily: panelTheme.typography.body,
    fontSize: 11,
    fontWeight: '500',
    color: panelTheme.colors.textSoft
  }
});
