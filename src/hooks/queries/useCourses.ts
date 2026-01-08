import { useQuery } from '@tanstack/react-query';
import { fetchCourses } from '../../services/api';

export const useCourses = ({ 
  categoryId, 
  enabled = true,
  search,
}: { 
  categoryId?: string | number | null; 
  enabled?: boolean;
  search?: string;
}) => {
  const query = useQuery({
    queryKey: ['courses', categoryId, search],
    queryFn: () => {
      return fetchCourses(categoryId, { search });
    },
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return query;
};


