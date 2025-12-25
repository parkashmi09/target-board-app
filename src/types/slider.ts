export interface SliderItem {
  id: number;
  image: string;
  action: string;
  category_id: number;
  status: number;
  sorting_params: number;
  mediaUrl?: string;
  link?: string;
  mediaType?: 'image' | 'video';
  localSource?: any;
}

export interface UseSlidersOptions {
  categoryId?: string | number | null;
  enabled?: boolean;
  select?: (data: SliderItem[]) => SliderItem[];
}


