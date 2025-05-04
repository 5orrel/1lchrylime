document.addEventListener('DOMContentLoaded', function() {
    // API URLs
    const ipInfoAPI = 'https://ipinfo.io/json?token=ffb97be19c9016';
    const sheetDBAPI = 'https://sheetdb.io/api/v1/ovgpnrzj00t4b';
    
    // Get visitor information
    getVisitorInfo();
    
    // Fetch existing entries and display them
    fetchEntries();
    
    // Periodically update entries
    setInterval(fetchEntries, 60000); // Update every minute
    
    /**
     * Get visitor information and log it to the SheetDB
     */
    function getVisitorInfo() {
        fetch(ipInfoAPI)
            .then(response => response.json())
            .then(data => {
                const timestamp = new Date();
                const entryData = {
                    ip: data.ip || 'unknown',
                    city: data.city ? data.city.toLowerCase() : 'nowhere',
                    country: data.country ? data.country.toLowerCase() : 'zz',
                    timestamp: timestamp.toISOString()
                };
                
                logVisitorEntry(entryData);
            })
            .catch(error => {
                console.error('Error fetching visitor information:', error);
                const timestamp = new Date();
                const entryData = {
                    ip: 'unknown',
                    city: 'nowhere',
                    country: 'zz',
                    timestamp: timestamp.toISOString()
                };
                
                logVisitorEntry(entryData);
            });
    }
    
    /**
     * Log visitor entry to SheetDB
     * @param {Object} entryData - The visitor entry data
     */
    function logVisitorEntry(entryData) {
        fetch(sheetDBAPI, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: [entryData] })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Visitor entry logged:', data);
        })
        .catch(error => {
            console.error('Error logging visitor entry:', error);
        });
    }
    
    /**
     * Fetch all entries from SheetDB
     */
    function fetchEntries() {
        fetch(sheetDBAPI)
            .then(response => response.json())
            .then(data => {
                // Process entries and filter duplicates
                const processedEntries = processEntries(data);
                displayEntries(processedEntries);
            })
            .catch(error => {
                console.error('Error fetching entries:', error);
                // Display a placeholder entry if fetching fails
                const placeholderEntry = formatEntry({
                    timestamp: 'present place:present time',
                    city: 'nowhere',
                    country: 'zz'
                });
                document.getElementById('visitorEntries').innerHTML = placeholderEntry;
            });
    }
    
    /**
     * Process entries and filter duplicates
     * @param {Array} entries - The raw entries from SheetDB
     * @returns {Array} - Processed entries with duplicates filtered
     */
    function processEntries(entries) {
        const uniqueEntries = [];
        const ipTimeMap = new Map();
        
        // Sort entries by timestamp (newest first)
        entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Filter out duplicates from the same IP within 6 hours
        entries.forEach(entry => {
            const ip = entry.ip;
            const currentTime = new Date(entry.timestamp);
            
            if (!ipTimeMap.has(ip)) {
                ipTimeMap.set(ip, currentTime);
                uniqueEntries.push(entry);
            } else {
                const lastTime = ipTimeMap.get(ip);
                const hoursDiff = (currentTime - lastTime) / (1000 * 60 * 60);
                
                if (hoursDiff > 6) {
                    ipTimeMap.set(ip, currentTime);
                    uniqueEntries.push(entry);
                }
            }
        });
        
        return uniqueEntries;
    }
    
    /**
     * Format the entry for display
     * @param {Object} entry - The entry data
     * @returns {string} - Formatted entry string
     */
 function formatEntry(entry) {
        let dateTime;
        
        if (entry.timestamp) {
            const date = new Date(entry.timestamp);
            
            // Format: M.D.YY HH:MM:SS (no leading zeros)
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const year = date.getFullYear().toString().substr(-2);
            
            const hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const seconds = date.getSeconds().toString().padStart(2, '0');
            
            dateTime = `${month}.${day}.${year} ${hours}:${minutes}:${seconds}`;
        } else {
            dateTime = "present place:present time";
        }

        const city = entry.city || 'nowhere';
        const country = entry.country || 'zz';
        
        return `<span class="visitor-entry">${dateTime} ${city}, ${country}</span>`;
    }
    
    /**
     * Display processed entries
     * @param {Array} entries - The processed entries
     */
    function displayEntries(entries) {
        const entriesContainer = document.getElementById('visitorEntries');
        
        if (entries.length === 0) {
            // Display a placeholder if no entries
            entriesContainer.innerHTML = formatEntry({
                timestamp: 'present time : present place',
                city: 'nowhere',
                country: 'zz'
            });
            return;
        }
        
        // Format each entry and join with the separator
        const formattedEntries = entries.map(entry => formatEntry(entry)).join(' ➛ ');
        entriesContainer.innerHTML = formattedEntries;
    }
});
