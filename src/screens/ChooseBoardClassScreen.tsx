import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Animated, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import { useToast } from '../components/Toast';
import { useRegistrationDataStore } from '../store';
import SVGIcon from '../components/SVGIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateUserProfile, fetchMediums } from '../services/api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../navigation/HomeStack';
import GradientBackground from '../components/GradientBackground';
import { ChevronRight } from 'lucide-react-native';

type ChooseBoardClassNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'ChooseBoardClass'>;

const ChooseBoardClassScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<ChooseBoardClassNavigationProp>();
    const toast = useToast();
    const { stateBoards, classes, loadAllData } = useRegistrationDataStore();

    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedBoardId, setSelectedBoardId] = useState<string>('');
    const [selectedMediumId, setSelectedMediumId] = useState<string>('');

    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    // Mediums state
    const [mediums, setMediums] = useState<any[]>([]);
    const [loadingMediums, setLoadingMediums] = useState(false);
    const [showMediumModal, setShowMediumModal] = useState(false);

    // Animations
    const boardAnim = useRef(new Animated.Value(0)).current; // 0: hidden, 1: visible

    useEffect(() => {
        loadAllData();
        loadUserData();
    }, [loadAllData]);

    const loadUserData = async () => {
        try {
            const userDataString = await AsyncStorage.getItem('userData');
            if (userDataString) {
                const user = JSON.parse(userDataString);
                setUserData(user);
                // Don't pre-select anything - let user make fresh selections
            }
        } catch (error) {
            console.error('Failed to load user data', error);
        }
    };

    const handleClassSelect = (classId: string) => {
        setSelectedClassId(classId);
        // Animate boards in
        Animated.timing(boardAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    };

    const handleBoardSelect = async (boardId: string) => {
        setSelectedBoardId(boardId);
        setLoadingMediums(true);
        try {
            const data = await fetchMediums(boardId);
            setMediums(data);
            setShowMediumModal(true);
        } catch (error) {
            console.error('Failed to fetch mediums', error);
            toast.show({ text: 'Failed to fetch mediums', type: 'error' });
        } finally {
            setLoadingMediums(false);
        }
    };

    const handleMediumSelect = async (mediumId: string) => {
        setSelectedMediumId(mediumId);
        setShowMediumModal(false);
        handleSave(mediumId);
    };

    const handleSave = async (mediumId: string) => {
        if (!selectedClassId) {
            toast.show({ text: 'Please select your class', type: 'error' });
            return;
        }
        if (!selectedBoardId) {
            toast.show({ text: 'Please select your board', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const payload: any = {
                city: userData?.city || 'Mumbai',
                classId: selectedClassId,
                stateBoardId: selectedBoardId,
            };

            await updateUserProfile(payload);

            // Find selected objects to update local storage fully
            const selectedClassObj = classes.find(c => c._id === selectedClassId);
            const selectedBoardObj = stateBoards.find(b => b._id === selectedBoardId);
            const selectedMediumObj = mediums.find(m => m._id === mediumId);

            // Update Local Storage
            const updatedUser = {
                ...userData,
                classId: selectedClassId,
                class_id: selectedClassId,
                stateBoardId: selectedBoardId,
                mediumId: mediumId, // Save locally
                class: selectedClassObj || userData.class,
                stateBoard: selectedBoardObj || userData.stateBoard,
                medium: selectedMediumObj
            };

            await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));

            toast.show({ text: 'Preferences updated!', type: 'success' });
            navigation.goBack();

        } catch (e: any) {
            console.error('Update error:', e);
            const errorMessage = e?.message || e?.data?.message || 'An unexpected error occurred.';
            toast.show({ text: errorMessage, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <GradientBackground>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <SVGIcon name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Select Streams</Text>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
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
                                            style={[
                                                styles.classCard,
                                                {
                                                    backgroundColor: theme.colors.cardBackground,
                                                }
                                            ]}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[
                                                styles.radioButton,
                                                {
                                                    borderColor: isSelected ? theme.colors.text : theme.colors.textSecondary,
                                                }
                                            ]}>
                                                {isSelected && <View style={[styles.radioInner, { backgroundColor: theme.colors.text }]} />}
                                            </View>
                                            <Text style={[
                                                styles.classText,
                                                {
                                                    color: theme.colors.text,
                                                    fontWeight: '400'
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
                        <Animated.View
                            style={[
                                styles.section,
                                {
                                    opacity: boardAnim,
                                    transform: [{
                                        translateY: boardAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [50, 0]
                                        })
                                    }]
                                }
                            ]}
                        >
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select your board</Text>
                            <View style={styles.boardList}>
                                {stateBoards.map((item) => {
                                    const isSelected = selectedBoardId === item._id;
                                    return (
                                        <TouchableOpacity
                                            key={item._id}
                                            onPress={() => handleBoardSelect(item._id)}
                                            style={[
                                                styles.boardCard,
                                                {
                                                    backgroundColor: theme.colors.cardBackground,
                                                }
                                            ]}
                                            activeOpacity={0.7}
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
                                                        fontWeight: '500'
                                                    }
                                                ]}>
                                                    {item.name}
                                                </Text>
                                            </View>
                                            <ChevronRight size={20} color={theme.colors.textSecondary} />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </Animated.View>
                    </View>
                </ScrollView>

                {/* Medium Selection Modal */}
                <Modal
                    visible={showMediumModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowMediumModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: theme.colors.cardBackground }]}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Please Select Your Medium</Text>

                            {loadingMediums ? (
                                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 20 }} />
                            ) : (
                                <View style={styles.mediumList}>
                                    {mediums.map((item) => (
                                        <TouchableOpacity
                                            key={item._id}
                                            style={[styles.mediumCard, { backgroundColor: theme.colors.background }]}
                                            onPress={() => handleMediumSelect(item._id)}
                                        >
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
                                            <ChevronRight size={20} color={theme.colors.textSecondary} />
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
                        </View>
                    </View>
                </Modal>

                {/* Global Loading Overlay */}
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#FFFFFF" />
                    </View>
                )}
            </View>
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
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: getSpacing(2),
    },
    section: {
        marginBottom: getSpacing(3),
    },
    sectionTitle: {
        fontSize: moderateScale(16),
        fontWeight: '500',
        marginBottom: getSpacing(2),
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
        fontWeight: '600',
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
        fontWeight: '500',
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
});

export default ChooseBoardClassScreen;

