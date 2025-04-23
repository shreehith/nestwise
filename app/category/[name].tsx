import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import PropertyItem from '../../components/PropertyItem';

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

type SortOption = 'priceHighToLow' | 'priceLowToHigh' | 'locationAToZ' | 'locationZToA' | 'areaHighToLow' | 'areaLowToHigh';

const sortOptions = [
  { id: 'priceHighToLow', label: 'Price: High to Low', icon: 'arrow-down' },
  { id: 'priceLowToHigh', label: 'Price: Low to High', icon: 'arrow-up' },
  { id: 'locationAToZ', label: 'Location: A to Z', icon: 'text' },
  { id: 'locationZToA', label: 'Location: Z to A', icon: 'text' },
  { id: 'areaHighToLow', label: 'Sq.ft: High to Low', icon: 'expand' },
  { id: 'areaLowToHigh', label: 'Sq.ft: Low to High', icon: 'contract' },
] as const;

export default function CategoryScreen() {
  const { name } = useLocalSearchParams();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSort, setCurrentSort] = useState<SortOption>('priceHighToLow');

  useEffect(() => {
    fetchCategoryProperties();
  }, [name]);

  const fetchCategoryProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('property')
        .select('*')
        .eq('category', name)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSortedProperties = () => {
    const sortedProperties = [...properties];

    switch (currentSort) {
      case 'priceHighToLow':
        return sortedProperties.sort((a, b) => b.price - a.price);
      case 'priceLowToHigh':
        return sortedProperties.sort((a, b) => a.price - b.price);
      case 'locationAToZ':
        return sortedProperties.sort((a, b) => a.location.localeCompare(b.location));
      case 'locationZToA':
        return sortedProperties.sort((a, b) => b.location.localeCompare(a.location));
      case 'areaHighToLow':
        return sortedProperties.sort((a, b) => b.area - a.area);
      case 'areaLowToHigh':
        return sortedProperties.sort((a, b) => a.area - b.area);
      default:
        return sortedProperties;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B87A3B" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{name}</Text>
      </View>

      <View style={styles.filterSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.filterOption,
                currentSort === option.id && styles.selectedOption
              ]}
              onPress={() => setCurrentSort(option.id)}
            >
              <Ionicons 
                name={option.icon as any} 
                size={18} 
                color={currentSort === option.id ? '#B87A3B' : '#666'} 
                style={styles.filterIcon}
              />
              <Text style={[
                styles.filterOptionText,
                currentSort === option.id && styles.selectedOptionText
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {properties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No properties found</Text>
          <Text style={styles.emptySubText}>
            There are no properties listed in this category yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={getSortedProperties()}
          renderItem={({ item }) => (
            <PropertyItem 
              item={item}
              onFavoriteChange={fetchCategoryProperties}
            />
          )}
          keyExtractor={(item) => item.property_id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8E8FF',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  filterSection: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  filterContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selectedOption: {
    backgroundColor: '#FFF5EB',
    borderWidth: 1,
    borderColor: '#B87A3B',
  },
  filterIcon: {
    marginRight: 6,
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedOptionText: {
    color: '#B87A3B',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
}); 