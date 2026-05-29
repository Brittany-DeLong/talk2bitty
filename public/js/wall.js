// Wall/Community Feed Module

let cachedPostPhoto = null;

async function publishCommunityPost() {
  const postInput = document.getElementById('publicPostInput');
  const copy = postInput?.value.trim() || '';

  if (!copy && !cachedPostPhoto) {
    alert('Please enter some text or add a photo.');
    return;
  }

  const publishBtn = document.querySelector('.wall-btn');
  if (publishBtn) publishBtn.disabled = true;

  try {
    const result = await API.posts.create(copy, cachedPostPhoto);
    
    if (result.success) {
      postInput.value = '';
      cachedPostPhoto = null;
      const photoNotice = document.getElementById('postPhotoNotice');
      if (photoNotice) photoNotice.innerText = '';
      
      // Refresh the feed
      await loadCommunityFeed();
      alert('Your post has been published!');
    }
  } catch (error) {
    console.error('Post creation failed:', error);
    alert('Failed to publish post. Please try again.');
  } finally {
    if (publishBtn) publishBtn.disabled = false;
  }
}

function handlePostPhotoLoad(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      cachedPostPhoto = e.target.result;
      const photoNotice = document.getElementById('postPhotoNotice');
      if (photoNotice) photoNotice.innerText = "✓ Media attached successfully.";
    };
    reader.readAsDataURL(input.files[0]);
  }
}

async function loadCommunityFeed() {
  try {
    const data = await API.posts.getAll(50);
    const stream = document.getElementById('publicFeedStream');
    
    if (!stream) return;
    
    stream.innerHTML = '';
    
    if (data.posts && data.posts.length > 0) {
      data.posts.forEach(post => {
        const card = createPostCard(post);
        stream.appendChild(card);
      });
    } else {
      stream.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px 20px;">No posts yet. Be the first to share!</div>';
    }
  } catch (error) {
    console.error('Failed to load posts:', error);
  }
}

function createPostCard(post) {
  const card = document.createElement('div');
  card.className = 'post-card';
  
  const labelColor = post.author === 'bitty' ? 'var(--pink-jewel)' : 'var(--teal-jewel)';
  const authorName = post.author === 'bitty' ? 'Bitty [Owner]' : (post.authorName || 'Anonymous Visitor');
  
  let imgElement = post.imageData 
    ? `<img src="${post.imageData}" style="width:100%; max-height:450px; object-fit:contain; border-radius:2px; margin-top:12px; border:1px solid rgba(255,255,255,0.1);" alt="Post image">`
    : '';
  
  const reactionsHtml = (post.reactions || {})
    ? Object.entries(post.reactions || {})
        .map(([emoji, count]) => `<button class="react-btn" onclick="incrementReaction(this, '${post.id}', '${emoji}')"><span class="emoji">${emoji}</span> <span class="count">${count || 0}</span></button>`)
        .join('')
    : '<button class="react-btn" onclick="incrementReaction(this, \'' + post.id + '\', \'👁️\')">👁️ <span class="count">0</span></button><button class="react-btn" onclick="incrementReaction(this, \'' + post.id + '\', \'🖤\')">🖤 <span class="count">0</span></button><button class="react-btn" onclick="incrementReaction(this, \'' + post.id + '\', \'🔥\')">🔥 <span class="count">0</span></button><button class="react-btn" onclick="incrementReaction(this, \'' + post.id + '\', \'💭\')">💭 <span class="count">0</span></button>';

  const deleteBtn = window.auth?.isAdmin() && post.author === 'bitty' 
    ? `<button onclick="deletePost('${post.id}')" style="background: #ea580c; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; margin-left: auto;">Delete</button>`
    : '';

  card.innerHTML = `
    <div style="font-size: 0.75rem; color: ${labelColor}; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
      <strong>${authorName}</strong> • ${new Date(post.createdAt).toLocaleString()}
      ${deleteBtn}
    </div>
    <div class="post-card-text">${post.text}</div>
    ${imgElement}
    <div class="reaction-bar">
      ${reactionsHtml}
    </div>
  `;
  
  return card;
}

async function incrementReaction(buttonElement, postId, emoji) {
  try {
    const result = await API.reactions.add(postId, emoji);
    const countNode = buttonElement.querySelector('.count');
    if (countNode && result.newCount !== undefined) {
      countNode.innerText = result.newCount;
    }
    buttonElement.style.color = 'var(--pink-jewel)';
  } catch (error) {
    console.error('Reaction failed:', error);
    alert('Failed to add reaction.');
  }
}

async function deletePost(postId) {
  if (!confirm('Are you sure you want to delete this post?')) return;
  
  try {
    const result = await API.posts.delete(postId);
    if (result.success) {
      await loadCommunityFeed();
    }
  } catch (error) {
    console.error('Delete failed:', error);
    alert('Failed to delete post.');
  }
}

// Export functions
window.wall = {
  publishCommunityPost,
  handlePostPhotoLoad,
  loadCommunityFeed,
  incrementReaction,
  deletePost
};
