import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface Tender {
  tender_id: string;
  title: string;
  reference_no: string;
  start_date: string;
  closing_date: string;
  opening_date: string;
  description: string;
  category: string;
  estimated_cost: number;
  status: 'active' | 'closed' | 'awarded';
  created_at: string;
}

export default function TendersScreen() {
  const router = useRouter();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTenders = async () => {
    try {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenders(data || []);
    } catch (error) {
      console.error('Error fetching tenders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTenders();
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ' ' + date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B87A3B" />
        <Text style={styles.loadingText}>Loading tenders...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Government Tenders</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {/* Add filter functionality */}}
        >
          <Ionicons name="filter" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.tableHeader}>
        <View style={styles.headerCell}>
          <Text style={styles.headerText}>Tender Title</Text>
        </View>
        <View style={[styles.headerCell, styles.centerCell]}>
          <Text style={styles.headerText}>Reference No.</Text>
        </View>
        <View style={[styles.headerCell, styles.dateCell]}>
          <Text style={styles.headerText}>Closing Date</Text>
        </View>
        <View style={[styles.headerCell, styles.dateCell]}>
          <Text style={styles.headerText}>Opening Date</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.tenderList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#B87A3B']}
          />
        }
      >
        {tenders.map((tender, index) => (
          <TouchableOpacity
            key={tender.tender_id}
            style={[
              styles.tenderItem,
              index % 2 === 0 && styles.evenRow
            ]}
            onPress={() => router.push(`/tender/${tender.tender_id}`)}
          >
            <View style={styles.cell}>
              <Text style={styles.tenderTitle}>{tender.title}</Text>
              <Text style={styles.category}>{tender.category}</Text>
            </View>
            <View style={[styles.cell, styles.centerCell]}>
              <Text style={styles.referenceNo}>{tender.reference_no}</Text>
            </View>
            <View style={[styles.cell, styles.dateCell]}>
              <Text style={styles.dateText}>{formatDate(tender.closing_date)}</Text>
            </View>
            <View style={[styles.cell, styles.dateCell]}>
              <Text style={styles.dateText}>{formatDate(tender.opening_date)}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {tenders.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#666" />
            <Text style={styles.emptyStateText}>No tenders available</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8E8FF',
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    padding: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#B87A3B',
    padding: 12,
  },
  headerCell: {
    flex: 2,
  },
  centerCell: {
    flex: 1,
    alignItems: 'center',
  },
  dateCell: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tenderList: {
    flex: 1,
  },
  tenderItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  evenRow: {
    backgroundColor: '#F8F9FA',
  },
  cell: {
    flex: 2,
    justifyContent: 'center',
  },
  tenderTitle: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#666',
  },
  referenceNo: {
    fontSize: 13,
    color: '#333',
  },
  dateText: {
    fontSize: 12,
    color: '#333',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
}); 