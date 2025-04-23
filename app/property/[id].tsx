import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { LineChart } from 'react-native-chart-kit';

interface Property {
  property_id: string;
  created_at: string;
  image: string;
  location: string;
  price: number;
  area: number;
  description: string;
  bhk: number;
  baths: number;
  Details: string;
  amenities: string[];
  category: string;
  contact?: string;
}

const AMENITIES_OPTIONS = [
  { id: 1, name: 'Gymnasium', icon: '🏋️' },
  { id: 2, name: 'Club House', icon: '🏠' },
  { id: 3, name: "Children's Play Area", icon: '🎮' },
  { id: 4, name: 'Amphitheatre', icon: '🎭' },
  { id: 5, name: 'Jogging Track', icon: '🏃' },
  { id: 6, name: 'Badminton Court', icon: '🏸' },
  { id: 7, name: 'Basketball Court', icon: '🏀' },
  { id: 8, name: 'Skating Rink', icon: '⛸️' },
  { id: 9, name: 'Swimming Pool', icon: '🏊' },
  { id: 10, name: 'Tennis Court', icon: '🎾' },
  { id: 11, name: 'Yoga Center', icon: '🧘' },
  { id: 12, name: 'Library', icon: '📚' },
  { id: 13, name: 'Party Hall', icon: '🎉' },
  { id: 14, name: 'Garden', icon: '🌳' },
  { id: 15, name: 'Security', icon: '👮' },
  { id: 16, name: 'Power Backup', icon: '🔋' },
  { id: 17, name: 'Parking', icon: '🅿️' },
  { id: 18, name: 'Elevator', icon: '🛗' },
  { id: 19, name: 'Indoor Games', icon: '🎲' },
  { id: 20, name: 'Fire Safety', icon: '🧯' },
  { id: 21, name: 'CCTV Surveillance', icon: '📹' },
  { id: 22, name: 'Visitor Parking', icon: '🚗' },
  { id: 23, name: 'Rain Water Harvesting', icon: '💧' },
  { id: 24, name: 'Senior Citizen Area', icon: '👴' },
  { id: 25, name: 'Pet Area', icon: '🐕' },
];

const calculateGrowthRate = (location: string, category: string) => {
  if (category === 'Commercial') return 20;
  const locationLower = location.toLowerCase();
  if (locationLower.includes('hyderabad')) return 13;
  if (locationLower.includes('mumbai') || locationLower.includes('navi mumbai')) return 15;
  if (locationLower.includes('delhi')) return 12;
  if (locationLower.includes('bengaluru')) return 18;
  return 9; // Default growth rate for other locations
};

const generateGrowthData = (location: string, category: string) => {
  const growthRate = calculateGrowthRate(location, category);
  const years = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
  const data = years.map(year => {
    if (year === 0) return 0; // Set "Now" to 0%
    const growth = Math.pow(1 + growthRate/100, year) - 1;
    return Math.round(growth * 100);
  });
  return data;
};

export default function PropertyDetailsScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'buy' | 'rent' | 'lease'>('buy');

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }
    fetchPropertyDetails();
    checkIfLiked();
  }, [id]);

  useEffect(() => {
    if (property) {
      checkIfOwner();
    }
  }, [property]);

  const fetchPropertyDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('property')
        .select('*, created_by')
        .eq('property_id', id)
        .single();

      if (error) throw error;
      console.log('Fetched property:', data);
      setProperty(data);
    } catch (error) {
      console.error('Error fetching property details:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfLiked = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('favorites')
          .select()
          .match({ user_id: user.id, property_id: id })
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

  const checkIfOwner = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.id);
      console.log('Property created_by:', property?.created_by);
      
      if (user && property) {
        const isPropertyOwner = user.id === property.created_by;
        console.log('Is owner?', isPropertyOwner);
        setIsOwner(isPropertyOwner);
      }
    } catch (error) {
      console.error('Error checking ownership:', error);
    }
  };

  const toggleLike = async () => {
    try {
      setLikeLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Sign In Required', 'Please sign in to save favorites');
        return;
      }

      if (isLiked) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .match({ user_id: user.id, property_id: id });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([
            { user_id: user.id, property_id: id }
          ]);

        if (error) throw error;
      }

      setIsLiked(!isLiked);
      Alert.alert(
        isLiked ? 'Removed from Favorites' : 'Added to Favorites',
        isLiked ? 'Property removed from your favorites' : 'Property added to your favorites'
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleContact = async () => {
    if (!showContact) {
      setShowContact(true);
      return;
    }

    if (property?.contact) {
      const phoneNumber = property.contact.replace(/\s/g, '');
      const url = Platform.select({
        ios: `tel:${phoneNumber}`,
        android: `tel:${phoneNumber}`
      });

      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to make phone call');
        }
      } catch (error) {
        console.error('Error making phone call:', error);
        Alert.alert('Error', 'Failed to make phone call');
      }
    }
  };

  const handleDeList = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to de-list a property');
        return;
      }

      if (user.id !== property?.created_by) {
        Alert.alert('Error', 'You can only de-list your own properties');
        return;
      }

      Alert.alert(
        'Confirm De-listing',
        'Are you sure you want to de-list this property? This action cannot be undone.',
        [
          {
            text: 'No',
            style: 'cancel'
          },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from('property')
                  .delete()
                  .eq('property_id', id);

                if (error) throw error;

                Alert.alert(
                  'Success',
                  'Property has been de-listed successfully',
                  [
                    {
                      text: 'OK',
                      onPress: () => router.back()
                    }
                  ]
                );
              } catch (error) {
                console.error('Error de-listing property:', error);
                Alert.alert('Error', 'Failed to de-list property. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleDeList:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const calculateRent = (price: number) => {
    // Rent is 4% of total price per year
    return price * 0.04;
  };

  const calculateLease = (price: number) => {
    // Lease is 4% of total price per year
    return price * 0.04;
  };

  const renderImage = () => {
    let imageSource;
    try {
      if (property?.image) {
        if (typeof property.image === 'string') {
          if (property.image.startsWith('http')) {
            imageSource = { uri: property.image };
          } else if (property.image.includes('assets/images')) {
            // Handle local image paths
            const imageName = property.image.split('/').pop()?.split('.')[0];
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
          }
        }
      }
      return (
        <View style={styles.imageContainer}>
          <Image
            source={imageSource}
            style={styles.propertyImage}
            resizeMode="cover"
          />
          {imageError && (
            <View style={[styles.propertyImage, styles.errorImageContainer]}>
              <Text style={styles.errorImageText}>🏠</Text>
            </View>
          )}
        </View>
      );
    } catch (error) {
      console.error('Error loading image:', error);
      return (
        <View style={[styles.propertyImage, styles.errorImageContainer]}>
          <Text style={styles.errorImageText}>🏠</Text>
        </View>
      );
    }
  };

  const renderAmenities = () => {
    if (!property?.amenities || property.amenities.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Property Amenities</Text>
        <View style={styles.amenitiesContainer}>
          {property.amenities.map((amenity, index) => {
            const amenityOption = AMENITIES_OPTIONS.find(a => a.name === amenity);
            return (
              <View key={index} style={styles.amenityItem}>
                <View style={styles.amenityIconContainer}>
                  <Text style={styles.amenityIcon}>{amenityOption?.icon || '🏠'}</Text>
                </View>
                <Text numberOfLines={2} style={styles.amenityText}>{amenity}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B87A3B" />
        <Text style={styles.loadingText}>Loading property details...</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#666" />
        <Text style={styles.errorText}>Property not found</Text>
        <TouchableOpacity 
          style={styles.backButtonError} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {renderImage()}

        <View style={styles.contentContainer}>
          {/* Breadcrumb Navigation */}
          <View style={styles.breadcrumb}>
            <Text style={styles.breadcrumbText}>Home</Text>
            <Text style={styles.breadcrumbSeparator}> › </Text>
            <Text style={styles.breadcrumbText}>Projects in {property.location.split(',')[1]}</Text>
            <Text style={styles.breadcrumbSeparator}> › </Text>
            <Text style={styles.breadcrumbText}>{property.location.split(',')[0]}</Text>
          </View>

          {/* Property Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.propertyTitle}>{property.location.split(',')[0]}</Text>
            <TouchableOpacity 
              onPress={toggleLike}
              disabled={likeLoading}
              style={styles.likeButton}
            >
              {likeLoading ? (
                <ActivityIndicator size="small" color="#ff4444" />
              ) : (
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isLiked ? "#ff4444" : "#666"} 
                />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.locationText}>{property.location}</Text>

          {/* Badges */}
          <View style={styles.badgesContainer}>
            {property.rera_approved && (
              <View style={[styles.badge, styles.reraBadge]}>
                <Text style={styles.badgeText}>RERA ✓</Text>
              </View>
            )}
            {!property.brokerage && (
              <View style={[styles.badge, styles.brokerageBadge]}>
                <Text style={styles.badgeText}>No Brokerage</Text>
              </View>
            )}
            {property.floor_plans && (
              <View style={[styles.badge, styles.plansBadge]}>
                <Text style={styles.badgeText}>3D Floor Plans Available</Text>
              </View>
            )}
          </View>

          {/* Price Range */}
          <View style={styles.priceSection}>
            <View style={styles.priceOptions}>
              <TouchableOpacity 
                style={[styles.priceOption, styles.selectedOption]}
                onPress={() => setSelectedOption('buy')}
              >
                <Text style={styles.priceOptionText}>Buy</Text>
                <Text style={styles.priceAmount}>
                  ₹{(property.price / 100000).toFixed(2)} Lakhs
                </Text>
                <Text style={styles.chargesText}>+ Govt. Charges</Text>
              </TouchableOpacity>

              {property.category !== 'Commercial' && (
                <TouchableOpacity 
                  style={styles.priceOption}
                  onPress={() => setSelectedOption('rent')}
                >
                  <Text style={styles.priceOptionText}>Rent</Text>
                  <Text style={styles.priceAmount}>
                    ₹{(calculateRent(property.price) / 100000).toFixed(2)} Lakhs/year
                  </Text>
                  <Text style={styles.chargesText}>+ Maintenance</Text>
                </TouchableOpacity>
              )}

              {property.category === 'Commercial' && (
                <TouchableOpacity 
                  style={styles.priceOption}
                  onPress={() => setSelectedOption('lease')}
                >
                  <Text style={styles.priceOptionText}>Lease</Text>
                  <Text style={styles.priceAmount}>
                    ₹{(calculateLease(property.price) / 100000).toFixed(2)} Lakhs/year
                  </Text>
                  <Text style={styles.chargesText}>+ Maintenance</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Configuration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {property.category !== 'Commercial' ? `${property.bhk} BHK ${property.category}` : property.category}
            </Text>
            <View style={styles.configContainer}>
              <View style={styles.configItem}>
                <Text style={styles.configValue}>{property.area}</Text>
                <Text style={styles.configLabel}>Sq.ft</Text>
              </View>
              {property.category !== 'Commercial' && (
                <>
                  <View style={styles.configItem}>
                    <Text style={styles.configValue}>{property.bhk}</Text>
                    <Text style={styles.configLabel}>Beds</Text>
                  </View>
                  <View style={styles.configItem}>
                    <Text style={styles.configValue}>{property.baths}</Text>
                    <Text style={styles.configLabel}>Baths</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Description */}
          {property.Details && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{property.Details}</Text>
            </View>
          )}

          {/* Price Growth Graph */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Growth Analysis</Text>
            <View style={styles.graphContainer}>
              <LineChart
                data={{
                  labels: ['-5Y', '-4Y', '-3Y', '-2Y', '-1Y', 'Now', '+1Y', '+2Y', '+3Y', '+4Y', '+5Y'],
                  datasets: [{
                    data: generateGrowthData(property.location, property.category)
                  }]
                }}
                width={Dimensions.get('window').width - 32}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(184, 122, 59, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#B87A3B'
                  },
                  formatYLabel: (value) => `${value}%`
                }}
                bezier
                style={styles.chart}
                fromZero
              />
              <Text style={styles.graphNote}>
                Based on historical growth rate of {calculateGrowthRate(property.location, property.category)}% per year
                {property.category === 'Commercial' ? ' (Commercial Property)' : ''}
              </Text>
              
              {/* Projected Growth Table */}
              <View style={styles.growthTable}>
                <Text style={styles.growthTableTitle}>Projected Growth After 5 Years</Text>
                <View style={styles.growthTableRow}>
                  <Text style={styles.growthTableLabel}>
                    {property.category === 'Commercial' ? 'Commercial Property' : 
                     property.location.toLowerCase().includes('bengaluru') ? 'Bengaluru Property' :
                     property.location.toLowerCase().includes('mumbai') || property.location.toLowerCase().includes('navi mumbai') ? 'Mumbai/Navi Mumbai Property' :
                     property.location.toLowerCase().includes('hyderabad') ? 'Hyderabad Property' :
                     property.location.toLowerCase().includes('delhi') ? 'Delhi Property' :
                     'Property in Other Location'}:
                  </Text>
                  <Text style={styles.growthTableValue}>
                    {Math.round((Math.pow(1 + calculateGrowthRate(property.location, property.category)/100, 5) - 1) * 100)}%
                  </Text>
                </View>
                <Text style={styles.growthTableNote}>
                  Based on historical growth rate of {calculateGrowthRate(property.location, property.category)}% per year
                </Text>
              </View>
            </View>
          </View>

          {/* Amenities */}
          {renderAmenities()}

          {/* Contact and De-list Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.contactButton,
                showContact && styles.contactButtonActive
              ]}
              onPress={handleContact}
            >
              {showContact ? (
                <View style={styles.contactInfo}>
                  <Ionicons name="call" size={20} color="#fff" style={styles.contactIcon} />
                  <Text style={styles.contactButtonText}>
                    {property?.contact || 'No contact available'}
                  </Text>
                </View>
              ) : (
                <View style={styles.contactInfo}>
                  <Ionicons name="eye" size={20} color="#fff" style={styles.contactIcon} />
                  <Text style={styles.contactButtonText}>View Number</Text>
                </View>
              )}
            </TouchableOpacity>

            {isOwner && (
              <TouchableOpacity 
                style={styles.deListButton}
                onPress={handleDeList}
              >
                <View style={styles.contactInfo}>
                  <Ionicons name="trash-outline" size={20} color="#fff" style={styles.contactIcon} />
                  <Text style={styles.contactButtonText}>De-list Property</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Debug information - remove in production */}
          {__DEV__ && (
            <View style={styles.debugInfo}>
              <Text>Debug Info:</Text>
              <Text>Is Owner: {isOwner ? 'Yes' : 'No'}</Text>
              <Text>Property ID: {id}</Text>
              <Text>Created By: {property?.created_by}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    width: '100%',
    backgroundColor: '#f0f0f0',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  errorImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  errorImageText: {
    fontSize: 48,
  },
  contentContainer: {
    padding: 16,
  },
  breadcrumb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#666',
  },
  breadcrumbSeparator: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  reraBadge: {
    backgroundColor: '#E8F5E9',
  },
  brokerageBadge: {
    backgroundColor: '#F5F5F5',
  },
  plansBadge: {
    backgroundColor: '#E3F2FD',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  constructionStatus: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  completionDate: {
    fontSize: 14,
    color: '#666',
  },
  priceSection: {
    marginBottom: 24,
  },
  priceOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  priceOption: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#FFF5EB',
    borderColor: '#B87A3B',
  },
  priceOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#B87A3B',
    marginBottom: 4,
  },
  chargesText: {
    fontSize: 12,
    color: '#666',
  },
  configContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
  },
  configItem: {
    alignItems: 'center',
  },
  configValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  configLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  amenityItem: {
    width: '33.33%', // 3 items per row
    alignItems: 'center',
    marginBottom: 20,
  },
  amenityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  amenityIcon: {
    fontSize: 24,
  },
  amenityText: {
    fontSize: 12,
    color: '#4A5568',
    textAlign: 'center',
    paddingHorizontal: 4,
    maxWidth: '100%',
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 24,
    gap: 12,
  },
  contactButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deListButton: {
    backgroundColor: '#DC3545',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactButtonActive: {
    backgroundColor: '#28A745',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactIcon: {
    marginRight: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
    marginBottom: 24,
  },
  backButtonError: {
    backgroundColor: '#B87A3B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  likeButton: {
    padding: 8,
    marginLeft: 8,
  },
  debugInfo: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    marginTop: 16,
    borderRadius: 8,
  },
  graphContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  graphNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  growthTable: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  growthTableTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  growthTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  growthTableLabel: {
    fontSize: 12,
    color: '#666',
  },
  growthTableValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B87A3B',
  },
  growthTableNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
}); 