import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAppState } from '../store/AppContext';
import * as storageService from '../services/storage';

import AuthStack from './AuthStack';
import MainStack from './MainStack';

const Root = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const { state, dispatch } = useAppState();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        async function restoreState() {
            try {
                const [user, cart, orders, tags, activeVendor] = await Promise.all([
                    storageService.getUser(),
                    storageService.getCart(),
                    storageService.getOrders(),
                    storageService.getTags(),
                    storageService.getActiveVendor(),
                ]);

                if (user) {
                    dispatch({
                        type: 'RESTORE_STATE',
                        payload: {
                            user,
                            isAuthenticated: true,
                            cart,
                            orderHistory: orders,
                            tags,
                            activeVendorId: activeVendor?.vendorId || null,
                            activeVendorName: activeVendor?.vendorName || null,
                            activeVendorImage: activeVendor?.vendorImage || null,
                        }
                    });
                }
            } catch (e) {
                console.warn('Failed to restore state:', e);
            } finally {
                setIsReady(true);
            }
        }
        restoreState();
    }, []);

    if (!isReady) return null;

    const Nav = NavigationContainer as any;

    return (
        <Nav>
            <Root.Navigator screenOptions={{ headerShown: false }}>
                {state.isAuthenticated ? (
                    <Root.Screen name="Main" component={MainStack} />
                ) : (
                    <Root.Screen name="Auth" component={AuthStack} />
                )}
            </Root.Navigator>
        </Nav>
    );
}
