import api from '@api/axios';
import { Colors } from '@constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import debounce from 'lodash.debounce';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Linking, StyleSheet, Text, TextInput, View } from 'react-native';


export default function Clients() {
  const [clients, setClients] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('first_name');

  const { dark } = useTheme();
  const color = dark ? Colors.dark : Colors.light;

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) return;
  
    Linking.openURL(`tel:${phoneNumber}`);
  };  

  const loadClients = async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;
  
    setLoading(true);
    try {
      const nextPage = reset ? 1 : page;
      const response = await api.get(`/clients?page=${nextPage}&search=${search}&sort=${sort}`);
      const pagination = response.data.clients;
  
      if (reset) {
        setClients(pagination.data);
      } else {
        // avoid duplicates by filtering out already existing IDs
        const newData = pagination.data.filter(
          (newItem) => !clients.some((existing) => existing.id === newItem.id)
        );
        setClients(prev => [...prev, ...newData]);
      }
  
      setHasMore(pagination.current_page < pagination.last_page);
      setPage(nextPage + 1);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };  

  useEffect(() => {
    const delayedSearch = debounce(() => {
      loadClients(true);
    }, 500); // wait 500ms after typing
  
    delayedSearch();
  
    return delayedSearch.cancel;  // cleanup debounce on unmount
  }, [search, sort]);
  

  const handleSearch = (text) => {
    setSearch(text);
  };

  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    const initials = names.map(n => n[0]?.toUpperCase()).join('').substring(0, 2);
    return initials;
  };

  const renderItem = ({ item }) => (
    <View style={[styles.clientItem, { borderColor: color.icon, backgroundColor: color.background }]}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.initialsAvatar, { backgroundColor: color.primary }]}>
          <Text style={[styles.initialsText, { color: color.background }]}>{getInitials(item.name)}</Text>
        </View>
      )}
  
      <View style={styles.clientInfo}>
        <Text style={[styles.name, { color: color.text }]}>{item.name}</Text>
        <Text style={[styles.subText, { color: color.icon }]}>{item.email || item.phone}</Text>
      </View>
  
      {/* Floating call button */}
      <View style={[
        styles.callButton,
        { backgroundColor: color.primary }  // dynamically inject here
      ]}>
        <Ionicons
          name="call"
          size={20}
          color={color.background}
          onPress={() => handleCall(item.phone)}
        />
      </View>
    </View>
  );  

  const renderHeader = () => (
    <View style={[styles.searchContainer, { backgroundColor: color.inputBackground || '#F3F4F6' }]}>
      <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
      <TextInput
        placeholder="Recherche client"
        value={search}
        onChangeText={handleSearch}
        style={[styles.searchInput, 
          { 
            color: color.text,
            backgroundColor: color.background,  // or color.background for dynamic
            borderColor: color.icon 
          }]}
        placeholderTextColor="#999"
      />
    </View>
  );

  return (
<>
  {/* Search Bar OUTSIDE of FlatList */}
  <View style={styles.searchWrapper}>
  <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
  <TextInput
    placeholder="Recherche client"
    value={search}
    onChangeText={handleSearch}
    style={[
      styles.searchInput,
      {
        backgroundColor: color.background,
        borderColor: color.icon,
        color: color.text
      }
    ]}
    placeholderTextColor="#999"
  />
  {loading && (
    <ActivityIndicator
      size="small"
      color={color.primary}
      style={styles.searchSpinner}
    />
  )}
</View>


  {/* FlatList only handles clients */}
  <FlatList
    data={clients}
    keyExtractor={(item) => item.id.toString()}
    renderItem={renderItem}
    onEndReached={() => loadClients()}
    onEndReachedThreshold={0.5}
    ListFooterComponent={loading ? <ActivityIndicator size="small" /> : null}
    initialNumToRender={20}  // render a bit more initially
    removeClippedSubviews={false}  // prevent cutting views behind
  />
</>
  );
}

const styles = StyleSheet.create({
  callButton: {
    position: 'absolute',
    right: 12,
    top: '75%',
    marginTop: -20, // half of height for perfect vertical center
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },    
  searchWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
  },
  
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 45,
    borderRadius: 12,
    paddingLeft: 36,
    paddingRight: 40, // leave space for spinner
    borderWidth: 1,
  },
  
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  
  searchSpinner: {
    position: 'absolute',
    right: 12,
  },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    margin: 16,
    height: 45,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 45,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
  },  
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 10,
    marginVertical: 3,
    borderRadius: 12,
    backgroundColor: '#fff',
  
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  
    // Android shadow
    elevation: 1,
  },  
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  initialsAvatar: {
    width: 50,
    height: 50,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clientInfo: {
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subText: {
    fontSize: 14,
    marginTop: 2,
  },
});
