// Archivo: mobile/src/widgets/RussoWidgets.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export const Widget1_FeaturedProduct = ({ product, theme, onPress }) => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                style={[styles.widgetContainer, { backgroundColor: theme.primary }]}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={onPress}
                activeOpacity={0.9}
            >
                <View style={styles.widgetHeader}>
                    <Text style={[styles.widgetTitle, { color: theme.accent }]}>
                        PRODUCTO EXCLUSIVO
                    </Text>
                    <MaterialCommunityIcons name="crown" size={20} color={theme.secondary} />
                </View>
                
                {product ? (
                    <>
                        <Text style={[styles.productName, { color: theme.text }]}>
                            {product.name}
                        </Text>
                        <Text style={[styles.productPrice, { color: theme.secondary }]}>
                            ${product.price}
                        </Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>NUEVO</Text>
                        </View>
                    </>
                ) : (
                    <Text style={[styles.placeholder, { color: theme.text }]}>
                        Descubre lo último en lujo
                    </Text>
                )}
                
                <View style={[styles.footer, { borderTopColor: theme.secondary }]}>
                    <Text style={[styles.footerText, { color: theme.accent }]}>
                        VER AHORA →
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export const Widget2_QuickCart = ({ itemCount, total, theme, onPress }) => {
    return (
        <TouchableOpacity
            style={[styles.widgetContainer, styles.cartWidget, { backgroundColor: theme.primary }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.cartHeader}>
                <Ionicons name="bag-handle" size={24} color={theme.secondary} />
                <View style={[styles.cartBadge, { backgroundColor: theme.secondary }]}>
                    <Text style={styles.badgeCount}>{itemCount || 0}</Text>
                </View>
            </View>
            
            <Text style={[styles.cartTitle, { color: theme.text }]}>Tu elegancia</Text>
            <Text style={[styles.cartTotal, { color: theme.secondary }]}>
                ${total || '0.00'}
            </Text>
            
            <View style={styles.cartFooter}>
                <Text style={[styles.cartAction, { color: theme.accent }]}>
                    COMPRAR →
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export const Widget3_Notifications = ({ notifications, theme, onPress }) => {
    const unreadCount = notifications?.filter(n => !n.read).length || 0;
    
    return (
        <TouchableOpacity
            style={[styles.widgetContainer, { backgroundColor: theme.primary }]}
            onPress={onPress}
        >
            <View style={styles.notificationHeader}>
                <Ionicons name="notifications" size={22} color={theme.secondary} />
                {unreadCount > 0 && (
                    <View style={[styles.notificationBadge, { backgroundColor: '#FF4757' }]}>
                        <Text style={styles.badgeCount}>{unreadCount}</Text>
                    </View>
                )}
            </View>
            
            <Text style={[styles.widgetTitle, { color: theme.accent }]}>
                NOTIFICACIONES
            </Text>
            
            {notifications?.slice(0, 2).map((notification, index) => (
                <View key={index} style={styles.notificationItem}>
                    <View style={[
                        styles.notificationDot, 
                        { backgroundColor: notification.read ? theme.accent : theme.secondary }
                    ]} />
                    <Text style={[styles.notificationText, { color: theme.text }]} numberOfLines={2}>
                        {notification.message}
                    </Text>
                </View>
            ))}
            
            {(!notifications || notifications.length === 0) && (
                <Text style={[styles.placeholder, { color: theme.text }]}>
                    Sin notificaciones nuevas
                </Text>
            )}
        </TouchableOpacity>
    );
};

export const Widget4_OrderStatus = ({ order, theme, onPress }) => {
    const getStatusColor = (status) => {
        const colors = {
            'processing': theme.secondary,
            'shipped': '#4CAF50',
            'delivered': '#2196F3',
            'pending': '#FF9800'
        };
        return colors[status] || theme.accent;
    };

    return (
        <TouchableOpacity
            style={[styles.widgetContainer, { backgroundColor: theme.primary }]}
            onPress={onPress}
        >
            <Text style={[styles.widgetTitle, { color: theme.accent }]}>
                ESTADO DE PEDIDO
            </Text>
            
            {order ? (
                <>
                    <Text style={[styles.orderNumber, { color: theme.text }]}>
                        #{order.order_number}
                    </Text>
                    
                    <View style={styles.statusContainer}>
                        <View style={[
                            styles.statusDot, 
                            { backgroundColor: getStatusColor(order.status) }
                        ]} />
                        <Text style={[styles.statusText, { color: theme.text }]}>
                            {order.status.toUpperCase()}
                        </Text>
                    </View>
                    
                    <View style={styles.progressBar}>
                        <View style={[
                            styles.progressFill, 
                            { 
                                width: `${order.progress || 50}%`,
                                backgroundColor: theme.secondary
                            }
                        ]} />
                    </View>
                </>
            ) : (
                <Text style={[styles.placeholder, { color: theme.text }]}>
                    Sin pedidos activos
                </Text>
            )}
        </TouchableOpacity>
    );
};

// Continuar con los otros 11 widgets...

export const Widget5_QuickSearch = ({ theme, onPress }) => {
    return (
        <TouchableOpacity
            style={[styles.widgetContainer, styles.searchWidget, { backgroundColor: theme.primary }]}
            onPress={onPress}
        >
            <Ionicons name="search" size={28} color={theme.secondary} />
            <Text style={[styles.searchText, { color: theme.text }]}>
                Buscar exclusivos...
            </Text>
        </TouchableOpacity>
    );
};

export const Widget6_Wishlist = ({ items, theme, onPress }) => {
    return (
        <TouchableOpacity
            style={[styles.widgetContainer, { backgroundColor: theme.primary }]}
            onPress={onPress}
        >
            <Ionicons name="heart" size={24} color={theme.secondary} />
            <Text style={[styles.widgetTitle, { color: theme.accent }]}>
                FAVORITOS
            </Text>
            <Text style={[styles.countText, { color: theme.text }]}>
                {items || 0} artículos
            </Text>
        </TouchableOpacity>
    );
};

export const Widget7_NewArrivals = ({ count, theme, onPress }) => {
    return (
        <TouchableOpacity
            style={[styles.widgetContainer, { backgroundColor: theme.primary }]}
            onPress={onPress}
        >
            <MaterialCommunityIcons name="gift" size={26} color={theme.secondary} />
            <Text style={[styles.widgetTitle, { color: theme.accent }]}>
                NUEVOS
            </Text>
            <Text style={[styles.countText, { color: theme.text }]}>
                {count || 12} productos
            </Text>
        </TouchableOpacity>
    );
};

export const Widget8_ExclusiveOffers = ({ offers, theme, onPress }) => {
    return (
        <TouchableOpacity
            style={[styles.widgetContainer, styles.offerWidget, { backgroundColor: theme.primary }]}
            onPress={onPress}
        >
            <View style={styles.offerBadge}>
                <Text style={styles.offerBadgeText}>EXCLUSIVO</Text>
            </View>
            <Text style={[styles.offerText, { color: theme.secondary }]}>
                Ofertas solo para ti
            </Text>
        </TouchableOpacity>
    );
};

export const Widget9_RecentViews = ({ products, theme, onPress }) => {
    return (
        <TouchableOpacity
            style={[styles.widgetContainer, { backgroundColor: theme.primary }]}
            onPress={onPress}
        >
            <Text style={[styles.widgetTitle, { color: theme.accent }]}>
                VISTOS RECIENTEMENTE
            </Text>
            <Text style={[styles.countText, { color: theme.text }]}>
                {products?.length || 0} productos
            </Text>
        </TouchableOpacity>
    );
};

export const Widget10_PersonalStats = ({ stats, theme, onPress }) => {
    return (
        <TouchableOpacity
            style={[styles.widgetContainer, { backgroundColor: theme.primary }]}
            onPress={onPress}
        >
            <MaterialCommunityIcons name="chart-box" size={24} color={theme.secondary} />
            <Text style={[styles.widgetTitle, { color: theme.accent }]}>
                TUS ESTADÍSTICAS
            </Text>
        </TouchableOpacity>
    );
};

export const Widget11_EventCalendar = ({ events, theme, onPress }) => {
    return (
        <TouchableOpacity
            style={[styles.widgetContainer, { backgroundColor: theme.primary }]}
            onPress={onPress}
        >
            <Ionicons name="calendar" size={22} color={theme.secondary} />
            <Text style={[styles.widgetTitle, { color: theme.accent }]}>
                EVENTOS
            </Text>
            <Text style={[styles.countText, { color: theme.text }]}>
                {events?.length || 0} próximos
            </Text>
        </TouchableOpacity>
    );
};

export const Widget12_QuickActions = ({ actions, theme, onAction }) => {
    return (
        <View style={[styles.widgetContainer, { backgroundColor: theme.primary }]}>
            <Text style={[styles.widgetTitle, { color: theme.accent }]}>
                ACCIONES RÁPIDAS
            </Text>
            <View style={styles.actionGrid}>
                {actions?.map((action, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.actionButton}
                        onPress={() => onAction(action)}
                    >
                        <Ionicons name={action.icon} size={20} color={theme.secondary} />
                        <Text style={[styles.actionText, { color: theme.text }]}>
                            {action.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

export const Widget13_ShippingTracker = ({ shipments, theme, onPress }) => {
    return (
        <TouchableOpacity
            style={[styles.widgetContainer, { backgroundColor: theme.primary }]}
            onPress={onPress}
        >
            <MaterialCommunityIcons name="truck-fast" size={24} color={theme.secondary} />
            <Text style={[styles.widgetTitle, { color: theme.accent }]}>
                ENVÍOS
            </Text>
            <Text style={[styles.countText, { color: theme.text }]}>
                {shipments?.length || 0} activos
            </Text>
        </TouchableOpacity>
    );
};

export const Widget14_ThemePreview = ({ theme, onPress }) => {
    return (
        <TouchableOpacity
            style={[styles.widgetContainer, styles.themeWidget, { backgroundColor: theme.primary }]}
            onPress={onPress}
        >
            <View style={[styles.themePreview, { backgroundColor: theme.secondary }]} />
            <Text style={[styles.themeName, { color: theme.text }]}>
                {theme.name}
            </Text>
        </TouchableOpacity>
    );
};

export const Widget15_Interactive3D = ({ product, theme, onPress }) => {
    return (
        <TouchableOpacity
            style={[styles.widgetContainer, styles.interactiveWidget, { backgroundColor: theme.primary }]}
            onPress={onPress}
        >
            <MaterialCommunityIcons name="cube-scan" size={28} color={theme.secondary} />
            <Text style={[styles.widgetTitle, { color: theme.accent }]}>
                VER EN 3D
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    widgetContainer: {
        borderRadius: 16,
        padding: 16,
        margin: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    widgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    widgetTitle: {
        fontSize: 12,
        fontFamily: 'serif',
        letterSpacing: 1,
        fontWeight: '600',
    },
    productName: {
        fontSize: 16,
        fontFamily: 'serif',
        marginVertical: 4,
    },
    productPrice: {
        fontSize: 20,
        fontFamily: 'serif',
        fontWeight: '700',
    },
    badge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: '#D4AF37',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '700',
    },
    footer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    footerText: {
        fontSize: 11,
        fontFamily: 'serif',
        letterSpacing: 0.5,
    },
    placeholder: {
        fontSize: 14,
        fontFamily: 'serif',
        opacity: 0.7,
        textAlign: 'center',
        marginVertical: 8,
    },
    // Estilos específicos para cada widget...
    cartWidget: {
        minHeight: 120,
    },
    cartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cartBadge: {
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeCount: {
        color: '#000',
        fontSize: 10,
        fontWeight: '700',
    },
    cartTitle: {
        fontSize: 14,
        fontFamily: 'serif',
        marginTop: 8,
    },
    cartTotal: {
        fontSize: 24,
        fontFamily: 'serif',
        fontWeight: '700',
        marginTop: 4,
    },
    cartFooter: {
        marginTop: 8,
    },
    cartAction: {
        fontSize: 12,
        fontFamily: 'serif',
        letterSpacing: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    notificationBadge: {
        marginLeft: 8,
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    notificationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    notificationText: {
        fontSize: 12,
        fontFamily: 'serif',
        flex: 1,
    },
    orderNumber: {
        fontSize: 14,
        fontFamily: 'serif',
        marginVertical: 4,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        fontFamily: 'serif',
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        marginTop: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    searchWidget: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchText: {
        marginLeft: 8,
        fontSize: 14,
        fontFamily: 'serif',
        opacity: 0.8,
    },
    countText: {
        fontSize: 12,
        fontFamily: 'serif',
        marginTop: 4,
    },
    offerWidget: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 100,
    },
    offerBadge: {
        backgroundColor: '#D4AF37',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 8,
    },
    offerBadgeText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    offerText: {
        fontSize: 14,
        fontFamily: 'serif',
        textAlign: 'center',
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    actionButton: {
        alignItems: 'center',
        width: '48%',
        marginVertical: 4,
    },
    actionText: {
        fontSize: 10,
        fontFamily: 'serif',
        marginTop: 4,
    },
    themeWidget: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    themePreview: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginBottom: 8,
    },
    themeName: {
        fontSize: 12,
        fontFamily: 'serif',
    },
    interactiveWidget: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
