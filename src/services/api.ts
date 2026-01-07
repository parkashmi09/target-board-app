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

/**
 * Update user profile (fullName and city)
 * PUT /auth/user/update
 */
export const updateUser = async (payload: { fullName?: string; city?: string }) => {
  try {
    if (__DEV__) {
      console.log('[API] updateUser called', payload);
    }
    
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    // Trim token to remove any whitespace
    const cleanToken = token.trim();
    
    if (!cleanToken) {
      throw new Error('Token is empty. Please login again.');
    }

    // Ensure payload has required fields
    const requestPayload: { fullName: string; city?: string } = {
      fullName: payload.fullName || '',
    };
    
    if (payload.city && payload.city.trim()) {
      requestPayload.city = payload.city.trim();
    }

    const authHeader = `Bearer ${cleanToken}`;
    const requestUrl = `${BASE_URL}/auth/user/update`;
    const requestBody = JSON.stringify(requestPayload);

    console.log('[API] updateUser - Full Request Details:');
    console.log('[API] URL:', requestUrl);
    console.log('[API] Method: PUT');
    console.log('[API] Payload:', requestPayload);
    console.log('[API] Token (first 30 chars):', cleanToken.substring(0, 30) + '...');
    console.log('[API] Token (last 20 chars):', '...' + cleanToken.substring(cleanToken.length - 20));
    console.log('[API] Token length:', cleanToken.length);
    console.log('[API] Authorization header:', authHeader.substring(0, 50) + '...');

    const response = await fetch(requestUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      body: requestBody,
    });

    console.log('[API] Response status:', response.status);
    console.log('[API] Response headers:', Object.fromEntries(response.headers.entries()));

    const isJson = (response.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await response.json() : undefined;

    if (!response.ok) {
      console.error('[API] updateUser - Error Response:');
      console.error('[API] Status:', response.status);
      console.error('[API] Status Text:', response.statusText);
      console.error('[API] Response Data:', data);
      
      if (response.status === 401) {
        // Token might be expired or invalid
        console.error('[API] 401 Unauthorized - Possible causes:');
        console.error('[API] 1. Token expired');
        console.error('[API] 2. Token invalid');
        console.error('[API] 3. Token not properly formatted');
        console.error('[API] 4. Server not accepting Bearer token format');
        
        // Check token structure
        try {
          const tokenParts = cleanToken.split('.');
          console.error('[API] Token structure - Parts count:', tokenParts.length);
          if (tokenParts.length === 3) {
            console.error('[API] Token appears to be a valid JWT format');
            console.error('[API] Token header (first part):', tokenParts[0].substring(0, 20) + '...');
            console.error('[API] Token payload (second part):', tokenParts[1].substring(0, 20) + '...');
          } else {
            console.error('[API] Token does not appear to be in JWT format');
          }
        } catch (e) {
          console.error('[API] Could not analyze token structure:', e);
        }
        
        throw new ApiError(
          data?.message || 'Authentication failed. Your session may have expired. Please login again.',
          response.status,
          data
        );
      }
      throw new ApiError(
        data?.message || `HTTP ${response.status}`,
        response.status,
        data
      );
    }

    if (__DEV__) {
      console.log('[API] updateUser response:', data);
    }
    
    return data as { message?: string; user?: any };
  } catch (error: any) {
    if (__DEV__) {
      console.error('[updateUser] Error:', error?.message, error);
    }
    throw error;
  }
};

/**
 * Upload profile image
 * PUT /profile/image
 */
export const uploadProfileImage = async (imageUri: string) => {
  try {
    if (__DEV__) {
      console.log('[API] uploadProfileImage called', imageUri);
    }
    
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Create FormData
    const formData = new FormData();
    
    // Extract file name and type from URI
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    const fileName = `profile_${Date.now()}.${fileType}`;
    
    formData.append('image', {
      uri: imageUri,
      type: `image/${fileType}`,
      name: fileName,
    } as any);

    const response = await fetch(`${BASE_URL}/profile/image`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - let fetch set it with boundary
      },
      body: formData,
    });

    const isJson = (response.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await response.json() : undefined;
    
    if (!response.ok) {
      throw new ApiError(data?.message || `HTTP ${response.status}`, response.status, data);
    }

    if (__DEV__) {
      console.log('[API] uploadProfileImage response:', data);
    }
    
    return data as { message: string; imageUrl: string };
  } catch (error: any) {
    if (__DEV__) {
      console.error('[uploadProfileImage] Error:', error?.message);
    }
    throw error;
  }
};

export const fetchUserCourses = async (): Promise<any[]> => {
  try {
    if (__DEV__) {
      console.log('[API] fetchUserCourses called');
    }
    const url = '/purchase/user/courses';
    const response = await api.get<any>(url);
    
    if (__DEV__) {
      console.log('[API] fetchUserCourses response:', response);
    }
    
    // Handle new response structure with purchasedCourses
    if (response && response.success && Array.isArray(response.purchasedCourses)) {
      return response.purchasedCourses;
    }

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
    if (__DEV__) {
      console.warn('[fetchUserCourses] Unexpected response structure:', response);
    }
    return [];
  } catch (error: any) {
    if (__DEV__) {
      console.error('[fetchUserCourses] Error:', error?.message);
    }
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

export const fetchCourseDetails = async (courseId: string | number) => {
  try {
    const url = `/courses/${courseId}`;
    const response = await api.get<any>(url);

    // Handle different response structures
    let courseData;

    // If response is an array, take the first item
    if (Array.isArray(response)) {
      courseData = response[0];
    }
    // If response has a data property, use it
    else if (response?.data) {
      courseData = response.data;
    }
    // Otherwise use response directly
    else {
      courseData = response;
    }

    if (!courseData) {
      throw new Error('No course data found in response');
    }

    return courseData;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[fetchCourseDetails] Error:', error?.message);
    }
    throw error;
  }
};

/**
 * Create Razorpay order for course purchase
 * Endpoint: POST /purchase/create-order
 */
export const createPurchaseOrder = async (courseId: string, packageId?: string, discountCode?: string) => {
  try {
    if (__DEV__) {
      console.log('[API] createPurchaseOrder called', { courseId, packageId, discountCode });
    }
    const url = '/purchase/create-order';
    
    const payload: any = { courseId };
    if (packageId) {
      payload.packageId = packageId;
    }
    if (discountCode) {
      payload.discountCode = discountCode;
    }

    const response = await api.post<any>(url, payload);
    if (__DEV__) {
      console.log('[API] createPurchaseOrder response:', response);
    }

    if (response?.success && response?.order) {
      return response.order;
    }

    throw new Error(response?.message || 'Failed to create order');
  } catch (error: any) {
    if (__DEV__) {
      console.error('[createPurchaseOrder] Error:', error?.message);
    }
    throw error;
  }
};

/**
 * Verify Razorpay payment
 * Endpoint: POST /purchase/verify
 */
export const verifyPurchasePayment = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) => {
  try {
    if (__DEV__) {
      console.log('[API] verifyPurchasePayment called', {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: razorpaySignature.substring(0, 20) + '...',
      });
    }
    const url = '/purchase/verify';
    
    const payload = {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    };

    const response = await api.post<any>(url, payload);
    if (__DEV__) {
      console.log('[API] verifyPurchasePayment response:', response);
    }

    if (response?.success) {
      return response;
    }

    throw new Error(response?.message || 'Payment verification failed');
  } catch (error: any) {
    if (__DEV__) {
      console.error('[verifyPurchasePayment] Error:', error?.message);
    }
    throw error;
  }
};

/**
 * Create Razorpay payment link for QR code payment
 * Endpoint: POST /payments/create-qr-code
 */
export const createPaymentLink = async (courseId: string, packageId?: string, discountCode?: string) => {
  try {
    // Validate courseId
    if (!courseId || courseId.trim() === '') {
      throw new Error('Course ID is required');
    }

    // Normalize optional parameters - filter out empty strings
    const normalizedPackageId = packageId?.trim();
    const normalizedDiscountCode = discountCode?.trim();

    if (__DEV__) {
      console.log('[API] createPaymentLink called', { 
        courseId, 
        packageId: normalizedPackageId, 
        discountCode: normalizedDiscountCode 
      });
    }
    const url = '/payments/create-qr-code';
    const fullUrl = `${BASE_URL}${url}`;
    
    const payload: any = { courseId: courseId.trim() };
    // Only add packageId if it's a non-empty string
    if (normalizedPackageId && normalizedPackageId !== '') {
      payload.packageId = normalizedPackageId;
    }
    // Only add discountCode if it's a non-empty string
    if (normalizedDiscountCode && normalizedDiscountCode !== '') {
      payload.discountCode = normalizedDiscountCode;
    }

    // Log API endpoint URL and payload
    console.log('[QR Code Generation] API Endpoint URL:', fullUrl);
    console.log('[QR Code Generation] API Payload:', JSON.stringify(payload, null, 2));

    const response = await api.post<any>(url, payload);
    console.log('[QR Code Generation] API Response:', response);
    if (__DEV__) {
      console.log('[API] createPaymentLink response:', response);
    }

    // Handle response - check for qrImageUrl (new format) or qrUrl (old format)
    const qrImageUrl = response?.qrImageUrl;
    const qrUrl = response?.qrUrl || response?.paymentLink?.qrUrl || response?.paymentLink?.short_url;
    const shortUrl = response?.short_url || response?.paymentLink?.short_url || qrUrl;

    if (response?.success && (qrImageUrl || response?.paymentLink || qrUrl)) {
      return {
        paymentLink: response.paymentLink,
        qrImageUrl: qrImageUrl, // New format - direct image URL
        qrUrl: qrImageUrl || qrUrl || shortUrl, // Use qrImageUrl if available, fallback to qrUrl
        short_url: shortUrl || qrImageUrl || qrUrl,
        qrCodeId: response?.qrCodeId, // Store qrCodeId if available
      };
    }

    // Also handle case where response might not have success flag but has qrImageUrl or qrUrl
    if (qrImageUrl || qrUrl) {
      return {
        paymentLink: response.paymentLink,
        qrImageUrl: qrImageUrl,
        qrUrl: qrImageUrl || qrUrl,
        short_url: shortUrl || qrImageUrl || qrUrl,
        qrCodeId: response?.qrCodeId,
      };
    }

    throw new Error(response?.message || 'Failed to create payment link');
  } catch (error: any) {
    if (__DEV__) {
      console.error('[createPaymentLink] Error:', error?.message);
    }
    throw error;
  }
};

// TPStreams Types
export interface Stream {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  courseId: string | {
    _id: string;
    class: string;
  };
  categoryId?: string;
  tpAssetId?: string;
  hlsUrl?: string;
  chatEmbedUrl?: string | null;
  tpStatus?: 'NOT_STARTED' | 'STARTED' | 'STOPPED' | 'COMPLETED' | 'STREAMING';
  status: 'live' | 'upcoming' | 'completed' | 'scheduled';
  enableDrmForRecording?: boolean;
  latency?: string;
  transcodeRecordedVideo?: boolean;
  resolutions?: string[];
  startTime?: string;
  scheduled_start?: string;
  isServerStarted?: boolean;
  vodResolutions?: string[];
  bannerUrl?: string;
  thumbnail?: string;
  isPaid?: boolean;
  isUserPurchased?: boolean;
  activities?: Array<{
    status: string;
    event: string;
    timestamp: string;
    _id: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  courseSelections?: Array<{
    course?: {
      _id: string;
      name: string;
      class?: string;
    };
    category?: {
      _id: string;
      name: string;
    };
    _id?: string;
  }>;
  actualStartTime?: string;
}

/**
 * Fetch streams for a specific course
 * @param courseId - Course ID
 * @param type - Optional filter: 'live' | 'upcoming'
 */
export const getCourseStreams = async (courseId: string, type?: 'live' | 'upcoming'): Promise<Stream[]> => {
  try {
    if (__DEV__) {
      console.log('[API] getCourseStreams called', { courseId, type });
    }
    const url = type ? `/streams/course/${courseId}?type=${type}` : `/streams/course/${courseId}`;
    const response = await api.get<any>(url);
    
    if (__DEV__) {
      console.log('[API] getCourseStreams response:', response);
    }
    
    // Handle different response structures
    let streams: any[] = [];
    if (response && (response as any).streams && Array.isArray((response as any).streams)) {
      streams = (response as any).streams;
    } else if (Array.isArray(response)) {
      streams = response;
    }
    
    return streams.map((item: any) => {
      const stream = item.stream || item;
      const isUserPurchased = item.isUserPurchased !== undefined 
        ? Boolean(item.isUserPurchased) 
        : (stream.isUserPurchased !== undefined ? Boolean(stream.isUserPurchased) : false);
      
      return {
        ...stream,
        isUserPurchased,
        id: stream._id || stream.id,
      };
    });
  } catch (error: any) {
    if (__DEV__) {
      console.error('[getCourseStreams] Error:', error?.message);
    }
    throw error;
  }
};

/**
 * Fetch streams for a user's class
 * GET /user/streams?classId=:classId
 */
export const getUserStreams = async (classId: string, type?: 'live' | 'upcoming'): Promise<Stream[]> => {
  try {
    if (__DEV__) {
      console.log('[API] getUserStreams called', { classId, type });
    }
    const typeParam = type ? `&type=${type}` : '';
    const response = await api.get<any>(`/user/streams?classId=${classId}${typeParam}`);
    
    if (__DEV__) {
      console.log('[API] getUserStreams response:', response);
    }
    
    // Handle response structure: { total: number, streams: [...] }
    let streams: any[] = [];
    if (response && (response as any).streams && Array.isArray((response as any).streams)) {
      streams = (response as any).streams;
    } else if (Array.isArray(response)) {
      streams = response;
    }
    
    return streams.map((item: any) => {
      const stream = item.stream || item;
      const isUserPurchased = item.isUserPurchased !== undefined 
        ? Boolean(item.isUserPurchased) 
        : (stream.isUserPurchased !== undefined ? Boolean(stream.isUserPurchased) : false);
      
      return {
        ...stream,
        id: stream._id || stream.id,
        thumbnail: stream.bannerUrl || stream.thumbnail,
        scheduled_start: stream.startTime || stream.scheduled_start,
        courseId: typeof stream.courseId === 'object' ? stream.courseId._id : stream.courseId,
        isUserPurchased,
      };
    });
  } catch (error: any) {
    if (__DEV__) {
      console.error('[getUserStreams] Error:', error?.message);
    }
    return [];
  }
};

/**
 * Fetch a single stream by ID with purchase status
 * GET /streams/:streamId
 */
export const getStreamById = async (streamId: string): Promise<{ stream: Stream; isUserPurchased: boolean; chatRoomId?: { roomId: string } }> => {
  try {
    if (__DEV__) {
      console.log('[API] getStreamById called for streamId:', streamId);
    }
    const response = await api.get<{ stream: Stream; isUserPurchased: boolean; chatRoomId?: { roomId: string } }>(`/streams/${streamId}`);
    
    if (__DEV__) {
      console.log('[API] getStreamById response:', response);
    }
    
    // Handle response structure: { stream: {...}, isUserPurchased: true, chatRoomId: {...} }
    const stream = response.stream || (response as any);
    const isUserPurchased = response.isUserPurchased !== undefined 
      ? Boolean(response.isUserPurchased) 
      : false;
    
    return {
      stream: {
        ...stream,
        id: stream._id || stream.id,
      },
      isUserPurchased,
      chatRoomId: response.chatRoomId,
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('[getStreamById] Error:', error?.message);
    }
    throw error;
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

// Downloads Types
export interface Download {
  _id: string;
  userId: string;
  content: string | ContentDownload;
  assetType: 'video' | 'pdf';
  assetUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentDownload {
  _id: string;
  title: string;
  type: string;
  pdf?: {
    url: string;
  };
  video?: {
    assetId: string;
  };
  category?: {
    _id: string;
    name: string;
  };
  course?: {
    _id: string;
    title: string;
  };
}

export interface DownloadsResponse {
  count: number;
  downloads: Download[];
}

/**
 * Get all downloads for authenticated user
 * GET /downloads
 */
export const getDownloads = async (): Promise<DownloadsResponse> => {
  try {
    if (__DEV__) {
      console.log('[API] getDownloads called');
    }
    const response = await api.get<DownloadsResponse>('/downloads');
    if (__DEV__) {
      console.log('[API] getDownloads response:', response);
    }
    return response;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[getDownloads] Error:', error?.message);
    }
    throw error;
  }
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

/**
 * Add content to downloads
 * POST /download/:contentId
 * For videos, the endpoint might need the assetType in the body or as a parameter
 */
export interface AddDownloadResponse {
  message?: string;
  download?: Download;
}

export const addDownload = async (contentId: string, assetType?: 'video' | 'pdf'): Promise<AddDownloadResponse> => {
  try {
    if (__DEV__) {
      console.log('[API] addDownload called for contentId:', contentId, 'assetType:', assetType);
    }
    
    // Include assetType in request body if provided (especially for videos)
    const payload = assetType ? { assetType } : {};
    
    // Try the standard endpoint with payload
    const response = await api.post<AddDownloadResponse>(`/download/${contentId}`, payload);
    if (__DEV__) {
      console.log('[API] addDownload response:', response);
    }
    return response;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[addDownload] Error:', error?.message, 'Status:', error?.status, 'ContentId:', contentId, 'AssetType:', assetType);
    }
    
    // If 404 error for video, provide more specific error message
    if (error.status === 404 && assetType === 'video') {
      if (__DEV__) {
        console.error('[addDownload] 404 error - Video download endpoint may not be configured correctly');
        console.error('[addDownload] Attempted endpoint: POST /download/' + contentId);
        console.error('[addDownload] Payload:', assetType ? { assetType } : {});
      }
    }
    
    throw error;
  }
};

// Category Types
export interface CategoryNode {
  _id: string;
  name: string;
  hindiName?: string; // Hindi translation from API
  course: string;
  parent: string | null;
  level: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  children: CategoryNode[];
  contents?: ContentItem[];
  streams?: Stream[];
}

/**
 * Fetch category tree for a course
 * GET /category/tree/:courseId
 */
export const fetchCategoryTree = async (courseId: string | number): Promise<CategoryNode[]> => {
  try {
    if (__DEV__) {
      console.log('[API] fetchCategoryTree called for courseId:', courseId);
    }
    const url = `/category/tree/${courseId}`;
    const response = await api.get<CategoryNode[]>(url);
    
    // Ensure we always return an array
    if (Array.isArray(response)) {
      return response;
    }
    
    // Handle wrapped response
    if (response && Array.isArray((response as any).data)) {
      return (response as any).data;
    }
    
    if (__DEV__) {
      console.warn('[fetchCategoryTree] Unexpected response structure:', response);
    }
    return [];
  } catch (error: any) {
    if (__DEV__) {
      console.error('[fetchCategoryTree] Error:', error?.message);
    }
    return [];
  }
};

// Content Types
export interface ContentItem {
  _id: string;
  title: string;
  hindiTitle?: string; // Hindi translation from API
  type: 'video' | 'pdf';
  accessType?: string;
  pdf?: {
    url: string;
    fileName?: string;
  };
  video?: {
    assetId?: string;
    url?: string;
  };
  category?: {
    _id: string;
    name: string;
    hindiName?: string;
  };
  course?: {
    _id: string;
    title?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface ContentItemsResponse {
  count: number;
  contents: ContentItem[];
}

/**
 * Fetch content items (videos/PDFs) by category ID
 * GET /category/:categoryId
 */
export const fetchContentByCategory = async (categoryId: string): Promise<ContentItem[]> => {
  try {
    if (__DEV__) {
      console.log('[API] fetchContentByCategory called for categoryId:', categoryId);
    }
    const response = await api.get<ContentItemsResponse>(`/category/${categoryId}`);
    
    // Handle response structure: { count: number, contents: ContentItem[] }
    if (response && 'contents' in response && Array.isArray(response.contents)) {
      return response.contents;
    }
    
    // Fallback: if response is directly an array
    if (Array.isArray(response)) {
      return response;
    }
    
    if (__DEV__) {
      console.warn('[fetchContentByCategory] Unexpected response structure:', response);
    }
    return [];
  } catch (error: any) {
    if (__DEV__) {
      console.error('[fetchContentByCategory] Error:', error?.message);
    }
    return [];
  }
};

