//ProfileScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { auth, db } from '../../services/firebase';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function ProfileScreen({ onLogout }) {
  const [userData, setUserData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert('Not Logged In', 'Please log in first.');
        if (onLogout) onLogout();
        return;
      }

      try {
        const uid = currentUser.uid;
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setName(data.name || '');
          setEmail(data.email || '');
        } else {
          // Create Firestore user doc if missing
          const newData = {
            name: currentUser.displayName || '',
            email: currentUser.email || '',
          };
          await setDoc(doc(db, 'users', uid), newData);
          setUserData(newData);
          setName(newData.name);
          setEmail(newData.email);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        Alert.alert('Error', 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!name || !email) {
      Alert.alert('Missing Fields', 'Name and Email cannot be empty.');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      // Update Firebase Auth
      await updateProfile(currentUser, { displayName: name });
      if (currentUser.email !== email) {
        await updateEmail(currentUser, email);
      }
      if (password) {
        await updatePassword(currentUser, password);
      }

      // Update Firestore
      const uid = currentUser.uid;
      await setDoc(doc(db, 'users', uid), { name, email }, { merge: true });

      setUserData({ name, email });
      setEditing(false);
      setPassword('');
      Alert.alert('Success', 'Profile updated!');
    } catch (err) {
      console.error('Error updating profile:', err);
      Alert.alert('Update Failed', err.message);
    }
  };

  const handleLogout = async () => {
    if (auth.currentUser) {
      await auth.signOut();
    }
    if (onLogout) onLogout();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="green" />
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.empty}>No profile found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Avatar + Name */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userData.name ? userData.name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.profileName}>{userData.name || 'Unnamed User'}</Text>
      </View>

      {!editing ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Email</Text>
          <Text style={styles.cardValue}>{userData.email || 'No email set'}</Text>

          <TouchableOpacity style={styles.primaryButton} onPress={() => setEditing(true)}>
            <Text style={styles.primaryButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter name"
              placeholderTextColor="#888"
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
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter new password"
              secureTextEntry
              placeholderTextColor="#888"
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'green',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
  },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    color: '#444',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: 'black',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    color: 'black',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: 'green',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cancelText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    padding: 14,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: 'red',
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
