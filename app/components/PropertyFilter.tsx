import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type SortOption = 'priceHighToLow' | 'priceLowToHigh' | 'locationAToZ' | 'locationZToA';

interface PropertyFilterProps {
  onSortChange: (option: SortOption) => void;
  currentSort: SortOption;
}

export default function PropertyFilter({ onSortChange, currentSort }: PropertyFilterProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const sortOptions = [
    { id: 'priceHighToLow', label: 'Price: High to Low', icon: 'arrow-down' },
    { id: 'priceLowToHigh', label: 'Price: Low to High', icon: 'arrow-up' },
    { id: 'locationAToZ', label: 'Location: A to Z', icon: 'text' },
    { id: 'locationZToA', label: 'Location: Z to A', icon: 'text' },
  ] as const;

  const handleSort = (option: SortOption) => {
    onSortChange(option);
    setModalVisible(false);
  };

  const getCurrentSortLabel = () => {
    return sortOptions.find(option => option.id === currentSort)?.label || 'Sort by';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="filter" size={20} color="#666" />
        <Text style={styles.filterText}>{getCurrentSortLabel()}</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort Properties</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.sortOption,
                  currentSort === option.id && styles.selectedOption
                ]}
                onPress={() => handleSort(option.id)}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={20} 
                  color={currentSort === option.id ? '#B87A3B' : '#666'} 
                />
                <Text style={[
                  styles.sortOptionText,
                  currentSort === option.id && styles.selectedOptionText
                ]}>
                  {option.label}
                </Text>
                {currentSort === option.id && (
                  <Ionicons name="checkmark" size={20} color="#B87A3B" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
  },
  filterText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  selectedOption: {
    backgroundColor: '#FFF5EB',
  },
  sortOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  selectedOptionText: {
    color: '#B87A3B',
    fontWeight: '500',
  },
}); 