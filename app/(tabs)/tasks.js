import api from '@/api/axios'; // <-- Use the axios instance
import { useAuth } from '@/components/AuthContext';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TabView } from 'react-native-tab-view';

const STATUS_COLORS = {
  'en attente': '#FF4D4F', // Red
  'en cours': '#FFC107',  // Yellow
  'terminer': '#00C851',  // Bright Green
  'terminée': '#00C851',  // Bright Green (with accent)
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const DAYS_TO_SHOW = 7;

function getWeekDates(selectedDate) {
  // Returns an array of 7 days centered on selectedDate
  const startOfWeek = dayjs(selectedDate).startOf('week');
  return Array.from({ length: DAYS_TO_SHOW }, (_, i) => startOfWeek.add(i, 'day'));
}

// Helper to get label for each date
function getDateTabLabel(date, today) {
  if (date.isSame(today, 'day')) return 'Today';
  if (date.isSame(today.add(1, 'day'), 'day')) return 'Tomorrow';
  if (date.isSame(today.subtract(1, 'day'), 'day')) return 'Yesterday';
  return date.format('ddd D MMM');
}

function DateTab({ date, selected, onPress, color }) {
  const today = dayjs();
  const label = getDateTabLabel(date, today);
  const [textWidth, setTextWidth] = useState(0);

  return (
    <TouchableOpacity
      onPress={() => onPress(date)}
      style={styles.dateTabTouchable}
      activeOpacity={0.85}
    >
      <View style={styles.dateTabContent}>
        <Text
          style={[
            styles.dateTabLabel,
            {
              color: selected ? color.text : color.icon,
              fontWeight: selected ? 'bold' : 'normal',
              fontSize: selected ? 16 : 15,
              textAlign: 'center',
            },
          ]}
          onLayout={e => setTextWidth(e.nativeEvent.layout.width)}
        >
          {label}
        </Text>
        {selected && textWidth > 0 && (
          <View
            style={[
              styles.dateTabIndicator,
              {
                backgroundColor: color.primary,
                width: textWidth,
                alignSelf: 'center',
              },
            ]}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

// Task Details Modal Component
function TaskDetailsModal({ visible, task, onClose, color }) {
  // Add comprehensive safety checks
  if (!visible || !task || !task.client) {
    console.log('TaskDetailsModal: Missing required data', { visible, hasTask: !!task, hasClient: !!(task && task.client) });
    return null;
  }

  // Additional safety check for client data
  if (!task.client.first_name && !task.client.last_name) {
    console.log('TaskDetailsModal: Client has no name data', task.client);
    return null;
  }

  // Validate task object structure
  if (typeof task !== 'object' || task === null) {
    console.log('TaskDetailsModal: Task is not a valid object', task);
    return null;
  }

  // Ensure all required task properties exist
  const requiredProps = ['id', 'task_name', 'status', 'urgent'];
  for (const prop of requiredProps) {
    if (!(prop in task)) {
      console.log(`TaskDetailsModal: Missing required property '${prop}'`, task);
      return null;
    }
  }

  // Log the task data for debugging
  console.log('TaskDetailsModal rendering with task:', {
    id: task.id,
    name: task.task_name,
    status: task.status,
    urgent: task.urgent,
    hasClient: !!task.client,
    clientName: task.client?.first_name || task.client?.last_name
  });

  const handleCallClient = () => {
    if (task?.client?.phone_number && task.client.phone_number.trim() !== '' && task.client.phone_number !== 'null') {
      Linking.openURL(`tel:${task.client.phone_number}`);
    } else {
      Alert.alert(
        'Phone Number Not Available',
        'Phone number information is not available for this client.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleOpenMaps = () => {
    // Try to get address from various possible field names (excluding city name)
    const address = task?.client?.address || 
                   task?.client?.full_address || 
                   task?.client?.street_address || 
                   task?.client?.location;
    
    if (address && address.trim() !== '' && address !== 'null') {
      const encodedAddress = encodeURIComponent(address);
      Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
    } else {
      Alert.alert(
        'Address Not Available',
        'Address information is not available for this client.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  // Helper function to safely get text content
  const getSafeText = (value, fallback = '') => {
    if (value === null || value === undefined || value === 'null') return fallback;
    if (typeof value === 'string') return value.trim() || fallback;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    // Ensure we always return a string
    return String(fallback || '');
  };

  // Helper functions to format dates safely
  const formatTaskDate = () => {
    try {
      const dateText = getSafeText(task.task_date);
      return dateText ? new Date(dateText).toLocaleDateString() : 'No date set';
    } catch (error) {
      console.log('Error parsing task date:', error);
      return 'No date set';
    }
  };

  const formatCreatedDate = () => {
    try {
      const dateText = getSafeText(task.created_at);
      return dateText ? new Date(dateText).toLocaleDateString() : 'Unknown';
    } catch (error) {
      console.log('Error parsing created date:', error);
      return 'Unknown';
    }
  };

  const formatClientInitials = () => {
    const firstName = getSafeText(task.client.first_name, '');
    const lastName = getSafeText(task.client.last_name, '');
    const firstInitial = firstName && firstName.length > 0 ? firstName[0] : '';
    const lastInitial = lastName && lastName.length > 0 ? lastName[0] : '';
    const initials = firstInitial + lastInitial;
    return initials.length > 0 ? initials.toUpperCase() : '?';
  };

  const formatClientFullName = () => {
    const firstName = getSafeText(task.client.first_name, 'Unknown');
    const lastName = getSafeText(task.client.last_name, '');
    if (!firstName || firstName === '') return 'Unknown';
    if (!lastName || lastName === '') return firstName;
    return `${firstName} ${lastName}`;
  };

  // Use the same badge styling functions as the task card
  const getBadgeStyle = (status) => {
    if (status === 'terminée') {
      return {
        backgroundColor: 'rgba(0, 100, 0, 0.2)', // Dark green with low opacity
        borderColor: '#00C851', // Green border
        borderWidth: 1,
      };
    } else if (status === 'en cours') {
      return {
        backgroundColor: 'rgba(184, 134, 11, 0.2)', // Dark yellow with low opacity
        borderColor: '#FFC107', // Yellow border
        borderWidth: 1,
      };
    } else if (status === 'en attente') {
      return {
        backgroundColor: 'rgba(178, 34, 34, 0.2)', // Dark red with low opacity
        borderColor: '#FF4D4F', // Red border
        borderWidth: 1,
      };
    }
    return {
      backgroundColor: 'rgba(73, 80, 87, 0.2)', // Dark gray with low opacity
      borderColor: '#6C757D', // Gray border
      borderWidth: 1,
    };
  };

  const getTextStyle = (status) => {
    if (status === 'terminée') {
      return { color: '#006400' }; // Dark green text
    } else if (status === 'en cours') {
      return { color: '#B8860B' }; // Dark yellow text
    } else if (status === 'en attente') {
      return { color: '#B22222' }; // Dark red text
    }
    return { color: '#495057' }; // Dark gray text
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: color.background }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: color.text }]}>Task Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={color.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* Task Card */}
            <View style={[styles.modalTaskCard, { backgroundColor: color.background, borderColor: color.icon + '40' }]}>
              <View style={styles.modalTaskHeader}>
                {/* Title Section */}
                <View style={styles.modalTaskTitleRow}>
                  <View style={styles.modalTaskTitleSection}>
                    <Text style={[styles.modalTaskTitle, { color: color.text }]} numberOfLines={2}>
                      {(() => {
                        const taskName = getSafeText(task.task_name, 'Untitled Task');
                        return taskName;
                      })()}
                    </Text>
                    {(() => {
                      const taskType = getSafeText(task.task_type);
                      
                      // Function to get appropriate icon for dental task types
                      const getTaskTypeIcon = (type) => {
                        // Use the same build/repair icon for all task types
                        return 'build-outline';
                      };
                      
                      return taskType ? (
                        <View style={styles.modalTaskTypeContainer}>
                          <Ionicons 
                            name={getTaskTypeIcon(taskType)} 
                            size={16} 
                            color={color.icon} 
                            style={styles.modalTaskTypeIcon} 
                          />
                          <Text style={[styles.modalTaskType, { color: color.icon }]}>{taskType}</Text>
                        </View>
                      ) : null;
                    })()}
                  </View>
                </View>
                
                {/* Badges Container - Absolute Positioned */}
                <View style={styles.modalBadgesContainer}>
                  {/* Status Badge - Top Right */}
                  {(() => {
                    const taskStatus = getSafeText(task.status, 'unknown');
                    // Use the same styling logic as the task card
                    const getBadgeStyle = () => {
                      const status = taskStatus;
                      if (status === 'terminée') {
                        return {
                          backgroundColor: 'rgba(0, 200, 81, 0.15)', // Green with very low opacity
                          borderColor: '#00C851', // Green border
                          borderWidth: 1,
                        };
                      } else if (status === 'en cours') {
                        return {
                          backgroundColor: 'rgba(255, 193, 7, 0.15)', // Yellow with very low opacity
                          borderColor: '#FFC107', // Yellow border
                          borderWidth: 1,
                        };
                      } else if (status === 'en attente') {
                        return {
                          backgroundColor: 'rgba(255, 77, 79, 0.15)', // Red with very low opacity
                          borderColor: '#FF4D4F', // Red border
                          borderWidth: 1,
                        };
                      }
                      return {
                        backgroundColor: 'rgba(108, 112, 118, 0.15)', // Gray with very low opacity
                        borderColor: '#6C757D', // Gray border
                        borderWidth: 1,
                      };
                    };

                    const getTextStyle = () => {
                      const status = taskStatus;
                      if (status === 'terminée') {
                        return { color: '#006400' }; // Dark green text
                      } else if (status === 'en cours') {
                        return { color: '#B8860B' }; // Dark yellow text
                      } else if (status === 'en attente') {
                        return { color: '#B22222' }; // Dark red text
                      }
                      return { color: '#495057' }; // Dark gray text
                    };

                    const badgeStyle = getBadgeStyle();
                    const textStyle = getTextStyle();
                    return (
                      <View style={[styles.modalStatusBadge, badgeStyle]}>
                        <Text style={[styles.modalStatusText, textStyle]}>
                          {taskStatus}
                        </Text>
                      </View>
                    );
                  })()}
                  
                  {/* Urgent Badge - Below Status Badge */}
                  {(() => {
                    console.log('Urgent badge check:', { urgent: task.urgent, type: typeof task.urgent, value: task.urgent });
                    // Handle different possible urgent values
                    const isUrgent = task.urgent === true || task.urgent === 1 || task.urgent === '1' || task.urgent === 'true';
                    console.log('Is urgent calculated:', isUrgent);
                    return isUrgent ? (
                      <View style={[styles.modalUrgentBadge, { backgroundColor: '#FF4D4F' }]}>
                        <Text style={styles.modalUrgentText}>URGENT</Text>
                      </View>
                    ) : null;
                  })()}
                </View>
              </View>

              {(() => {
                const description = getSafeText(task.description);
                return description ? (
                  <Text style={[styles.modalDescription, { color: color.text }]}>{description}</Text>
                ) : null;
              })()}

              {(() => {
                const observation = getSafeText(task.observation);
                return observation ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: color.text }]}>Observation</Text>
                    <Text style={[styles.modalObservation, { color: color.text }]}>{observation}</Text>
                  </View>
                ) : null;
              })()}
              
              {/* Task Action Buttons */}
              <View style={[styles.modalTaskFooter, { borderTopColor: color.icon + '40' }]}>
                {/* Comment Button - Left Side */}
                <TouchableOpacity 
                  style={[styles.modalTaskCommentButton, { backgroundColor: color.primary }]}
                  onPress={() => {
                    // Add comment button - code to be added later
                  }}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color="white" />
                </TouchableOpacity>
                
                {/* Status-based Action Button - Right Side */}
                {(() => {
                  const taskStatus = getSafeText(task.status).toLowerCase();
                  if (taskStatus === 'en attente') {
                    return (
                      <TouchableOpacity 
                        style={[styles.modalTaskActionButton, { backgroundColor: '#FFC107' }]}
                        onPress={() => {
                          // Start task button - code to be added later
                        }}
                      >
                        <Text style={styles.modalTaskActionButtonText}>Démarrer</Text>
                      </TouchableOpacity>
                    );
                  } else if (taskStatus === 'en cours') {
                    return (
                      <TouchableOpacity 
                        style={[styles.modalTaskActionButton, { backgroundColor: '#00C851' }]}
                        onPress={() => {
                          // End task button - code to be added later
                        }}
                      >
                        <Text style={styles.modalTaskActionButtonText}>Terminer</Text>
                      </TouchableOpacity>
                    );
                  }
                  return null;
                })()}
              </View>
            </View>

            {/* Client Card */}
            {(() => {
              const hasClient = task.client && getSafeText(task.client.first_name);
              return hasClient ? (
              <View style={[styles.modalClientCard, { backgroundColor: color.background, borderColor: color.icon + '40' }]}>
                <View style={styles.modalClientCardContent}>
                  {/* Left Section - Profile Image */}
                  <View style={styles.modalClientImageSection}>
                    {task.client.image_name && task.client.image_name !== 'null' && task.client.image_name.trim() !== '' ? (
                      <Image 
                        source={{ uri: task.client.image_name }} 
                        style={styles.modalClientProfileImage}
                        defaultSource={require('@/assets/images/icon.png')}
                        onError={(error) => console.log('Image loading error:', error)}
                      />
                    ) : (
                      <View style={[styles.modalClientProfilePlaceholder, { backgroundColor: color.primary }]}>
                        <Text style={styles.modalClientProfileInitials}>
                          {(() => {
                            const initials = formatClientInitials();
                            return initials;
                          })()}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Right Section - Info and Actions */}
                  <View style={styles.modalClientInfoSection}>
                    <Text style={[styles.modalClientName, { color: color.text }]}>
                      {(() => {
                        const fullName = formatClientFullName();
                        return fullName;
                      })()}
                    </Text>
                    
                    {(() => {
                      const cityName = getSafeText(task.client.city_name);
                      return cityName ? (
                        <Text style={[styles.modalClientCity, { color: color.icon }]}>
                          {cityName}
                        </Text>
                      ) : null;
                    })()}
                  </View>
                </View>
                
                {/* Footer with Action Buttons - Full Width */}
                <View style={[styles.modalClientFooter, { borderTopColor: color.icon + '40' }]}>
                  <TouchableOpacity 
                    style={[styles.modalClientActionButton, { backgroundColor: color.primary }]}
                    onPress={handleCallClient}
                  >
                    <Ionicons name="call" size={20} color="white" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalClientActionButton, { backgroundColor: color.primary }]}
                    onPress={handleOpenMaps}
                  >
                    <Ionicons name="map" size={20} color="white" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalClientActionButton, { backgroundColor: color.primary }]}
                    onPress={() => {
                      // Client details button - code to be added later
                    }}
                  >
                    <Ionicons name="person" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null;
          })()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function TaskCard({ task, color, onTaskPress }) {
  // Helper function to safely get text content
  const getSafeText = (value, fallback = '') => {
    if (value === null || value === undefined || value === 'null') return fallback;
    if (typeof value === 'string') return value.trim() || fallback;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    // Ensure we always return a string
    return String(fallback || '');
  };

  // Normalize status text to handle variations
  const normalizedStatus = getSafeText(task.status).toLowerCase();
  const statusColor = STATUS_COLORS[normalizedStatus] || STATUS_COLORS[getSafeText(task.status)] || '#6C757D'; // fallback to gray
  
  // Get badge style based on status
  const getBadgeStyle = () => {
    const status = getSafeText(task.status);
    if (status === 'terminée') {
      return {
        backgroundColor: 'rgba(0, 200, 81, 0.15)', // Green with very low opacity
        borderColor: '#00C851', // Green border
        borderWidth: 1,
      };
    } else if (status === 'en cours') {
      return {
        backgroundColor: 'rgba(255, 193, 7, 0.15)', // Yellow with very low opacity
        borderColor: '#FFC107', // Yellow border
        borderWidth: 1,
      };
    } else if (status === 'en attente') {
      return {
        backgroundColor: 'rgba(255, 77, 79, 0.15)', // Red with very low opacity
        borderColor: '#FF4D4F', // Red border
        borderWidth: 1,
      };
    }
    return {
      backgroundColor: 'rgba(108, 112, 118, 0.15)', // Gray with very low opacity
      borderColor: '#6C757D', // Gray border
      borderWidth: 1,
    };
  };

  const getTextStyle = () => {
    const status = getSafeText(task.status);
    if (status === 'terminée') {
      return { color: '#006400' }; // Dark green text
    } else if (status === 'en cours') {
      return { color: '#B8860B' }; // Dark yellow text
    } else if (status === 'en attente') {
      return { color: '#B22222' }; // Dark red text
    }
    return { color: '#495057' }; // Dark gray text
  };

  const getUrgentDotColor = () => {
    const status = getSafeText(task.status);
    if (status === 'terminée') {
      return '#00C851'; // Green
    } else if (status === 'en cours') {
      return '#FFC107'; // Yellow
    } else if (status === 'en attente') {
      return '#FF4D4F'; // Red
    }
    return '#6C757D'; // Gray
  };
  
  return (
    <TouchableOpacity
      onPress={() => onTaskPress(task)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.taskCard,
        {
          backgroundColor: color.background, // Use theme background color
          borderColor: color.icon, // Use theme icon color for border
          shadowColor: color.icon, // Use theme icon color for shadow
        },
      ]}>
        <View style={styles.taskCardContent}>
          {task.urgent && (() => {
            const urgentColor = getUrgentDotColor();
            return <View style={[styles.urgentDotLeft, { backgroundColor: urgentColor, borderColor: color.background }]} />;
          })()}
          <View style={styles.taskCardTextSection}>
            <Text style={[styles.taskName, { color: color.text }]}>{(() => {
              const taskName = getSafeText(task.task_name, 'Untitled Task');
              return taskName;
            })()}</Text>
            {(() => {
              const taskType = getSafeText(task.task_type);
              return taskType ? (
                <View style={styles.taskTypeContainer}>
                  <Ionicons name="build-outline" size={14} color={color.icon} style={styles.taskTypeIcon} />
                  <Text style={[styles.taskType, { color: color.icon }]}>{taskType}</Text>
                </View>
              ) : null;
            })()}
          </View>
          {(() => {
            const badgeStyle = getBadgeStyle();
            const textStyle = getTextStyle();
            return (
              <View style={[
                styles.statusBadge,
                badgeStyle
              ]}>
                <Text style={[styles.statusBadgeText, textStyle]}>{(() => {
                  const status = getSafeText(task.status, 'Unknown Status');
                  return status;
                })()}</Text>
              </View>
            );
          })()}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const INITIAL_TABS = 7;
const today = dayjs();
const initialDates = Array.from({ length: INITIAL_TABS }, (_, i) =>
  today.add(i - Math.floor(INITIAL_TABS / 2), 'day')
);

export default function Tasks() {
  const { user } = useAuth();
  const { dark } = useTheme();
  const color = dark ? Colors.dark : Colors.light;
  const [selectedDate, setSelectedDate] = useState(today);
  const [dates, setDates] = useState(initialDates);
  const [tasksByDate, setTasksByDate] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(Math.floor(INITIAL_TABS / 2)); // center on today
  const [routes, setRoutes] = useState([]);
  const tabRefs = useRef([]);
  const scrollViewRef = useRef(null);
  const [tabLayouts, setTabLayouts] = useState({});
  const [pendingIndexShift, setPendingIndexShift] = useState(null);
  
  // Modal state
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Infinite date logic
  const THRESHOLD = 2;
  const PREPEND_COUNT = 7;
  const APPEND_COUNT = 7;
  const prependDates = (currentIndex) => {
    const first = dates[0];
    const newDates = [];
    for (let i = PREPEND_COUNT; i >= 1; i--) {
      newDates.push(first.subtract(i, 'day'));
    }
    setDates(prev => [...newDates, ...prev]);
    setPendingIndexShift(currentIndex + PREPEND_COUNT);
  };
  const appendDates = () => {
    const last = dates[dates.length - 1];
    const newDates = [];
    for (let i = 1; i <= APPEND_COUNT; i++) {
      newDates.push(last.add(i, 'day'));
    }
    setDates(prev => [...prev, ...newDates]);
  };

  useEffect(() => {
    setRoutes(
      dates.map((date, i) => ({
        key: date.format('YYYY-MM-DD'),
        title: getDateTabLabel(date, dayjs()),
        date,
      }))
    );
  }, [dates]);

  // Only load tasks for the visible tab (and optionally adjacent tabs)
  useEffect(() => {
    if (!user || !user.id) return;
    setLoading(true);
    setError(null);
    const newTasksByDate = { ...tasksByDate };
    const toLoad = [index];
    // Optionally, load adjacent tabs for smoother swiping
    if (index > 0) toLoad.push(index - 1);
    if (index < dates.length - 1) toLoad.push(index + 1);
    Promise.all(
      toLoad.map(i => {
        const date = dates[i];
        if (!date) return Promise.resolve();
        const key = date.format('YYYY-MM-DD');
        if (newTasksByDate[key]) return Promise.resolve();
        return api.get(`/tasks?technician_id=${user.id}&date=${date.format('YYYY-MM-DD')}`)
          .then(res => {
            if (res.data.success) {
              newTasksByDate[key] = res.data.tasks;
            } else {
              newTasksByDate[key] = [];
              setError('API error: ' + (res.data.message || 'Erreur serveur'));
            }
          })
          .catch(e => {
            newTasksByDate[key] = [];
            setError('API error: ' + e.message);
          });
      })
    ).then(() => {
      setTasksByDate(newTasksByDate);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates, user, index]);

  // Center selected tab in ScrollView
  useEffect(() => {
    const layout = tabLayouts[index];
    if (
      !layout ||
      typeof layout.x !== 'number' ||
      typeof layout.width !== 'number' ||
      isNaN(layout.x) ||
      isNaN(layout.width) ||
      !scrollViewRef.current
    ) {
      // If we have a pending index shift, try again later
      if (pendingIndexShift !== null) return;
      console.log('Tab centering skipped:', { index, layout, tabLayouts });
      return;
    }
    const { x, width } = layout;
    console.log('Tab centering:', { index, x, width, tabLayouts });
    try {
      scrollViewRef.current.scrollTo({
        x: x + width / 2 - 180, // 180 = half of screen width (360/2)
        animated: true,
      });
    } catch (err) {
      console.error('Tab centering scroll error:', err);
    }
    // If we have a pending index shift, do it now
    if (pendingIndexShift !== null) {
      setIndex(pendingIndexShift);
      setPendingIndexShift(null);
    }
  }, [index, tabLayouts, pendingIndexShift]);

  // Handle task press to open modal
  const handleTaskPress = async (task) => {
    if (!task || !task.id) {
      console.log('Invalid task data:', task);
      return;
    }
    
    try {
      // Fetch full task details
      const response = await api.get(`/tasks/${task.id}`);
      if (response.data.success && response.data.task) {
        console.log('Task data received:', response.data.task);
        console.log('Client data:', response.data.task.client);
        console.log('Task urgent status:', response.data.task.urgent);
        console.log('Task status:', response.data.task.status);
        console.log('Task name:', response.data.task.task_name);
        setSelectedTask(response.data.task);
        setModalVisible(true);
      } else {
        console.log('API response invalid:', response.data);
      }
    } catch (err) {
      console.error('Error fetching task details:', err);
      // Optionally show an error message to the user
    }
  };

  // Close modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedTask(null);
  };
  
  // Clean up modal when component unmounts or user changes
  useEffect(() => {
    return () => {
      setModalVisible(false);
      setSelectedTask(null);
    };
  }, []);

  // TabView render scene for each date
  const renderScene = ({ route }) => {
    const tasks = tasksByDate[route.key] || [];
    if (loading && !tasks.length) {
      return <ActivityIndicator color={color.primary} style={{ marginTop: 32 }} />;
    }
    if (error) {
      return <Text style={[styles.errorText, { color: color.primary }]}>{error}</Text>;
    }
    if (tasks.length === 0) {
      return <Text style={[styles.emptyText, { color: color.icon }]} >Aucune tâche pour ce jour.</Text>;
    }
    return (
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TaskCard task={item} color={color} onTaskPress={handleTaskPress} />}
        contentContainerStyle={{ padding: 0, paddingTop: 16 }}
      />
    );
  };

  // Custom tab bar using your DateTab
  const renderTabBar = (props) => (
    <View style={[styles.dateSelectorContainer, { backgroundColor: color.background }]}> 
      <ScrollView
        horizontal
        ref={scrollViewRef}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateTabsScroll}
      >
        {props.navigationState.routes.map((route, i) => (
          <View
            key={route.key}
            ref={el => (tabRefs.current[i] = el)}
            onLayout={e => {
              const { x, width } = e.nativeEvent.layout;
              setTabLayouts(prev => ({
                ...prev,
                [i]: { x, width },
              }));
            }}
          >
            <DateTab
              date={route.date}
              selected={props.navigationState.index === i}
              onPress={() => {
                setIndex(i);
                setSelectedDate(route.date);
              }}
              color={color}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // Infinite logic: add more dates when swiping near first/last tab
  const handleIndexChange = (i) => {
    if (i <= THRESHOLD) {
      prependDates(i);
      // Don't shift index yet; wait for layouts to be measured
    } else if (i >= dates.length - 1 - THRESHOLD) {
      appendDates();
      setIndex(i); // allow normal index change
      setSelectedDate(dates[i]);
    } else {
      setIndex(i);
      setSelectedDate(dates[i]);
    }
  };

  return (
    <>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={handleIndexChange}
        initialLayout={{ width: SCREEN_WIDTH }}
        renderTabBar={renderTabBar}
        swipeEnabled
      />
      
      <TaskDetailsModal
        visible={modalVisible && !!selectedTask}
        task={selectedTask}
        onClose={closeModal}
        color={color}
      />
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  topBarTitle: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  dateSelectorContainer: {
    marginTop: 2, // set to 2 for small spacing above tabs
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTabsScroll: {
    alignItems: 'flex-end',
    paddingHorizontal: 4, // reduced from 8
    height: 48, // reduced from 90
    paddingVertical: 0, // ensure no extra vertical padding
  },
  dateTabTouchable: {
    marginHorizontal: 1, // reduced from 4
    marginVertical: 2,
  },
  dateTabContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60, // reduced from 70
    paddingHorizontal: 10, // reduced from 18
    paddingVertical: 8, // restore vertical padding
    borderRadius: 22,
    marginHorizontal: 1, // reduced from 2
    // ensure marginVertical is 0 or removed
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    position: 'relative', // allow absolute positioning of indicator
  },
  dateTabLabel: {
    textAlign: 'center',
  },
  dateTabIndicator: {
    position: 'absolute',
    bottom: -2, // move the indicator a little lower
    height: 4,
    borderRadius: 2,
    backgroundColor: undefined, // will be set inline
  },
  swipeArea: {
    height: 10,
    width: '100%',
  },
  taskCard: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 10, // Match Clients screen
    marginVertical: 3,    // Match Clients screen
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
    width: 16, // increased from 12
    height: 16, // increased from 12
    borderRadius: 8, // increased from 6
    backgroundColor: '#FF4D4F',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#23272A',
    alignSelf: 'center',
  },
  errorText: {
    color: '#FF4D4F',
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalScroll: {
    padding: 15,
  },
  modalTaskCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
  },
  modalTaskHeader: {
    marginBottom: 16,
    position: 'relative',
  },
  modalTaskTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTaskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalTaskTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  modalTaskTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  modalTaskTypeIcon: {
    marginRight: 6,
  },
  modalTaskType: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  modalBadgesContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    alignItems: 'flex-end',
    gap: 8,
  },
  modalUrgentBadge: {
    backgroundColor: '#FF4D4F',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
  },
  modalUrgentText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
    // Remove backgroundColor and color as they're now set dynamically
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    // Remove color as it's now set dynamically
  },
  modalSection: {
    marginBottom: 15,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
  modalTaskInfo: {
    marginTop: 10,
    marginBottom: 15,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  modalInfoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  modalObservation: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalClientCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 15,
    borderWidth: 1,
  },
  modalClientCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  modalClientImageSection: {
    marginRight: 16,
  },
  modalClientProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  modalClientProfilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClientProfileInitials: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  modalClientInfoSection: {
    flex: 1,
    justifyContent: 'space-between',
  },
  modalClientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalClientCity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  modalClientActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modalClientFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: undefined, // Will be set dynamically to match border color
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  modalClientActionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTaskFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: undefined, // Will be set dynamically to match border color
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  modalTaskActionButton: {
    minWidth: 80,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalTaskCommentButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTaskActionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    numberOfLines: 1,
  },
});
