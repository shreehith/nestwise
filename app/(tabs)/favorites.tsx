import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
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

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // First get the favorite property IDs
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', user.id);

      if (favoritesError) throw favoritesError;

      if (favoritesData && favoritesData.length > 0) {
        // Get the actual property details for each favorite
        const propertyIds = favoritesData.map(fav => fav.property_id);
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('property')
          .select('*')
          .in('property_id', propertyIds);

        if (propertiesError) throw propertiesError;
        setFavorites(propertiesData || []);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
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
        <Text style={styles.title}>My Favorites</Text>
      </View>
      
      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No favorite properties yet</Text>
          <Text style={styles.emptySubText}>
            Like some properties to see them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={({ item }) => (
            <PropertyItem 
              item={item}
              onFavoriteChange={fetchFavorites}
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
    padding: 20,
    backgroundColor: '#F8E8FF',
    marginTop: 44,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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