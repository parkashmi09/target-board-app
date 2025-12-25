import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import SVGIcon from '../SVGIcon';
import { Images } from '../../assets/images';

interface ImageBannerProps {
  imageSource?: ImageSourcePropType;
  imageUrl?: string;
  onPress?: () => void;
  onClose?: () => void;
}

const ImageBanner: React.FC<ImageBannerProps> = ({
  imageSource,
  imageUrl,
  onPress,
  onClose,
}) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || (!imageSource && !imageUrl)) return null;

  const screenWidth = Dimensions.get('window').width;
  const bannerWidth = screenWidth * 0.9; // 90% of device width
  const bannerHeight = 85; // 40px height

  return (
    <View style={styles.outerContainer}>
      <View
        style={[
          styles.container,
          {
            width: bannerWidth,
            height: bannerHeight,
            alignSelf: 'center',
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          style={styles.imageContainer}
        >
          <Image
            source={imageUrl ? { uri: imageUrl } : (imageSource || Images.TB_LOGO)}
            style={styles.bannerImage}
            resizeMode="cover"
            defaultSource={Images.TB_LOGO}
          />
        </TouchableOpacity>

        {/* Close Button - Top Right */}
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <View style={styles.closeIconWrapper}>
            <SVGIcon
              name="close"
              size={moderateScale(14)}
              color="rgba(255, 255, 255, 0.9)"
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    paddingVertical: getSpacing(0.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderRadius: moderateScale(4),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 10,
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    right: moderateScale(8),
    top: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    width: moderateScale(28),
    height: moderateScale(28),
    zIndex: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: moderateScale(14),
    overflow: 'hidden',
  },
  closeIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: moderateScale(28),
    height: moderateScale(28),
  },
});

export default ImageBanner;

