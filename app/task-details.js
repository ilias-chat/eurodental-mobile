import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import api from '../api/axios';
import { Colors } from '../constants/Colors';

const STATUS_COLORS = {
  'en attente': '#FF4D4F',
  'en cours': '#FFC107',
  'terminer': '#00C851',
  'terminée': '#00C851',
};

export default function TaskDetails() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams();
  const { dark } = useTheme();
  const color = dark ? Colors.dark : Colors.light;

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    if (!taskId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/tasks/${taskId}`);
      if (response.data.success) {
        setTask(response.data.task);
      } else {
        setError('Failed to load task details');
      }
    } catch (err) {
      console.error('Error fetching task details:', err);
      setError('Error loading task details');
    } finally {
      setLoading(false);
    }
  };

  const handleCallClient = () => {
    if (task?.client?.phone_number) {
      Linking.openURL(`tel:${task.client.phone_number}`);
    }
  };

  const getStatusBadgeStyle = (status) => {
    const statusColor = STATUS_COLORS[status] || '#6C757D';
    return {
      backgroundColor: `rgba(${statusColor === '#00C851' ? '0, 100, 0' : 
                               statusColor === '#FFC107' ? '184, 134, 11' : 
                               statusColor === '#FF4D4F' ? '178, 34, 34' : '73, 80, 87'}, 0.2)`,
      borderColor: statusColor,
      borderWidth: 1,
    };
  };

  const getStatusTextStyle = (status) => {
    const statusColor = STATUS_COLORS[status] || '#6C757D';
    return { color: statusColor === '#00C851' ? '#006400' : 
                   statusColor === '#FFC107' ? '#B8860B' : 
                   statusColor === '#FF4D4F' ? '#B22222' : '#495057' };
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: color.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={color.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: color.text }]}>Task Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color.primary} />
        </View>
      </View>
    );
  }

  if (error || !task) {
    return (
      <View style={[styles.container, { backgroundColor: color.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={color.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: color.text }]}>Task Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: color.text }]}>{error || 'Task not found'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: color.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={color.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: color.text }]}>Task Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Task Card */}
        <View style={[styles.taskCard, { backgroundColor: color.card || color.background, borderColor: color.icon }]}>
          <View style={styles.taskHeader}>
            <View style={styles.taskTitleRow}>
              <Text style={[styles.taskTitle, { color: color.text }]}>{task.task_name}</Text>
              {task.urgent && (
                <View style={[styles.urgentBadge, { backgroundColor: '#FF4D4F' }]}>
                  <Text style={styles.urgentText}>URGENT</Text>
                </View>
              )}
            </View>
            <View style={[styles.statusBadge, getStatusBadgeStyle(task.status)]}>
              <Text style={[styles.statusText, getStatusTextStyle(task.status)]}>
                {task.status}
              </Text>
            </View>
          </View>

          {task.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: color.text }]}>Description</Text>
              <Text style={[styles.description, { color: color.text }]}>{task.description}</Text>
            </View>
          )}

          <View style={styles.taskInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color={color.icon} />
              <Text style={[styles.infoText, { color: color.text }]}>
                Date: {new Date(task.task_date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={color.icon} />
              <Text style={[styles.infoText, { color: color.text }]}>
                Created: {new Date(task.created_at).toLocaleDateString()}
              </Text>
            </View>
            {task.task_type && (
              <View style={styles.infoRow}>
                <Ionicons name="construct-outline" size={16} color={color.icon} />
                <Text style={[styles.infoText, { color: color.text }]}>
                  Type: {task.task_type}
                </Text>
              </View>
            )}
          </View>

          {task.observation && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: color.text }]}>Observation</Text>
              <Text style={[styles.observation, { color: color.text }]}>{task.observation}</Text>
            </View>
          )}
        </View>

        {/* Client Card */}
        {task.client && (
          <View style={[styles.clientCard, { backgroundColor: color.card || color.background, borderColor: color.icon }]}>
            <Text style={[styles.clientTitle, { color: color.text }]}>Client Information</Text>
            
            <View style={styles.clientInfo}>
              <View style={styles.clientHeader}>
                {task.client.image_name ? (
                  <Image 
                    source={{ uri: task.client.image_name }} 
                    style={styles.clientAvatar}
                  />
                ) : (
                  <View style={[styles.clientAvatarPlaceholder, { backgroundColor: color.primary }]}>
                    <Text style={[styles.clientInitials, { color: color.background }]}>
                      {task.client.first_name?.[0]}{task.client.last_name?.[0]}
                    </Text>
                  </View>
                )}
                <View style={styles.clientNameContainer}>
                  <Text style={[styles.clientName, { color: color.text }]}>
                    {task.client.first_name} {task.client.last_name}
                  </Text>
                  {task.client.city_name && (
                    <Text style={[styles.clientCity, { color: color.icon }]}>
                      {task.client.city_name}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.clientContact}>
                {task.client.phone_number && (
                  <TouchableOpacity 
                    style={[styles.contactButton, { backgroundColor: color.primary }]}
                    onPress={handleCallClient}
                  >
                    <Ionicons name="call" size={16} color="white" />
                    <Text style={styles.contactButtonText}>Call Client</Text>
                  </TouchableOpacity>
                )}
                
                {task.client.email && (
                  <View style={styles.contactInfo}>
                    <Ionicons name="mail-outline" size={16} color={color.icon} />
                    <Text style={[styles.contactText, { color: color.text }]}>
                      {task.client.email}
                    </Text>
                  </View>
                )}
                
                {task.client.phone_number && (
                  <View style={styles.contactInfo}>
                    <Ionicons name="call-outline" size={16} color={color.icon} />
                    <Text style={[styles.contactText, { color: color.text }]}>
                      {task.client.phone_number}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  taskCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  taskTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  urgentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  observation: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  taskInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  clientCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clientTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  clientInfo: {
    gap: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  clientAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientInitials: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clientNameContainer: {
    marginLeft: 12,
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
  },
  clientCity: {
    fontSize: 14,
    marginTop: 2,
  },
  clientContact: {
    gap: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
  },
}); 