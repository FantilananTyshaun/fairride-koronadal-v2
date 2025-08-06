import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import CalculateFareScreen from './src/screens/home/CalculateFareScreen';
import HistoryScreen from './src/screens/history/HistoryScreen';
import ReportStack from './src/navigation/ReportStack';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';

import HistoryStack from './src/navigation/HistoryStack';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem('loggedInUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
    loadUser();
  }, []);

  const handleLogin = async (userData) => {
    await AsyncStorage.setItem('loggedInUser', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('loggedInUser');
    setUser(null);
  };

  const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
      </Stack.Screen>
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
        tabBarIcon: ({ focused, color, size }) => {
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
        component={CalculateFareScreen}
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
        name="Report"
        component={ReportStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Report',
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

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {user ? <MainTabs /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
