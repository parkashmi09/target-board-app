import React, { memo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import TopperCard from '../TopperCard';
import ResponsiveView from '../ResponsiveView';
import { Images } from '../../assets/images';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { Theme } from '../../theme/theme';

interface ToppersSectionProps {
    theme: Theme;
}

const ToppersSection = memo(({ theme }: ToppersSectionProps) => {
    const toppers = [
        { id: 1, name: "Priya Jaiswal", rank: 1, percentage: "96.80%", gradientColors: ['#E3F2FD', '#FFFFFF'] },
        { id: 2, name: "Rahul Kumar", rank: 2, percentage: "95.50%", gradientColors: ['#FFF3E0', '#FFFFFF'] },
        { id: 3, name: "Anjali Singh", rank: 3, percentage: "94.20%", gradientColors: ['#F3E5F5', '#FFFFFF'] },
        { id: 4, name: "Amit Verma", rank: 4, percentage: "93.80%", gradientColors: ['#E8F5E9', '#FFFFFF'] },
    ];

    const renderItem = useCallback(({ item }: { item: any }) => (
        <TopperCard
            name={item.name}
            rank={item.rank}
            percentage={item.percentage}
            studentImage={Images.TB_LOGO}
            gradientColors={item.gradientColors}
        />
    ), []);

    return (
        <ResponsiveView padding={2}>
            <View style={styles.toppersSection}>
                <Text
                    style={[
                        styles.toppersSectionTitle,
                        {
                            color: theme.colors.text,
                            fontSize: moderateScale(20),
                            fontWeight: '800',
                            marginBottom: getSpacing(2),
                        },
                    ]}
                >
                    Top Toppers
                </Text>
                <FlatList
                    data={toppers}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.toppersScrollContent}
                />
            </View>
        </ResponsiveView>
    );
});

const styles = StyleSheet.create({
    toppersSection: {
        marginTop: getSpacing(2),
    },
    toppersSectionTitle: {
        fontWeight: '800',
    },
    toppersScrollContent: {
        paddingRight: getSpacing(2),
    },
});

export default ToppersSection;


