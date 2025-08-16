import api from '@/api/axios';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import 'react-native-reanimated';
import { TabBar, TabView } from 'react-native-tab-view';

const SCREEN_WIDTH = Dimensions.get('window').width;





export default function ClientDetails() {
  const { clientId } = useLocalSearchParams();
  const router = useRouter();
  const { dark } = useTheme();
  const color = dark ? Colors.dark : Colors.light;
  const [client, setClient] = useState(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routes] = useState([
    { key: 'tasks', title: 'Tâches' },
    { key: 'orders', title: 'Commandes' },
    { key: 'products', title: 'Produits' }
  ]);

  // Check if clientId is provided
  useEffect(() => {
    if (!clientId) {
      setError('Client ID is required');
      setLoading(false);
      return;
    }
    
    fetchClientDetails();
  }, [clientId]);



  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/clients/${clientId}`);
      if (response.data.success) {
        setClient(response.data.client);
      } else {
        setError(response.data.message || 'Failed to fetch client details');
      }
    } catch (error) {
      console.error('Error fetching client:', error);
      if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'tasks':
        return <ClientTasks clientId={clientId} color={color} />;
      case 'orders':
        return <ClientOrders clientId={clientId} color={color} />;
      case 'products':
        return <ClientProducts clientId={clientId} color={color} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: color.background }]}>
        <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={[styles.loadingText, { color: color.text }]}>
            Loading client details...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: color.background }]}>
        <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF4D4F" />
          <Text style={[styles.errorText, { color: color.text }]}>{error}</Text>
          
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: color.primary }]}
            onPress={() => fetchClientDetails()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          
                     <TouchableOpacity 
             style={[styles.retryButton, { backgroundColor: color.icon }]}
             onPress={() => router.back()}
           >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!client) {
    return (
      <View style={[styles.container, { backgroundColor: color.background }]}>
        <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF4D4F" />
          <Text style={[styles.errorText, { color: color.text }]}>Client not found</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: color.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

    return (
      <>
        <StatusBar 
          barStyle={dark ? "light-content" : "dark-content"} 
          backgroundColor="transparent"
          translucent={true}
        />
        
        {/* Header */}
        <ClientHeader client={client} onBack={() => router.back()} color={color} />
        
        {/* Tab View */}
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: SCREEN_WIDTH }}
          renderTabBar={props => (
            <TabBar
              {...props}
              style={[styles.tabBar, { borderBottomColor: color.icon, backgroundColor: color.background }]}
              indicatorStyle={[styles.indicator, { backgroundColor: color.primary }]}
              labelStyle={[styles.tabLabel, { color: color.icon }]}
              activeColor={color.text}
              inactiveColor={color.icon}
            />
          )}
        />
      </>
    );
}

// Client Header Component
function ClientHeader({ client, onBack, color }) {
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '';
    const names = name.split(' ');
    const initials = names.map(n => n[0]?.toUpperCase() || '').join('');
    return initials.substring(0, 2);
  };

      return (
          <View style={[styles.header, { backgroundColor: color.background, borderBottomColor: color.icon + '40' }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={28} color={color.text} />
      </TouchableOpacity>
      
      <View style={styles.profileContainer}>
        {client.image_name && client.image_name.trim() !== '' ? (
          <Image 
            source={{ uri: client.image_name }} 
            style={styles.avatar}
            defaultSource={require('@/assets/images/icon.png')}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: color.primary }]}>
            <Text style={styles.avatarText}>
              {getInitials(`${client.first_name} ${client.last_name}`)}
            </Text>
          </View>
        )}
        
        <View style={styles.userInfo}>
          <Text style={[styles.name, { color: color.text }]}>
            {client.first_name} {client.last_name}
          </Text>
          <Text style={[styles.email, { color: color.icon }]}>{client.city_name}</Text>
        </View>
      </View>
    </View>
  );
}

// Client Tasks Tab Component
function ClientTasks({ clientId, color }) {
  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to format date in French
  const formatDateInFrench = (dateString) => {
    if (dateString === 'no-date') {
      return 'Sans date';
    }
    
    const date = new Date(dateString);
    const options = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  // Helper function to group tasks by date
  const groupTasksByDate = (tasksList) => {
    console.log('=== DEBUG: Raw tasks ===');
    tasksList.forEach(task => {
      console.log(`Task: ${task.task_name}`);
      console.log(`  - task.task_date: ${task.task_date} (type: ${typeof task.task_date})`);
      console.log(`  - task.due_date: ${task.due_date} (type: ${typeof task.due_date})`);
      console.log(`  - task.created_at: ${task.created_at} (type: ${typeof task.created_at})`);
      console.log('  ---');
    });
    
    const grouped = {};
    tasksList.forEach(task => {
      // Use the correct field name from API: task_date
      const dateKey = task.task_date || task.due_date;
      console.log(`Processing task "${task.task_name}":`);
      console.log(`  - Selected dateKey: ${dateKey}`);
      
      if (dateKey) {
        // Normalize date to YYYY-MM-DD format to group by day only
        const date = new Date(dateKey);
        const normalizedDate = date.toISOString().split('T')[0]; // Gets YYYY-MM-DD
        console.log(`  - Parsed date: ${date}`);
        console.log(`  - Normalized date: ${normalizedDate}`);
        
        if (!grouped[normalizedDate]) {
          grouped[normalizedDate] = [];
        }
        grouped[normalizedDate].push(task);
      } else {
        // If no date, group under "No Date" or use created_at as fallback
        const fallbackDate = task.created_at ? new Date(task.created_at).toISOString().split('T')[0] : 'no-date';
        console.log(`  - No date found, using fallback: ${fallbackDate}`);
        if (!grouped[fallbackDate]) {
          grouped[fallbackDate] = [];
        }
        grouped[fallbackDate].push(task);
      }
    });
    
    console.log('=== DEBUG: Final grouped result ===');
    console.log('Grouped tasks:', grouped);
    
    // Convert to array and sort by date (newest first)
    return Object.entries(grouped)
      .sort(([a], [b]) => {
        if (a === 'no-date') return 1; // Put no-date at the end
        if (b === 'no-date') return -1;
        return new Date(b) - new Date(a);
      })
      .map(([date, taskList]) => ({ date, tasks: taskList }));
  };

  const loadTasks = async (pageNum = 1, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
          try {
        setError(null);
        
        const response = await api.get(`/clients/${clientId}/tasks?page=${pageNum}&limit=20`);
      if (response.data.success) {
        if (pageNum === 1 || isRefresh) {
          setTasks(response.data.tasks);
        } else {
          setTasks(prev => [...prev, ...response.data.tasks]);
        }
        setHasMore(response.data.pagination.has_next);
        setPage(pageNum);
      } else {
        setError(response.data.message || 'Failed to load tasks');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTasks(1);
  }, [clientId]);

  const onRefresh = () => {
    loadTasks(1, true);
  };

  const onEndReached = () => {
    if (!loading && hasMore) {
      loadTasks(page + 1);
    }
  };

  const renderTaskItem = ({ item }) => (
    <View style={[
      styles.taskCard,
      {
        backgroundColor: color.background,
        borderColor: color.icon,
        shadowColor: color.icon,
      },
    ]}>
      <View style={styles.taskCardContent}>
        {item.urgent ? (
          <View style={[styles.urgentDotLeft, { backgroundColor: getUrgentDotColor(item.status), borderColor: color.background }]} />
        ) : null}
        <View style={styles.taskCardTextSection}>
          <Text style={[styles.taskName, { color: color.text }]}>{item.task_name}</Text>
          {item.task_type ? (
            <View style={styles.taskTypeContainer}>
              <Ionicons name="build-outline" size={14} color={color.icon} style={styles.taskTypeIcon} />
              <Text style={[styles.taskType, { color: color.icon }]}>{item.task_type}</Text>
            </View>
          ) : null}

        </View>
        {(() => {
          const badgeStyle = getBadgeStyle(item.status);
          const textStyle = getTextStyle(item.status);
          return (
            <View style={[
              styles.statusBadge,
              badgeStyle
            ]}>
              <Text style={[styles.statusBadgeText, textStyle]}>{item.status}</Text>
            </View>
          );
        })()}
      </View>
    </View>
  );

  const renderDateSection = ({ item }) => {
    const { date, tasks } = item;
    return (
      <View style={styles.dateSection}>
        <View style={[styles.dateHeader, { 
          borderBottomColor: color.icon + '20'
        }]}>
          <Text style={[styles.dateHeaderText, { color: color.icon }]}>
            {formatDateInFrench(date)}
          </Text>
        </View>
        {tasks.map((task, index) => (
          <View key={task.id} style={styles.taskWrapper}>
            {renderTaskItem({ item: task })}
          </View>
        ))}
      </View>
      );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#FF4D4F" />
        <Text style={[styles.errorText, { color: color.text }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: color.primary }]}
          onPress={() => loadTasks(1, true)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Group tasks by date
  const groupedTasks = groupTasksByDate(tasks);

  return (
    <FlatList
      data={groupedTasks}
      keyExtractor={(item) => item.date}
      renderItem={renderDateSection}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.1}
      ListFooterComponent={loading ? <ActivityIndicator style={styles.loadingMore} /> : null}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="list" size={64} color={color.icon} />
          <Text style={[styles.emptyText, { color: color.icon }]}>Aucune tâche trouvée</Text>
        </View>
      }
      contentContainerStyle={styles.listContainer}
    />
  );
}

// Client Orders Tab Component
function ClientOrders({ clientId, color }) {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = async (pageNum = 1, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
          try {
        setError(null);
        
        const response = await api.get(`/clients/${clientId}/orders?page=${pageNum}&limit=20`);
      if (response.data.success) {
        if (pageNum === 1 || isRefresh) {
          setOrders(response.data.orders);
        } else {
          setOrders(prev => [...prev, ...response.data.orders]);
        }
        setHasMore(response.data.pagination.has_next);
        setPage(pageNum);
      } else {
        setError(response.data.message || 'Failed to load orders');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders(1);
  }, [clientId]);

  const onRefresh = () => {
    loadOrders(1, true);
  };

  const onEndReached = () => {
    if (!loading && hasMore) {
      loadOrders(page + 1);
    }
  };

  const renderOrderItem = ({ item }) => {
    const getStatusLabel = (status) => {
      switch (status) {
        case 'pending': return 'en attente';
        case 'processing': return 'confirmé';
        case 'shipped': return 'livré';
        case 'canceled': return 'annulé';
        default: return status;
      }
    };

    const getBadgeStyle = () => {
      const status = item.status;
      if (status === 'shipped') {
        return {
          backgroundColor: '#10B981', // Green background (same as stock screen)
          borderColor: '#059669', // Green border
          borderWidth: 1,
        };
      } else if (status === 'pending') {
        return {
          backgroundColor: '#F59E0B', // Yellow background (same as stock screen)
          borderColor: '#D97706', // Yellow border
          borderWidth: 1,
        };
      } else if (status === 'processing') {
        return {
          backgroundColor: '#3B82F6', // Blue background
          borderColor: '#2563EB', // Blue border
          borderWidth: 1,
        };
      } else if (status === 'canceled') {
        return {
          backgroundColor: '#EF4444', // Red background (same as stock screen)
          borderColor: '#DC2626', // Red border
          borderWidth: 1,
        };
      }
      return {
        backgroundColor: '#6B7280', // Gray background
        borderColor: '#4B5563', // Gray border
        borderWidth: 1,
      };
    };

    const getTextStyle = () => {
      // All status text is now white for better contrast on colored backgrounds
      return { color: 'white' };
    };

    return (
      <View style={[styles.orderItem, { backgroundColor: color.background, borderColor: color.icon, shadowColor: color.icon }]}>
        <View style={styles.orderCardContent}>
          <View style={styles.orderCardTextSection}>
            <Text style={[styles.orderName, { color: color.text }]}>{item.order_number}</Text>
            <Text style={[styles.orderItems, { color: color.icon }]}>{item.items_count} articles</Text>
          </View>
          
          <View style={[
            styles.statusBadge,
            getBadgeStyle()
          ]}>
            <Text style={[styles.statusBadgeText, getTextStyle()]}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
        
        <View style={styles.orderFooter}>
          <Text style={[styles.orderAmount, { color: color.text }]}>
            {item.total_amount.toFixed(2)} MAD
          </Text>
        </View>
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#FF4D4F" />
        <Text style={[styles.errorText, { color: color.text }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: color.primary }]}
          onPress={() => loadOrders(1, true)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderOrderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.1}
      ListFooterComponent={loading ? <ActivityIndicator style={styles.loadingMore} /> : null}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt" size={64} color={color.icon} />
          <Text style={[styles.emptyText, { color: color.icon }]}>No orders found</Text>
        </View>
      }
      contentContainerStyle={styles.listContainer}
    />
  );
}

// Client Products Tab Component
function ClientProducts({ clientId, color }) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const loadProducts = async (pageNum = 1, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
          try {
        setError(null);
        
        const response = await api.get(`/clients/${clientId}/products?page=${pageNum}&limit=20`);
      if (response.data.success) {
        if (pageNum === 1 || isRefresh) {
          setProducts(response.data.products);
        } else {
          setProducts(prev => [...prev, ...response.data.products]);
        }
        setHasMore(response.data.pagination.has_next);
        setPage(pageNum);
      } else {
        setError(response.data.message || 'Failed to load products');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts(1);
  }, [clientId]);

  const onRefresh = () => {
    loadProducts(1, true);
  };

  const onEndReached = () => {
    if (!loading && hasMore) {
      loadProducts(page + 1);
    }
  };

  const renderProductItem = ({ item }) => {
    const getWarrantyDisplay = () => {
      if (item.warranty_status === 'active') {
        const daysLeft = Math.round(parseFloat(item.days_left_in_warranty));
        return {
          text: `${daysLeft} jours restants`,
          color: '#00C851', // Green
          backgroundColor: 'rgba(0, 200, 81, 0.15)',
          borderColor: '#00C851'
        };
      } else {
        return {
          text: 'Non actif',
          color: '#FF4D4F', // Red
          backgroundColor: 'rgba(255, 77, 79, 0.15)',
          borderColor: '#FF4D4F'
        };
      }
    };

    const warrantyInfo = getWarrantyDisplay();

    return (
      <View style={[styles.productItem, { backgroundColor: color.background, borderColor: color.icon, shadowColor: color.icon }]}>
        <View style={styles.productCardContent}>
          <View style={styles.productCardTextSection}>
            <Text style={[styles.productName, { color: color.text }]}>{item.product_name}</Text>
            <View style={styles.productTypeContainer}>
              <Ionicons name="cube" size={12} style={[styles.productTypeIcon, { color: color.icon }]} />
              <Text style={[styles.productType, { color: color.icon }]}>{item.category}</Text>
            </View>
          </View>
          
          <View style={[styles.statusBadge, getWarrantyBadgeStyle(item.warranty_status)]}>
            <Text style={[styles.statusBadgeText, getWarrantyTextStyle(item.warranty_status)]}>{item.warranty_status}</Text>
          </View>
        </View>
        
        <View style={styles.productFooter}>
          <Text style={[styles.productPrice, { color: color.text }]}>
            {item.price.toFixed(2)} MAD
          </Text>
          <Text style={[styles.warrantyDays, { color: warrantyInfo.color }]}>
            {warrantyInfo.text}
          </Text>
        </View>
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#FF4D4F" />
        <Text style={[styles.errorText, { color: color.text }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: color.primary }]}
          onPress={() => loadProducts(1, true)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderProductItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.1}
      ListFooterComponent={loading ? <ActivityIndicator style={styles.loadingMore} /> : null}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="cube" size={64} color={color.icon} />
          <Text style={[styles.emptyText, { color: color.icon }]}>No products found</Text>
        </View>
      }
      contentContainerStyle={styles.listContainer}
    />
  );
}

// Helper functions
function getStatusColor(status) {
  switch (status) {
    case 'en attente': return '#FF4D4F';
    case 'en cours': return '#FFC107';
    case 'terminée': return '#00C851';
    default: return '#6C757D';
  }
}

function getBadgeStyle(status) {
  if (status === 'terminée') {
    return {
      backgroundColor: '#10B981', // Green background (same as stock screen)
      borderColor: '#059669', // Green border
      borderWidth: 1,
    };
  } else if (status === 'en cours') {
    return {
      backgroundColor: '#F59E0B', // Yellow background (same as stock screen)
      borderColor: '#D97706', // Yellow border
      borderWidth: 1,
    };
  } else if (status === 'en attente') {
    return {
      backgroundColor: '#EF4444', // Red background (same as stock screen)
      borderColor: '#DC2626', // Red border
      borderWidth: 1,
    };
  }
  return {
    backgroundColor: '#6B7280', // Gray background
    borderColor: '#4B5563', // Gray border
    borderWidth: 1,
  };
}

function getTextStyle(status) {
  // All status text is now white for better contrast on colored backgrounds
  return { color: 'white' };
}

function getUrgentDotColor(status) {
  if (status === 'terminée') {
    return '#00C851'; // Green
  } else if (status === 'en cours') {
    return '#FFC107'; // Yellow
  } else if (status === 'en attente') {
    return '#FF4D4F'; // Red
  }
  return '#6C757D'; // Gray
}

function getOrderStatusColor(status) {
  switch (status) {
    case 'pending': return '#FFC107';
    case 'completed': return '#00C851';
    case 'cancelled': return '#FF4D4F';
    default: return '#6C757D';
  }
}

function getWarrantyStatusColor(status) {
  switch (status) {
    case 'active': return '#00C851';
    case 'expired': return '#FF4D4F';
    case 'expiring_soon': return '#FFC107';
    default: return '#6C757D';
  }
}

function getWarrantyBadgeStyle(status) {
  if (status === 'active') {
    return {
      backgroundColor: '#10B981', // Green background (same as stock screen)
      borderColor: '#059669', // Green border
      borderWidth: 1,
    };
  } else if (status === 'expired') {
    return {
      backgroundColor: '#EF4444', // Red background (same as stock screen)
      borderColor: '#DC2626', // Red border
      borderWidth: 1,
    };
  } else if (status === 'expiring_soon') {
    return {
      backgroundColor: '#F59E0B', // Yellow background (same as stock screen)
      borderColor: '#D97706', // Yellow border
      borderWidth: 1,
    };
  }
  return {
    backgroundColor: '#6B7280', // Gray background
    borderColor: '#4B5563', // Gray border
    borderWidth: 1,
  };
}

function getWarrantyTextStyle(status) {
  // All status text is now white for better contrast on colored backgrounds
  return { color: 'white' };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#FF4D4F',
    marginTop: 16,
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    marginHorizontal: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 75,
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingVertical: 8,
    position: 'relative',
    backgroundColor: undefined, // will be set inline
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    borderBottomWidth: 1,
    borderBottomColor: undefined, // will be set inline
    zIndex: 1000,
  },
  backButton: {
    position: 'absolute',
    top: 90,
    left: 20,
    zIndex: 10,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 60,
    marginTop: 4,
    marginBottom: 4,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },

  tabBar: {
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
  },
  indicator: {
    height: 3,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'none',
  },
  listContainer: {
    padding: 0,
    paddingTop: 16,
  },
  loadingMore: {
    marginVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 16,
    opacity: 0.6,
  },
  // Task Card styles - matching tasks screen exactly
  taskCard: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 10,
    marginVertical: 3,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskCardTextSection: {
    flex: 1,
    marginRight: 12,
  },
  taskName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  taskTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTypeIcon: {
    marginRight: 4,
  },
  taskType: {
    fontSize: 12,
    color: '#aaa',
    fontStyle: 'italic',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: 'white',
  },
  urgentDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4D4F',
    borderWidth: 2,
    borderColor: '#23272A',
  },
  urgentDotLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF4D4F',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#23272A',
    alignSelf: 'center',
  },
  // Order Item styles - matching tasks screen card structure
  orderItem: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 10,
    marginVertical: 3,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderCardTextSection: {
    flex: 1,
    marginRight: 12,
  },
  orderName: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderTypeIcon: {
    marginRight: 4,
  },
  orderType: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  orderItems: {
    fontSize: 12,
    opacity: 0.6,
  },
  // Product Item styles - matching tasks screen card structure
  productItem: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 10,
    marginVertical: 3,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productCardTextSection: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productTypeIcon: {
    marginRight: 4,
  },
  productType: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  productSerial: {
    fontSize: 12,
    opacity: 0.6,
  },
  warrantyDays: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Date section styles for grouped tasks
  dateSection: {
    marginBottom: 20,
  },
  dateHeader: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: undefined, // will be set inline
  },
  dateHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'left',
    opacity: 0.8,
  },
  taskWrapper: {
    marginBottom: 3,
  },
});
