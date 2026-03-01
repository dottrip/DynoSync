import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Alert } from 'react-native'

export function useFollowBuild(vehicleId: string) {
    const [isFollowing, setIsFollowing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [acting, setActing] = useState(false)

    useEffect(() => {
        if (!vehicleId) return

        // Prevent crashing if user is not fully authed
        api.follows.check(vehicleId)
            .then(res => setIsFollowing(res.isFollowing))
            .catch(err => console.debug('Follow check failed (likely auth):', err.message))
            .finally(() => setLoading(false))
    }, [vehicleId])

    const toggleFollow = async () => {
        if (!vehicleId || acting) return
        setActing(true)
        try {
            if (isFollowing) {
                await api.follows.unfollow(vehicleId)
                setIsFollowing(false)
            } else {
                await api.follows.follow(vehicleId)
                setIsFollowing(true)
            }
        } catch (err: any) {
            Alert.alert('Hold Up', err.message || 'Failed to update follow status')
        } finally {
            setActing(false)
        }
    }

    return { isFollowing, loading, acting, toggleFollow }
}
