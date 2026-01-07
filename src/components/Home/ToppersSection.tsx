import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import TopperCard from '../TopperCard';
import { Images } from '../../assets/images';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { Theme } from '../../theme/theme';

interface ToppersSectionProps {
    theme: Theme;
}

const ToppersSection = memo(({ theme }: ToppersSectionProps) => {
    const progress = useSharedValue(0);
    const windowWidth = useMemo(() => Dimensions.get('window').width, []);
    
    const toppers = useMemo(() => [
        { id: 1, name: "Priya Jaiswal", rank: 1, percentage: "96.80%", gradientColors: ['#E3F2FD', '#FFFFFF'] },
        { id: 2, name: "Rahul Kumar", rank: 2, percentage: "95.50%", gradientColors: ['#FFF3E0', '#FFFFFF'] },
        { id: 3, name: "Anjali Singh", rank: 3, percentage: "94.20%", gradientColors: ['#F3E5F5', '#FFFFFF'] },
        { id: 4, name: "Amit Verma", rank: 4, percentage: "93.80%", gradientColors: ['#E8F5E9', '#FFFFFF'] },
    ], []);

    // Match CourseSection styling
    const horizontalPadding = useMemo(() => getSpacing(1.5), []);
    const peekAmount = useMemo(() => moderateScale(20), []);
    const cardWidth = useMemo(() => windowWidth - horizontalPadding * 2 - peekAmount, [windowWidth, horizontalPadding, peekAmount]);
    const cardHeight = useMemo(() => moderateScale(260) + getSpacing(2), []);

    const renderItem = useCallback(({ item }: { item: any }) => (
        <View style={[styles.cardWrapper, { width: cardWidth }]}>
            <TopperCard
                name={item.name}
                rank={item.rank}
                percentage={item.percentage}
                studentImage={Images.TB_LOGO}
                gradientColors={item.gradientColors}
                width={cardWidth}
            />
        </View>
    ), [cardWidth]);

    return (
        <View style={styles.container}>
            <Text
                style={[
                    styles.toppersSectionTitle,
                    {
                        color: theme.colors.text,
                        fontSize: moderateScale(18),
                        fontWeight: '700',
                        marginLeft: horizontalPadding,
                        marginBottom: getSpacing(0.8),
                    },
                ]}
            >
               Our Toppers
            </Text>
            {toppers.length > 0 && (
                <Carousel
                    width={cardWidth}
                    height={cardHeight}
                    data={toppers}
                    renderItem={renderItem}
                    loop={toppers.length > 1}
                    autoPlay={false}
                    pagingEnabled
                    snapEnabled
                    mode="parallax"
                    modeConfig={{
                        parallaxScrollingScale: 0.90,
                        parallaxScrollingOffset: peekAmount,
                    }}
                    style={{ marginLeft: horizontalPadding, overflow: 'visible' }}
                    enabled={true}
                    windowSize={2}
                />
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginVertical: getSpacing(1.2),
    },
    toppersSectionTitle: {
        fontWeight: '700',
    },
    cardWrapper: {
        alignItems: 'stretch',
    },
});

export default ToppersSection;


