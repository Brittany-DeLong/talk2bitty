// Payment & Checkout Module

async function triggerStripePipeline(durationType) {
  const checkoutStatus = document.getElementById('checkoutStatus');
  const checkoutButtons = document.querySelectorAll('.checkout-btn');
  
  if (checkoutStatus) checkoutStatus.innerText = 'Opening secure checkout...';
  checkoutButtons.forEach((button) => button.disabled = true);
  
  try {
    const response = await fetch('/.netlify/functions/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration: durationType })
    });
    
    const data = await response.json();
    
    if (response.ok && data.url) {
      window.location.href = data.url;
    } else {
      if (checkoutStatus) {
        checkoutStatus.innerText = "Checkout error: " + (data.error || 'Unable to start checkout.');
      }
    }
  } catch (err) {
    console.error('Checkout error:', err);
    if (checkoutStatus) {
      checkoutStatus.innerText = "Network error reaching checkout.";
    }
  } finally {
    checkoutButtons.forEach((button) => button.disabled = false);
  }
}

// Export functions
window.payment = {
  triggerStripePipeline
};
