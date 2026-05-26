import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  terracotta: '#D24A32',
  cream: '#FAF8F5',
  white: '#FFFFFF',
  grayText: '#6C7280',
  blackText: '#1F2937'
};

// --- PREMIUM FEATURE: BOUNCING HEART COMPONENT ---
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

// --- PREMIUM FEATURE: SKELETON LOADER COMPONENT ---
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

export default function ExploreScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [spots, setSpots] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
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
    const q = query(collection(db, 'destinations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedSpots = snapshot.docs.map(doc => {
        const data = doc.data();
        if (data.name && data.name.toLowerCase().replace(/\s/g, '') === 'pakolview') {
          data.name = 'Pakol View';
        }
        return { id: doc.id, ...data };
      });

      fetchedSpots.sort((a, b) => {
        const nameA = a.name ? a.name.toLowerCase() : '';
        const nameB = b.name ? b.name.toLowerCase() : '';
        return nameA.localeCompare(nameB);
      });

      setSpots(fetchedSpots);
      setLoading(false); // Turn off skeleton when data arrives
    });

    return unsubscribe;
  }, []);

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

  const getLocalSpotImage = (spotName, municipality) => {
    const name = String(spotName || '').toLowerCase().trim();
    const muni = String(municipality || '').toLowerCase().trim();

    if (name.includes('rompeolas')) return require('../assets/images/places/rompeolas.jpeg');
    if (name.includes('paguriran')) return require('../assets/images/places/paguriran.jpg');
    if (name.includes('bulusan lake')) return require('../assets/images/places/bulusanlake.jpg');
    if (name.includes('palogtok')) return require('../assets/images/places/palogtokfalls.jpg');
    if (name.includes('subic')) return require('../assets/images/places/subic.jpg');
    if (name.includes('tikling')) return require('../assets/images/places/tiklingisland.jpg');
    if (name.includes('buenavista')) return require('../assets/images/places/buenavistasurfcamp.jpg');
    if (name.includes('lola sayong') || name.includes('eco-surf')) return require('../assets/images/places/lolasayong.jpg');
    if (name.includes('barcelona church') || name.includes('st. joseph') || name.includes('parish')) return require('../assets/images/places/barcelonachurch.jpg');
    if (name.includes('ruins')) return require('../assets/images/places/barce.jpg');
    if (name.includes('san mateo')) return require('../assets/images/places/sanmateo.jpg');
    if (name.includes('valley view')) return require('../assets/images/places/valleyview.jpg');
    if (name.includes('otavi') || name.includes('otabi')) return require('../assets/images/places/otavi.jpg');
    if (name.includes('orok')) return require('../assets/images/places/orok.jpg');
    if (name.includes('bucalbucalan')) return require('../assets/images/places/bucalbucalanspring.jpg');
    if (name.includes('mangrove') || name.includes('prieto diaz')) return require('../assets/images/places/mangroveecopark.jpg');
    if (name.includes('plaza escudero')) return require('../assets/images/places/plazaescudero.jpg');
    if (name.includes('pakol')) return require('../assets/images/places/pakolview.jpg');
    if (name.includes('biton')) return require('../assets/images/places/biton.jpg');
    if (name.includes('casa feliz')) return require('../assets/images/places/juban.jpg');
    if (name.includes('gibalon')) return require('../assets/images/places/magallanes.jpg');
    if (name.includes('panumbagan')) return require('../assets/images/places/pilar.jpg');
    if (name.includes('malawmawan')) return require('../assets/images/places/castilla.jpeg');

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

  const filteredSpots = spots.filter(spot => 
    (spot.name && spot.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (spot.municipality && spot.municipality.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderGridCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.gridCard}
      onPress={() => router.push({ pathname: '/detail', params: item })}
    >
      <View style={styles.imageWrapper}>
        <Image source={getLocalSpotImage(item.name, item.municipality)} style={styles.gridImage} />
        
        {/* Animated Heart Applied Here */}
        <AnimatedHeartIcon 
          style={styles.heartBtn}
          isFavorite={favorites.includes(item.id)}
          onPress={() => toggleFavorite(item)}
          iconSize={18}
        />
      </View>
      
      <View style={styles.gridInfo}>
        <Text style={styles.gridTitle} numberOfLines={1}>{item.name}</Text>
        <View style={styles.gridLocRow}>
          <Ionicons name="location" size={12} color={COLORS.terracotta} />
          <Text style={styles.gridLocText} numberOfLines={1}>{item.municipality}</Text>
        </View>
        <View style={styles.gridRatingRow}>
          <Ionicons name="star" size={12} color="#FBBF24" />
          <Text style={styles.gridRatingText}>{item.rating || '4.5'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.headerContainer}>
        <Text style={styles.mainTitle}>Explore</Text>
        <Text style={styles.subTitle}>Discover the beauty of Sorsogon</Text>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.grayText} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search destinations or municipalities..."
            placeholderTextColor={COLORS.grayText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.grayText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.skeletonGrid}>
          <SkeletonPulse style={styles.gridCard} />
          <SkeletonPulse style={styles.gridCard} />
          <SkeletonPulse style={styles.gridCard} />
          <SkeletonPulse style={styles.gridCard} />
        </View>
      ) : (
        <FlatList
          data={filteredSpots}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.rowWrapper}
          renderItem={renderGridCard}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="map-outline" size={50} color="#E5E7EB" />
              <Text style={styles.emptyText}>No destinations found.</Text>
            </View>
          }
        />
      )}
      
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
  container: { flex: 1, backgroundColor: COLORS.white },
  headerContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  mainTitle: { fontSize: 34, fontWeight: 'bold', color: COLORS.terracotta, marginBottom: 5 },
  subTitle: { fontSize: 16, color: COLORS.grayText, marginBottom: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cream, borderRadius: 15, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#F0F0F0' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.blackText, height: '100%' },
  
  listContainer: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 },
  rowWrapper: { justifyContent: 'space-between' },
  
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  gridCard: { width: (SCREEN_WIDTH / 2) - 28, height: 220, backgroundColor: '#F9FAFB', borderRadius: 20, marginBottom: 20, overflow: 'hidden' },
  imageWrapper: { width: '100%', height: 140, position: 'relative' },
  gridImage: { width: '100%', height: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  
  heartBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.2)', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  
  gridInfo: { paddingHorizontal: 12, paddingTop: 12 },
  gridTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.blackText, marginBottom: 4 },
  gridLocRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  gridLocText: { fontSize: 12, color: COLORS.grayText, marginLeft: 4 },
  gridRatingRow: { flexDirection: 'row', alignItems: 'center' },
  gridRatingText: { fontSize: 13, fontWeight: 'bold', color: COLORS.blackText, marginLeft: 4 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  emptyText: { color: COLORS.grayText, fontSize: 16, marginTop: 10 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: COLORS.white, borderRadius: 25, padding: 30, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.blackText, marginBottom: 10 },
  modalMessage: { fontSize: 14, color: COLORS.grayText, textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  modalLoginButton: { width: '100%', backgroundColor: COLORS.terracotta, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  modalLoginText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' }
});