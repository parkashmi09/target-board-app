import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchStickyBanners } from '../../services/api';

export const stickyBannerKeys = {
    all: ['stickyBanners'] as const,
    lists: () => [...stickyBannerKeys.all, 'list'] as const,
};

export const useStickyBanners = (
    options: { enabled?: boolean } = {}
): UseQueryResult<any[], Error> => {
    const { enabled = true } = options;

    return useQuery<any[], Error>({
        queryKey: stickyBannerKeys.lists(),
        queryFn: fetchStickyBanners,
        enabled,
        staleTime: 0, // Always fetch fresh data
        gcTime: 1000 * 60 * 5, // 5 minutes cache
        refetchOnMount: 'always',
    });
};


