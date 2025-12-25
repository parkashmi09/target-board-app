import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  status: number;
  data?: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(path: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);

  const token = await AsyncStorage.getItem('token');

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await res.json() : undefined;
    if (!res.ok) {
      throw new ApiError(data?.message || `HTTP ${res.status}`, res.status, data);
    }
    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  post: <T>(path: string, body?: any, init?: RequestInit) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, ...(init || {}) }),
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { method: 'GET', ...(init || {}) }),
  put: <T>(path: string, body?: any, init?: RequestInit) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, ...(init || {}) }),
  patch: <T>(path: string, body?: any, init?: RequestInit) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, ...(init || {}) }),
  delete: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { method: 'DELETE', ...(init || {}) }),
};

// Auth endpoints
export const sendOtp = async (mobile: string) => {
  if (__DEV__) {
    console.log('[API] sendOtp called with mobile:', mobile);
    console.log('[API] Request URL:', `${BASE_URL}/auth/send-otp`);
  }

  try {
    const response = await api.post<{ success: boolean; message: string; userExists?: boolean }>('/auth/send-otp', { mobile });
    if (__DEV__) {
      console.log('[API] sendOtp response:', response);
    }
    return response;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[API] sendOtp error:', error);
    }
    throw error;
  }
};

export const verifyOtp = (mobile: string, code: string) => 
  api.post<{ message: string; token?: string; next?: string; tempToken?: string; user?: any; stickyBanners?: any[]; error?: string }>('/auth/verify-otp', { mobile, code });

export const registerStep1 = (tempToken: string, payload: { fullName: string }) => {
  if (__DEV__) {
    console.log('=== API CALL: registerStep1 ===');
    console.log('Payload:', payload);
  }

  return request<{ message: string; next: string }>('/auth/register-step-1', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tempToken}`,
    },
  }).then((data) => {
    if (__DEV__) {
      console.log('=== registerStep1 SUCCESS ===');
    }
    return data;
  }).catch((error) => {
    if (__DEV__) {
      console.error('=== registerStep1 ERROR ===', error);
    }
    throw error;
  });
};

export const registerStep2 = (tempToken: string, payload: { city?: string; classId: string; stateBoardId: string; mediumId?: string }) => {
  if (__DEV__) {
    console.log('=== API CALL: registerStep2 ===');
    console.log('Payload:', payload);
  }

  return request<{ message: string; token: string }>('/auth/register-step-2', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tempToken}`,
    },
  }).then((data) => {
    if (__DEV__) {
      console.log('=== registerStep2 SUCCESS ===');
    }
    return data;
  }).catch((error) => {
    if (__DEV__) {
      console.error('=== registerStep2 ERROR ===', error);
    }
    throw error;
  }) as Promise<{ message: string; token: string; user?: any; stickyBanners?: any[] }>;
};

export const loginWithPassword = (mobile: string, password: string) => 
  api.post<{ message: string; token: string; user?: any }>('/auth/login', { mobile, password });

export const fetchUserDetails = () => api.get<any>('/auth/user/details');

export const updateUserProfile = (payload: { city?: string; classId: string; stateBoardId: string }) =>
  api.put<{ message?: string; user?: any }>('/auth/update-profile', payload);

export const fetchUserCourses = async (): Promise<any[]> => {
  try {
    const url = '/purchase/user/courses';
    const response = await api.get<any>(url);
    
    // Ensure we always return an array
    if (Array.isArray(response)) {
      return response;
    }

    // Handle different response structures
    if (response && Array.isArray(response.data)) {
      return response.data;
    }

    if (response && Array.isArray(response.courses)) {
      return response.courses;
    }

    // Fallback to empty array if data structure is unexpected
    return [];
  } catch (error: any) {
    console.error('[fetchUserCourses] Error:', error?.message);
    // Return empty array instead of throwing to prevent React Query errors
    return [];
  }
};

// Meta endpoints
export const fetchStates = () => api.get<Array<{ id: number; state_name: string }>>('/states');
export const fetchCities = (stateId: number | string) => api.get<Array<{ id: number; city_name: string }>>(`/states/${stateId}/cities`);
export const fetchClasses = () => api.get<Array<{ _id: string; name: string; __v?: number }>>('/classes');
export const fetchStateBoards = () => api.get<Array<{ _id: string; name: string; logo?: string; description?: string }>>('/state-board');
export const fetchMediums = (stateBoardId: string) => api.get<Array<{ _id: string; name: string; stateBoardId: any }>>(`/medium?stateBoardId=${stateBoardId}`);

// Courses endpoints
export const fetchCourses = async (
  categoryId?: string | number | null,
  options?: {
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }
) => {
  try {
    let url = '/courses';
    const params: string[] = [];

    if (categoryId && categoryId !== null && categoryId !== 'null' && categoryId !== '') {
      params.push(`class=${categoryId}`);
    }

    if (options?.search) {
      params.push(`search=${encodeURIComponent(options.search)}`);
    }

    if (options?.minPrice !== undefined) {
      params.push(`minPrice=${options.minPrice}`);
    }

    if (options?.maxPrice !== undefined) {
      params.push(`maxPrice=${options.maxPrice}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    const response = await api.get<any>(url);

    if (Array.isArray(response)) {
      return response;
    }

    if (response && Array.isArray(response.data)) {
      return response.data;
    }

    if (response && Array.isArray(response.courses)) {
      return response.courses;
    }

    return [];
  } catch (error: any) {
    if (__DEV__) {
      console.error('[fetchCourses] Error:', error?.message);
    }
    return [];
  }
};

// Slider endpoints
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

export const fetchSliders = async (): Promise<SliderItem[]> => {
  const token = await AsyncStorage.getItem('token');

  const res = await fetch(`${BASE_URL}/sliders`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-access-token': token } : {}),
    },
  });

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const response = isJson ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiError(response?.message || `HTTP ${res.status}`, res.status, response);
  }

  const sliderArray = response?.data || [];
  return Array.isArray(sliderArray) ? sliderArray : [];
};

// Teachers endpoints
export const fetchTeachers = async (): Promise<any[]> => {
  const token = await AsyncStorage.getItem('token');

  const res = await fetch(`${BASE_URL}/teachers`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const response = isJson ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiError(response?.message || `HTTP ${res.status}`, res.status, response);
  }

  return Array.isArray(response) ? response : [];
};

export const fetchTeacherDetails = async (id: string): Promise<any> => {
  const token = await AsyncStorage.getItem('token');

  const res = await fetch(`${BASE_URL}/teachers/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const response = isJson ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiError(response?.message || `HTTP ${res.status}`, res.status, response);
  }

  return response;
};

// Banners endpoints
export const fetchBanners = async (): Promise<any[]> => {
  const token = await AsyncStorage.getItem('token');

  const res = await fetch(`${BASE_URL}/banners`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const response = isJson ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiError(response?.message || `HTTP ${res.status}`, res.status, response);
  }

  const banners = Array.isArray(response) ? response : [];
  return banners.filter((banner: any) => banner.isActive !== false);
};

export const fetchStickyBanners = async (): Promise<any[]> => {
  const token = await AsyncStorage.getItem('token');

  const res = await fetch(`${BASE_URL}/sticky-banner`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const response = isJson ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiError(response?.message || `HTTP ${res.status}`, res.status, response);
  }

  return Array.isArray(response) ? response : [];
};

