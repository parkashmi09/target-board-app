import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchUserCourses } from '../../services/api';

export const userCourseKeys = {
  all: ['userCourses'] as const,
  lists: () => [...userCourseKeys.all, 'list'] as const,
};

export const useUserCourses = (
  options: { enabled?: boolean } = {}
): UseQueryResult<any[], Error> => {
  const { enabled = true } = options;

  return useQuery<any[], Error>({
    queryKey: userCourseKeys.lists(),
    queryFn: fetchUserCourses,
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

