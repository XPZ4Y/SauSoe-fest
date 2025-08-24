const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

// IMPORTANT: Heroku, Render, and other services use the PORT environment variable.
// If it's not set, we default to 3000 for local development.
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'registrations.json');

// Helper function to read existing registrations
function readRegistrations() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading registrations:', error);
    }
    return [];
}

// Helper function to write registrations
function writeRegistrations(registrations) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(registrations, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing registrations:', error);
        return false;
    }
}

// Check if contact number or email already exists
function isDuplicate(registrations, contactNumber, email) {
    return registrations.some(registration => {
        // Check if contact number matches (case insensitive)
        if (registration.contactNumber && 
            registration.contactNumber.toLowerCase() === contactNumber.toLowerCase()) {
            return true;
        }
        
        // Check if email matches (if provided and not empty)
        if (email && registration.email && 
            registration.email.toLowerCase() === email.toLowerCase()) {
            return true;
        }
        
        return false;
    });
}

// Validate form data
function validateFormData(formData) {
    const errors = [];
    
    // Required fields validation
    const requiredFields = ['fullName', 'teamName', 'class', 'school', 'contactNumber', 'location', 'guardianPhone'];
    requiredFields.forEach(field => {
        if (!formData[field] || formData[field].trim() === '') {
            errors.push(`${field} is required`);
        }
    });
    
    // Email validation (if provided)
    if (formData.email && formData.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            errors.push('Please enter a valid email');
        }
    }
    
    // Phone number validation (basic)
    if (formData.contactNumber && !/^[0-9+\-\s()]{10,}$/.test(formData.contactNumber)) {
        errors.push('Please enter a valid contact number');
    }
    
    if (formData.guardianPhone && !/^[0-9+\-\s()]{10,}$/.test(formData.guardianPhone)) {
        errors.push('Please enter a valid guardian phone number');
    }
    
    return errors;
}

// Create HTTP server
const server = http.createServer((req, res) => {
    // Set CORS headers
    // Add this to your server.js
    if (req.method === 'GET') {
        // Determine the file path
        let filePath = req.url === '/' ? '/index.html' : req.url;
        filePath = path.join(__dirname, 'public', filePath);
        
        // Check if file exists
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
            } else {
                // Set appropriate Content-Type based on file extension
                const ext = path.extname(filePath);
                const contentTypes = {
                    '.html': 'text/html',
                    '.css': 'text/css',
                    '.js': 'application/javascript',
                    '.png': 'image/png',
                    '.jpg': 'image/jpeg'
                };
                
                res.writeHead(200, { 
                    'Content-Type': contentTypes[ext] || 'text/plain' 
                });
                res.end(data);
            }
        });
        return;
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Handle POST requests to /register
    if (req.method === 'POST' && req.url === '/register') {
        let body = '';
        
        // Collect the data chunks
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        // Process the data when complete
        req.on('end', () => {
            try {
                const formData = querystring.parse(body);
                
                // Validate form data
                const validationErrors = validateFormData(formData);
                if (validationErrors.length > 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        message: 'Validation failed',
                        errors: validationErrors 
                    }));
                    return;
                }
                
                // Read existing registrations
                const registrations = readRegistrations();
                
                // Check for duplicates
                if (isDuplicate(registrations, formData.contactNumber, formData.email || '')) {
                    res.writeHead(409, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        message: 'Duplicate registration found. Contact number or email already exists.' 
                    }));
                    return;
                }
                
                // Add timestamp and ID to the registration
                const newRegistration = {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    fullName: formData.fullName.trim(),
                    teamName: formData.teamName.trim(),
                    class: formData.class.trim(),
                    school: formData.school.trim(),
                    contactNumber: formData.contactNumber.trim(),
                    email: formData.email ? formData.email.trim() : '',
                    location: formData.location.trim(),
                    guardianPhone: formData.guardianPhone.trim()
                };
                
                // Add to registrations array
                registrations.push(newRegistration);
                
                // Write to file
                if (writeRegistrations(registrations)) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: 'Registration successful!',
                        data: newRegistration
                    }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        message: 'Failed to save registration. Please try again.' 
                    }));
                }
                
            } catch (error) {
                console.error('Error processing request:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    message: 'Internal server error' 
                }));
            }
        });
    } else {
        // Handle other routes
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false, 
            message: 'Endpoint not found' 
        }));
    }
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    process.exit(0);
});