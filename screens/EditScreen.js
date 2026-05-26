import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../services/firebaseConfig';

export default function EditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // Grabs the current spot's data

  // Pre-fill the state with the existing data
  const [name, setName] = useState(params.name || '');
  const [municipality, setMunicipality] = useState(params.municipality || '');
  const [description, setDescription] = useState(params.description || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!name || !municipality || !description) {
      return Alert.alert('Missing Info', 'Please fill out all fields.');
    }

    setIsUpdating(true);

    try {
      // The "Update" Operation!
      const spotRef = doc(db, 'destinations', params.id);
      await updateDoc(spotRef, {
        name: name,
        municipality: municipality,
        description: description,
        updatedAt: serverTimestamp(), // Required by rubric
      });

      Alert.alert('Success!', 'Destination updated successfully.');
      
      // Go back to the explore list to see the changes
      router.push('/explore');

    } catch (error) {
      Alert.alert('Error', 'Could not update: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Spot</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Destination Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Municipality</Text>
          <TextInput style={styles.input} value={municipality} onChangeText={setMunicipality} />

          <Text style={styles.label}>Description</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={description} 
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={4}
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleUpdate} disabled={isUpdating}>
            {isUpdating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  header: { padding: 20, marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 5, marginRight: 15 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#D24A32' },
  content: { flex: 1, paddingHorizontal: 20 },
  formContainer: { marginTop: 10 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#D24A32', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});