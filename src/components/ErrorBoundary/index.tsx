import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import GradientBackground from '../GradientBackground';
import SVGIcon from '../SVGIcon';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Error info:', errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // In production, you might want to log this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render ErrorFallbackWrapper which can use hooks
      return (
        <ErrorFallbackWrapper 
          error={this.state.error} 
          errorInfo={this.state.errorInfo} 
          onReset={this.handleReset} 
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

// Wrapper component to use hooks (hooks can't be used in class components)
const ErrorFallbackWrapper: React.FC<ErrorFallbackProps> = (props) => {
  return <ErrorFallback {...props} />;
};

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorInfo, onReset }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <GradientBackground>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Error Icon */}
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.error + '20' }]}>
              <SVGIcon name="alert-triangle" size={moderateScale(64)} color={theme.colors.error} />
            </View>

            {/* Error Title */}
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('error.title') || 'Oops! Something went wrong'}
            </Text>

            {/* Error Message */}
            <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
              {t('error.message') || 'We encountered an unexpected error. Please try again or restart the app.'}
            </Text>

            {/* Error Details (Development Only) */}
            {__DEV__ && error && (
              <View style={styles.detailsContainer}>
                <TouchableOpacity
                  onPress={() => setShowDetails(!showDetails)}
                  style={[styles.detailsButton, { borderColor: theme.colors.border }]}
                >
                  <Text style={[styles.detailsButtonText, { color: theme.colors.text }]}>
                    {showDetails
                      ? t('error.hideDetails') || 'Hide Details'
                      : t('error.showDetails') || 'Show Details'}
                  </Text>
                </TouchableOpacity>

                {showDetails && (
                  <View style={[styles.detailsBox, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>
                      {t('error.errorDetails') || 'Error Details:'}
                    </Text>
                    <Text style={[styles.detailsText, { color: theme.colors.textSecondary }]}>
                      {error.toString()}
                    </Text>
                    {errorInfo && (
                      <Text style={[styles.detailsText, { color: theme.colors.textSecondary, marginTop: getSpacing(1) }]}>
                        {errorInfo.componentStack}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={onReset}
                style={[styles.primaryButton, { backgroundColor: theme.colors.accent }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.primaryButtonText, { color: theme.colors.textInverse }]}>
                  {t('error.tryAgain') || 'Try Again'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  // In a real app, you might want to restart the app or navigate to home
                  onReset();
                }}
                style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
                  {t('error.goHome') || 'Go Home'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: getSpacing(3),
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  iconContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getSpacing(3),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: getSpacing(1.5),
  },
  message: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    lineHeight: moderateScale(24),
    marginBottom: getSpacing(3),
    paddingHorizontal: getSpacing(2),
  },
  detailsContainer: {
    width: '100%',
    marginBottom: getSpacing(3),
  },
  detailsButton: {
    paddingVertical: getSpacing(1),
    paddingHorizontal: getSpacing(2),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    alignSelf: 'center',
    marginBottom: getSpacing(1),
  },
  detailsButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  detailsBox: {
    padding: getSpacing(2),
    borderRadius: moderateScale(8),
    marginTop: getSpacing(1),
  },
  detailsTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginBottom: getSpacing(1),
  },
  detailsText: {
    fontSize: moderateScale(12),
    fontFamily: 'monospace',
    lineHeight: moderateScale(18),
  },
  buttonContainer: {
    width: '100%',
    gap: getSpacing(2),
  },
  primaryButton: {
    paddingVertical: getSpacing(2),
    paddingHorizontal: getSpacing(3),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(50),
  },
  primaryButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: getSpacing(2),
    paddingHorizontal: getSpacing(3),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: moderateScale(50),
  },
  secondaryButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});

// Export as a functional component wrapper for easier use
const ErrorBoundary: React.FC<Props> = (props) => {
  return <ErrorBoundaryClass {...props} />;
};

export default ErrorBoundary;

