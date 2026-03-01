import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
import { supabase } from '../lib/supabase'
import { Platform } from 'react-native'

export function useImagePicker() {
    const [uploading, setUploading] = useState(false)

    // Request permissions if needed
    const requestPermissions = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') {
                alert('Sorry, we need camera roll permissions to make this work!')
                return false
            }
        }
        return true
    }

    // Pick an image from the gallery
    const pickImage = async (aspect: [number, number] = [16, 9]) => {
        const hasPermission = await requestPermissions()
        if (!hasPermission) return null

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect,
            quality: 0.8,
        })

        if (!result.canceled && result.assets && result.assets.length > 0) {
            return result.assets[0].uri
        }
        return null
    }

    // Take a photo with the camera
    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
            alert('Sorry, we need camera permissions to make this work!')
            return null
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        })

        if (!result.canceled && result.assets && result.assets.length > 0) {
            return result.assets[0].uri
        }
        return null
    }

    // Upload the image to Supabase Storage
    // Returns the public URL of the uploaded image
    const uploadImage = async (uri: string, pathPrefix: string = 'vehicles'): Promise<string | null> => {
        try {
            setUploading(true)

            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('No active session')

            // 1. Read the image as base64 and decode to ArrayBuffer
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            })
            const arrayBuffer = decode(base64)

            // 2. Generate a unique file name
            const ext = uri.split('.').pop() || 'jpg'
            const fileName = `${pathPrefix}/${session.user.id}/${Date.now()}.${ext}`

            // 3. Upload to Supabase Storage
            const { error, data } = await supabase.storage
                .from('vehicle_images')
                .upload(fileName, arrayBuffer, {
                    contentType: `image/${ext}`,
                    upsert: true
                })

            if (error) {
                throw error
            }

            // 4. Retrieve the Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('vehicle_images')
                .getPublicUrl(fileName)

            return publicUrl
        } catch (error) {
            console.error('Error uploading image:', error)
            alert(error instanceof Error ? error.message : 'Error uploading image')
            return null
        } finally {
            setUploading(false)
        }
    }

    return {
        pickImage,
        takePhoto,
        uploadImage,
        uploading
    }
}
