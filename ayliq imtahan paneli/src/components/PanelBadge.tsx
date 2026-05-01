import {
  StyleSheet,
  Text,
  View
} from 'react-native-web';

import { panelTheme, panelToneToColor, type PanelTone } from '../theme/panelTheme';

type PanelBadgeProps = {
  label: string;
  tone?: PanelTone;
  filled?: boolean;
  small?: boolean;
};

export function PanelBadge({ label, tone = 'muted', filled = false, small = false }: PanelBadgeProps) {
  const toneColor = panelToneToColor[tone];

  return (
    <View
      style={[
        styles.base,
        small && styles.small,
        filled
          ? { borderColor: toneColor, backgroundColor: toneColor }
          : { borderColor: toneColor, backgroundColor: panelTheme.colors.surface }
      ]}
    >
      <Text style={[styles.label, small && styles.smallLabel, filled ? styles.filledLabel : { color: toneColor }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: panelTheme.spacing.md,
    paddingVertical: 8,
    alignSelf: 'flex-start'
  },
  small: {
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  label: {
    fontFamily: panelTheme.typography.body,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2
  },
  smallLabel: {
    fontSize: 10,
    letterSpacing: 0.35
  },
  filledLabel: {
    color: '#FFFFFF'
  }
});
