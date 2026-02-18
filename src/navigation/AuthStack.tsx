import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types';

import SplashScreen from '../screens/auth/SplashScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import NameScreen from '../screens/auth/NameScreen';
import TransitionScreen from '../screens/auth/TransitionScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
            <Stack.Screen name="Name" component={NameScreen} />
            <Stack.Screen name="Transition" component={TransitionScreen} />
        </Stack.Navigator>
    );
}
