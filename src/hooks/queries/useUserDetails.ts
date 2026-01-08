import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchUserDetails } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const userDetailsKeys = {
    all: ['userDetails'] as const,
    details: () => [...userDetailsKeys.all, 'details'] as const,
};

interface UserDetailsResponse {
    success: boolean;
    message: string;
    user: {
        id: string;
        _id?: string;
        mobile: string;
        fullName: string;
        city?: string;
        class?: {
            _id: string;
            name: string;
        } | null;
        stateBoard?: {
            _id: string;
            name: string;
            logo?: string;
            description?: string;
            classId?: string;
        };
        classId?: string;
        stateBoardId?: string;
        mediumId?: string;
        image?: string;
        profileImage?: string;
        imageUrl?: string;
        avatar?: string;
        onboardingStep?: number;
        isOnboarded?: boolean;
    };
}

const fetchUserDetailsAndCache = async (): Promise<UserDetailsResponse['user']> => {
    const response = await fetchUserDetails();
    
    if (response?.user) {
        // Update AsyncStorage with latest user data
        await AsyncStorage.setItem('userData', JSON.stringify(response.user));
        
        // Also set classId and stateBoardId for backward compatibility
        if (response.user.class?._id) {
            await AsyncStorage.setItem('classId', response.user.class._id);
        }
        if (response.user.stateBoard?._id) {
            await AsyncStorage.setItem('stateBoardId', response.user.stateBoard._id);
        }
        
        return response.user;
    }
    
    throw new Error('User details not found in response');
};

export const useUserDetails = (
    options: { enabled?: boolean } = {}
): UseQueryResult<UserDetailsResponse['user'], Error> => {
    const { enabled = true } = options;

    return useQuery<UserDetailsResponse['user'], Error>({
        queryKey: userDetailsKeys.details(),
        queryFn: fetchUserDetailsAndCache,
        enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
        retry: 1,
    });
};

