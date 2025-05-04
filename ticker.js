// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const ticker = document.getElementById('ticker');
    const textInput = document.getElementById('new-text');
    
    // Update ticker text
    textInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            ticker.textContent = this.value;
            this.value = '';
        }
    });
});
