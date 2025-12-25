import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchSliderData } from '../../services/home';
import { SliderItem, UseSlidersOptions } from '../../types/slider';

export const sliderKeys = {
    all: ['sliders'] as const,
    lists: () => [...sliderKeys.all, 'list'] as const,
    list: (categoryId: string | number) => [...sliderKeys.all, 'list', categoryId] as const,
    detail: (id: number) => [...sliderKeys.all, 'detail', id] as const,
};

export const useSliders = (
  options: UseSlidersOptions = {}
): UseQueryResult<SliderItem[], Error> => {
  const { categoryId, enabled = true, select } = options;

  const queryKey = categoryId 
    ? sliderKeys.list(categoryId)
    : sliderKeys.lists();

  return useQuery<SliderItem[], Error>({
    queryKey,
    queryFn: fetchSliderData,
    enabled,
    select: (data) => {
      let filteredData = data;
      
      if (categoryId && categoryId !== null) {
        filteredData = data.filter(
          (item) => 
            item.category_id === 0 || 
            item.category_id === Number(categoryId)
        );
        
        if (filteredData.length === 0 && data.length > 0) {
          filteredData = data;
        }
      }

      if (select) {
        return select(filteredData);
      }

      return filteredData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnMount: 'always',
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    placeholderData: (previousData) => previousData,
  });
};


