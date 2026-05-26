import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth'; // Added the listener
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../services/firebaseConfig';

export default function AddReviewScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Create a state to hold the user
  const [user, setUser] = useState(null);

  // This actively listens to Firebase to see if you are logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async () => {
    if (!name || !municipality || !description) {
      return Alert.alert('Missing Info', 'Please fill out all fields.');
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'destinations'), {
        name: name,
        municipality: municipality,
        description: description,
        createdBy: user.email, 
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp(), 
      });

      Alert.alert('Success!', 'Your spot has been added to Waypoint.');
      
      setName('');
      setMunicipality('');
      setDescription('');
      router.push('/explore');

    } catch (error) {
      Alert.alert('Error', 'Could not add destination: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add a Spot</Text>
        <Text style={styles.subtitle}>Found a hidden gem? Share it!</Text>
      </View>

      <View style={styles.content}>
        {/* IF GUEST: Show restriction message */}
        {!user ? (
          <View style={styles.centerContent}>
            <Text style={styles.guestText}>You must be logged in to add a destination.</Text>
            <TouchableOpacity style={styles.submitButton} onPress={() => router.push('/profile')}>
              <Text style={styles.buttonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* IF LOGGED IN: Show the form */
          <View style={styles.formContainer}>
            <Text style={styles.label}>Destination Name</Text>
            <TextInput style={styles.input} placeholder="e.g., Paguriran Island" value={name} onChangeText={setName} />

            <Text style={styles.label}>Municipality</Text>
            <TextInput style={styles.input} placeholder="e.g., Sorsogon City" value={municipality} onChangeText={setMunicipality} />

            <Text style={styles.label}>Description</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholder="What makes this place special?" 
              value={description} 
              onChangeText={setDescription}
              multiline={true}
              numberOfLines={4}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Submit Destination</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  header: { padding: 20, marginTop: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#D24A32' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  content: { flex: 1, paddingHorizontal: 20 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  guestText: { fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 20 },
  formContainer: { marginTop: 10 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#D24A32', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});