import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native-web';

import { panelTheme, panelToneToColor } from '../theme/panelTheme';
import type { PanelRole, PanelTab } from '../types/panel';

type PanelTabBarProps = {
  tabs: PanelTab[];
  activeKey: string;
  onChange: (key: string) => void;
  role: PanelRole;
};

export function PanelTabBar({ tabs, activeKey, onChange, role }: PanelTabBarProps) {
  const activeColor = panelToneToColor[role];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[
              styles.tab,
              active && {
                borderColor: activeColor,
                backgroundColor: activeColor
              }
            ]}
          >
            <View style={styles.tabContent}>
              {tab.emoji ? <Text style={[styles.emoji, active && styles.activeText]}>{tab.emoji}</Text> : null}
              <Text style={[styles.label, active && styles.activeText]}>{tab.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: panelTheme.spacing.sm,
    paddingHorizontal: panelTheme.spacing.xl,
    gap: 8
  },
  tab: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: panelTheme.colors.border,
    backgroundColor: panelTheme.colors.surface,
    paddingHorizontal: panelTheme.spacing.md,
    paddingVertical: 10,
    marginRight: 8
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  emoji: {
    fontSize: 14
  },
  label: {
    fontFamily: panelTheme.typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: panelTheme.colors.textSoft
  },
  activeText: {
    color: '#FFFFFF'
  }
});
