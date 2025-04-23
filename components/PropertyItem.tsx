import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';

interface Property {
  property_id: string;
  created_at: string;
  image: string;
  location: string;
  price: number;
  area: number;
  contact: string;
  category: string;
}

interface PropertyItemProps {
  item: Property;
  onFavoriteChange?: () => void;
}

export default function PropertyItem({ item, onFavoriteChange }: PropertyItemProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  let imageSource;
  try {
    if (typeof item.image === 'string') {
      if (item.image.startsWith('http')) {
        imageSource = { uri: item.image };
      } else if (item.image.includes('assets/images')) {
        // Handle local image paths
        const imageName = item.image.split('/').pop()?.split('.')[0];
        switch (imageName) {
          case 'modern-house':
            imageSource = require('../assets/images/modern-house.jpg');
            break;
          case 'luxury-villa':
            imageSource = require('../assets/images/luxury-villa.jpg');
            break;
          case 'penthouse':
            imageSource = require('../assets/images/penthouse.jpg');
            break;
          case 'sea-view':
            imageSource = require('../assets/images/sea-view.jpg');
            break;
          case 'elegant-house':
            imageSource = require('../assets/images/elegant-house.jpg');
            break;
          default:
            imageSource = require('../assets/images/modern-house.jpg');
        }
      } else {
        imageSource = require('../assets/images/modern-house.jpg');
      }
    } else {
      imageSource = item.image;
    }
  } catch (error) {
    imageSource = require('../assets/images/modern-house.jpg');
  }

  const toggleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to save favorites');
        return;
      }

      if (isLiked) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .match({ user_id: user.id, property_id: item.property_id });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([
            { user_id: user.id, property_id: item.property_id }
          ]);

        if (error) throw error;
      }

      setIsLiked(!isLiked);
      onFavoriteChange?.();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorites');
    }
  };

  useEffect(() => {
    const checkIfLiked = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('favorites')
            .select()
            .match({ user_id: user.id, property_id: item.property_id })
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error checking favorite status:', error);
          }
          setIsLiked(!!data);
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkIfLiked();
  }, [item.property_id]);

  return (
    <TouchableOpacity 
      style={styles.dealCard}
      onPress={() => router.push(`/property/${item.property_id}`)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={styles.dealImage}
          onError={() => setImageError(true)}
        />
        
        {imageError && (
          <View style={[styles.dealImage, styles.errorImageContainer]}>
            <Text style={styles.errorImageText}>🏠</Text>
          </View>
        )}
        
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>₹{item.price.toLocaleString('en-IN')}</Text>
        </View>

        <TouchableOpacity 
          style={styles.likeButton}
          onPress={toggleLike}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={isLiked ? "#ff4444" : "#ffffff"} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.propertyInfo}>
        <Text style={styles.locationText}>{item.location}</Text>
        <Text style={styles.areaText}>{item.area} sq ft</Text>
        <Text style={styles.categoryText}>{item.category}</Text>
        <Text style={styles.contactText}>Contact: {item.contact}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  dealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 8,
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
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  dealImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  errorImageContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorImageText: {
    fontSize: 48,
  },
  priceTag: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  likeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
  },
  propertyInfo: {
    padding: 12,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  areaText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
  },
}); 