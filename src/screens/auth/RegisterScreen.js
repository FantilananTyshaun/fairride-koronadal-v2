//RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { registerUser } from '../../services/userService';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      await registerUser(email, password, name);
      Alert.alert('Success', 'Account created.');
      navigation.navigate('Login');
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>FairRide Koronadal</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
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
  link: { color: 'blue', textAlign: 'center', marginTop: 20 }
});
