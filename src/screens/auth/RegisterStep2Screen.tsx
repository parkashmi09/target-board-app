import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Modal, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { getFontFamily } from '../../utils/fonts';
import { useToast } from '../../components/Toast';
import { useGlobalLoaderManual } from '../../components/GlobalLoader';
import { useRegistrationDataStore, useAuthStore } from '../../store';
import SVGIcon from '../../components/SVGIcon';
import { registerStep1, registerStep2, fetchMediums, fetchStateBoards } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GradientBackground from '../../components/GradientBackground';
import messaging from '@react-native-firebase/messaging';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RegisterStep2NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RegisterStep2'>;

const RegisterStep2Screen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<RegisterStep2NavigationProp>();
  const route = useRoute();
  const toast = useToast();
  const loader = useGlobalLoaderManual();
  const { login } = useAuthStore();
  const { classes, loadAllData } = useRegistrationDataStore();

  const { tempToken, fullName } = route.params as { tempToken: string; fullName: string };
  const [city, setCity] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedMediumId, setSelectedMediumId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Boards state - fetched dynamically based on selected class
  const [stateBoards, setStateBoards] = useState<any[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(false);

  // Mediums state
  const [mediums, setMediums] = useState<any[]>([]);
  const [loadingMediums, setLoadingMediums] = useState(false);
  const [showMediumModal, setShowMediumModal] = useState(false);

  // Animated values
  const boardSectionOpacity = useRef(new Animated.Value(0)).current;
  const boardSectionTranslateY = useRef(new Animated.Value(50)).current;
  const modalTranslateY = useRef(new Animated.Value(1000)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Animate modal
  useEffect(() => {
    if (showMediumModal) {
      Animated.parallel([
        Animated.spring(modalTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 90,
          friction: 20,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(modalTranslateY, {
          toValue: 1000,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showMediumModal]);

  // Animate loading overlay
  useEffect(() => {
    if (loading) {
      Animated.timing(loadingOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(loadingOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const handleClassSelect = useCallback(async (classId: string) => {
    setSelectedClassId(classId);
    // Reset downstream selections
    setSelectedBoardId('');
    setSelectedMediumId('');
    setStateBoards([]); // Clear previous boards
    
    // Reset animation
    boardSectionOpacity.setValue(0);
    boardSectionTranslateY.setValue(50);
    
    // Fetch boards for selected class
    setLoadingBoards(true);
    try {
      const data = await fetchStateBoards(classId);
      setStateBoards(data || []);
      
      // Animate boards in
      Animated.parallel([
        Animated.spring(boardSectionOpacity, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 15,
        }),
        Animated.spring(boardSectionTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 15,
        }),
      ]).start();
    } catch (error) {
      console.error('Failed to fetch boards', error);
      toast.show({ text: 'Failed to load boards', type: 'error' });
    } finally {
      setLoadingBoards(false);
    }
  }, [toast, boardSectionOpacity, boardSectionTranslateY]);

  const handleBoardSelect = useCallback(async (boardId: string) => {
    setSelectedBoardId(boardId);
    setSelectedMediumId(''); // Reset medium
    setLoadingMediums(true);
    try {
      const data = await fetchMediums(boardId);
      setMediums(data || []);
      if (data && data.length > 0) {
        setShowMediumModal(true);
      } else {
        // If no mediums found, just stick with board selection
        toast.show({ text: 'No mediums found for this board', type: 'info' });
      }
    } catch (error) {
      console.error('Failed to fetch mediums', error);
      toast.show({ text: 'Failed to fetch mediums', type: 'error' });
    } finally {
      setLoadingMediums(false);
    }
  }, [toast]);

  const handleRegister = useCallback(async (autoSelectedMediumId?: string) => {
    if (!selectedClassId) {
      toast.show({ text: 'Please select your class', type: 'error' });
      return;
    }
    if (!selectedBoardId) {
      toast.show({ text: 'Please select your board', type: 'error' });
      return;
    }
    // Optional: Check if medium is selected if mediums exist
    const finalMediumId = autoSelectedMediumId || selectedMediumId;
    if (mediums.length > 0 && !finalMediumId) {
      toast.show({ text: 'Please select your medium', type: 'error' });
      // Re-open modal if needed
      setShowMediumModal(true);
      return;
    }

    setLoading(true);
    try {
      loader.show();

      // Submit Step 1 Data
      await registerStep1(tempToken, { fullName });

      // Get FCM token with retry logic
      let fcmToken: string | undefined;
      try {
        // Request permission if not already granted
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          // Try to get token with retry (sometimes token needs a moment)
          let retries = 3;
          while (retries > 0 && !fcmToken) {
            try {
              fcmToken = await messaging().getToken();
              if (fcmToken && fcmToken.length > 0) {
                if (__DEV__) {
                  console.log('✅ FCM Token for registration:', fcmToken.substring(0, 20) + '...');
                  console.log('📱 Full FCM Token length:', fcmToken.length);
                }
                break;
              }
            } catch (tokenError) {
              if (__DEV__) {
                console.warn(`⚠️ Token retrieval attempt ${4 - retries} failed:`, tokenError);
              }
              retries--;
              if (retries > 0) {
                // Wait a bit before retrying
                await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
              }
            }
          }
          
          if (!fcmToken) {
            if (__DEV__) {
              console.error('❌ Failed to get FCM token after retries');
            }
          }
        } else {
          if (__DEV__) {
            console.warn('⚠️ FCM Permission not granted, token not available');
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.error('❌ Failed to get FCM token for registration:', error);
        }
      }

      // Submit Step 2 Data
      const payload: any = {
        stateBoardId: selectedBoardId,
        classId: selectedClassId,
      };

      if (finalMediumId) {
        payload.mediumId = finalMediumId;
      }
      if (city.trim()) {
        payload.city = city.trim();
      }
      if (fcmToken) {
        payload.fcmToken = fcmToken;
      }

      const res = await registerStep2(tempToken, payload);

      if (res.token) {
        await AsyncStorage.setItem('token', res.token);
        await AsyncStorage.setItem('firstTimeVisited', 'true');
        await AsyncStorage.removeItem('tempToken');

        // Save User Data
        let savedUser = res.user;
        if (savedUser) {
          // Augment user object with local selections if server doesn't return them populated
          const selectedClassObj = classes.find(c => c._id === selectedClassId);
          const selectedBoardObj = stateBoards.find(b => b._id === selectedBoardId);
          const selectedMediumObj = mediums.find(m => m._id === finalMediumId);

          savedUser = {
            ...savedUser,
            class: selectedClassObj || savedUser.class,
            stateBoard: selectedBoardObj || savedUser.stateBoard,
            // Save medium info locally in user object if needed
            medium: selectedMediumObj,
            mediumId: finalMediumId
          };

          await AsyncStorage.setItem('userData', JSON.stringify(savedUser));
          await AsyncStorage.setItem('userId', String(savedUser.id || savedUser._id || ''));
        }

        if (res.stickyBanners && Array.isArray(res.stickyBanners) && res.stickyBanners.length > 0) {
          await AsyncStorage.setItem('stickyBanners', JSON.stringify(res.stickyBanners));
        }

        toast.show({ text: res.message || 'Registration complete!', type: 'success' });
        setTimeout(() => login(), 500);
      } else {
        toast.show({ text: res.message || 'Registration failed', type: 'error' });
      }
    } catch (e: any) {
      console.error('Registration error:', e);
      const errorMessage = e?.message || e?.data?.message || 'An unexpected error occurred.';
      toast.show({ text: errorMessage, type: 'error' });
    } finally {
      loader.hide();
      setLoading(false);
    }
  }, [selectedClassId, selectedBoardId, selectedMediumId, mediums.length, tempToken, fullName, city, classes, stateBoards, toast, loader, login]);

  const handleMediumSelect = useCallback((mediumId: string) => {
    setSelectedMediumId(mediumId);
    setShowMediumModal(false);
    handleRegister(mediumId);
  }, [handleRegister]);

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <SVGIcon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Select Preferences</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* City Input */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>City (Optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.cardBackground,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  }
                ]}
                placeholder="Enter your city"
                placeholderTextColor={theme.colors.textSecondary}
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
            </View>

            {/* Class Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select your class</Text>
              <View style={styles.classGrid}>
                {classes.map((item) => {
                  const isSelected = selectedClassId === item._id;
                  return (
                    <TouchableOpacity
                      key={item._id}
                      onPress={() => handleClassSelect(item._id)}
                      activeOpacity={0.7}
                      style={[
                        styles.classCard,
                        {
                          backgroundColor: theme.colors.cardBackground,
                        }
                      ]}
                    >
                      <View style={[
                        styles.radioButton,
                        {
                          borderColor: isSelected ? theme.colors.text : theme.colors.textSecondary,
                        }
                      ]}>
                        {isSelected && (
                          <View
                            style={[
                              styles.radioInner,
                              { backgroundColor: theme.colors.text }
                            ]}
                          />
                        )}
                      </View>
                      <Text style={[
                        styles.classText,
                        {
                          color: theme.colors.text,
                          fontFamily: isSelected ? getFontFamily('600') : getFontFamily('400')
                        }
                      ]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Board Selection - Animated */}
            {selectedClassId && (
              <Animated.View
                style={[
                  styles.section,
                  {
                    opacity: boardSectionOpacity,
                    transform: [{ translateY: boardSectionTranslateY }],
                  }
                ]}
              >
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select your board</Text>
                {loadingBoards ? (
                  <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 20 }} />
                ) : (
                  <View style={styles.boardList}>
                    {stateBoards.length === 0 ? (
                      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                        No boards available for this class
                      </Text>
                    ) : (
                      stateBoards.map((item) => {
                        const isSelected = selectedBoardId === item._id;
                        return (
                          <TouchableOpacity
                            key={item._id}
                            onPress={() => handleBoardSelect(item._id)}
                            activeOpacity={0.7}
                          >
                            <View
                              style={[
                                styles.boardCard,
                                {
                                  backgroundColor: theme.colors.cardBackground,
                                  borderColor: isSelected ? theme.colors.secondary : 'transparent',
                                  borderWidth: isSelected ? 1 : 0,
                                }
                              ]}
                            >
                              <View style={styles.boardInfo}>
                                {item.logo ? (
                                  <Image source={{ uri: item.logo }} style={styles.boardLogo} resizeMode="contain" />
                                ) : (
                                  <View style={[styles.boardLogoPlaceholder, { backgroundColor: theme.colors.border }]} />
                                )}
                                <Text style={[
                                  styles.boardName,
                                  {
                                    color: theme.colors.text,
                                    fontFamily: isSelected ? getFontFamily('600') : getFontFamily('500')
                                  }
                                ]}>
                                  {item.name}
                                </Text>
                              </View>
                              <SVGIcon name="chevron-right" size={20} color={theme.colors.textSecondary} />
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                )}
              </Animated.View>
            )}
          </View>
        </ScrollView>

        {/* Medium Selection Modal */}
        {showMediumModal && (
          <Modal
            visible={showMediumModal}
            transparent={true}
            animationType="none"
            onRequestClose={() => setShowMediumModal(false)}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity
                activeOpacity={1}
                style={StyleSheet.absoluteFill}
                onPress={() => setShowMediumModal(false)}
              />
              <Animated.View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: theme.colors.cardBackground,
                    transform: [{ translateY: modalTranslateY }],
                    opacity: modalOpacity,
                  }
                ]}
              >
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Please Select Your Medium</Text>

                {loadingMediums ? (
                  <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 20 }} />
                ) : (
                  <View style={styles.mediumList}>
                    {mediums.map((item) => (
                      <TouchableOpacity
                        key={item._id}
                        onPress={() => handleMediumSelect(item._id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.mediumCard, { backgroundColor: theme.colors.background }]}>
                          <View style={styles.mediumInfo}>
                            {item.stateBoardId?.logo ? (
                              <Image source={{ uri: item.stateBoardId.logo }} style={styles.mediumLogo} resizeMode="contain" />
                            ) : (
                              <View style={[styles.mediumLogoPlaceholder, { backgroundColor: theme.colors.border }]} />
                            )}
                            <Text style={[styles.mediumName, { color: theme.colors.text }]}>
                              {item.name} Medium
                            </Text>
                          </View>
                          <SVGIcon name="chevron-right" size={20} color={theme.colors.textSecondary} />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowMediumModal(false)}
                >
                  <Text style={{ color: theme.colors.textSecondary }}>Cancel</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Modal>
        )}

        {/* Global Loading Overlay */}
        {loading && (
          <Animated.View style={[styles.loadingOverlay, { opacity: loadingOpacity }]}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: moderateScale(100),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(2),
    marginTop: getSpacing(2),
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: getSpacing(2),
    padding: getSpacing(1),
    zIndex: 1,
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('600'),
  },
  content: {
    paddingHorizontal: getSpacing(2),
  },
  section: {
    marginBottom: getSpacing(3),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('500'),
    marginBottom: getSpacing(2),
  },
  label: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('500'),
    marginBottom: getSpacing(1),
  },
  input: {
    borderRadius: moderateScale(8),
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(1.5),
    fontSize: moderateScale(16),
    borderWidth: 1,
    fontFamily: getFontFamily('400'),
  },
  classGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: getSpacing(1.5),
  },
  classCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: getSpacing(1.5),
    borderRadius: moderateScale(8),
    marginBottom: getSpacing(1),
  },
  radioButton: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getSpacing(1.5),
  },
  radioInner: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
  },
  classText: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('400'),
    flex: 1,
  },
  boardList: {
    gap: getSpacing(1.5),
  },
  boardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getSpacing(1.5),
    borderRadius: moderateScale(8),
  },
  boardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  boardLogo: {
    width: moderateScale(40),
    height: moderateScale(40),
    marginRight: getSpacing(2),
    borderRadius: moderateScale(20),
  },
  boardLogoPlaceholder: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    marginRight: getSpacing(2),
  },
  boardName: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('500'),
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: getSpacing(3),
    minHeight: '40%',
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('600'),
    marginBottom: getSpacing(3),
    textAlign: 'center',
  },
  mediumList: {
    gap: getSpacing(2),
  },
  mediumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getSpacing(2),
    borderRadius: moderateScale(12),
    elevation: 1,
  },
  mediumInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mediumLogo: {
    width: moderateScale(36),
    height: moderateScale(36),
    marginRight: getSpacing(2),
    borderRadius: moderateScale(18),
  },
  mediumLogoPlaceholder: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    marginRight: getSpacing(2),
  },
  mediumName: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('500'),
  },
  closeButton: {
    marginTop: getSpacing(3),
    alignItems: 'center',
    padding: getSpacing(2),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  emptyText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginVertical: getSpacing(2),
    fontStyle: 'italic',
  },
});

export default RegisterStep2Screen;
