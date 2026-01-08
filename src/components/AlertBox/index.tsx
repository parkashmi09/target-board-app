import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Modal from 'react-native-modal';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import SVGIcon from '../SVGIcon';

export interface AlertBoxProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  type?: 'warning' | 'danger' | 'info';
  isLoading?: boolean;
  icon?: string;
}

const AlertBox: React.FC<AlertBoxProps> = ({
  visible,
  onClose,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning',
  isLoading = false,
  icon,
}) => {
  const theme = useTheme();

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const handleConfirm = async () => {
    await onConfirm();
  };

  const getIconName = () => {
    if (icon) return icon;
    if (type === 'danger') return 'alert-triangle';
    if (type === 'warning') return 'alert-triangle';
    return 'info';
  };

  const getIconColor = () => {
    if (type === 'danger') return theme.colors.error;
    if (type === 'warning') return theme.colors.warning;
    return theme.colors.info;
  };

  const getConfirmButtonColor = () => {
    if (type === 'danger') return theme.colors.error;
    if (type === 'warning') return theme.colors.warning;
    return theme.colors.info;
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={() => !isLoading && handleCancel()}
      onBackButtonPress={() => !isLoading && handleCancel()}
      style={styles.modalContainer}
      backdropOpacity={0.6}
      animationIn="fadeIn"
      animationOut="fadeOut"
      avoidKeyboard={true}
      useNativeDriverForBackdrop={true}
    >
      <View style={[styles.modalContent, { backgroundColor: theme.colors.cardBackground }]}>
        <View style={styles.modalHeader}>
          <SVGIcon name={getIconName()} size={moderateScale(32)} color={getIconColor()} />
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
        </View>

        <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
          {message}
        </Text>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton, { borderColor: theme.colors.border }]}
            onPress={handleCancel}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
              {cancelText}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modalButton,
              styles.confirmButton,
              { backgroundColor: getConfirmButtonColor() },
            ]}
            onPress={handleConfirm}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.textInverse} />
            ) : (
              <Text style={[styles.confirmButtonText, { color: theme.colors.textInverse }]}>
                {confirmText}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: moderateScale(16),
    padding: getSpacing(3),
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: getSpacing(2),
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    marginTop: getSpacing(1.5),
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    textAlign: 'center',
    marginBottom: getSpacing(3),
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: getSpacing(2),
  },
  modalButton: {
    flex: 1,
    paddingVertical: getSpacing(1.5),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(44),
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    // backgroundColor set inline
  },
  modalButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});

export default AlertBox;

