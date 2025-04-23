import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

interface Property {
  property_id: number;
  location: string;
  price: number;
  area: number;
  contact: string;
  category: string;
  image: string;
  created_at: string;
  created_by: string;
  amenities: string[];
  bhk?: number;
  baths?: number;
  Details: string;
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

export default function ListingScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('add'); // 'add' or 'my'
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [contact, setContact] = useState('');
  const [category, setCategory] = useState<'Residential' | 'Commercial' | 'FarmHouse/Villas'>('Residential');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showAmenitiesDropdown, setShowAmenitiesDropdown] = useState(false);
  const [bhk, setBhk] = useState<number>(1);
  const [baths, setBaths] = useState<number>(1);
  const [description, setDescription] = useState('');

  const showAdditionalOptions = category !== 'Commercial';

  // Fetch user's properties
  const fetchMyProperties = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please sign in to view your properties');
        return;
      }

      const { data, error } = await supabase
        .from('property')
        .select('*')
        .eq('created_by', user.id)  // Filter by the current user's ID
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      Alert.alert('Error', 'Failed to fetch your properties');
    }
  };

  useEffect(() => {
    if (activeTab === 'my') {
      fetchMyProperties();
    }
  }, [activeTab]);

  const validateImageUrl = (url: string) => {
    if (!url) return false;
    try {
      const urlObject = new URL(url);
      return urlObject.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const validatePhoneNumber = (number: string) => {
    const indianPhonePattern = /^(\+91[\-\s]?)?[0-9]{10}$/;
    return indianPhonePattern.test(number);
  };

  const formatPhoneNumber = (number: string) => {
    // Remove any non-digit characters
    const digits = number.replace(/\D/g, '');
    
    // If number doesn't start with +91, add it
    if (!number.startsWith('+91') && digits.length <= 10) {
      return '+91 ' + digits;
    }
    return number;
  };

  const handleContactChange = (text: string) => {
    const formattedNumber = formatPhoneNumber(text);
    setContact(formattedNumber);
  };

  const toggleAmenity = (amenityName: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenityName)
        ? prev.filter(a => a !== amenityName)
        : [...prev, amenityName]
    );
  };

  const handleAddProperty = async () => {
    if (!location || !contact || !price || !area || !category || !imageUrl || !description) {
      Alert.alert('Error', 'Please fill in all fields including the image URL and description');
      return;
    }

    if (!validateImageUrl(imageUrl)) {
      Alert.alert('Error', 'Please enter a valid HTTPS URL');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please sign in to list a property');
        return;
      }

      // Create the base property data
      interface PropertyData {
        location: string;
        price: number;
        area: number;
        contact: string;
        category: 'Residential' | 'Commercial' | 'FarmHouse/Villas';
        image: string;
        Details: string;
        amenities: string[];
        created_at: string;
        bhk?: number;
        baths?: number;
        created_by: string;
      }

      const propertyData: PropertyData = {
        location: location,
        price: parseFloat(price),
        area: parseFloat(area),
        contact: contact,
        category: category,
        image: imageUrl,
        Details: description,
        amenities: selectedAmenities,
        created_at: new Date().toISOString(),
        created_by: user.id,
      };

      // Add BHK and baths if not commercial
      if (category !== 'Commercial') {
        propertyData.bhk = bhk;
        propertyData.baths = baths;
      }

      console.log('Attempting to insert property:', propertyData); // Debug log

      const { data, error: insertError } = await supabase
        .from('property')
        .insert([propertyData])
        .select();

      if (insertError) {
        console.error('Insert Error:', insertError); // Debug log
        throw insertError;
      }

      console.log('Insert successful:', data); // Debug log

      Alert.alert('Success', 'Property listed successfully!');
      
      // Clear form
      setLocation('');
      setContact('');
      setPrice('');
      setArea('');
      setCategory('Residential');
      setImageUrl('');
      setSelectedAmenities([]);
      setBhk(1);
      setBaths(1);
      setDescription('');
      
      // Always refresh the properties list after adding a property
      try {
        await fetchMyProperties();
      } catch (error) {
        console.error('Error refreshing properties list:', error);
        Alert.alert('Warning', 'Property was added but the list could not be refreshed. Please try refreshing manually.');
      }
    } catch (error) {
      console.error('Error adding property:', error);
      Alert.alert('Error', 'Failed to list property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPropertyItem = ({ item }: { item: Property }) => (
    <TouchableOpacity 
      style={styles.propertyCard}
      onPress={() => router.push(`/property/${item.property_id}`)}
    >
      <View style={styles.propertyCard}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.propertyImage}
          resizeMode="cover"
        />
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyLocation}>{item.location}</Text>
          <Text style={styles.propertyPrice}>₹{item.price}</Text>
          <Text style={styles.propertyDetails}>
            {item.area} sqft • {item.category}
            {item.category !== 'Commercial' && ` • ${item.bhk} BHK • ${item.baths} Baths`}
          </Text>
          <Text style={styles.propertyContact}>Contact: {item.contact}</Text>
          {item.Details && (
            <Text style={styles.propertyDescription}>{item.Details}</Text>
          )}
          {item.amenities && item.amenities.length > 0 && (
            <View style={styles.amenitiesContainer}>
              <Text style={styles.amenitiesTitle}>Amenities:</Text>
              <View style={styles.amenitiesList}>
                {item.amenities.map((amenity, index) => {
                  const amenityOption = AMENITIES_OPTIONS.find(a => a.name === amenity);
                  return (
                    <View key={index} style={styles.amenityItem}>
                      <Text>{amenityOption?.icon} {amenity}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Property Listing</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'add' && styles.activeTab]}
          onPress={() => setActiveTab('add')}
        >
          <Text style={[styles.tabText, activeTab === 'add' && styles.activeTabText]}>
            Add Property
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
            My Properties
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'add' ? (
        <ScrollView style={styles.scrollView}>
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Enter Location"
              value={location}
              onChangeText={setLocation}
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              placeholder="Enter Price"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              placeholder="Enter Area in (sft)"
              value={area}
              onChangeText={setArea}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              placeholder="Enter Contact No. (+91)"
              value={contact}
              onChangeText={handleContactChange}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
              maxLength={14} // +91 and 10 digits
            />

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={(itemValue: 'Residential' | 'Commercial' | 'FarmHouse/Villas') => setCategory(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Residential" value="Residential" />
                <Picker.Item label="Commercial" value="Commercial" />
                <Picker.Item label="FarmHouse/Villas" value="FarmHouse/Villas" />
              </Picker>
            </View>

            {showAdditionalOptions && (
              <>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={bhk}
                    onValueChange={(itemValue: number) => setBhk(itemValue)}
                    style={styles.picker}
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <Picker.Item 
                        key={num} 
                        label={`${num} BHK`} 
                        value={num} 
                      />
                    ))}
                  </Picker>
                </View>

                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={baths}
                    onValueChange={(itemValue: number) => setBaths(itemValue)}
                    style={styles.picker}
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <Picker.Item 
                        key={num} 
                        label={`${num} ${num === 1 ? 'Bath' : 'Baths'}`} 
                        value={num} 
                      />
                    ))}
                  </Picker>
                </View>
              </>
            )}

            <TextInput
              style={styles.input}
              placeholder="Enter Image URL (HTTPS only)"
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholderTextColor="#999"
              autoCapitalize="none"
            />

            {imageUrl && validateImageUrl(imageUrl) ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUrl }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton} 
                  onPress={() => setImageUrl('')}
                >
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : null}

            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Enter Property Description"
              value={description}
              onChangeText={setDescription}
              multiline={true}
              numberOfLines={4}
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={styles.amenitiesButton}
              onPress={() => setShowAmenitiesDropdown(!showAmenitiesDropdown)}
            >
              <Text style={styles.amenitiesButtonText}>
                {selectedAmenities.length > 0
                  ? `Selected Amenities (${selectedAmenities.length})`
                  : 'Select Amenities'}
              </Text>
            </TouchableOpacity>

            {showAmenitiesDropdown && (
              <View style={styles.amenitiesDropdownContainer}>
                <ScrollView 
                  style={styles.amenitiesDropdown}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  <View style={styles.amenitiesDropdownContent}>
                    {AMENITIES_OPTIONS.map((amenity) => (
                      <TouchableOpacity
                        key={amenity.id}
                        style={[
                          styles.amenityOption,
                          selectedAmenities.includes(amenity.name) && styles.selectedAmenityOption
                        ]}
                        onPress={() => toggleAmenity(amenity.name)}
                      >
                        <Text style={styles.amenityOptionText}>
                          {amenity.icon} {amenity.name}
                        </Text>
                        {selectedAmenities.includes(amenity.name) && (
                          <Ionicons name="checkmark-circle" size={24} color="#B87A3B" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.addButton, loading && styles.addButtonDisabled]}
              onPress={handleAddProperty}
              disabled={loading}
            >
              <Text style={styles.addButtonText}>
                {loading ? 'Adding Property...' : 'Add Property'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={myProperties}
          renderItem={renderPropertyItem}
          keyExtractor={item => item.property_id.toString()}
          contentContainerStyle={styles.propertiesList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>You haven't added any properties yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#F8E8FF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#B87A3B',
    borderRadius: 25,
    padding: 15,
    marginBottom: 16,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    padding: 5,
  },
  addButton: {
    backgroundColor: '#B87A3B',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8E8FF',
    padding: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#B87A3B',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  propertiesList: {
    padding: 16,
  },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  propertyInfo: {
    padding: 16,
  },
  propertyLocation: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  propertyPrice: {
    fontSize: 16,
    color: '#B87A3B',
    fontWeight: '600',
    marginBottom: 8,
  },
  propertyDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  propertyContact: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  amenitiesButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#B87A3B',
    borderRadius: 25,
    padding: 15,
    marginBottom: 16,
  },
  amenitiesButtonText: {
    color: '#B87A3B',
    fontSize: 16,
    textAlign: 'center',
  },
  amenitiesDropdownContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    marginBottom: 16,
    height: 250,
    overflow: 'hidden',
  },
  amenitiesDropdown: {
    flex: 1,
  },
  amenitiesDropdownContent: {
    paddingVertical: 5,
  },
  amenityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedAmenityOption: {
    backgroundColor: '#FFF5E6',
  },
  amenityOptionText: {
    fontSize: 16,
    color: '#333',
  },
  amenitiesContainer: {
    marginTop: 12,
  },
  amenitiesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityItem: {
    backgroundColor: '#F8E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  propertyDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
}); 