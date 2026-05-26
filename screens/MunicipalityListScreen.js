import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const COLORS = {
  terracotta: '#D24A32',
  cream: '#FAF8F5',
  white: '#FFFFFF',
  grayText: '#6C7280',
  blackText: '#1F2937'
};

// Data for the 15 Municipalities
const MUNICIPALITIES_DATA = [
  { id: '1', name: 'Sorsogon City', desc: 'The bustling capital and heart of the province.', image: require('../assets/images/places/sorci.jpg') },
  { id: '2', name: 'Bulusan', desc: 'Home to the pristine Bulusan Volcano and serene lakes.', image: require('../assets/images/places/bulusan.jpg') },
  { id: '3', name: 'Matnog', desc: 'Famous for its pink sand beaches and beautiful islands.', image: require('../assets/images/places/matnog.jpg') },
  { id: '4', name: 'Donsol', desc: 'The Whale Shark capital of the world.', image: require('../assets/images/places/donsol.jpg') },
  { id: '5', name: 'Gubat', desc: 'A surfer’s paradise with beautiful coastal shores.', image: require('../assets/images/places/gubat.jpg') },
  { id: '6', name: 'Casiguran', desc: 'Known for its cold springs and rich coastal heritage.', image: require('../assets/images/places/casiguran.jpg') },
  { id: '7', name: 'Barcelona', desc: 'Rich in history with well-preserved colonial ruins.', image: require('../assets/images/places/barce.jpg') },
  { id: '8', name: 'Prieto Diaz', desc: 'Award-winning mangrove eco-parks and wetlands.', image: require('../assets/images/places/ptodiaz.jpg') },
  { id: '9', name: 'Irosin', desc: 'A landlocked town known for therapeutic hot springs.', image: require('../assets/images/places/irosin.jpg') },
  { id: '10', name: 'Juban', desc: 'Lined with beautifully preserved heritage houses.', image: require('../assets/images/places/juban.jpg') },
  { id: '11', name: 'Bulan', desc: 'A bustling fishing town with quiet, scenic beaches.', image: require('../assets/images/places/bulan.jpg') },
  { id: '12', name: 'Castilla', desc: 'Rich in agriculture and untouched island escapes.', image: require('../assets/images/places/castilla.jpeg') },
  { id: '13', name: 'Magallanes', desc: 'The historic site of the first Catholic mass in Luzon.', image: require('../assets/images/places/magallanes.jpg') },
  { id: '14', name: 'Pilar', desc: 'Famous for submerged sandbars and marine life.', image: require('../assets/images/places/pilar.jpg') },
  { id: '15', name: 'Santa Magdalena', desc: 'A serene destination with majestic coastal viewpoints.', image: require('../assets/images/places/pakolview.jpg') },
];

export default function MunicipalityListScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter municipalities based on search bar
  const filteredData = MUNICIPALITIES_DATA.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMuniCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.cardContainer}
      activeOpacity={0.9}
      // THE MAGIC HAPPENS HERE: We push to the new screen and pass the municipality name!
      onPress={() => router.push({ 
        pathname: '/municipality-spots', 
        params: { municipality: item.name } 
      })}
    >
      <ImageBackground 
        source={item.image} 
        style={styles.cardImage}
        imageStyle={{ borderRadius: 16 }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']} 
          style={styles.cardOverlay}
        >
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardDesc}>{item.desc}</Text>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.blackText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore Sorsogon</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Discover a municipality"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderMuniCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 15, 
    paddingBottom: 15,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.blackText },
  backButton: { padding: 5, marginLeft: -5 },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.blackText },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  cardContainer: {
    width: '100%',
    height: 180,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  cardOverlay: {
    padding: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#E5E7EB',
  }
});