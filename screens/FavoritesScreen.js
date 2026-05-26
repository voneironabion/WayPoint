import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  SafeAreaView,
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

// --- PREMIUM FEATURE 1: BOUNCING HEART COMPONENT ---
const AnimatedHeartIcon = ({ isFavorite, onPress, style, iconSize = 28 }) => {
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
        <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={iconSize} color={COLORS.terracotta} />
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

export default function FavoritesScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
      return;
    }
    const favQuery = query(collection(db, 'favorites'), where('userId', '==', user.uid));
    const unsubFav = onSnapshot(favQuery, (snapshot) => {
      setFavorites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false); // Data arrived, turn off skeleton!
    });
    return unsubFav;
  }, [user]);

  // --- THE FIX: Point exactly to the user's specific favorite document ID ---
  const removeFromFavorites = async (item) => {
    if (!user) return;
    
    // We use the exact same combination used to save the favorite!
    const actualSpotId = item.spotId || item.id;
    const favoriteRef = doc(db, 'favorites', `${user.uid}_${actualSpotId}`);
    
    try {
      await deleteDoc(favoriteRef);
    } catch (error) { 
      console.error("Error removing favorite:", error); 
    }
  };

  const renderFavoriteCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.cardContainer}
      onPress={() => router.push({ pathname: '/detail', params: item })}
      activeOpacity={0.9}
    >
       <Image source={getLocalSpotImage(item.name, item.municipality)} style={styles.cardImage} />
       
       <AnimatedHeartIcon 
         style={styles.heartButton} 
         isFavorite={true} 
         onPress={() => removeFromFavorites(item)} 
         iconSize={28} 
       />

       <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.gradientOverlay}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.locationRow}>
             <Ionicons name="location" size={14} color={COLORS.terracotta} />
             <Text style={styles.cardLocation}>{item.municipality}</Text>
          </View>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description || "One of your favorite Sorsogon destinations."}
          </Text>
       </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Saved Spots</Text>
        <Text style={styles.subTitle}>Your favorite Sorsogon spots</Text>
      </View>

      <View style={styles.contentWrapper}>
        {!user ? (
          <View style={styles.centerContainer}>
            <Text style={styles.promptText}>Please sign in to view your saved spots.</Text>
            <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/profile')}>
              <Text style={styles.loginBtnText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.listContent}>
            <SkeletonPulse style={styles.cardContainer} />
            <SkeletonPulse style={styles.cardContainer} />
          </View>
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={(item) => item.id}
            renderItem={renderFavoriteCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <Text style={styles.promptText}>You haven't saved any spots yet. Go explore and tap some hearts!</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  mainTitle: { fontSize: 34, fontWeight: 'bold', color: COLORS.terracotta },
  subTitle: { fontSize: 16, color: COLORS.grayText, marginTop: 4 },
  contentWrapper: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  cardContainer: { width: '100%', height: 240, backgroundColor: '#E5E7EB', borderRadius: 20, marginBottom: 20, overflow: 'hidden', elevation: 8 },
  cardImage: { position: 'absolute', width: '100%', height: '100%' },
  heartButton: { position: 'absolute', top: 15, right: 15, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 25 },
  gradientOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%', justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 20 },
  cardTitle: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 26, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardLocation: { color: '#E2E8F0', fontSize: 14, fontWeight: '600', marginLeft: 4 },
  cardDesc: { color: '#D1D5DB', fontSize: 13, lineHeight: 18 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 50, marginBottom: 100 },
  promptText: { fontSize: 16, color: COLORS.grayText, textAlign: 'center', lineHeight: 24, marginBottom: 25 },
  loginBtn: { backgroundColor: COLORS.terracotta, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, elevation: 4 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});