import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

interface Notification {
  notification_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  tender_id: string;
  bid_id: string;
}

export default function AccountScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchUserData();
    fetchNotifications();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const fullName = user.user_metadata?.full_name || '';
        const firstName = fullName.split(' ')[0] || 'User';
        setUserData({
          email: user.email,
          firstName: firstName,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }
      setNotifications(data || []);
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserData(), fetchNotifications()]);
    setRefreshing(false);
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('notification_id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }
      
      // Update local state optimistically
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.notification_id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error in markNotificationAsRead:', error);
    }
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      action: () => router.push('/profile'),
    },
    {
      icon: 'add-circle-outline',
      title: 'List Your Own Properties',
      action: () => router.push('/(tabs)/listing'),
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      action: () => router.push('/notifications'),
    },
    {
      icon: 'settings-outline',
      title: 'Settings',
      action: () => router.push('/settings'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      action: () => router.push('/support'),
    },
    {
      icon: 'information-circle-outline',
      title: 'About Us',
      action: () => router.push('/about'),
    },
  ];

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#B87A3B" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#B87A3B']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
      </View>

      <View style={styles.profileSection}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200' }}
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{userData.firstName}</Text>
          <Text style={styles.email}>{userData.email}</Text>
        </View>
      </View>

      {notifications.length > 0 && (
        <View style={styles.notificationsSection}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          {notifications.slice(0, 3).map((notification) => (
            <TouchableOpacity
              key={notification.notification_id}
              style={[
                styles.notificationItem,
                notification.read && styles.notificationRead
              ]}
              onPress={() => {
                markNotificationAsRead(notification.notification_id);
                if (notification.type.includes('tender')) {
                  router.push(`/tender/${notification.tender_id}`);
                }
              }}
            >
              <View style={styles.notificationIcon}>
                <Ionicons 
                  name={notification.type.includes('tender') ? 'document-text' : 'notifications'} 
                  size={24} 
                  color="#B87A3B" 
                />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationDate}>
                  {formatDate(notification.created_at)}
                </Text>
              </View>
              {!notification.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
          {notifications.length > 3 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push('/notifications')}
            >
              <Text style={styles.viewAllText}>View All Notifications</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.menuSection}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.menuItem}
            onPress={item.action}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon as any} size={24} color="#666" />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Ionicons name="log-out-outline" size={24} color="#ff4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  notificationsSection: {
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  notificationRead: {
    opacity: 0.7,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 12,
    color: '#666',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B87A3B',
    marginLeft: 8,
  },
  viewAllButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF5EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  viewAllText: {
    color: '#B87A3B',
    fontSize: 14,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  signOutText: {
    fontSize: 16,
    color: '#ff4444',
    fontWeight: '600',
    marginLeft: 8,
  },
}); 