// API Service Module - Handles all backend communication

const API = {
  // Get JWT token from Netlify Identity
  async getToken() {
    if (window.netlifyIdentity?.currentUser()) {
      return await window.netlifyIdentity.currentUser().jwt();
    }
    return null;
  },

  // Posts API
  posts: {
    async create(text, imageData) {
      const token = await API.getToken();
      const response = await fetch('/.netlify/functions/posts-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          text,
          imageData,
          author: window.auth?.isAdmin() ? 'bitty' : null
        })
      });

      if (!response.ok) throw new Error('Failed to create post');
      return response.json();
    },

    async getAll(limit = 50) {
      const response = await fetch(`/.netlify/functions/posts-list?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    },

    async delete(postId) {
      const token = await API.getToken();
      const response = await fetch(`/.netlify/functions/posts-delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({ postId })
      });

      if (!response.ok) throw new Error('Failed to delete post');
      return response.json();
    }
  },

  // Broadcast Picture API
  broadcast: {
    async upload(imageData) {
      const token = await API.getToken();
      const response = await fetch('/.netlify/functions/broadcast-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({ imageData })
      });

      if (!response.ok) throw new Error('Failed to upload broadcast image');
      return response.json();
    },

    async get() {
      const response = await fetch('/.netlify/functions/broadcast-get');
      if (!response.ok) throw new Error('Failed to fetch broadcast image');
      return response.json();
    }
  },

  // Bookings/Orders API
  orders: {
    async getUserOrders() {
      const token = await API.getToken();
      const response = await fetch('/.netlify/functions/orders-list', {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },

    async getOrderDetails(orderId) {
      const token = await API.getToken();
      const response = await fetch(`/.netlify/functions/orders-detail?id=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch order details');
      return response.json();
    }
  },

  // Reactions API
  reactions: {
    async add(postId, emoji) {
      const token = await API.getToken();
      const response = await fetch('/.netlify/functions/reactions-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({ postId, emoji })
      });

      if (!response.ok) throw new Error('Failed to add reaction');
      return response.json();
    }
  },

  // Admin Functions
  admin: {
    async getAllPosts() {
      const token = await API.getToken();
      const response = await fetch('/.netlify/functions/admin-posts-all', {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch all posts');
      return response.json();
    },

    async deletePost(postId) {
      const token = await API.getToken();
      const response = await fetch('/.netlify/functions/admin-posts-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({ postId })
      });

      if (!response.ok) throw new Error('Failed to delete post');
      return response.json();
    },

    async getAllOrders() {
      const token = await API.getToken();
      const response = await fetch('/.netlify/functions/admin-orders-all', {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch all orders');
      return response.json();
    }
  }
};

window.API = API;
