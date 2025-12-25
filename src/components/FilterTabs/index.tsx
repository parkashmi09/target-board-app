import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';

export type FilterTabType = string;

export interface FilterTab {
    id: FilterTabType;
    label: string;
    icon?: React.ComponentType<{ size: number; color: string }>;
}

interface FilterTabsProps {
    tabs: FilterTab[];
    activeTab: FilterTabType;
    onTabChange: (tabId: FilterTabType) => void;
}

const FilterTabs: React.FC<FilterTabsProps> = ({ tabs, activeTab, onTabChange }) => {
    const theme = useTheme();
    const { colors } = theme;

    return (
        <View style={[styles.tabsContainer, { backgroundColor: 'transparent' }]}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const IconComponent = tab.icon;

                return (
                    <TouchableOpacity
                        key={tab.id}
                        style={[
                            styles.tab,
                            isActive && {
                                backgroundColor: colors.secondary,
                                borderColor: colors.secondary,
                            },
                            !isActive && { borderColor: colors.border }
                        ]}
                        onPress={() => onTabChange(tab.id)}
                        activeOpacity={0.7}
                    >
                        {IconComponent && (
                            <IconComponent 
                                size={moderateScale(14)} 
                                color={isActive ? colors.secondaryText : colors.textSecondary} 
                            />
                        )}
                        <Text style={[
                            styles.tabText,
                            { 
                                color: isActive ? colors.secondaryText : colors.textSecondary,
                                fontWeight: isActive ? '700' : '600'
                            }
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: getSpacing(2),
        paddingVertical: getSpacing(1.5),
        gap: getSpacing(1),
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: getSpacing(1.25),
        paddingHorizontal: getSpacing(1.5),
        borderRadius: moderateScale(4),
        gap: getSpacing(0.5),
    },
    tabText: {
        fontSize: moderateScale(14),
    },
});

export default FilterTabs;

