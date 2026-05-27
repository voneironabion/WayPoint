import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, 
        tabBarStyle: {
          height: 75, 
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          elevation: 0, 
        },
      }}>
        
      {/* HOME TAB */}
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={focused ? 26 : 24} 
                color={focused ? "#FFFFFF" : "#9CA3AF"} 
              />
            </View>
          ),
        }}
      />

      {/* EXPLORE TAB */}
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <Ionicons 
                name={focused ? "compass" : "compass-outline"} 
                size={focused ? 26 : 24} 
                color={focused ? "#FFFFFF" : "#9CA3AF"} 
              />
            </View>
          ),
        }}
      />

      {/* FAVORITES TAB */}
      <Tabs.Screen
        name="favorites"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <Ionicons 
                name={focused ? "heart" : "heart-outline"} 
                size={focused ? 26 : 24} 
                color={focused ? "#FFFFFF" : "#9CA3AF"} 
              />
            </View>
          ),
        }}
      />

      {/* PROFILE TAB */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <Ionicons 
                name={focused ? "person" : "person-outline"} 
                size={focused ? 26 : 24} 
                color={focused ? "#FFFFFF" : "#9CA3AF"} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 45,
    height: 45,
    borderRadius: 25,
    marginTop: 10,
  },
  activeIconWrapper: {
    backgroundColor: '#D24A32', 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    shadowColor: '#D24A32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  }
});