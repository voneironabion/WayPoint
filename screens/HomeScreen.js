import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
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

const MUNICIPALITIES_DATA = [
  { id: '7', name: 'Barcelona', image: require('../assets/images/places/barce.jpg') },
  { id: '1', name: 'Bulusan', image: require('../assets/images/places/bulusan.jpg') },
  { id: '6', name: 'Casiguran', image: require('../assets/images/places/casiguran.jpg') },
  { id: '3', name: 'Donsol', image: require('../assets/images/places/donsol.jpg') },
  { id: '5', name: 'Gubat', image: require('../assets/images/places/gubat.jpg') },
  { id: '2', name: 'Matnog', image: require('../assets/images/places/matnog.jpg') },
  { id: '8', name: 'Prieto Diaz', image: require('../assets/images/places/ptodiaz.jpg') },
  { id: '4', name: 'Sorsogon City', image: require('../assets/images/places/sorci.jpg') },
];

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


export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [spots, setSpots] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Popular');
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: '1', name: 'Popular', icon: 'flame' },
    { id: '2', name: 'Beach', icon: 'sunny' },
    { id: '3', name: 'Lake & Spring', icon: 'water' },
    { id: '4', name: 'Heritage', icon: 'library' },
  ];

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

  // --- NEW: Refresh user data every time the screen comes into focus ---
  useFocusEffect(
    useCallback(() => {
      if (auth.currentUser) {
        // Spread operator forces React to see this as a "new" update and refresh the UI instantly
        setUser({ ...auth.currentUser });
      } else {
        setUser(null);
      }
    }, [])
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'destinations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSpots(snapshot.docs.map(doc => {
        const data = doc.data();
        if (data.name && data.name.toLowerCase().replace(/\s/g, '') === 'pakolview') {
          data.name = 'Pakol View';
        }
        return { id: doc.id, ...data };
      }));
      setLoading(false);
    });
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

  const featuredSpots = spots.filter(spot => spot.isFeatured === true);
  const bottomCarouselSpots = spots.filter(spot => {
    if (activeCategory === 'Popular') return spot.rating >= 4.6 || spot.category === 'Popular'; 
    return spot.category === activeCategory; 
  });

  // Smart Greeting Logic
  const getGreetingName = () => {
    if (!user) return 'Explorer';
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split('@')[0];
    return 'Explorer';
  };

  const renderHeroCard = ({ item }) => (
    <TouchableOpacity onPress={() => router.push({ pathname: '/detail', params: item })}>
      <ImageBackground 
        source={getLocalSpotImage(item.name, item.municipality)} 
        style={styles.heroCard}
        imageStyle={{ borderRadius: 18 }}
      >
        <AnimatedHeartIcon 
          style={styles.heroHeartIcon}
          isFavorite={favorites.includes(item.id)}
          onPress={() => toggleFavorite(item)}
          iconSize={22}
        />

        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.heroOverlayGradient}>
          <Text style={styles.heroTitle}>{item.name}</Text>
          <Text style={styles.heroLocation}>
            <Ionicons name="location" size={14} color="#fff" /> {item.municipality}
          </Text>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  const renderPopularCard = ({ item }) => (
    <TouchableOpacity style={styles.popularCard} onPress={() => router.push({ pathname: '/detail', params: item })}>
      <View style={styles.popularImageContainer}>
        <Image source={getLocalSpotImage(item.name, item.municipality)} style={styles.popularImage} />
        
        <AnimatedHeartIcon 
          style={styles.popularHeartIcon}
          isFavorite={favorites.includes(item.id)}
          onPress={() => toggleFavorite(item)}
          iconSize={18}
        />
      </View>
      <View style={styles.popularInfoContainer}>
         <Text style={styles.popularName} numberOfLines={1}>{item.name}</Text>
         <View style={styles.popularLocContainer}>
           <Ionicons name="location" size={12} color={COLORS.terracotta} style={styles.popularLocPin} />
           <Text style={styles.popularLocText} numberOfLines={1}>{item.municipality}</Text>
         </View>
         <View style={styles.popularRatingContainer}>
            <Ionicons name="star" size={12} color="#fcd53f" style={styles.popularRatingStar} />
            <Text style={styles.popularRatingText}>{item.rating || '4.5'}</Text>
         </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* TOP NAV: Custom Avatar Support */}
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileBtn}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={22} color="#9CA3AF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* HEADER: Dynamic Name */}
        <View style={styles.header}>
          <Text style={styles.greet}>Hi {getGreetingName()},</Text>
          <Text style={styles.mainTitle}>Where do you wanna go?</Text>
        </View>

        {loading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.heroList}>
            <SkeletonPulse style={styles.heroCard} />
            <SkeletonPulse style={styles.heroCard} />
          </ScrollView>
        ) : (
          <FlatList
            data={featuredSpots}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={renderHeroCard}
            contentContainerStyle={styles.heroList}
          />
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore Places</Text>
          <TouchableOpacity style={styles.seeAllButton} onPress={() => router.push('/municipality-list')} activeOpacity={0.7}>
             <Text style={styles.seeAllText}>See all</Text>
             <Ionicons name="chevron-forward" size={16} color={COLORS.terracotta} />
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.muniScroll}>
          {MUNICIPALITIES_DATA.map((muni) => (
            <TouchableOpacity 
              key={muni.id} 
              style={styles.muniCard}
              onPress={() => router.push({ pathname: '/municipality-spots', params: { municipality: muni.name } })}
            >
               <Image source={muni.image} style={styles.muniImage} />
               <Text style={styles.muniText}>
                 {muni.name === 'Sorsogon City' ? 'Sorsogon' : muni.name}
               </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              onPress={() => setActiveCategory(cat.name)}
              style={[styles.catPill, activeCategory === cat.name && styles.activePill, activeCategory === cat.name && styles.activePillShadow]}
            >
              <Ionicons name={cat.icon} size={18} color={activeCategory === cat.name ? "#fff" : COLORS.grayText} />
              <Text style={[styles.catText, activeCategory === cat.name && styles.activeCatText]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20, marginBottom: 30 }}>
            <SkeletonPulse style={styles.popularCard} />
            <SkeletonPulse style={styles.popularCard} />
          </ScrollView>
        ) : (
          <FlatList
            data={bottomCarouselSpots}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={renderPopularCard}
            contentContainerStyle={styles.popularList}
            ListEmptyComponent={<Text style={{marginLeft: 20, color: COLORS.grayText, marginBottom: 20}}>No spots found for this category.</Text>}
          />
        )}
      </ScrollView>

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
  container: { flex: 1, backgroundColor: '#fff' },
  topNav: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 5 },
  profileBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: COLORS.cream, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, marginBottom: 20 },
  greet: { fontSize: 16, color: '#666' },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.terracotta, marginTop: 5 },
  heroList: { paddingLeft: 20 },
  heroCard: { width: 280, height: 350, marginRight: 20, justifyContent: 'flex-end', position: 'relative', borderRadius: 18, overflow: 'hidden' }, 
  heroHeartIcon: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(0,0,0,0.2)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  heroOverlayGradient: { padding: 20, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, width: '100%' },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  heroLocation: { color: '#fff', fontSize: 14, marginTop: 5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 30, marginBottom: 15, alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  seeAllButton: { flexDirection: 'row', alignItems: 'center', padding: 5 },
  seeAllText: { fontSize: 14, color: COLORS.terracotta, fontWeight: 'bold', marginRight: 2 },
  muniScroll: { paddingLeft: 20 },
  muniCard: { alignItems: 'center', marginRight: 18 },
  muniImage: { width: 95, height: 95, borderRadius: 15, marginBottom: 8 }, 
  muniText: { fontSize: 14, color: '#333', fontWeight: '600' },
  catScroll: { marginTop: 30, paddingLeft: 20, marginBottom: 20 },
  catPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, backgroundColor: '#fff', marginRight: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  activePill: { backgroundColor: COLORS.terracotta, borderColor: COLORS.terracotta },
  activePillShadow: { shadowColor: COLORS.terracotta, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  catText: { marginLeft: 8, color: COLORS.grayText },
  activeCatText: { color: '#fff', fontWeight: '600' },
  popularList: { paddingLeft: 20, paddingRight: 20, marginTop: 10, marginBottom: 30 },
  popularCard: { width: 200, height: 220, backgroundColor: '#fff', borderRadius: 20, marginRight: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  popularImageContainer: { position: 'relative', width: '100%', height: 140, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  popularImage: { width: '100%', height: '100%' },
  popularHeartIcon: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.15)', padding: 6, borderRadius: 15 },
  popularInfoContainer: { padding: 15 },
  popularName: { fontWeight: 'bold', fontSize: 16, color: '#333', marginBottom: 5 },
  popularLocContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  popularLocPin: { marginRight: 2 },
  popularLocText: { fontSize: 12, color: '#666' },
  popularRatingContainer: { flexDirection: 'row', alignItems: 'center' },
  popularRatingStar: { marginRight: 2 },
  popularRatingText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: COLORS.white, borderRadius: 25, padding: 30, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.blackText, marginBottom: 10 },
  modalMessage: { fontSize: 14, color: COLORS.grayText, textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  modalLoginButton: { width: '100%', backgroundColor: COLORS.terracotta, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  modalLoginText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' }
});