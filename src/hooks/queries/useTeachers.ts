import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchTeachers, fetchTeacherDetails } from '../../services/api';

export const teacherKeys = {
    all: ['teachers'] as const,
    lists: () => [...teacherKeys.all, 'list'] as const,
    detail: (id: string) => [...teacherKeys.all, 'detail', id] as const,
};

export const useTeachers = (
    options: { enabled?: boolean } = {}
): UseQueryResult<any[], Error> => {
    const { enabled = true } = options;

    return useQuery<any[], Error>({
        queryKey: teacherKeys.lists(),
        queryFn: fetchTeachers,
        enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
    });
};

export const useTeacherDetails = (
    id: string,
    options: { enabled?: boolean } = {}
): UseQueryResult<any, Error> => {
    const { enabled = true } = options;

    return useQuery<any, Error>({
        queryKey: teacherKeys.detail(id),
        queryFn: () => fetchTeacherDetails(id),
        enabled: enabled && !!id,
        staleTime: 1000 * 60 * 30, // 30 minutes
        gcTime: 1000 * 60 * 60, // 1 hour
    });
};


