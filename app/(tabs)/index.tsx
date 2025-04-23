import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
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

interface Category {
  id: string;
  name: string;
  image: any; // Using any for require() image source
}

const categories: Category[] = [
  { id: '1', name: 'Residential', image: require('../../assets/images/residential.jpg') },
  { id: '2', name: 'Commercial', image: require('../../assets/images/commercial.jpg') },
  { id: '3', name: 'FarmHouse/Villas', image: require('../../assets/images/villa-background.jpg') },
];

// const featuredProperties: Property[] = [
//   {
//     property_id: '1',
//     created_at: new Date().toISOString(),
//     image: '../../assets/images/modern-house.jpg',
//     location: 'Bangalore, Karnataka',
//     price: 30000,
//     area: 1200,
//     contact: '+1 (555) 123-4567',
//     category: 'House'
//   },
//   {
//     property_id: '2',
//     created_at: new Date().toISOString(),
//     image: '../../assets/images/luxury-villa.jpg',
//     location: 'Mumbai, Maharashtra',
//     price: 45000,
//     area: 2100,
//     contact: '+1 (555) 234-5678',
//     category: 'Villa'
//   },
//   {
//     property_id: '3',
//     created_at: new Date().toISOString(),
//     image: '../../assets/images/penthouse.jpg',
//     location: 'Delhi, NCR',
//     price: 65000,
//     area: 2800,
//     contact: '+1 (555) 345-6789',
//     category: 'Penthouse'
//   },
//   {
//     property_id: '4',
//     created_at: new Date().toISOString(),
//     image: '../../assets/images/sea-view.jpg',
//     location: 'Chennai, Tamil Nadu',
//     price: 35000,
//     area: 1100,
//     contact: '+1 (555) 456-7890',
//     category: 'Apartment'
//   },
//   {
//     property_id: '5',
//     created_at: new Date().toISOString(),
//     image: '../../assets/images/elegant-house.jpg',
//     location: 'Pune, Maharashtra',
//     price: 40000,
//     area: 1800,
//     contact: '+1 (555) 567-8901',
//     category: 'House'
//   }
// ];

const mockProperties: Property[] = [
  {
    property_id: '1',
    created_at: new Date().toISOString(),
    image: 'https://example.com/house1.jpg',
    location: '123 Main St, City',
    price: 450000,
    area: 2500,
    contact: '+1 (555) 123-4567',
    category: 'House'
  },
  {
    property_id: '2',
    created_at: new Date().toISOString(),
    image: 'https://example.com/house2.jpg',
    location: '456 Oak Ave, Town',
    price: 350000,
    area: 1800,
    contact: '+1 (555) 987-6543',
    category: 'Apartment'
  },
  // Add more mock properties as needed
];

// Custom property item component to handle image loading
function PropertyItem({ item }: { item: Property }) {
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
            imageSource = require('../../assets/images/modern-house.jpg');
            break;
          case 'luxury-villa':
            imageSource = require('../../assets/images/luxury-villa.jpg');
            break;
          case 'penthouse':
            imageSource = require('../../assets/images/penthouse.jpg');
            break;
          case 'sea-view':
            imageSource = require('../../assets/images/sea-view.jpg');
            break;
          case 'elegant-house':
            imageSource = require('../../assets/images/elegant-house.jpg');
            break;
          default:
            imageSource = require('../../assets/images/modern-house.jpg');
        }
      } else {
        imageSource = require('../../assets/images/modern-house.jpg');
      }
    } else {
      // If item.image is already a require statement
      imageSource = item.image;
    }
  } catch (error) {
    imageSource = require('../../assets/images/modern-house.jpg');
  }

  const toggleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to save favorites');
        return;
      }

      if (isLiked) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .match({ user_id: user.id, property_id: item.property_id });

        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert([
            { user_id: user.id, property_id: item.property_id }
          ]);

        if (error) throw error;
      }

      setIsLiked(!isLiked);
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

export default function TabOneScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

  useEffect(() => {
    fetchUserName();
    fetchProperties();
  }, []);

  useEffect(() => {
    // Filter properties whenever searchQuery changes
    if (searchQuery.trim() === '') {
      setFilteredProperties(properties);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = properties.filter(property => 
        property.location.toLowerCase().includes(query) ||
        property.category.toLowerCase().includes(query)
      );
      setFilteredProperties(filtered);
    }
  }, [searchQuery, properties]);

  const fetchUserName = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        // Try to get user's full name from profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (data?.full_name) {
          const firstName = data.full_name.split(' ')[0];
          setUserName(firstName);
        } else if (user.user_metadata?.full_name) {
          // Fallback to user metadata if profile not found
          const firstName = user.user_metadata.full_name.split(' ')[0];
          setUserName(firstName);
        } else {
          // Final fallback to email
          setUserName(user.email?.split('@')[0] || 'User');
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserName('User');
    }
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('property')
        .select('*');

      if (error) throw error;
      setProperties(data || []);
      setFilteredProperties(data || []); // Initialize filtered properties
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryItem = ({ item }: { item: Category }) => {
    return (
      <TouchableOpacity 
        style={styles.categoryCard}
        onPress={() => {
          // @ts-ignore - expo-router typing issue
          router.push({
            pathname: "/category/[name]",
            params: { name: item.name }
          });
        }}
      >
        <Image source={item.image} style={styles.categoryIcon} resizeMode="cover" />
        <Text style={styles.categoryName}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderPropertyItem = ({ item }: { item: Property }) => {
    // Just return the PropertyItem component
    return <PropertyItem item={item} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <Image 
            source={require('../../assets/images/profile.jpg')}
            style={styles.profileImage}
          />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search here..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
        </View>

        

        <View style={[styles.sectionContainer, styles.dealsSection]}>
          <Text style={styles.sectionTitle}>Properties for you</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#B87A3B" style={styles.loader} />
          ) : filteredProperties.length === 0 ? (
            <View style={styles.noPropertiesContainer}>
              <Text style={styles.noPropertiesText}>No properties found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProperties}
              renderItem={renderPropertyItem}
              keyExtractor={(item) => `property-${item.property_id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dealsContainer}
            />
          )}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Categories for you...</Text>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => `category-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          />
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#F8E8FF',
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    color: '#000000',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 5,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F8E8FF',
  },
  searchInput: {
    backgroundColor: '#EEEEF6',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
  },
  categoriesContainer: {
    paddingBottom: 10,
  },
  categoryCard: {
    marginRight: 20,
    width: 120,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 120,
    height: 120,
    borderRadius: 15,
    marginBottom: 8,
  },
  categoryName: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  dealsContainer: {
    paddingRight: 20,
  },
  dealsSection: {
    paddingBottom: 0,
  },
  bottomSpacing: {
    height: 100,
  },
  dealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginLeft: 20,
    width: 300,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  imageContainer: {
    position: 'relative',
  },
  dealImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  priceTag: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#B87A3B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
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
  loader: {
    marginTop: 20,
  },
  noPropertiesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  noPropertiesText: {
    fontSize: 16,
    color: '#6B7280',
  },
  imageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    zIndex: 1,
  },
  errorImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorImageText: {
    fontSize: 48,
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
});
