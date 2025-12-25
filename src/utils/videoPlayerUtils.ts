import AsyncStorage from '@react-native-async-storage/async-storage';

export const PROGRESS_STORAGE_KEY = 'video_progress';
export const SEEK_INTERVAL = 10;

export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const loadSavedProgress = async (streamId: string): Promise<number> => {
    try {
        if (!streamId) return 0;
        const progressKey = `${PROGRESS_STORAGE_KEY}_${streamId}`;
        const savedProgress = await AsyncStorage.getItem(progressKey);
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            if (progress.position && progress.position > 10) {
                return progress.position;
            }
        }
    } catch (error) {
        if (__DEV__) {
            console.error('[VideoPlayerUtils] Error loading progress:', error);
        }
    }
    return 0;
};

export const saveProgress = async (streamId: string, position: number, duration: number): Promise<void> => {
    try {
        if (!streamId) return;
        const progressKey = `${PROGRESS_STORAGE_KEY}_${streamId}`;
        await AsyncStorage.setItem(progressKey, JSON.stringify({
            position,
            duration,
            timestamp: Date.now(),
        }));
    } catch (error) {
        if (__DEV__) {
            console.error('[VideoPlayerUtils] Error saving progress:', error);
        }
    }
};

export const extractAssetId = (tpAssetId?: string, hlsUrl?: string): string => {
    if (tpAssetId) {
        return tpAssetId;
    }
    if (hlsUrl) {
        const match = hlsUrl.match(/\/live\/[^\/]+\/([^\/]+)\/video\.m3u8/);
        if (match && match[1]) {
            return match[1];
        }
    }
    return '';
};

