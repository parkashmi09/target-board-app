import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import { updateUser, uploadProfileImage, fetchUserDetails } from '../services/api';
import { useToast } from '../components/Toast';
import { useGlobalLoaderManual } from '../components/GlobalLoader';
import ScreenHeader from '../components/ScreenHeader';
import GradientBackground from '../components/GradientBackground';
import SVGIcon from '../components/SVGIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';

// @ts-ignore - react-native-image-picker types
import { launchImageLibrary } from 'react-native-image-picker';

const EditProfileScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const toast = useToast();
  const loader = useGlobalLoaderManual();

  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setFullName(userData.fullName || userData.name || '');
        setCity(userData.city || '');
        if (userData.image || userData.profileImage || userData.imageUrl || userData.avatar) {
          setProfileImage(userData.image || userData.profileImage || userData.imageUrl || userData.avatar);
        }
      }

      // Also fetch latest user details
      try {
        const userDetails = await fetchUserDetails();
        if (userDetails?.user) {
          setFullName(userDetails.user.fullName || userDetails.user.name || fullName);
          setCity(userDetails.user.city || city);
          if (userDetails.user.image || userDetails.user.profileImage || userDetails.user.imageUrl || userDetails.user.avatar) {
            setProfileImage(userDetails.user.image || userDetails.user.profileImage || userDetails.user.imageUrl || userDetails.user.avatar);
          }
          // Update AsyncStorage
          await AsyncStorage.setItem('userData', JSON.stringify(userDetails.user));
        }
      } catch (e) {
        // Silent error, use cached data
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[EditProfile] Error loading user data:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePicker = () => {
    const options: any = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
      includeBase64: false,
      selectionLimit: 1,
    };

    launchImageLibrary(options, (response: any) => {
      if (response.didCancel) {
        // User cancelled image picker
        console.log('[EditProfile] User cancelled image picker');
      } else if (response.errorCode) {
        let errorMessage = 'Failed to pick image';
        switch (response.errorCode) {
          case 'camera_unavailable':
            errorMessage = 'Camera not available';
            break;
          case 'permission':
            errorMessage = 'Permission denied. Please enable camera/gallery access in settings';
            break;
          case 'others':
            errorMessage = response.errorMessage || 'Unknown error occurred';
            break;
        }
        toast.show({ text: errorMessage, type: 'error' });
        console.error('[EditProfile] Image picker error:', response.errorCode, response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (asset.uri) {
          console.log('[EditProfile] Image selected:', asset.uri);
          setProfileImage(asset.uri);
          toast.show({ text: 'Image selected. Tap "Upload Image" to save it.', type: 'info' });
        }
      }
    });
  };

  const handleUploadImage = async () => {
    if (!profileImage || profileImage.startsWith('http')) {
      toast.show({ text: 'Please select a new image first', type: 'error' });
      return;
    }

    setIsUploadingImage(true);
    try {
      loader.show();
      const result = await uploadProfileImage(profileImage);
      
      if (result.imageUrl) {
        setProfileImage(result.imageUrl);
        // Update userData in AsyncStorage
        const userDataStr = await AsyncStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          await AsyncStorage.setItem('userData', JSON.stringify({
            ...userData,
            image: result.imageUrl,
            profileImage: result.imageUrl,
            imageUrl: result.imageUrl,
          }));
        }
        toast.show({ text: result.message || 'Profile image updated successfully', type: 'success' });
      }
    } catch (error: any) {
      toast.show({ 
        text: error?.message || 'Failed to upload image. Please try again.', 
        type: 'error' 
      });
    } finally {
      loader.hide();
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.show({ text: 'Please enter your full name', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      loader.show();
      
      // Validate token exists
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        toast.show({ 
          text: 'Authentication token not found. Please login again.', 
          type: 'error' 
        });
        return;
      }

      const payload: { fullName: string; city?: string } = {
        fullName: fullName.trim(),
      };
      
      if (city && city.trim()) {
        payload.city = city.trim();
      }

      console.log('[EditProfile] Saving with payload:', JSON.stringify(payload, null, 2));
      if (__DEV__) {
        console.log('[EditProfile] Full payload object:', payload);
      }

      const result = await updateUser(payload);
      
      // Refresh user data from API to get latest info
      try {
        const userDetails = await fetchUserDetails();
        if (userDetails?.user) {
          await AsyncStorage.setItem('userData', JSON.stringify(userDetails.user));
          // Update local state
          setFullName(userDetails.user.fullName || userDetails.user.name || fullName);
          setCity(userDetails.user.city || city);
          if (userDetails.user.image) {
            setProfileImage(userDetails.user.image);
          }
        }
      } catch (e) {
        // If refresh fails, still update local storage with what we have
        const userDataStr = await AsyncStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          await AsyncStorage.setItem('userData', JSON.stringify({
            ...userData,
            fullName: payload.fullName,
            name: payload.fullName,
            city: payload.city || userData.city,
          }));
        }
      }

      toast.show({ text: result.message || 'Profile updated successfully', type: 'success' });
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (error: any) {
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (error?.status === 401) {
        errorMessage = 'Authentication failed. Your session may have expired. Please login again.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.show({ 
        text: errorMessage, 
        type: 'error' 
      });
      
      if (__DEV__) {
        console.error('[EditProfile] Save error:', error);
      }
    } finally {
      loader.hide();
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <GradientBackground>
        <ScreenHeader title="Edit Profile" showSearch={false} />
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.text} />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScreenHeader title="Edit Profile" showSearch={false} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <TouchableOpacity
              onPress={handleImagePicker}
              style={styles.imageContainer}
              activeOpacity={0.8}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.placeholderImage, { backgroundColor: theme.colors.border }]}>
                  <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                    Tap to add photo
                  </Text>
                </View>
              )}
              <View style={[styles.editIconContainer, { backgroundColor: theme.colors.accent }]}>
                <SVGIcon name="camera" size={moderateScale(18)} color={theme.colors.primaryText} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleUploadImage}
              disabled={!profileImage || profileImage.startsWith('http') || isUploadingImage}
              style={[
                styles.uploadButton,
                {
                  backgroundColor: theme.colors.accent,
                  opacity: (!profileImage || profileImage.startsWith('http') || isUploadingImage) ? 0.5 : 1,
                },
              ]}
              activeOpacity={0.8}
            >
              {isUploadingImage ? (
                <ActivityIndicator size="small" color={theme.colors.primaryText} />
              ) : (
                <Text style={[styles.uploadButtonText, { color: theme.colors.primaryText }]}>
                  Upload Image
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Full Name</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.inputBackground,
                    color: theme.colors.text,
                    borderBottomWidth: 2,
                    borderBottomColor: theme.colors.primaryText,
                  },
                ]}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text }]}>City</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.inputBackground,
                    color: theme.colors.text,
                    borderBottomWidth: 2,
                    borderBottomColor: theme.colors.primaryText,
                  },
                ]}
                placeholder="Enter your city"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="words"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving || !fullName.trim()}
              style={[
                styles.saveButton,
                {
                  backgroundColor: theme.colors.secondary,
                  opacity: (isSaving || !fullName.trim()) ? 0.5 : 1,
                },
              ]}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={theme.colors.secondaryText} />
              ) : (
                <Text style={[styles.saveButtonText, { color: theme.colors.secondaryText }]}>
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: getSpacing(3),
    paddingVertical: moderateScale(20),
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: getSpacing(4),
  },
  imageContainer: {
    position: 'relative',
    marginBottom: getSpacing(2),
  },
  profileImage: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  placeholderImage: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: moderateScale(12),
    textAlign: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  uploadButton: {
    paddingHorizontal: getSpacing(3),
    paddingVertical: getSpacing(1.5),
    borderRadius: moderateScale(8),
    minWidth: moderateScale(150),
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  formSection: {
    marginTop: getSpacing(2),
  },
  inputContainer: {
    marginBottom: getSpacing(3),
  },
  label: {
    fontSize: moderateScale(15),
    marginBottom: getSpacing(1),
    fontWeight: '500',
  },
  input: {
    borderRadius: moderateScale(8),
    paddingHorizontal: getSpacing(1.5),
    paddingVertical: getSpacing(1.5),
    fontSize: moderateScale(15),
    borderWidth: 0,
  },
  saveButton: {
    width: '100%',
    paddingVertical: getSpacing(1.5),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getSpacing(2),
    minHeight: moderateScale(50),
  },
  saveButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    letterSpacing: 1,
  },
});

export default EditProfileScreen;

