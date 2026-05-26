import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { auth, db } from '../services/firebaseConfig';

const COLORS = {
  terracotta: '#D24A32',
  cream: '#FAF8F5',
  grayText: '#6C7280',
  white: '#FFFFFF',
  inputBorder: '#E5E7EB',
  blackText: '#1F2937',
  lightGray: '#F9FAFB',
  lightTerracotta: '#FFF0ED' 
};

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/adventurer/png?seed=Felix&backgroundColor=f3f4f6',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Aneka&backgroundColor=f3f4f6',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Nala&backgroundColor=f3f4f6',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Leo&backgroundColor=f3f4f6',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Destiny&backgroundColor=f3f4f6',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Oliver&backgroundColor=f3f4f6',
];

export default function ProfileScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [savedCount, setSavedCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setDisplayName(u.displayName || '');
        setSelectedAvatar(u.photoURL || AVATAR_OPTIONS[0]);
      }
    });
    return unsubscribe;
  }, []);

  // Fetch live saved spots AND live reviews count
  useEffect(() => {
    if (!user) return;
    
    const favQuery = query(collection(db, 'favorites'), where('userId', '==', user.uid));
    const unsubFav = onSnapshot(favQuery, (snapshot) => {
      setSavedCount(snapshot.docs.length);
    });

    const reviewQuery = query(collection(db, 'reviews'), where('userId', '==', user.uid));
    const unsubRev = onSnapshot(reviewQuery, (snapshot) => {
      setReviewsCount(snapshot.docs.length);
    });

    return () => {
      unsubFav();
      unsubRev();
    };
  }, [user]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      Alert.alert("Login Failed", "Invalid email or password.");
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert("Wait a sec!", "Please enter a name so we know what to call you.");
      return;
    }
    
    setIsSaving(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
        photoURL: selectedAvatar
      });
      setUser({ ...auth.currentUser }); 
      setIsEditing(false);
    } catch (error) {
      Alert.alert("Error", "Could not update profile. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const MenuItem = ({ icon, title, onPress, isDestructive }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconBox, isDestructive && { backgroundColor: '#FEF2F2' }]}>
        <Ionicons name={icon} size={20} color={isDestructive ? '#EF4444' : COLORS.terracotta} />
      </View>
      <Text style={[styles.menuItemText, isDestructive && { color: '#EF4444' }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color={COLORS.grayText} opacity={0.5} />
    </TouchableOpacity>
  );

  if (user) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          
          <View style={styles.topNav}>
             <TouchableOpacity onPress={() => router.back()} style={styles.navButton}>
               <Ionicons name="chevron-back" size={26} color={COLORS.blackText} />
             </TouchableOpacity>
             <TouchableOpacity 
               onPress={() => setIsEditing(!isEditing)} 
               style={styles.navButtonRight}
             >
               <Text style={styles.navButtonText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
             </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              
              <View style={styles.innerContainer}>
                
                <View style={styles.floatingProfileHeader}>
                  <View style={styles.avatarGlowWrapper}>
                    <Image 
                      source={{ uri: user.photoURL || AVATAR_OPTIONS[0] }} 
                      style={styles.floatingAvatar} 
                    />
                  </View>
                  <Text style={styles.profileName}>{user.displayName || 'Sorsogon Explorer'}</Text>
                  <Text style={styles.profileEmail}>{user.email}</Text>
                </View>

                {!isEditing && (
                  <View style={styles.statsRow}>
                     <View style={styles.statPill}>
                        <View style={[styles.statIconBox, { backgroundColor: COLORS.lightTerracotta }]}>
                          <Ionicons name="heart" size={18} color={COLORS.terracotta} />
                        </View>
                        <View>
                          <Text style={styles.statNumber}>{savedCount}</Text>
                          <Text style={styles.statLabel}>Saved</Text>
                        </View>
                     </View>

                     <View style={styles.statPill}>
                        <View style={[styles.statIconBox, { backgroundColor: '#F3F4F6' }]}>
                          <Ionicons name="star" size={18} color="#F59E0B" />
                        </View>
                        <View>
                          <Text style={styles.statNumber}>{reviewsCount}</Text>
                          <Text style={styles.statLabel}>Reviews</Text>
                        </View>
                     </View>
                  </View>
                )}

                {isEditing ? (
                  <View style={styles.editSection}>
                    <Text style={styles.sectionTitle}>Select Avatar</Text>
                    <View style={styles.avatarGrid}>
                      {AVATAR_OPTIONS.map((avatar, index) => (
                        <TouchableOpacity 
                          key={index} 
                          onPress={() => setSelectedAvatar(avatar)}
                          style={[styles.avatarOptionWrapper, selectedAvatar === avatar && styles.avatarOptionSelected]}
                        >
                          <Image source={{ uri: avatar }} style={styles.avatarOption} />
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.sectionTitle}>Display Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="What should we call you?"
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCorrect={false}
                    />

                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Save Changes</Text>}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.menuSection}>
                    <Text style={styles.menuHeader}>Preferences</Text>
                    <View style={styles.menuCard}>
                      <MenuItem icon="notifications-outline" title="Notifications" onPress={() => {}} />
                      <View style={styles.menuDivider} />
                      <MenuItem icon="shield-checkmark-outline" title="Privacy & Security" onPress={() => {}} />
                    </View>

                    <Text style={styles.menuHeader}>Support & Account</Text>
                    <View style={styles.menuCard}>
                      <MenuItem icon="help-circle-outline" title="Help Center" onPress={() => {}} />
                      <View style={styles.menuDivider} />
                      <MenuItem icon="log-out-outline" title="Log Out" onPress={() => signOut(auth)} isDestructive />
                    </View>
                  </View>
                )}

              </View>
            </KeyboardAvoidingView>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.grayText} />
          </TouchableOpacity>

          <View style={styles.loggedOutContainer}>
            <View style={styles.headerArea}>
              <Text style={styles.mainTitle}>Profile</Text>
              <Text style={styles.subTitle}>Sign in to save your Sorsogon trip</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.buttonText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  scrollContent: { paddingBottom: 100 },
  innerContainer: { paddingHorizontal: 20 },
  loggedOutContainer: { flex: 1, paddingHorizontal: 25, justifyContent: 'center' },
  
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: 10, paddingBottom: 5 },
  navButton: { padding: 10 },
  navButtonRight: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: COLORS.lightTerracotta, borderRadius: 20 },
  navButtonText: { color: COLORS.terracotta, fontWeight: 'bold', fontSize: 14 },

  floatingProfileHeader: { alignItems: 'center', marginTop: 10, marginBottom: 25 },
  avatarGlowWrapper: { 
    width: 124, height: 124, borderRadius: 62, backgroundColor: COLORS.white, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    shadowColor: COLORS.terracotta, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 10 
  },
  floatingAvatar: { width: 114, height: 114, borderRadius: 57, backgroundColor: COLORS.lightGray },
  profileName: { fontSize: 26, fontWeight: 'bold', color: COLORS.blackText, marginBottom: 4 },
  profileEmail: { fontSize: 15, color: COLORS.grayText, fontWeight: '500' },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35, paddingHorizontal: 10 },
  statPill: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, 
    flex: 1, marginHorizontal: 8, paddingVertical: 12, paddingHorizontal: 15, borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 
  },
  statIconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: COLORS.blackText },
  statLabel: { fontSize: 12, color: COLORS.grayText, fontWeight: '600' },

  menuSection: { marginBottom: 20 },
  menuHeader: { fontSize: 13, fontWeight: 'bold', color: COLORS.grayText, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, marginLeft: 15 },
  menuCard: { backgroundColor: COLORS.white, borderRadius: 24, paddingVertical: 8, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18 },
  menuIconBox: { width: 40, height: 40, borderRadius: 14, backgroundColor: COLORS.lightTerracotta, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuItemText: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.blackText },
  menuDivider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 73, marginRight: 18 },
  
  editSection: { width: '100%', backgroundColor: COLORS.white, padding: 25, borderRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.blackText, marginBottom: 15 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  avatarOptionWrapper: { width: 65, height: 65, borderRadius: 35, borderWidth: 3, borderColor: 'transparent', marginBottom: 15 },
  avatarOptionSelected: { borderColor: COLORS.terracotta },
  avatarOption: { width: '100%', height: '100%', borderRadius: 30, backgroundColor: COLORS.lightGray },

  headerArea: { marginBottom: 40 },
  mainTitle: { fontSize: 34, fontWeight: 'bold', color: COLORS.terracotta },
  subTitle: { fontSize: 16, color: COLORS.grayText, marginTop: 8 },
  form: { width: '100%' },
  input: { backgroundColor: COLORS.lightGray, height: 55, borderRadius: 16, paddingHorizontal: 18, marginBottom: 15, borderWidth: 1, borderColor: COLORS.inputBorder, fontSize: 16, color: COLORS.blackText },
  
  backButton: { position: 'absolute', top: 10, left: 10, padding: 15, zIndex: 10 },
  loginButton: { backgroundColor: COLORS.terracotta, height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: COLORS.terracotta, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  saveButton: { backgroundColor: COLORS.terracotta, width: '100%', height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: COLORS.terracotta, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' }
});