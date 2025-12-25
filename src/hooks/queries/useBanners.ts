import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchBanners } from '../../services/api';

export const bannerKeys = {
    all: ['banners'] as const,
    lists: () => [...bannerKeys.all, 'list'] as const,
};

export const useBanners = (
    options: { enabled?: boolean } = {}
): UseQueryResult<any[], Error> => {
    const { enabled = true } = options;

    return useQuery<any[], Error>({
        queryKey: bannerKeys.lists(),
        queryFn: fetchBanners,
        enabled,
        staleTime: 0, // Always fetch fresh data
        gcTime: 1000 * 60 * 5, // 5 minutes cache
        refetchOnMount: 'always',
    });
};


