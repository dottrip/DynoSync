import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
import { supabase } from '../lib/supabase'
import { Platform } from 'react-native'

/** Result of an image upload with both full-size and thumbnail URLs */
export interface UploadResult {
    imageUrl: string
    thumbUrl: string
}

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

    /**
     * Pick an image from the gallery.
     * quality controls JPEG compression (0-1). Lower = smaller file.
     */
    const pickImage = async (aspect: [number, number] = [16, 9], quality: number = 0.8) => {
        const hasPermission = await requestPermissions()
        if (!hasPermission) return null

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect,
            quality,
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
            quality: 0.7,
        })

        if (!result.canceled && result.assets && result.assets.length > 0) {
            return result.assets[0].uri
        }
        return null
    }

    /**
     * Pick a low-quality version of an image for thumbnail use.
     * Uses ImagePicker's built-in quality parameter.
     */
    const pickImageForThumb = async (uri: string): Promise<string> => {
        // Re-pick with lower quality is not ideal, so we just reuse the same URI
        // The main size saving comes from the quality parameter on the initial pick
        return uri
    }

    /**
     * Upload a single image file to Supabase Storage.
     * Returns the public URL.
     */
    const uploadSingleFile = async (uri: string, fileName: string): Promise<string> => {
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
        })
        const arrayBuffer = decode(base64)

        const ext = uri.split('.').pop()?.toLowerCase() || 'jpg'
        const contentType = ext === 'png' ? 'image/png' : 'image/jpeg'

        const { error } = await supabase.storage
            .from('vehicle_images')
            .upload(fileName, arrayBuffer, {
                contentType,
                upsert: true
            })

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
            .from('vehicle_images')
            .getPublicUrl(fileName)

        return publicUrl
    }

    /**
     * Upload image with compression.
     * The main image uses the picker's quality=0.7 for compression.
     * A thumbnail copy is stored under thumbs/ path for list views.
     * Returns { imageUrl, thumbUrl }
     */
    const uploadImage = async (uri: string, pathPrefix: string = 'vehicles'): Promise<UploadResult | null> => {
        try {
            setUploading(true)

            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('No active session')

            const ts = Date.now()
            const basePath = `${pathPrefix}/${session.user.id}`

            // Upload main image
            const mainFileName = `${basePath}/${ts}.jpg`
            const imageUrl = await uploadSingleFile(uri, mainFileName)

            // Upload same file as thumbnail (same compressed image, different path)
            // In a future iteration, we can use server-side resize (Cloudflare Images)
            const thumbFileName = `${basePath}/thumbs/${ts}.jpg`
            const thumbUrl = await uploadSingleFile(uri, thumbFileName)

            return { imageUrl, thumbUrl }
        } catch (error) {
            console.error('Error uploading image:', error)
            alert(error instanceof Error ? error.message : 'Error uploading image')
            return null
        } finally {
            setUploading(false)
        }
    }

    /**
     * Legacy upload method (returns single URL string for backward compatibility).
     * Used by components that don't need thumbnails (avatars, log media).
     */
    const uploadImageLegacy = async (uri: string, pathPrefix: string = 'vehicles'): Promise<string | null> => {
        const result = await uploadImage(uri, pathPrefix)
        return result?.imageUrl ?? null
    }

    return {
        pickImage,
        takePhoto,
        uploadImage,
        uploadImageLegacy,
        uploading
    }
}
