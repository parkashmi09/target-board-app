import { useQuery } from '@tanstack/react-query';
import { fetchCourses } from '../../services/api';

export const useCourses = ({ 
  categoryId, 
  enabled = true,
  search,
  stateBoardId,
}: { 
  categoryId?: string | number | null; 
  enabled?: boolean;
  search?: string;
  stateBoardId?: string | number | null;
}) => {
  const query = useQuery({
    queryKey: ['courses', categoryId, stateBoardId, search],
    queryFn: () => {
      return fetchCourses(categoryId, { search, stateBoardId });
    },
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return query;
};


