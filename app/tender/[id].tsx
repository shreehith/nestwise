import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  status: 'active' | 'closed' | 'awarded' | 'coming_soon';
  created_at: string;
  documents: string[];
  eligibility_criteria: string[];
}

interface Bid {
  bid_id: string;
  tender_id: string;
  user_id: string;
  amount: number;
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected';
  created_at: string;
}

export default function TenderDetailsScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const router = useRouter();
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userBid, setUserBid] = useState<Bid | null>(null);
  const [editingBid, setEditingBid] = useState(false);

  useEffect(() => {
    fetchTenderDetails();
    checkExistingBid();
  }, [id]);

  const fetchTenderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .eq('tender_id', id)
        .single();

      if (error) throw error;
      setTender(data);
    } catch (error) {
      console.error('Error fetching tender details:', error);
      Alert.alert('Error', 'Failed to load tender details');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingBid = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .match({ tender_id: id, user_id: user.id })
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUserBid(data);
      if (data) {
        setBidAmount(data.amount.toString());
      }
    } catch (error) {
      console.error('Error checking existing bid:', error);
    }
  };

  const createNotification = async (bidId: string, type: string, message: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: user.id,
          type,
          tender_id: id,
          bid_id: bidId,
          message,
          read: false,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error creating notification:', error);
        // Don't throw the error, just log it
        return;
      }
    } catch (error) {
      console.error('Error in createNotification:', error);
      // Don't throw the error, just log it
    }
  };

  const handleSubmitBid = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please sign in to submit a bid');
        return;
      }

      if (!bidAmount || isNaN(Number(bidAmount))) {
        Alert.alert('Error', 'Please enter a valid bid amount');
        return;
      }

      const numericBidAmount = Number(bidAmount);
      if (numericBidAmount <= 0) {
        Alert.alert('Error', 'Bid amount must be greater than 0');
        return;
      }

      setSubmitting(true);

      // First check if a bid exists
      const { data: existingBids, error: checkError } = await supabase
        .from('bids')
        .select('*')
        .eq('tender_id', id)
        .eq('user_id', user.id);

      if (checkError) {
        console.error('Error checking existing bid:', checkError);
        Alert.alert('Error', 'Failed to check existing bid');
        setSubmitting(false);
        return;
      }

      const existingBid = existingBids?.[0];
      let bidData;

      if (existingBid) {
        // Update existing bid
        const { data: updatedBid, error: updateError } = await supabase
          .from('bids')
          .update({
            amount: numericBidAmount,
            status: 'submitted',
            updated_at: new Date().toISOString()
          })
          .eq('bid_id', existingBid.bid_id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating bid:', updateError);
          Alert.alert('Error', 'Failed to update bid');
          setSubmitting(false);
          return;
        }

        bidData = updatedBid;
        setUserBid(updatedBid);
        Alert.alert('Success', 'Bid updated successfully');
      } else {
        // Create new bid
        const { data: newBid, error: insertError } = await supabase
          .from('bids')
          .insert({
            tender_id: id,
            user_id: user.id,
            amount: numericBidAmount,
            status: 'submitted',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating bid:', insertError);
          Alert.alert('Error', 'Failed to submit bid');
          setSubmitting(false);
          return;
        }

        bidData = newBid;
        setUserBid(newBid);
        Alert.alert('Success', 'Bid submitted successfully');
      }

      // Create notification
      if (bidData) {
        createNotification(
          bidData.bid_id,
          existingBid ? 'Bid Updated' : 'Bid Submitted',
          `Your bid for ${tender?.title} has been ${existingBid ? 'updated' : 'submitted'} to ${formatCurrency(numericBidAmount)}`
        );
      }

      // Refresh the tender data
      fetchTenderDetails();
      setEditingBid(false);
    } catch (error) {
      console.error('Error in handleSubmitBid:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#E8F5E9';
      case 'closed':
        return '#FFEBEE';
      case 'awarded':
        return '#E3F2FD';
      case 'coming_soon':
        return '#FFF3E0';
      default:
        return '#fff';
    }
  };

  const renderBidSection = () => {
    if (tender?.status === 'coming_soon') {
      return (
        <View style={styles.comingSoonContainer}>
          <Ionicons name="time-outline" size={48} color="#FF9800" />
          <Text style={styles.comingSoonText}>Bidding will open soon</Text>
          <Text style={styles.comingSoonDate}>
            Starts on {formatDate(tender.start_date)}
          </Text>
        </View>
      );
    }

    if (tender?.status === 'closed') {
      return (
        <View style={styles.closedContainer}>
          <Ionicons name="close-circle-outline" size={48} color="#F44336" />
          <Text style={styles.closedText}>Bidding is closed</Text>
          <Text style={styles.closedDate}>
            Closed on {formatDate(tender.closing_date)}
          </Text>
        </View>
      );
    }

    if (tender?.status === 'awarded') {
      return (
        <View style={styles.awardedContainer}>
          <Ionicons name="trophy-outline" size={48} color="#2196F3" />
          <Text style={styles.awardedText}>Tender has been awarded</Text>
        </View>
      );
    }

    return (
      <View style={styles.bidSection}>
        <Text style={styles.sectionTitle}>
          {userBid ? 'Your Bid' : 'Submit Your Bid'}
        </Text>
        {userBid ? (
          <View style={styles.userBidInfo}>
            <Text style={styles.userBidAmount}>
              Amount: {formatCurrency(userBid.amount)}
            </Text>
            <Text style={styles.userBidStatus}>
              Status: {userBid.status.replace('_', ' ')}
            </Text>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.bidInput}
              placeholder="Enter bid amount (INR)"
              value={bidAmount}
              onChangeText={setBidAmount}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmitBid}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : 'Submit Bid'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B87A3B" />
        <Text style={styles.loadingText}>Loading tender details...</Text>
      </View>
    );
  }

  if (!tender) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#666" />
        <Text style={styles.errorText}>Tender not found</Text>
        <TouchableOpacity 
          style={styles.backButton} 
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
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Tender Details</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.tenderTitle}>{tender?.title}</Text>
            <Text style={styles.referenceNo}>Reference No: {tender?.reference_no}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Important Dates</Text>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Start Date:</Text>
              <Text style={styles.dateValue}>{formatDate(tender?.start_date || '')}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Closing Date:</Text>
              <Text style={styles.dateValue}>{formatDate(tender?.closing_date || '')}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Opening Date:</Text>
              <Text style={styles.dateValue}>{formatDate(tender?.opening_date || '')}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tender Details</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{tender?.category}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Estimated Cost:</Text>
              <Text style={styles.detailValue}>{formatCurrency(tender?.estimated_cost || 0)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Status:</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(tender?.status || '') }
              ]}>
                <Text style={styles.statusText}>
                  {(tender?.status || '').replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{tender?.description}</Text>
          </View>

          {tender?.eligibility_criteria && tender.eligibility_criteria.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Eligibility Criteria</Text>
              {tender.eligibility_criteria.map((criteria, index) => (
                <View key={index} style={styles.criteriaItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                  <Text style={styles.criteriaText}>{criteria}</Text>
                </View>
              ))}
            </View>
          )}

          {tender?.documents && tender.documents.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Documents</Text>
              {tender.documents.map((document, index) => (
                <TouchableOpacity key={index} style={styles.documentItem}>
                  <Ionicons name="document-text-outline" size={24} color="#666" />
                  <Text style={styles.documentText}>{document}</Text>
                  <Ionicons name="download-outline" size={24} color="#B87A3B" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {renderBidSection()}
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8E8FF',
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tenderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  referenceNo: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  dateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
  },
  dateValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  criteriaText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  bidSection: {
    marginBottom: 24,
  },
  bidInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#B87A3B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userBidInfo: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
  },
  userBidAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  userBidStatus: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
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
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  comingSoonContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    marginTop: 16,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
    marginTop: 12,
  },
  comingSoonDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  closedContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    marginTop: 16,
  },
  closedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginTop: 12,
  },
  closedDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  awardedContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginTop: 16,
  },
  awardedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  documentText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
}); 