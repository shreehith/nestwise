import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

interface Settings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  darkMode: boolean;
  language: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({
    pushNotifications: true,
    emailNotifications: true,
    darkMode: false,
    language: 'English',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          pushNotifications: data.push_notifications,
          emailNotifications: data.email_notifications,
          darkMode: data.dark_mode,
          language: data.language,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateSetting = async (key: keyof Settings, value: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          [key]: value,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const renderSettingItem = (
    title: string,
    key: keyof Settings,
    type: 'switch' | 'select' = 'switch'
  ) => (
    <View style={styles.settingItem}>
      <Text style={styles.settingTitle}>{title}</Text>
      {type === 'switch' ? (
        <Switch
          value={settings[key] as boolean}
          onValueChange={(value) => updateSetting(key, value)}
          trackColor={{ false: '#767577', true: '#B87A3B' }}
          thumbColor={settings[key] ? '#fff' : '#f4f3f4'}
        />
      ) : (
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => {
            // Handle language selection
            Alert.alert(
              'Select Language',
              'Choose your preferred language',
              [
                { text: 'English', onPress: () => updateSetting(key, 'English') },
                { text: 'Spanish', onPress: () => updateSetting(key, 'Spanish') },
                { text: 'French', onPress: () => updateSetting(key, 'French') },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
        >
          <Text style={styles.selectButtonText}>{settings[key]}</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        {renderSettingItem('Push Notifications', 'pushNotifications')}
        {renderSettingItem('Email Notifications', 'emailNotifications')}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        {renderSettingItem('Dark Mode', 'darkMode')}
        {renderSettingItem('Language', 'language', 'select')}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/profile')}
        >
          <Ionicons name="person-outline" size={24} color="#B87A3B" />
          <Text style={styles.buttonText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#ff4444" />
          <Text style={[styles.buttonText, styles.logoutText]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#F8E8FF',
    marginTop: 44,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    padding: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  buttonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#ff4444',
  },
}); 