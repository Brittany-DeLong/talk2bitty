// Broadcast Picture Module

async function uploadMainBroadcastPicture(input) {
  if (!input.files || !input.files[0]) return;

  const uploadBtn = document.getElementById('broadcastUploadBtn');
  if (uploadBtn) uploadBtn.disabled = true;

  try {
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const result = await API.broadcast.upload(e.target.result);
        
        if (result.success) {
          document.getElementById('broadcastPlaceholder').style.display = 'none';
          const img = document.getElementById('broadcastImg');
          img.src = e.target.result;
          img.style.display = 'block';
          alert('Your broadcast profile image has been successfully updated!');
        }
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload image. Please try again.');
      }
    };
    reader.readAsDataURL(input.files[0]);
  } finally {
    if (uploadBtn) uploadBtn.disabled = false;
  }
}

async function loadBroadcastPicture() {
  try {
    const data = await API.broadcast.get();
    
    if (data.imageData) {
      document.getElementById('broadcastPlaceholder').style.display = 'none';
      const img = document.getElementById('broadcastImg');
      img.src = data.imageData;
      img.style.display = 'block';
    }
  } catch (error) {
    console.error('Failed to load broadcast picture:', error);
  }
}

// Export functions
window.broadcast = {
  uploadMainBroadcastPicture,
  loadBroadcastPicture
};
