import { fetchSliders } from './api';
import { SliderItem } from '../types/slider';

export interface HomeData {
  slider?: SliderItem[];
  batches?: Array<any>;
  live_class?: Array<any>;
  onlineTest?: Array<any>;
  [key: string]: any;
}

export const fetchSliderData = async (): Promise<SliderItem[]> => {
  try {
    const sliderData = await fetchSliders();
    return sliderData || [];
  } catch (error: any) {
    return [];
  }
};

export const fetchHomeData = async (): Promise<HomeData> => {
  try {
    const slider = await fetchSliderData();
    return {
      slider,
      batches: [],
      live_class: [],
      onlineTest: [],
    };
  } catch (error) {
    return {
      slider: [],
      batches: [],
      live_class: [],
      onlineTest: [],
    };
  }
};


