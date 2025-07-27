import api from '@/api/axios'; // <-- Use the axios instance
import { useAuth } from '@/components/AuthContext';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@react-navigation/native';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

function TaskCard({ task, color }) {
  const router = useRouter();
  
  // Debug: log the actual status text
  console.log('Task status:', task.status, 'Available colors:', Object.keys(STATUS_COLORS));
  
  // Normalize status text to handle variations
  const normalizedStatus = task.status?.toLowerCase().trim();
  const statusColor = STATUS_COLORS[normalizedStatus] || STATUS_COLORS[task.status] || '#6C757D'; // fallback to gray
  
  // Get badge style based on status
  const getBadgeStyle = () => {
    if (task.status === 'terminée') {
      return {
        backgroundColor: 'rgba(0, 100, 0, 0.2)', // Dark green with low opacity
        borderColor: '#00C851', // Green border
        borderWidth: 1,
      };
    } else if (task.status === 'en cours') {
      return {
        backgroundColor: 'rgba(184, 134, 11, 0.2)', // Dark yellow with low opacity
        borderColor: '#FFC107', // Yellow border
        borderWidth: 1,
      };
    } else if (task.status === 'en attente') {
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

  const getTextStyle = () => {
    if (task.status === 'terminée') {
      return { color: '#006400' }; // Dark green text
    } else if (task.status === 'en cours') {
      return { color: '#B8860B' }; // Dark yellow text
    } else if (task.status === 'en attente') {
      return { color: '#B22222' }; // Dark red text
    }
    return { color: '#495057' }; // Dark gray text
  };

  const getUrgentDotColor = () => {
    if (task.status === 'terminée') {
      return '#00C851'; // Green
    } else if (task.status === 'en cours') {
      return '#FFC107'; // Yellow
    } else if (task.status === 'en attente') {
      return '#FF4D4F'; // Red
    }
    return '#6C757D'; // Gray
  };
  
  return (
    <TouchableOpacity
      onPress={() => router.push(`/task-details?taskId=${task.id}`)}
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
          {task.urgent && <View style={[styles.urgentDotLeft, { backgroundColor: getUrgentDotColor(), borderColor: color.background }]} />}
          <Text style={[styles.taskName, { color: color.text }]}>{task.task_name}</Text>
          <View style={[
            styles.statusBadge,
            getBadgeStyle()
          ]}>
            <Text style={[styles.statusBadgeText, getTextStyle()]}>{task.status}</Text>
          </View>
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
        renderItem={({ item }) => <TaskCard task={item} color={color} />}
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
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={handleIndexChange}
      initialLayout={{ width: SCREEN_WIDTH }}
      renderTabBar={renderTabBar}
      swipeEnabled
    />
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
  taskName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    flex: 1,
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
});
