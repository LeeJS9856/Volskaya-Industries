import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomePage } from './src/pages/HomePage';
import { AddPersonPage } from './src/pages/AddPersonPage';
import { PersonListPage } from './src/pages/PersonListPage';

export type RootStackParamList = {
  HomePage: undefined;
  AddPersonPage: undefined;
  PersonListPage: undefined;
};

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomePage} options={{ title: '홈' }} />
        <Stack.Screen name="AddPersonPage" component={AddPersonPage} options={{ title: '인물 등록' }} />
        <Stack.Screen name="PersonListPage" component={PersonListPage} options={{ title: '등록된 인물 목록' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
