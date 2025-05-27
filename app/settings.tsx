import React from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity, Linking } from "react-native";
import { useTheme } from './theme/ThemeContext';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Display Preferences Section */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Display Preferences
        </Text>
        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>
            Dark Mode
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#ddd', true: theme.primary }}
            thumbColor={'white'}
          />
        </View>
      </View>

      {/* App Information Section */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          App Information
        </Text>
        <View style={[styles.infoItem, { borderBottomColor: theme.background }]}>
          <Text style={[styles.infoLabel, { color: theme.text }]}>Version</Text>
          <Text style={[styles.infoValue, { color: theme.text }]}>1.1.0</Text>
        </View>
        <View style={[styles.infoItem, { borderBottomColor: theme.background }]}>
          <Text style={[styles.infoLabel, { color: theme.text }]}>Developer</Text>
          <Text style={[styles.infoValue, { color: theme.text }]}>ESalas</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.link}
          onPress={() => Linking.openURL('mailto:esalas1@ssct.edu.ph')}
        >
          <Text style={[styles.linkText, { color: theme.primary }]}>
            Contact Developer
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
  },
  link: {
    paddingVertical: 12,
    marginTop: 4,
  },
  linkText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
