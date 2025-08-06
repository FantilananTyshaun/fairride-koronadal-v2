// profilescreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation, onLogout }) {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem('loggedInUser');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setName(parsed.name || '');
        setEmail(parsed.email || '');
        setPassword(parsed.password || '');
      }
    };
    loadUser();
  }, []);

  const handleSave = async () => {
    const updatedUser = { name, email, password };
    await AsyncStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setEditing(false);
    Alert.alert('Success', 'Profile updated');
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('loggedInUser');
    if (onLogout) {
      onLogout();
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.empty}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!editing ? (
        <>
          <Text style={styles.centerLabel}>Name</Text>
          <Text style={styles.centerValue}>{user.name}</Text>

          <TouchableOpacity style={styles.button} onPress={() => setEditing(true)}>
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>

          {/* Logout only visible when NOT editing */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setEditing(false)}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  centerLabel: {
    fontWeight: 'bold',
    fontSize: 20,
    color: 'black',
    textAlign: 'center',
    marginBottom: 6,
    marginTop: 6,
  },
  centerValue: {
    fontSize: 18,
    color: 'black',
    marginBottom: 16,
    textAlign: 'center',
  },
  formGroup: {
    width: 300,
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'black',
    marginBottom: 4,
    textAlign: 'left',
  },
  input: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 8,
    padding: 10,
    color: 'black',
  },
  button: {
    backgroundColor: '#E6F5E6',
    padding: 14,
    width: 200,
    borderRadius: 10,
    borderColor: 'black',
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 12,
    padding: 12,
    width: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    padding: 14,
    marginTop: 24,
    width: 200,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: 'black',
  },
});
