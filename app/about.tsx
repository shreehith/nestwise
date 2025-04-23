import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>About Us</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Welcome to NestWise</Text>
          <Text style={styles.description}>
            NestWise is your trusted partner in finding the perfect property. We
            connect buyers and sellers in a seamless, efficient, and secure
            environment. Our mission is to make property transactions simple,
            transparent, and hassle-free.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Features</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="home-outline" size={24} color="#B87A3B" />
              <Text style={styles.featureText}>Extensive Property Listings</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="search-outline" size={24} color="#B87A3B" />
              <Text style={styles.featureText}>Advanced Search Filters</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="heart-outline" size={24} color="#B87A3B" />
              <Text style={styles.featureText}>Save Favorite Properties</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="chatbubble-outline" size={24} color="#B87A3B" />
              <Text style={styles.featureText}>Direct Communication</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleLinkPress('mailto:support@nestwise.com')}
          >
            <Ionicons name="mail-outline" size={24} color="#B87A3B" />
            <Text style={styles.contactText}>support@nestwise.com</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleLinkPress('tel:+919032169310')}
          >
            <Ionicons name="call-outline" size={24} color="#B87A3B" />
            <Text style={styles.contactText}>+91 9032169310</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleLinkPress('https://wa.me/9032169310')}
          >
            <Ionicons name="logo-whatsapp" size={24} color="#B87A3B" />
            <Text style={styles.contactText}>WhatsApp Support</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Follow Us</Text>
          <View style={styles.socialLinks}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleLinkPress('https://facebook.com/nestwise')}
            >
              <Ionicons name="logo-facebook" size={24} color="#B87A3B" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleLinkPress('https://twitter.com/nestwise')}
            >
              <Ionicons name="logo-twitter" size={24} color="#B87A3B" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleLinkPress('https://instagram.com/nestwise')}
            >
              <Ionicons name="logo-instagram" size={24} color="#B87A3B" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.copyright}>
            © 2024 NestWise. All rights reserved.
          </Text>
        </View>
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
  content: {
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  featureList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  contactText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  version: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 14,
    color: '#666',
  },
}); 