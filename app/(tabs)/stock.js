import api from '@api/axios';
import { Colors } from '@constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import debounce from 'lodash.debounce';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Stock() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('product_name');

  const { dark } = useTheme();
  const color = dark ? Colors.dark : Colors.light;
  const navigation = useNavigation();

  const handleProductPress = (product) => {
    // Navigate to product details when implemented
    // navigation.navigate('product-details', { productId: product.id });
  };  

  const loadProducts = async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;
  
    setLoading(true);
    try {
      const nextPage = reset ? 1 : page;
      console.log('Loading products, page:', nextPage, 'search:', search);
      const response = await api.get(`/catalog/products?page=${nextPage}&name=${search}`);
      console.log('API Response:', response.data);
      
      const productsData = response.data.products;
      const pagination = response.data.pagination;
      
      console.log('Products found:', productsData?.length || 0);
      console.log('Pagination:', pagination);
  
      if (reset) {
        setProducts(productsData);
      } else {
        // avoid duplicates by filtering out already existing IDs
        const newData = productsData.filter(
          (newItem) => !products.some((existing) => existing.id === newItem.id)
        );
        setProducts(prev => [...prev, ...newData]);
      }
  
      setHasMore(pagination.current_page < pagination.last_page);
      setPage(nextPage + 1);
    } catch (error) {
      console.log('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };  

  useEffect(() => {
    // Load products on initial mount
    loadProducts(true);
  }, []);

  useEffect(() => {
    const delayedSearch = debounce(() => {
      loadProducts(true);
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
    <TouchableOpacity 
      style={[styles.productItem, { borderColor: color.icon, backgroundColor: color.background }]}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.7}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.initialsAvatar, { backgroundColor: color.primary }]}>
          <Text style={[styles.initialsText, { color: color.background }]}>{getInitials(item.product_name)}</Text>
        </View>
      )}
  
      <View style={styles.productInfo}>
        <Text style={[styles.name, { color: color.text }]}>{item.product_name}</Text>
        
        {/* Brand and Category tags */}
        <View style={styles.tagsContainer}>
          <View style={[styles.tag, { borderColor: color.icon }]}>
            <Text style={[styles.tagText, { color: color.icon }]}>{item.brand || 'N/A'}</Text>
          </View>
          <View style={[styles.tag, { borderColor: color.icon }]}>
            <Text style={[styles.tagText, { color: color.icon }]}>{item.category || 'N/A'}</Text>
          </View>
        </View>
        
                          {/* Stock Badge */}
          <View style={[
            styles.stockBadge,
            { 
              backgroundColor: item.stock_quantity > 10 ? '#10B981' : item.stock_quantity > 0 ? '#F59E0B' : '#EF4444',
              borderColor: item.stock_quantity > 10 ? '#059669' : item.stock_quantity > 0 ? '#D97706' : '#DC2626'
            }
          ]}>
            <Ionicons 
              name="cube-outline" 
              size={16} 
              color="white" 
              style={styles.stockIcon}
            />
            <Text style={styles.stockBadgeQuantity}>
              {item.stock_quantity || 0}
            </Text>
          </View>
      </View>
  

    </TouchableOpacity>
  );  

  const renderHeader = () => (
    <View style={[styles.searchContainer, { backgroundColor: color.inputBackground || '#F3F4F6' }]}>
      <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
      <TextInput
        placeholder="Recherche produit"
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
          placeholder="Recherche produit"
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

      {/* Debug info */}
      {products.length === 0 && !loading && (
        <View style={styles.debugContainer}>
          <Text style={[styles.debugText, { color: color.text }]}>
            No products found. Loading: {loading ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.debugText, { color: color.text }]}>
            Products count: {products.length}
          </Text>
        </View>
      )}

      {/* FlatList only handles products */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        onEndReached={() => loadProducts()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator size="small" /> : null}
        initialNumToRender={20}  // render a bit more initially
        removeClippedSubviews={false}  // prevent cutting views behind
      />
    </>
  );
}

const styles = StyleSheet.create({
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
  productItem: {
    position: 'relative',
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
  productInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subText: {
    fontSize: 14,
    marginTop: 2,
  },
  categoryText: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  stockText: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  stockBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 60,
    gap: 6,
    zIndex: 1,
  },
  stockIcon: {
    marginRight: 2,
  },
  stockBadgeQuantity: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'transparent',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  debugContainer: {
    padding: 16,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 14,
    marginBottom: 4,
  },
});
