import { useState, useEffect, useRef } from 'react'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { api } from '../lib/api'

// Set global handler so notifications show up even when app is foregrounded
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
})

// Error helper
function handleRegistrationError(errorMessage: string) {
    console.warn(`[Push Error] ${errorMessage}`)
    throw new Error(errorMessage)
}

/**
 * Sync logic:
 * Call `registerForPushNotificationsAsync` to attempt to get the Expo Token.
 * If successful, we push it to the backend via `api.profile.updatePushToken`.
 */
export async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'DynoSync Messages',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#3ea8ff',
        })
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync()
            finalStatus = status
        }

        if (finalStatus !== 'granted') {
            handleRegistrationError('Permission not granted to get push token for push notification!')
            return null
        }

        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId

        // In SDK 50+ you might need a projectId. But often Expo Go works without it, we try to pass it if we have it
        try {
            const pushTokenString = (
                await Notifications.getExpoPushTokenAsync({
                    projectId,
                })
            ).data
            return pushTokenString
        } catch (e: unknown) {
            handleRegistrationError(`${e}`)
        }
    } else {
        handleRegistrationError('Must use physical device for push notifications')
    }
}

export function usePushNotifications() {
    const [expoPushToken, setExpoPushToken] = useState('')
    const [notification, setNotification] = useState<Notifications.Notification | undefined>(
        undefined
    )
    const notificationListener = useRef<Notifications.Subscription | null>(null)
    const responseListener = useRef<Notifications.Subscription | null>(null)
    const [isRegistering, setIsRegistering] = useState(false)

    useEffect(() => {
        notificationListener.current = Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
            setNotification(notification)
        })

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
            // You can handle notification taps here
            console.log('User tapped notification', response)
        })

        return () => {
            notificationListener.current?.remove()
            responseListener.current?.remove()
        }
    }, [])

    /**
     * Helper to enable push explicitly.
     * Gets the token -> sends to API -> returns true if success.
     */
    const enablePush = async () => {
        setIsRegistering(true)
        try {
            const token = await registerForPushNotificationsAsync()
            if (token) {
                setExpoPushToken(token)
                // Send to backend
                try {
                    await api.profile.updatePushToken(token)
                    return { success: true }
                } catch (apiError: any) {
                    console.error('[Push API Error]', apiError)
                    return { success: false, error: apiError.message || 'Server error' }
                }
            }
            return { success: false, error: 'User denied permission or device not supported' }
        } catch (e: any) {
            console.error('[Push Hook Error]', e)
            return { success: false, error: e.message }
        } finally {
            setIsRegistering(false)
        }
    }

    return {
        expoPushToken,
        notification,
        enablePush,
        isRegistering
    }
}
