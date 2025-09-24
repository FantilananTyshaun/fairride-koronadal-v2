import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase'; // make sure this points to your firebase.js

export default function LoginScreen({ navigation, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // ✅ Fetch user data from Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userData;
      if (userDocSnap.exists()) {
        userData = userDocSnap.data();
      } else {
        // fallback if Firestore doc missing
        userData = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || '',
          email: firebaseUser.email,
        };
      }

      // ✅ Save locally
      await AsyncStorage.setItem('loggedInUser', JSON.stringify(userData));

      // ✅ Trigger onLogin callback
      onLogin(userData);
    } catch (error) {
      Alert.alert('Login Failed', error.message);
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>FairRide Koronadal</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#999"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#999"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  logo: { width: 500, height: 150, alignSelf: 'center', marginBottom: 20 },
  title: { textAlign: 'center', fontSize: 22, fontWeight: 'bold', color: 'black', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: 'black', borderRadius: 8, padding: 10, marginBottom: 16, color: 'black' },
  button: { backgroundColor: '#E6F5E6', padding: 14, borderRadius: 10, alignItems: 'center', borderColor: 'black', borderWidth: 1 },
  buttonText: { color: 'black', fontWeight: 'bold', fontSize: 16 },
  link: { color: 'black', textAlign: 'center', marginTop: 20 }
});
