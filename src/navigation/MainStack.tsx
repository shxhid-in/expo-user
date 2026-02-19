import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types';

import ChatScreen from '../screens/main/ChatScreen';
import UPIPaymentScreen from '../screens/main/UPIPaymentScreen';
import VendorStoreScreen from '../screens/main/VendorStoreScreen';
import CategoryMarketplaceScreen from '../screens/main/CategoryMarketplaceScreen';
import OrderPlacedScreen from '../screens/main/OrderPlacedScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="UPIPayment" component={UPIPaymentScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="VendorStore" component={VendorStoreScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="CategoryMarketplace" component={CategoryMarketplaceScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="OrderPlaced" component={OrderPlacedScreen} options={{ presentation: 'fullScreenModal' }} />
        </Stack.Navigator>
    );
}
