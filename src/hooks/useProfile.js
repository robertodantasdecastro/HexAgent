/**
 * useProfile Hook - Manage User Personalization
 * Hook useProfile - Gerenciar Personalização do Usuário
 * 
 * Interacts with /config/profile endpoint.
 * Interage com o endpoint /config/profile.
 * 
 * @author Roberto Dantas de Castro
 */

import { useCallback, useEffect, useState } from 'react';
import APIClient from '../utils/APIClient';

const useProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const api = APIClient.getInstance();

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.get('/config/profile');
            if (data.success && data.profile) {
                setProfile(data.profile);
            } else {
                setError(data.error || 'Failed to load profile');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [api]);

    const saveProfile = useCallback(async (newProfile) => {
        try {
            setLoading(true);
            const data = await api.post('/config/profile', { profile: newProfile });
            if (data.success) {
                setProfile(newProfile);
                return true;
            } else {
                throw new Error(data.error || 'Failed to save profile');
            }
        } catch (err) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    return {
        profile,
        loading,
        error,
        loadProfile,
        saveProfile,
        updateProfile: setProfile // Optimistic update
    };
};

export default useProfile;
