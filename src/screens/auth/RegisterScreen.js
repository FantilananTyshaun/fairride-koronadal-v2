import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db } from '../../services/firebase'; // Make sure this points to your firebase.js
import { doc, setDoc } from 'firebase/firestore';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Required', 'Please fill out all fields.');
      return;
    }

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // ✅ Update display name in Auth
      await updateProfile(firebaseUser, { displayName: name });

      // ✅ Save user to Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        uid: firebaseUser.uid,
        name: name,
        email: email,
        createdAt: new Date().toISOString(),
      });

      // ✅ Save user locally
      const newUser = {
        uid: firebaseUser.uid,
        name: name,
        email: email,
      };
      await AsyncStorage.setItem('loggedInUser', JSON.stringify(newUser));

      Alert.alert('Success', 'Registration complete!');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', error.message);
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Register</Text>

      <TextInput
        placeholder="Name"
        placeholderTextColor="#999"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
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

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
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
