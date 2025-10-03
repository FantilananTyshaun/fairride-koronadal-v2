// App.js
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './src/services/firebase';

import ReportStack from './src/navigation/FareStack';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import HomeStack from './src/navigation/HomeStack';
import HistoryStack from './src/navigation/HistoryStack';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Watch Firebase authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false); // mark loading complete
    });
    return unsubscribe; // cleanup listener
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );

  const MainTabs = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleAlign: 'left',
        headerTitleStyle: {
          fontSize: 30,
          fontWeight: 'bold',
          color: 'green',
        },
        tabBarStyle: { backgroundColor: '#fff', paddingBottom: 5 },
        tabBarLabelStyle: { fontSize: 14 },
        tabBarActiveTintColor: 'green',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color }) => {
          let iconName;

          if (route.name === 'FareCalculator') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'TripHistory') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Report') {
            iconName = focused ? 'warning' : 'warning-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="FareCalculator"
        component={HomeStack}
        options={{
          title: 'FairRide Koronadal',
          tabBarLabel: 'Home',
        }}
      />

      <Tab.Screen
        name="TripHistory"
        component={HistoryStack}
        options={{
          title: 'Trip History',
          tabBarLabel: 'History',
        }}
      />

      <Tab.Screen
        name="FareMatrix"
        component={ReportStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Fare Matrix',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'help-circle' : 'help-circle-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      >
        {() => <ProfileScreen onLogout={handleLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );

  if (loading) {
    // show a temporary loading indicator inside SafeAreaView
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="green" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {user ? <MainTabs /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
