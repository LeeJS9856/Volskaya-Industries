import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomePage } from './src/pages/HomePage';
import { AddPersonPage } from './src/pages/AddPersonPage';

export type RootStackParamList = {
  HomePage: undefined;
  AddPersonPage: undefined;
};

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomePage} options={{ title: '홈' }} />
        <Stack.Screen name="AddPersonPage" component={AddPersonPage} options={{ title: '인물 등록' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
