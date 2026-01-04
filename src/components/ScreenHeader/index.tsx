import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Animated, Dimensions, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, X, Mic, Search } from 'lucide-react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import SVGIcon from '../SVGIcon';

interface ScreenHeaderProps {
    title?: string;
    onBackPress?: () => void;
    onSearch?: (searchText: string) => void;
    onMenuPress?: () => void;
    placeholder?: string;
    defaultValue?: string;
    showSearch?: boolean;
    showMenu?: boolean;
    rightComponent?: React.ReactNode;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
    title,
    onBackPress,
    onSearch,
    onMenuPress,
    placeholder = 'Search',
    defaultValue = '',
    showSearch = true,
    showMenu = false,
    rightComponent
}) => {
    const theme = useTheme();
    const { colors } = theme;
    const backgroundColor = theme.isDark ? colors.background : colors.yellow;
    const navigation = useNavigation();
    const [searchText, setSearchText] = useState(defaultValue);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const screenWidth = Dimensions.get('window').width;

    // Update local state when defaultValue changes
    useEffect(() => {
        setSearchText(defaultValue);
    }, [defaultValue]);

    // Reset search state when showSearch changes
    useEffect(() => {
        setIsSearchActive(false);
    }, [showSearch]);

    // Animate search bar sliding in from left when search is activated
    useEffect(() => {
        if (isSearchActive) {
            // Start from left (off-screen to the left)
            slideAnim.setValue(-screenWidth);
            // Animate to center (0) with smooth easing
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start(() => {
                // Focus input after animation completes
                inputRef.current?.focus();
            });
        } else {
            // Slide out to the left when deactivating
            Animated.timing(slideAnim, {
                toValue: -screenWidth,
                duration: 300,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }).start();
        }
    }, [isSearchActive, screenWidth]);

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            navigation.goBack();
        }
    };

    const handleSearchChange = (text: string) => {
        setSearchText(text);
        if (onSearch) {
            onSearch(text);
        }
    };

    const handleClear = () => {
        setSearchText('');
        if (onSearch) {
            onSearch('');
        }
        inputRef.current?.focus();
    };

    const handleMicPress = () => {
        // Placeholder for voice search functionality
        // You can implement voice search here later
        inputRef.current?.focus();
    };

    const handleSearchIconPress = () => {
        setIsSearchActive(true);
    };

    const handleCloseSearch = () => {
        setIsSearchActive(false);
        setSearchText('');
        if (onSearch) {
            onSearch('');
        }
    };

    if (!showSearch) {
        // Fallback to title-based header if search is disabled
        return (
            <View style={[styles.header, { backgroundColor }]}>
                <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                    <ChevronLeft size={moderateScale(24)} color={colors.text} />
                </TouchableOpacity>
                {title && (
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
                )}
                {rightComponent && (
                    <View style={styles.rightIcons}>
                        {rightComponent}
                    </View>
                )}
            </View>
        );
    }

    return (
        <View style={[styles.headerContainer, { backgroundColor }]}>
            {/* Default Header with Title and Search Icon */}
            {!isSearchActive && (
                <View style={[styles.header, { backgroundColor }]}>
                    <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                        <ChevronLeft size={moderateScale(24)} color={colors.text} />
                    </TouchableOpacity>
                    {title && (
                        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
                    )}
                    <View style={styles.rightIcons}>
                        {rightComponent}
                        {showSearch && (
                            <TouchableOpacity onPress={handleSearchIconPress} style={styles.searchIconButton}>
                                <Search size={moderateScale(24)} color={colors.text} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {/* Search Bar - Slides in from left when activated - Always render but position off-screen when inactive */}
            <Animated.View
                style={[
                    styles.searchHeader,
                    {
                        backgroundColor: colors.cardBackground,
                        transform: [{ translateX: slideAnim }],
                        opacity: isSearchActive ? 1 : 0,
                        zIndex: isSearchActive ? 1001 : -1,
                    }
                ]}
                pointerEvents={isSearchActive ? 'auto' : 'none'}
            >
                <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                    <ChevronLeft size={moderateScale(24)} color={colors.text} />
                </TouchableOpacity>
                <TextInput
                    ref={inputRef}
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textSecondary}
                    value={searchText}
                    onChangeText={handleSearchChange}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={isSearchActive}
                />
                {searchText.length > 0 ? (
                    <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                        <X size={moderateScale(20)} color={colors.textSecondary} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleCloseSearch} style={styles.closeButton}>
                        <X size={moderateScale(20)} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        marginTop: getSpacing(2),
        position: 'relative',
        zIndex: 1000,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: getSpacing(2),
        paddingHorizontal: getSpacing(2),
        paddingVertical: getSpacing(1.5),
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        // borderRadius: moderateScale(8),
        paddingHorizontal: getSpacing(2),
        paddingVertical: getSpacing(1.5),
        minHeight: moderateScale(44),
        marginBottom: getSpacing(8),
        position: 'absolute',
        width: '95%',
        left: '2.5%',
        right: 0,
        bottom: getSpacing(8),
        top: getSpacing(2),
    },
    backButton: {
        marginRight: getSpacing(1.5),
        padding: getSpacing(0.5),
    },
    headerTitle: {
        fontSize: moderateScale(20),
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    searchInput: {
        flex: 1,
        fontSize: moderateScale(16),
        paddingVertical: 0,
        paddingHorizontal: getSpacing(1),
        margin: 0,
        minHeight: moderateScale(24),
    },
    clearButton: {
        padding: getSpacing(0.5),
        marginLeft: getSpacing(0.5),
    },
    micButton: {
        padding: getSpacing(0.5),
        marginLeft: getSpacing(0.5),
    },
    rightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchIconButton: {
        padding: getSpacing(0.5),
        marginLeft: getSpacing(1),
    },
    menuIconButton: {
        padding: getSpacing(0.5),
        marginLeft: getSpacing(1),
    },
    closeButton: {
        padding: getSpacing(0.5),
        marginLeft: getSpacing(0.5),
    },
});

export default ScreenHeader;

