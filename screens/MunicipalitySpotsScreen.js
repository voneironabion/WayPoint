import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../services/firebaseConfig';

const COLORS = {
  terracotta: '#D24A32',
  cream: '#FAF8F5',
  white: '#FFFFFF',
  grayText: '#6C7280',
  blackText: '#1F2937'
};

// --- PREMIUM FEATURE 1: BOUNCING HEART COMPONENT ---
const AnimatedHeartIcon = ({ isFavorite, onPress, style, iconSize = 18 }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleValue, { toValue: 0.7, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleValue, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity style={style} onPress={handlePress} activeOpacity={0.9}>
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <Ionicons 
          name={isFavorite ? "heart" : "heart-outline"} 
          size={iconSize} 
          color={isFavorite ? COLORS.terracotta : "#fff"} 
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

// --- PREMIUM FEATURE 2: SKELETON LOADER COMPONENT ---
const SkeletonPulse = ({ style }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return <Animated.View style={[style, { opacity, backgroundColor: '#E5E7EB' }]} />;
};

export default function MunicipalitySpotsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const municipalityName = params.municipality || 'Destinations';

  const [user, setUser] = useState(null);
  const [spots, setSpots] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  const getLocalSpotImage = (spotName, municipality) => {
    const name = spotName?.toLowerCase() || '';
    const muni = municipality?.toLowerCase() || '';

    if (name.includes('rompeolas')) return require('../assets/images/places/rompeolas.jpeg');
    if (name.includes('paguriran')) return require('../assets/images/places/paguriran.jpg');
    if (name.includes('bulusan lake')) return require('../assets/images/places/bulusanlake.jpg');
    if (name.includes('palogtok')) return require('../assets/images/places/palogtokfalls.jpg');
    if (name.includes('subic')) return require('../assets/images/places/subic.jpg');
    if (name.includes('tikling')) return require('../assets/images/places/tiklingisland.jpg');
    if (name.includes('buenavista')) return require('../assets/images/places/buenavistasurfcamp.jpg');
    if (name.includes('lola sayong')) return require('../assets/images/places/lolasayong.jpg');
    if (name.includes('barcelona church') || name.includes('st. joseph')) return require('../assets/images/places/barcelonachurch.jpg');
    if (name.includes('san mateo')) return require('../assets/images/places/sanmateo.jpg');
    if (name.includes('valley view')) return require('../assets/images/places/valleyview.jpg');
    if (name.includes('otavi') || name.includes('otabi')) return require('../assets/images/places/otavi.jpg');
    if (name.includes('orok')) return require('../assets/images/places/orok.jpg');
    if (name.includes('bucalbucalan')) return require('../assets/images/places/bucalbucalanspring.jpg');
    if (name.includes('mangrove')) return require('../assets/images/places/mangroveecopark.jpg');
    if (name.includes('plaza escudero')) return require('../assets/images/places/plazaescudero.jpg');
    if (name.includes('pakol')) return require('../assets/images/places/pakolview.jpg');
    if (name.includes('biton')) return require('../assets/images/places/biton.jpg');
    if (name.includes('casa feliz')) return require('../assets/images/places/juban.jpg');

    if (muni.includes('matnog')) return require('../assets/images/places/matnog.jpg');
    if (muni.includes('bulusan')) return require('../assets/images/places/bulusan.jpg');
    if (muni.includes('gubat')) return require('../assets/images/places/gubat.jpg');
    if (muni.includes('barcelona')) return require('../assets/images/places/barce.jpg');
    if (muni.includes('irosin')) return require('../assets/images/places/irosin.jpg');
    if (muni.includes('juban')) return require('../assets/images/places/juban.jpg');
    if (muni.includes('bulan')) return require('../assets/images/places/bulan.jpg');
    if (muni.includes('casiguran')) return require('../assets/images/places/casiguran.jpg');
    if (muni.includes('castilla')) return require('../assets/images/places/castilla.jpeg');
    if (muni.includes('magallanes')) return require('../assets/images/places/magallanes.jpg');
    if (muni.includes('pilar')) return require('../assets/images/places/pilar.jpg');
    if (muni.includes('prieto diaz')) return require('../assets/images/places/ptodiaz.jpg');
    if (muni.includes('santa magdalena')) return require('../assets/images/places/pakolview.jpg');
    if (muni.includes('donsol')) return require('../assets/images/places/donsol.jpg');
    
    return require('../assets/images/places/sorci.jpg'); 
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }
    const favQuery = query(collection(db, 'favorites'), where('userId', '==', user.uid));
    const unsubFav = onSnapshot(favQuery, (snapshot) => {
      setFavorites(snapshot.docs.map(doc => doc.data().spotId));
    });
    return unsubFav;
  }, [user]);

  useEffect(() => {
    if (!params.municipality) return;

    const q = query(
      collection(db, 'destinations'),
      where('municipality', '==', params.municipality)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSpots = snapshot.docs.map(doc => {
        const data = doc.data();
        if (data.name && data.name.toLowerCase().replace(/\s/g, '') === 'pakolview') {
          data.name = 'Pakol View';
        }
        return { id: doc.id, ...data };
      });
      setSpots(fetchedSpots);
      setLoading(false);
    });

    return unsubscribe;
  }, [params.municipality]);

  const toggleFavorite = async (item) => {
    if (!user) {
       setLoginModalVisible(true);
       return;
    }
    const favoriteRef = doc(db, 'favorites', `${user.uid}_${item.id}`); 
    try {
      if (favorites.includes(item.id)) {
        await deleteDoc(favoriteRef);
      } else {
        await setDoc(favoriteRef, { userId: user.uid, spotId: item.id, ...item });
      }
    } catch (error) { console.error(error); }
  };

  const filteredSpots = spots.filter(spot => 
    spot.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSpotCard = ({ item }) => (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => router.push({ pathname: '/detail', params: item })}
      activeOpacity={0.8}
    >
      <View style={{ position: 'relative' }}>
        <Image source={getLocalSpotImage(item.name, item.municipality)} style={styles.cardImage} />
        <AnimatedHeartIcon 
          style={styles.heartBtn}
          isFavorite={favorites.includes(item.id)}
          onPress={() => toggleFavorite(item)}
          iconSize={16}
        />
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>

        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color="#3498db" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.municipality}, Sorsogon
          </Text>
        </View>

        <Text style={styles.descriptionText} numberOfLines={2}>
          {item.description || 'Experience the beauty of this amazing destination.'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.blackText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{municipalityName}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Discover a destination"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.listContent}>
          <SkeletonPulse style={styles.cardContainer} />
          <SkeletonPulse style={styles.cardContainer} />
          <SkeletonPulse style={styles.cardContainer} />
          <SkeletonPulse style={styles.cardContainer} />
        </View>
      ) : (
        <FlatList
          data={filteredSpots}
          keyExtractor={(item) => item.id}
          renderItem={renderSpotCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="map-outline" size={60} color="#E5E7EB" />
              <Text style={styles.emptyText}>No destinations found matching your search.</Text>
            </View>
          }
        />
      )}

      {/* LOGIN MODAL */}
      <Modal animationType="fade" transparent={true} visible={loginModalVisible} onRequestClose={() => setLoginModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="person-circle" size={60} color={COLORS.terracotta} style={{ marginBottom: 15 }} />
            <Text style={styles.modalTitle}>Sign In Required</Text>
            <Text style={styles.modalMessage}>Please sign in to save your favorite Sorsogon destinations!</Text>
            <TouchableOpacity style={styles.modalLoginButton} onPress={() => { setLoginModalVisible(false); router.push('/profile'); }}>
              <Text style={styles.modalLoginText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLoginModalVisible(false)} style={{ marginTop: 15 }}>
              <Text style={{ color: COLORS.grayText, fontSize: 14 }}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 15, 
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.blackText },
  backButton: { padding: 5, marginLeft: -5 },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.blackText },

  listContent: { padding: 20 },
  
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    height: 124, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  heartBtn: { 
    position: 'absolute', 
    top: 6, 
    right: 6, 
    backgroundColor: 'rgba(0,0,0,0.25)', 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  cardInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.blackText,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#3498db',
    marginLeft: 4,
    fontWeight: '600'
  },
  descriptionText: {
    fontSize: 11,
    color: COLORS.grayText,
    lineHeight: 16,
  },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 80 },
  emptyText: { marginTop: 15, fontSize: 14, color: COLORS.grayText, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: COLORS.white, borderRadius: 25, padding: 30, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.blackText, marginBottom: 10 },
  modalMessage: { fontSize: 14, color: COLORS.grayText, textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  modalLoginButton: { width: '100%', backgroundColor: COLORS.terracotta, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  modalLoginText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' }
});