import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const RussoInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  prefix,
  suffix,
  containerStyle,
  inputStyle,
  labelStyle,
  error,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [borderWidthAnim] = useState(new Animated.Value(1));

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(borderWidthAnim, {
      toValue: 2,
      duration: 150,
      useNativeDriver: false,
    }).start();
    if (onFocus) onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(borderWidthAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
    if (onBlur) onBlur();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const borderColor = borderWidthAnim.interpolate({
    inputRange: [1, 2],
    outputRange: ['#2C2C2C', '#D4AF37'],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {error && <Text style={styles.errorStar}> *</Text>}
        </Text>
      )}

      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderWidth: borderWidthAnim,
            borderColor,
          },
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
          multiline && styles.multilineContainer,
        ]}
      >
        {prefix && (
          <View style={styles.prefixContainer}>
            <Text style={styles.prefixText}>{prefix}</Text>
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            inputStyle,
            !editable && styles.inputDisabled,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#666666"
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor="#D4AF37"
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.visibilityButton}
            onPress={togglePasswordVisibility}
            activeOpacity={0.7}
          >
            <Icon
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color="#888888"
            />
          </TouchableOpacity>
        )}

        {suffix && !secureTextEntry && (
          <View style={styles.suffixContainer}>
            <Text style={styles.suffixText}>{suffix}</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorIcon}>
            <Icon name="alert-circle" size={20} color="#FF4757" />
          </View>
        )}
      </Animated.View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Geist-Medium',
    color: '#F5F5F5',
    marginBottom: 8,
  },
  errorStar: {
    color: '#FF4757',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 15,
    minHeight: 56,
  },
  inputContainerFocused: {
    backgroundColor: '#1A1A1A',
  },
  inputContainerError: {
    borderColor: '#FF4757',
  },
  multilineContainer: {
    minHeight: 100,
    alignItems: 'flex-start',
    paddingVertical: 15,
  },
  prefixContainer: {
    marginRight: 10,
  },
  prefixText: {
    fontSize: 16,
    fontFamily: 'Geist-Medium',
    color: '#888888',
  },
  input: {
    flex: 1,
    color: '#F5F5F5',
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    paddingVertical: 0,
    minHeight: 20,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 70,
  },
  inputDisabled: {
    color: '#666666',
    opacity: 0.7,
  },
  visibilityButton: {
    padding: 5,
    marginLeft: 10,
  },
  suffixContainer: {
    marginLeft: 10,
  },
  suffixText: {
    fontSize: 16,
    fontFamily: 'Geist-Medium',
    color: '#888888',
  },
  errorIcon: {
    marginLeft: 10,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Geist-Regular',
    color: '#FF4757',
    marginTop: 5,
    marginLeft: 5,
  },
});