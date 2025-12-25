import { useQuery } from '@tanstack/react-query';
import { fetchCourses } from '../../services/api';

export const useCourses = ({ 
  categoryId, 
  enabled = true,
  search,
  minPrice,
  maxPrice,
}: { 
  categoryId?: string | number | null; 
  enabled?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}) => {
  const query = useQuery({
    queryKey: ['courses', categoryId, search, minPrice, maxPrice],
    queryFn: () => {
      return fetchCourses(categoryId, { search, minPrice, maxPrice });
    },
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return query;
};


