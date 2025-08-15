import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import GroupChannelScreen from './screens/GroupChannelScreen';
import IndividualChatScreen from './screens/IndividualChatScreen';
import SettingsScreen from './screens/SettingsScreen';
import DeviceListScreen from './screens/DeviceListScreen';

// Import services
import {AudioService} from './services/AudioService';
import {NetworkService} from './services/NetworkService';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({color, size}) => {
          let iconName: string;

          if (route.name === 'GroupChannel') {
            iconName = 'group';
          } else if (route.name === 'Devices') {
            iconName = 'devices';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}>
      <Tab.Screen
        name="GroupChannel"
        component={GroupChannelScreen}
        options={{title: 'Group Channel'}}
      />
      <Tab.Screen
        name="Devices"
        component={DeviceListScreen}
        options={{title: 'Devices'}}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{title: 'Settings'}}
      />
    </Tab.Navigator>
  );
}

const App: React.FC = () => {
  React.useEffect(() => {
    // Initialize services
    AudioService.initialize();
    NetworkService.initialize();

    return () => {
      // Cleanup services
      AudioService.cleanup();
      NetworkService.cleanup();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="IndividualChat"
            component={IndividualChatScreen}
            options={{title: 'Individual Chat'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
