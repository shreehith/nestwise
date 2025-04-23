import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import CountDown from 'react-native-countdown-component';

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
  status: 'upcoming' | 'ongoing' | 'closed' | 'awarded';
  created_at: string;
  documents: string[];
  eligibility_criteria: string[];
}

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'closed', label: 'Closed' },
  { id: 'awarded', label: 'Awarded' },
];

const generateSampleTenders = (): Tender[] => {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30 * oneDay;

  const categories = ['Construction', 'IT Services', 'Healthcare', 'Education', 'Transportation'];
  const statuses = ['active', 'coming_soon', 'closed', 'awarded'] as const;

  const tenders: Tender[] = [];

  statuses.forEach(status => {
    for (let i = 1; i <= 5; i++) {
      const startDate = new Date(now.getTime() + (i * oneWeek));
      const closingDate = new Date(startDate.getTime() + oneMonth);
      const openingDate = new Date(closingDate.getTime() + oneWeek);

      tenders.push({
        tender_id: `tender-${status}-${i}`,
        title: `${categories[i % 5]} Project Tender ${i}`,
        reference_no: `REF-${status.toUpperCase().slice(0, 2)}-${i}`,
        start_date: startDate.toISOString(),
        closing_date: closingDate.toISOString(),
        opening_date: openingDate.toISOString(),
        description: `This is a sample tender for ${categories[i % 5]} services. Detailed specifications and requirements will be provided in the tender document.`,
        category: categories[i % 5],
        estimated_cost: 1000000 * (i + 1),
        status: status,
        created_at: now.toISOString(),
        documents: ['tender_document.pdf', 'specifications.pdf'],
        eligibility_criteria: [
          'Minimum 5 years of experience',
          'Valid business registration',
          'Financial stability proof',
          'Previous project references'
        ]
      });
    }
  });

  return tenders;
};

export default function TendersScreen() {
  const router = useRouter();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  const fetchTenders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tenders:', error);
        return;
      }

      // Update status based on dates
      const updatedTenders = data?.map(tender => {
        const now = new Date();
        const startDate = new Date(tender.start_date);
        const closingDate = new Date(tender.closing_date);

        let status = tender.status;
        if (tender.status !== 'awarded') {
          if (startDate > now) {
            status = 'upcoming';
          } else if (startDate <= now && closingDate > now) {
            status = 'ongoing';
          } else if (closingDate <= now) {
            status = 'closed';
          }
        }

        return { ...tender, status };
      }) || [];

      setTenders(updatedTenders);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTenders();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#FF9800'; // Orange
      case 'ongoing':
        return '#4CAF50'; // Green
      case 'closed':
        return '#F44336'; // Red
      case 'awarded':
        return '#2196F3'; // Blue
      default:
        return '#9E9E9E'; // Gray
    }
  };

  const getTimeUntilDate = (dateString: string) => {
    const targetDate = new Date(dateString).getTime();
    const now = new Date().getTime();
    const difference = targetDate - now;
    return Math.max(Math.floor(difference / 1000), 0); // Convert to seconds, minimum 0
  };

  const getCountdownTitle = (status: string, tender: Tender) => {
    switch (status) {
      case 'active':
        return 'Closes in:';
      case 'coming_soon':
        return 'Starts in:';
      case 'closed':
        return 'Opens in:';
      default:
        return '';
    }
  };

  const getCountdownDate = (status: string, tender: Tender) => {
    switch (status) {
      case 'active':
        return tender.closing_date;
      case 'coming_soon':
        return tender.start_date;
      case 'closed':
        return tender.opening_date;
      default:
        return '';
    }
  };

  const getFilteredTenders = () => {
    return tenders.filter(tender => tender.status === activeTab);
  };

  const renderTenderItem = ({ item }: { item: Tender }) => (
    <TouchableOpacity
      style={styles.tenderItem}
      onPress={() => router.push(`/tender/${item.tender_id}`)}
    >
      <View style={styles.tenderHeader}>
        <Text style={styles.tenderTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.referenceNo}>Ref: {item.reference_no}</Text>
      
      {item.status !== 'awarded' && (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownLabel}>
            {getCountdownTitle(item.status, item)}
          </Text>
          <CountDown
            until={getTimeUntilDate(getCountdownDate(item.status, item))}
            size={12}
            digitStyle={styles.countdownDigit}
            digitTxtStyle={styles.countdownDigitText}
            timeLabelStyle={styles.countdownLabel}
            separatorStyle={styles.countdownSeparator}
            timeToShow={['D', 'H', 'M', 'S']}
            timeLabels={{ d: 'Days', h: 'Hours', m: 'Mins', s: 'Secs' }}
            showSeparator
          />
        </View>
      )}
      
      <View style={styles.datesContainer}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Start Date:</Text>
          <Text style={styles.dateValue}>{formatDate(item.start_date)}</Text>
        </View>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Closing Date:</Text>
          <Text style={styles.dateValue}>{formatDate(item.closing_date)}</Text>
        </View>
      </View>
      
      <Text style={styles.estimatedCost}>
        Estimated Cost: {formatCurrency(item.estimated_cost)}
      </Text>
      
      <Text style={styles.category}>Category: {item.category}</Text>
    </TouchableOpacity>
  );

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
        <Text style={styles.title}>Government Tenders</Text>
      </View>
      
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={getFilteredTenders()}
        renderItem={renderTenderItem}
        keyExtractor={(item) => item.tender_id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#B87A3B']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No {activeTab} tenders available</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#F8E8FF',
    paddingTop: 60,
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
  listContainer: {
    padding: 16,
  },
  tenderItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tenderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tenderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  referenceNo: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  datesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  estimatedCost: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    marginBottom: 8,
  },
  category: {
    fontSize: 14,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#B87A3B',
  },
  tabText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: '#B87A3B',
  },
  countdownContainer: {
    alignItems: 'center',
    marginVertical: 8,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  countdownLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  countdownDigit: {
    backgroundColor: '#B87A3B',
    padding: 4,
    borderRadius: 4,
  },
  countdownDigitText: {
    color: '#FFF',
    fontSize: 14,
  },
  countdownSeparator: {
    color: '#B87A3B',
  },
}); 