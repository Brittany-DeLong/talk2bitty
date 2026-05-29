// Netlify KV Store Functions for Data Management
// Using Netlify's built-in key-value storage

const { getStore } = require('@netlify/blobs');

async function getPosts(limit = 50) {
  try {
    const store = getStore('posts');
    const allPosts = await store.list();
    
    const posts = [];
    for (const entry of allPosts.blobs) {
      const post = await store.get(entry.key);
      if (post) posts.push(JSON.parse(post));
    }
    
    return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

async function createPost(text, imageData, author, authorEmail) {
  try {
    const store = getStore('posts');
    const postId = Date.now().toString();
    
    const post = {
      id: postId,
      text,
      imageData: imageData ? imageData.substring(0, 100000) : null, // Limit image size
      author,
      authorEmail,
      authorName: author === 'bitty' ? 'Bitty [Owner]' : author,
      createdAt: new Date().toISOString(),
      reactions: {
        '👁️': 0,
        '🖤': 0,
        '🔥': 0,
        '💭': 0
      }
    };
    
    await store.set(postId, JSON.stringify(post));
    return post;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

async function deletePost(postId) {
  try {
    const store = getStore('posts');
    await store.delete(postId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

async function addReaction(postId, emoji) {
  try {
    const store = getStore('posts');
    const postData = await store.get(postId);
    
    if (!postData) throw new Error('Post not found');
    
    const post = JSON.parse(postData);
    if (!post.reactions[emoji]) {
      post.reactions[emoji] = 0;
    }
    post.reactions[emoji]++;
    
    await store.set(postId, JSON.stringify(post));
    return { success: true, newCount: post.reactions[emoji] };
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
}

async function saveBroadcastImage(imageData) {
  try {
    const store = getStore('broadcast');
    await store.set('main', JSON.stringify({
      imageData: imageData.substring(0, 500000), // Limit to ~500KB
      updatedAt: new Date().toISOString()
    }));
    return { success: true };
  } catch (error) {
    console.error('Error saving broadcast image:', error);
    throw error;
  }
}

async function getBroadcastImage() {
  try {
    const store = getStore('broadcast');
    const data = await store.get('main');
    return data ? JSON.parse(data) : { imageData: null };
  } catch (error) {
    console.error('Error getting broadcast image:', error);
    return { imageData: null };
  }
}

async function saveOrder(orderId, orderData) {
  try {
    const store = getStore('orders');
    await store.set(orderId, JSON.stringify({
      ...orderData,
      createdAt: new Date().toISOString()
    }));
    return { success: true };
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
}

async function getOrders(userEmail) {
  try {
    const store = getStore('orders');
    const allOrders = await store.list();
    
    const orders = [];
    for (const entry of allOrders.blobs) {
      const order = await store.get(entry.key);
      if (order) {
        const orderData = JSON.parse(order);
        if (orderData.customerEmail === userEmail) {
          orders.push(orderData);
        }
      }
    }
    
    return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

module.exports = {
  getPosts,
  createPost,
  deletePost,
  addReaction,
  saveBroadcastImage,
  getBroadcastImage,
  saveOrder,
  getOrders
};
