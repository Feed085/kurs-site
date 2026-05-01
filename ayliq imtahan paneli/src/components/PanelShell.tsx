import type { ReactNode } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type ScrollViewProps
} from 'react-native-web';

import { panelTheme, panelToneToColor, type PanelTone } from '../theme/panelTheme';

type PanelShellProps = {
  title: string;
  subtitle: string;
  roleLabel: string;
  roleTone: PanelTone;
  children: ReactNode;
  headerRight?: ReactNode;
  scrollProps?: ScrollViewProps;
};

export function PanelShell({
  title,
  subtitle,
  roleLabel,
  roleTone,
  children,
  headerRight,
  scrollProps
}: PanelShellProps) {
  const accentColor = panelToneToColor[roleTone];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={panelTheme.colors.background} />
      <ScrollView
        {...scrollProps}
        contentContainerStyle={styles.content}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.brand}>RIM ACADEMY</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={[styles.roleBadge, { borderColor: accentColor }]}>
            <Text style={[styles.roleBadgeText, { color: accentColor }]}>{roleLabel}</Text>
          </View>
        </View>

        {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: panelTheme.colors.background
  },
  scrollView: {
    flex: 1,
    backgroundColor: panelTheme.colors.background
  },
  content: {
    paddingHorizontal: panelTheme.spacing.xl,
    paddingTop: panelTheme.spacing.xl,
    paddingBottom: panelTheme.spacing.xxl
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: panelTheme.spacing.md,
    marginBottom: panelTheme.spacing.lg
  },
  headerText: {
    flex: 1
  },
  brand: {
    fontFamily: panelTheme.typography.body,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    color: panelTheme.colors.primary,
    textTransform: 'uppercase',
    marginBottom: 6
  },
  title: {
    fontFamily: panelTheme.typography.heading,
    fontSize: 28,
    fontWeight: '900',
    color: panelTheme.colors.text,
    letterSpacing: -0.4,
    lineHeight: 34
  },
  subtitle: {
    marginTop: 6,
    fontFamily: panelTheme.typography.body,
    fontSize: 14,
    fontWeight: '500',
    color: panelTheme.colors.textSoft,
    lineHeight: 20
  },
  roleBadge: {
    borderWidth: 1,
    borderRadius: 999,
    backgroundColor: panelTheme.colors.surface,
    paddingHorizontal: panelTheme.spacing.md,
    paddingVertical: 8,
    alignSelf: 'flex-start'
  },
  roleBadgeText: {
    fontFamily: panelTheme.typography.body,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase'
  },
  headerRight: {
    marginBottom: panelTheme.spacing.md
  }
});
