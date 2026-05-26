import { Quicksand_700Bold, useFonts } from '@expo-google-fonts/quicksand';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { auth, db } from '../services/firebaseConfig';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const IMAGE_HEIGHT_DOWN = SCREEN_HEIGHT * 0.55;
const IMAGE_HEIGHT_UP = SCREEN_HEIGHT * 0.25;
const SHEET_SNAP_Y_DOWN = SCREEN_HEIGHT * 0.45;
const SHEET_SNAP_Y_UP = 80;

const COLORS = {
  terracotta: '#D24A32',
  cream: '#FAF8F5',
  grayText: '#6C7280',
  blackText: '#1F2937',
  white: '#FFFFFF',
  inputBg: '#F3F4F6'
};

const AnimatedHeartIcon = ({ isFavorite, onPress, style, iconSize = 32 }) => {
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
          color={COLORS.terracotta} 
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function DetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [fontsLoaded] = useFonts({ Quicksand_700Bold });
  
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isFavorite, setIsFavorite] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  
  const [reviewText, setReviewText] = useState('');
  // Start with an empty array. Firebase will fill this!
  const [reviews, setReviews] = useState([]);

  const panY = useRef(new Animated.Value(SHEET_SNAP_Y_DOWN)).current;

  const rawName = params.name || '';
  const displayName = rawName.toLowerCase() === 'pakolview' ? 'Pakol View' : rawName;
  const currentSpotId = String(params.id || '');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user || !currentSpotId) return;
    const favId = `${user.uid}_${currentSpotId}`;
    const favRef = doc(db, 'favorites', favId);
    
    const unsubFav = onSnapshot(favRef, (docSnap) => {
      setIsFavorite(docSnap.exists());
    });
    return unsubFav;
  }, [user, currentSpotId]);

  // --- NEW: Live Firebase Reviews Listener ---
  useEffect(() => {
    if (!currentSpotId) return;
    const reviewsQuery = query(collection(db, 'reviews'), where('spotId', '==', currentSpotId));
    
    const unsubReviews = onSnapshot(reviewsQuery, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort so newest reviews show up at the top
      fetchedReviews.sort((a, b) => b.createdAt - a.createdAt);
      setReviews(fetchedReviews);
    });
    return unsubReviews;
  }, [currentSpotId]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const toggleFavorite = async () => {
    if (!user) {
      setLoginModalVisible(true);
      return;
    }
    
    const favId = `${user.uid}_${currentSpotId}`;
    const favRef = doc(db, 'favorites', favId);
    
    try {
      if (isFavorite) {
        await deleteDoc(favRef);
      } else {
        await setDoc(favRef, {
          ...params,
          userId: user.uid,
          spotId: currentSpotId,
          id: currentSpotId,
          name: displayName,
        });
      }
    } catch (error) { console.error(error); }
  };

  // --- NEW: Actually Save the Review to Firebase ---
  const handleAddReview = async () => {
    if (!user) { setLoginModalVisible(true); return; }
    if (reviewText.trim().length === 0) return;
    
    try {
      await addDoc(collection(db, 'reviews'), {
        userId: user.uid,
        user: user.displayName || user.email.split('@')[0],
        text: reviewText.trim(),
        spotId: currentSpotId,
        createdAt: Date.now()
      });
      setReviewText('');
      Keyboard.dismiss();
    } catch (error) {
      console.error("Error adding review: ", error);
      alert("Failed to submit review.");
    }
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false, 
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dy) > 2 && Math.abs(gestureState.vy) > Math.abs(gestureState.vx);
    },
    onPanResponderGrant: () => {
      panY.extractOffset(); 
    },
    onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
    onPanResponderRelease: (evt, gestureState) => {
      panY.flattenOffset(); 
      const midPoint = (SHEET_SNAP_Y_DOWN + SHEET_SNAP_Y_UP) / 2;
      
      if (gestureState.vy > 0.2 || panY._value > midPoint) {
         Animated.spring(panY, { toValue: SHEET_SNAP_Y_DOWN, useNativeDriver: false, bounciness: 4 }).start();
      } else {
         Animated.spring(panY, { toValue: SHEET_SNAP_Y_UP, useNativeDriver: false, bounciness: 4 }).start();
      }
    },
  })).current;

  const getCoordinates = (spotName) => {
    const name = String(spotName || '').toLowerCase().trim();

    if (name.includes('rompeolas')) return { latitude: 12.9735, longitude: 123.9980 }; 
    if (name.includes('paguriran')) return { latitude: 13.0805, longitude: 124.0863 }; 
    if (name.includes('bulusan lake')) return { latitude: 12.7533, longitude: 124.0580 }; 
    if (name.includes('palogtok')) return { latitude: 12.7370, longitude: 124.1210 }; 
    if (name.includes('subic')) return { latitude: 12.5292, longitude: 124.1378 }; 
    if (name.includes('tikling')) return { latitude: 12.5750, longitude: 124.1170 }; 
    if (name.includes('whale shark') || name.includes('donsol')) return { latitude: 12.9090, longitude: 123.5940 }; 
    if (name.includes('buenavista')) return { latitude: 12.9240, longitude: 124.1320 }; 
    if (name.includes('lola sayong') || name.includes('eco-surf')) return { latitude: 12.9262, longitude: 124.1305 }; 
    if (name.includes('barcelona church') || name.includes('st. joseph') || name.includes('ruins')) return { latitude: 12.8687, longitude: 124.1420 }; 
    if (name.includes('san mateo')) return { latitude: 12.7215, longitude: 124.0270 }; 
    if (name.includes('valley view')) return { latitude: 12.6980, longitude: 124.0180 }; 
    if (name.includes('casa feliz')) return { latitude: 12.8467, longitude: 123.9880 }; 
    if (name.includes('otavi') || name.includes('otabi')) return { latitude: 12.6730, longitude: 123.9350 }; 
    if (name.includes('orok')) return { latitude: 12.8800, longitude: 124.0150 }; 
    if (name.includes('plaza escudero')) return { latitude: 12.8690, longitude: 124.0090 }; 
    if (name.includes('malawmawan')) return { latitude: 12.9260, longitude: 123.8440 }; 
    if (name.includes('gibalon')) return { latitude: 12.8120, longitude: 123.8370 }; 
    if (name.includes('bucalbucalan')) return { latitude: 12.8300, longitude: 123.8600 }; 
    if (name.includes('panumbagan')) return { latitude: 12.9320, longitude: 123.7510 }; 
    if (name.includes('mangrove') || name.includes('prieto diaz')) return { latitude: 13.0460, longitude: 124.1950 }; 
    if (name.includes('pakol')) return { latitude: 12.6500, longitude: 124.1090 }; 

    return { latitude: 12.8500, longitude: 123.9500 };
  };

  const getFullAddress = (spotName, defaultMuni) => {
    const name = String(spotName || '').toLowerCase().trim();
    if (name.includes('rompeolas')) return "Brgy. Talisay, Sorsogon City";
    if (name.includes('paguriran')) return "Brgy. Sawanga, Bacon District, Sorsogon City";
    if (name.includes('bulusan lake')) return "Bulusan Volcano Natural Park, San Roque, Bulusan";
    if (name.includes('palogtok')) return "Brgy. San Roque, Bulusan";
    if (name.includes('subic')) return "Calintaan Island, Brgy. Calintaan, Matnog";
    if (name.includes('tikling')) return "Tikling Island, Matnog";
    if (name.includes('whale shark') || name.includes('donsol')) return "Brgy. Dancalan, Donsol";
    if (name.includes('buenavista')) return "Brgy. Buenavista, Gubat";
    if (name.includes('lola sayong') || name.includes('eco-surf')) return "Brgy. Buenavista, Gubat";
    if (name.includes('barcelona church') || name.includes('st. joseph') || name.includes('ruins')) return "Brgy. Poblacion Sur, Barcelona";
    if (name.includes('san mateo')) return "Brgy. San Mateo, Irosin";
    if (name.includes('valley view')) return "Brgy. San Pedro, Irosin";
    if (name.includes('casa feliz')) return "Brgy. South Poblacion, Juban";
    if (name.includes('otavi') || name.includes('otabi')) return "Brgy. Otavi, Bulan";
    if (name.includes('orok')) return "Brgy. Orok, Casiguran";
    if (name.includes('plaza escudero')) return "Brgy. Central, Casiguran";
    if (name.includes('malawmawan')) return "Brgy. Macalaya, Castilla";
    if (name.includes('gibalon')) return "Brgy. Siuton, Magallanes";
    if (name.includes('bucalbucalan')) return "Brgy. Bucalbucalan, Magallanes";
    if (name.includes('panumbagan')) return "Brgy. Bantayan, Pilar";
    if (name.includes('mangrove') || name.includes('prieto diaz')) return "Brgy. Diamante, Prieto Diaz";
    if (name.includes('pakol')) return "Brgy. San Bartolome, Santa Magdalena";

    return defaultMuni ? `${defaultMuni}, Sorsogon` : "Sorsogon, Philippines";
  };

  const getExtendedStory = (spotName) => {
    const name = String(spotName || '').toLowerCase().trim();

    if (name.includes('rompeolas')) return "Rompeolas serves as the iconic baywalk of Sorsogon City. Originally built to protect the coastal barangays from strong waves during typhoons, it has transformed into the city's premier leisure spot. Locals gather here during the late afternoon to catch the spectacular golden sunset over Sorsogon Bay, jog along the sea wall, and indulge in a vibrant street food scene.";
    if (name.includes('paguriran')) return "Paguriran Island is a true geological wonder. Not exactly a typical island, it is a jagged, craggy rock formation sitting right in the middle of the shallow sea. The rocks form a natural, enclosed lagoon that fills up with clear sea water during high tide. It feels like your own private swimming pool created by nature.";
    if (name.includes('bulusan lake')) return "Dubbed the 'Switzerland of the Orient', Bulusan Lake is nestled at the heart of the Bulusan Volcano National Park. The emerald green waters are completely surrounded by lush rainforests, creating a tranquil, almost mystical atmosphere. Visitors can kayak across the calm waters, walk the paved path around the lake, or just listen to the rich chorus of endemic birds.";
    if (name.includes('subic')) return "Don't let the name confuse you—this isn't the Subic in Zambales! Subic Beach in Matnog is famous across the country for its uniquely pinkish sand, created by crushed red organ-pipe corals mixed with the white grains. The waters here drop into a vibrant turquoise, offering some of the clearest swimming conditions in the province.";
    if (name.includes('donsol')) return "Donsol placed Sorsogon on the global tourism map. Known as the 'Whale Shark Capital of the World', it offers one of the most ethical marine wildlife interactions available. Instead of feeding the sharks to keep them around, the guides rely on the natural migration patterns of these gentle giants (locally called 'Butanding') as they pass through the nutrient-rich waters.";
    if (name.includes('lola sayong') || name.includes('eco-surf') || name.includes('buenavista')) return "Gubat's surf camps are more than just destinations; they are movements. Run by a dedicated community of local surfers, these camps promote sustainable tourism, youth education, and environmental protection. It offers a laid-back, bohemian vibe where beginners can learn to ride the Pacific waves on fine gray sand.";
    if (name.includes('barcelona church') || name.includes('st. joseph') || name.includes('ruins')) return "The architectural marvels of Barcelona take you back to the Spanish era. Built in 1874 without the use of cement, the thick walls of the St. Joseph Parish were constructed using coral stones taken from the sea and bound together using a mixture of egg whites, lime, and tuba (coconut wine). Across it lie the ruins of the old presidencia, facing the sea.";
    if (name.includes('juban') || name.includes('casa feliz')) return "Walking through Juban is like taking a step back in time. The municipality is famous for its concentration of beautifully preserved 'Bahay na Bato' (stone houses) from the Spanish colonial period. These ancestral homes feature capiz shell windows, intricate wooden carvings, and massive stone foundations, preserving the affluent history of the abaca trade era.";
    if (name.includes('san mateo')) return "Nestled in the lush landscapes of Irosin, which lies inside a caldera, San Mateo Hot Spring provides natural thermal waters heated by the nearby Bulusan Volcano. The warm, mineral-rich pools are believed to have therapeutic properties, making it the perfect place to relax sore muscles after a long day of exploring.";

    return "This destination is one of the true hidden gems of the Bicol region. Rich in local culture and surrounded by untouched natural beauty, it offers visitors a chance to step away from the bustling city life. Whether you are looking for relaxation, photography opportunities, or a deeper connection with nature, this spot captures the heart of what makes Sorsogon so special.";
  };

  const getGoodToKnow = (spotName) => {
    const name = String(spotName || '').toLowerCase().trim();
    if (name.includes('donsol')) return { time: "Dec to May", highlights: "Whale shark interaction." };
    if (name.includes('subic') || name.includes('tikling')) return { time: "March to May", highlights: "Pinkish sand, island hopping." };
    if (name.includes('sayong') || name.includes('eco-surf') || name.includes('buenavista')) return { time: "October to March", highlights: "Surfing, beach camping." };
    if (name.includes('rompeolas')) return { time: "4:00 PM to 6:00 PM", highlights: "Sunset & Street food." };
    return { time: "Dry season (Feb to May)", highlights: "Sightseeing and local culture." };
  };

  const spotCoords = getCoordinates(params.name);
  const fullAddress = getFullAddress(params.name, params.municipality);
  const goodToKnowData = getGoodToKnow(params.name);

  const openDirectionsInNativeMap = () => {
    const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
    const url = scheme + `${spotCoords.latitude},${spotCoords.longitude}?q=${encodeURIComponent(displayName)}`;
    Linking.openURL(url).catch(() => {
      alert("Could not open maps. Make sure a map app is installed.");
    });
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

  const imageScale = panY.interpolate({
    inputRange: [SHEET_SNAP_Y_UP, SHEET_SNAP_Y_DOWN],
    outputRange: [1, 1.2],
    extrapolate: 'clamp',
  });
  const imageHeight = panY.interpolate({
    inputRange: [SHEET_SNAP_Y_UP, SHEET_SNAP_Y_DOWN],
    outputRange: [IMAGE_HEIGHT_UP, IMAGE_HEIGHT_DOWN],
    extrapolate: 'clamp',
  });

  if (!fontsLoaded) return null;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Animated.Image 
          source={getLocalSpotImage(params.name, params.municipality)} 
          style={[styles.bgImage, { height: imageHeight, transform: [{ scale: imageScale }] }]}
          resizeMode="cover"
        />

        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.iconCircle} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.grayText} />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: panY }] }]}>
          
          <View {...panResponder.panHandlers} style={styles.dragZone}>
            <View style={styles.handleContainer}><View style={styles.handlePill} /></View>
            
            <View style={styles.sheetHeader}>
              <View style={styles.titleLocBlock}>
                 <Text style={styles.placeTitle}>{displayName || 'Destination'}</Text>
                 <View style={styles.locBlock}>
                    <Ionicons name="location-outline" size={16} color={COLORS.terracotta} style={{marginTop: 2}} />
                    <Text style={styles.locText}>{fullAddress}</Text>
                 </View>
              </View>
              
              <AnimatedHeartIcon 
                isFavorite={isFavorite}
                onPress={toggleFavorite}
                iconSize={32}
              />
            </View>

            <View style={styles.tabsContainer}>
              <TouchableOpacity style={styles.tabButton} onPress={() => handleTabChange('Overview')}>
                <Text style={[styles.tabText, activeTab === 'Overview' && styles.activeTabText]}>Overview</Text>
                {activeTab === 'Overview' && <View style={styles.activeLine} />}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.tabButton} onPress={() => handleTabChange('Map')}>
                <Text style={[styles.tabText, activeTab === 'Map' && styles.activeTabText]}>Map</Text>
                {activeTab === 'Map' && <View style={styles.activeLine} />}
              </TouchableOpacity>

              <TouchableOpacity style={styles.tabButton} onPress={() => handleTabChange('Reviews')}>
                <Text style={[styles.tabText, activeTab === 'Reviews' && styles.activeTabText]}>Reviews</Text>
                {activeTab === 'Reviews' && <View style={styles.activeLine} />}
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              
              {activeTab === 'Overview' && (
                <View>
                  <Text style={styles.shortDescription}>{params.description}</Text>
                  <View style={styles.divider} />
                  <Text style={styles.sectionHeading}>The Story</Text>
                  <Text style={styles.longDescription}>{getExtendedStory(params.name)}</Text>
                  <Text style={styles.sectionHeading}>Good to Know</Text>
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={20} color={COLORS.terracotta} style={styles.infoIcon}/>
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoTitle}>Best Time to Visit</Text>
                      <Text style={styles.infoDesc}>{goodToKnowData.time}</Text>
                    </View>
                  </View>
                </View>
              )}

              {activeTab === 'Map' && (
                <View style={styles.mapTabContainer}>
                  <Text style={styles.sectionHeading}>Location Details</Text>
                  <Text style={[styles.infoDesc, { marginBottom: 15 }]}>Explore the area surrounding {displayName}.</Text>
                  
                  <View style={styles.mapWrapper} pointerEvents="none">
                    <MapView
                      style={styles.map}
                      mapType="satellite" 
                      initialRegion={{
                        ...spotCoords,
                        latitudeDelta: 0.015,
                        longitudeDelta: 0.0121,
                      }}
                      scrollEnabled={false}
                      zoomEnabled={false}
                      pitchEnabled={false}
                      rotateEnabled={false}
                    >
                      <Marker
                        coordinate={spotCoords}
                        title={displayName}
                        description={fullAddress}
                      >
                        <View style={styles.customMarker}>
                           <Ionicons name="location" size={30} color={COLORS.terracotta} />
                        </View>
                      </Marker>
                    </MapView>
                  </View>

                  <TouchableOpacity style={styles.directionsBtn} onPress={openDirectionsInNativeMap} activeOpacity={0.8}>
                    <Ionicons name="navigate" size={20} color="#fff" />
                    <Text style={styles.directionsBtnText}>Get Directions</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeTab === 'Reviews' && (
                <View>
                  <View style={styles.inputRow}>
                    <TextInput style={styles.reviewInput} placeholder="Write a review..." value={reviewText} onChangeText={setReviewText} multiline />
                    <TouchableOpacity style={styles.sendButton} onPress={handleAddReview}>
                        <Ionicons name="send" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                  
                  {reviews.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: COLORS.grayText, marginTop: 20 }}>
                      No reviews yet. Be the first to review!
                    </Text>
                  ) : (
                    reviews.map(item => (
                      <View key={item.id} style={styles.reviewCard}>
                          <Text style={styles.reviewUser}>{item.user}</Text>
                          <Text style={styles.reviewText}>{item.text}</Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>

        <Modal animationType="fade" transparent={true} visible={loginModalVisible} onRequestClose={() => setLoginModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons name="person-circle" size={60} color={COLORS.terracotta} style={{ marginBottom: 15 }} />
              <Text style={styles.modalTitle}>Sign In Required</Text>
              <Text style={styles.modalMessage}>Please sign in to save destinations or write a review!</Text>
              <TouchableOpacity style={styles.modalLoginButton} onPress={() => { setLoginModalVisible(false); router.push('/profile'); }}>
                <Text style={styles.modalLoginText}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLoginModalVisible(false)} style={{ marginTop: 15 }}>
                <Text style={{ color: COLORS.grayText }}>Not now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  bgImage: { position: 'absolute', width: '100%' },
  topHeader: { position: 'absolute', top: 60, left: 20, zIndex: 10 },
  iconCircle: { width: 45, height: 45, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' },
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SCREEN_HEIGHT, backgroundColor: COLORS.white, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 15 },
  
  dragZone: { width: '100%', backgroundColor: 'transparent' },
  handleContainer: { alignItems: 'center', paddingVertical: 20 },
  handlePill: { width: 40, height: 5, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.1)' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 30, paddingBottom: 15 },
  
  titleLocBlock: { flex: 1, paddingRight: 15 },
  placeTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.blackText },
  locBlock: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 5 },
  locText: { fontSize: 14, color: COLORS.grayText, marginLeft: 4, flexShrink: 1, lineHeight: 20 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 30, marginTop: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tabButton: { marginRight: 30, paddingBottom: 10 },
  tabText: { fontSize: 16, fontWeight: '600', color: COLORS.grayText },
  activeTabText: { color: COLORS.terracotta },
  activeLine: { width: '100%', height: 3, backgroundColor: COLORS.terracotta, marginTop: 7 },
  scrollContent: { paddingHorizontal: 30, paddingBottom: 150, paddingTop: 20 },
  
  mapTabContainer: { flex: 1 },
  mapWrapper: { width: '100%', height: 250, borderRadius: 20, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#F0F0F0' },
  map: { width: '100%', height: '100%' },
  customMarker: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5 },
  directionsBtn: { backgroundColor: COLORS.terracotta, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 15, borderRadius: 15, marginBottom: 20 },
  directionsBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },

  shortDescription: { color: COLORS.blackText, fontSize: 18, fontWeight: '600', lineHeight: 26, marginBottom: 15 },
  divider: { width: '100%', height: 1, backgroundColor: '#F0F0F0', marginBottom: 20 },
  sectionHeading: { fontSize: 20, fontWeight: 'bold', color: COLORS.blackText, marginBottom: 10, marginTop: 10 },
  longDescription: { color: COLORS.grayText, fontSize: 15, lineHeight: 24, marginBottom: 25, textAlign: 'justify' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  infoIcon: { marginRight: 15, backgroundColor: '#FFF0ED', padding: 10, borderRadius: 12 },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.blackText, marginBottom: 2 },
  infoDesc: { fontSize: 14, color: COLORS.grayText },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  reviewInput: { flex: 1, backgroundColor: COLORS.inputBg, borderRadius: 12, padding: 15, fontSize: 15, minHeight: 50 },
  sendButton: { backgroundColor: COLORS.terracotta, width: 50, height: 50, borderRadius: 12, marginLeft: 10, justifyContent: 'center', alignItems: 'center' },
  reviewCard: { backgroundColor: COLORS.white, padding: 18, borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  reviewUser: { fontWeight: 'bold', fontSize: 15, color: COLORS.blackText, marginBottom: 5 },
  reviewText: { fontSize: 14, color: COLORS.grayText },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: COLORS.white, borderRadius: 25, padding: 30, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.blackText, marginBottom: 10 },
  modalMessage: { fontSize: 14, color: COLORS.grayText, textAlign: 'center', marginBottom: 25 },
  modalLoginButton: { width: '100%', backgroundColor: COLORS.terracotta, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  modalLoginText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' }
});