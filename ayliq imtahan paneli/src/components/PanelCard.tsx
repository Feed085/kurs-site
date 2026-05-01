import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle
} from 'react-native-web';

import { panelTheme, panelToneToColor, type PanelTone } from '../theme/panelTheme';

type PanelCardProps = {
  title?: string;
  subtitle?: string;
  tone?: PanelTone;
  right?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PanelCard({ title, subtitle, tone = 'primary', right, children, style }: PanelCardProps) {
  const accentColor = panelToneToColor[tone];

  return (
    <View style={[styles.card, style]}>
      {(title || subtitle || right) && (
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            {title ? <Text style={[styles.title, { color: accentColor }]}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {right ? <View style={styles.rightSlot}>{right}</View> : null}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: panelTheme.colors.surface,
    borderRadius: panelTheme.radius.lg,
    borderWidth: 1,
    borderColor: panelTheme.colors.border,
    padding: panelTheme.spacing.lg,
    marginBottom: panelTheme.spacing.lg,
    ...panelTheme.shadow.card
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: panelTheme.spacing.md
  },
  headerTextBlock: {
    flex: 1,
    paddingRight: panelTheme.spacing.md
  },
  rightSlot: {
    alignItems: 'flex-end'
  },
  title: {
    fontFamily: panelTheme.typography.heading,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.1,
    color: panelTheme.colors.text
  },
  subtitle: {
    marginTop: 4,
    fontFamily: panelTheme.typography.body,
    fontSize: 13,
    fontWeight: '500',
    color: panelTheme.colors.textSoft,
    lineHeight: 18
  }
});
