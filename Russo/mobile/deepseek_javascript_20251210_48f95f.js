import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useTheme } from 'styled-components/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const RussoTabBar = ({ state, descriptors, navigation }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Icon mapping
        const getIconName = () => {
          switch (route.name) {
            case 'Home':
              return 'home';
            case 'Search':
              return 'magnify';
            case 'Cart':
              return 'shopping';
            case 'Profile':
              return 'account';
            default:
              return 'circle';
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <Animated.View style={styles.tabContent}>
              {/* Icon */}
              <View style={[
                styles.iconContainer,
                isFocused && styles.iconContainerActive,
              ]}>
                <Icon
                  name={getIconName()}
                  size={24}
                  color={isFocused ? '#0A0A0A' : '#888888'}
                />
              </View>

              {/* Label */}
              <Text style={[
                styles.label,
                isFocused && styles.labelActive,
              ]}>
                {label}
              </Text>

              {/* Active indicator */}
              {isFocused && (
                <View style={styles.activeIndicator} />
              )}
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
    paddingHorizontal: 10,
    paddingVertical: 8,
    height: 70,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconContainerActive: {
    backgroundColor: '#D4AF37',
  },
  label: {
    fontSize: 10,
    fontFamily: 'Geist-Medium',
    color: '#888888',
    letterSpacing: 0.5,
  },
  labelActive: {
    color: '#D4AF37',
    fontFamily: 'Geist-Bold',
  },
  activeIndicator: {
    position: 'absolute',
    top: -5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4AF37',
  },
});