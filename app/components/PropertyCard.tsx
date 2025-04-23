import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Property {
  property_id: string;
  image: string;
  location: string;
  price: number;
  area: number;
  category: string;
}

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const router = useRouter();

  const getImageSource = () => {
    try {
      if (property.image) {
        if (typeof property.image === 'string') {
          if (property.image.startsWith('http')) {
            return { uri: property.image };
          } else if (property.image.includes('assets/images')) {
            const imageName = property.image.split('/').pop()?.split('.')[0];
            switch (imageName) {
              case 'modern-house':
                return require('../../assets/images/modern-house.jpg');
              case 'luxury-villa':
                return require('../../assets/images/luxury-villa.jpg');
              case 'penthouse':
                return require('../../assets/images/penthouse.jpg');
              case 'sea-view':
                return require('../../assets/images/sea-view.jpg');
              case 'elegant-house':
                return require('../../assets/images/elegant-house.jpg');
              default:
                return require('../../assets/images/modern-house.jpg');
            }
          }
        }
      }
      return require('../../assets/images/modern-house.jpg');
    } catch (error) {
      return require('../../assets/images/modern-house.jpg');
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/property/${property.property_id}`)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={getImageSource()}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>₹{property.price.toLocaleString('en-IN')}</Text>
        </View>
      </View>
      
      <View style={styles.detailsContainer}>
        <Text style={styles.location} numberOfLines={1}>
          {property.location}
        </Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="expand-outline" size={16} color="#666" />
            <Text style={styles.statText}>{property.area} sq ft</Text>
          </View>
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryText}>{property.category}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  priceTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#B87A3B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsContainer: {
    padding: 12,
  },
  location: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 14,
  },
  categoryContainer: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
}); 