const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');
const { MongoClient, ServerApiVersion } = require('mongodb');

// IMPORTANT: Heroku, Render, and other services use the PORT environment variable.
// If it's not set, we default to 3000 for local development.
const PORT = process.env.PORT || 3000;

// MongoDB connection setup
const MONGODB_URI = process.env.MONGODB_URI || "api_mongodb_6969_userid_sexy_chris_chinese_1_11231393138543521upx@33.mongodbapi.com";//my api key
const DB_NAME = "registration_db";
const COLLECTION_NAME = "registrations";
const LOGIN_NAME = "login-name"; // New collection for login posts
const GAMEDEBUG_COLLECTION_NAME = "gamedebug"; // New collection for game debug data

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(MONGODB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Connect to MongoDB
let db, registrationsCollection, loginCollection, gamedebugCollection;

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB successfully!");
        
        db = client.db(DB_NAME);
        registrationsCollection = db.collection(COLLECTION_NAME);
        loginCollection = db.collection(LOGIN_NAME);
        gamedebugCollection = db.collection(GAMEDEBUG_COLLECTION_NAME); // Initialize the new collection
        
        // Create indexes for efficient duplicate checking for registrations
        // Enforce uniqueness at the database level. This is the strongest protection.
        await registrationsCollection.createIndex({ contactNumber: 1 }, { unique: true });

        // Email can be optional, so a sparse unique index is perfect.
        // It only enforces uniqueness for documents that HAVE the email field.
        await registrationsCollection.createIndex({ email: 1 }, { unique: true, sparse: true });
        
        return true;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        return false;
    }
}

// Helper function to read existing registrations
async function readRegistrations() {
    try {
        if (!registrationsCollection) {
            throw new Error('MongoDB connection not established');
        }
        const registrations = await registrationsCollection.find({}).toArray();
        return registrations;
    } catch (error) {
        console.error('Error reading registrations from MongoDB:', error);
        return [];
    }
}

// Helper function to write a new registration
async function writeRegistration(registration) {
    try {
        if (!registrationsCollection) {
            throw new Error('MongoDB connection not established');
        }
        
        const result = await registrationsCollection.insertOne(registration);
        return result.acknowledged;
    } catch (error) {
        console.error('Error writing registration to MongoDB:', error);
        return false;
    }
}

// Helper function to write new loginn data
async function writeLoginData(loginPost) {
    try {
        if (!loginCollection) {
            throw new Error('MongoDB connection not established for login-data');
        }
        const result = await loginCollection.insertOne(loginPost);
        return result.acknowledged;
    } catch (error) {
        console.error('Error writing login data to MongoDB:', error);
        return false;
    }
}

// --- NEW HELPER FUNCTION FOR GAMEDEBUG ---
async function writeGameDebugData(clientIP, sessionData) {
    try {
        if (!gamedebugCollection) {
            throw new Error('MongoDB connection not established for gamedebug');
        }
        const primaryIP = clientIP.split(',')[0].trim();
        const filter = { "clientIP": primaryIP };
        const update = {
            $push: {
                sessions: {
                    $each: [{
                        timestamp: new Date().toISOString(),
                        ...sessionData
                    }]
                }
            }
        };
        const options = {
            upsert: true
        };

        const result = await gamedebugCollection.updateOne(filter, update, options);

        return result.acknowledged;
    } catch (error) {
        console.error('Error writing game debug data to MongoDB:', error);
        return false;
    }
}

// Check if contact number or email already exists
async function isDuplicate(contactNumber, email) {
    try {
        if (!registrationsCollection) {
            throw new Error('MongoDB connection not established');
        }
        
        // Check if contact number matches (case insensitive)
        const contactNumberQuery = { 
            contactNumber: { $regex: new RegExp(`^${contactNumber}$`, 'i') } 
        };
        
        const contactNumberDuplicate = await registrationsCollection.findOne(contactNumberQuery);
        
        if (contactNumberDuplicate) {
            return true;
        }
        
        // Check if email matches (if provided and not empty)
        if (email && email.trim() !== '') {
            const emailQuery = { 
                email: { $regex: new RegExp(`^${email}$`, 'i') } 
            };
            
            const emailDuplicate = await registrationsCollection.findOne(emailQuery);
            
            if (emailDuplicate) {
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Error checking for duplicates in MongoDB:', error);
        // In case of error, assume it's a duplicate to prevent potential data issues
        return true;
    }
}

// Validate registration form data
function validateFormData(formData) {
    const errors = [];
    
    // Required fields validation
    const requiredFields = ['fullName', 'school', 'contactNumber'];
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



// --- NEW VALIDATION FUNCTION --- A mouse tracker function to analyse behaviours
function validateGameDebugData(data) {
    const errors = [];
    if (!data.mousepath) {
        errors.push("Missing 'mousepath' field");
    } else if (!Array.isArray(data.mousepath)) {
        errors.push("'mousepath' must be an array");
    }
    if (!data.clicks) {
        errors.push("Missing 'clicks' field");
    } else if (!Array.isArray(data.clicks)) {
        errors.push("'clicks' must be an array");
    }
    if (!data.keypresses) {
        errors.push("Missing 'keypresses' field");
    } else if (!Array.isArray(data.keypresses)) {
        errors.push("'keypresses' must be an array");
    }
    return errors;
}


// A list of common bot probes. You can add more to this list.
const FORBIDDEN_PATHS = [
    '/wp-admin/setup-config.php',
    '/wordpress/wp-admin/setup-config.php',
    '/xmlrpc.php',
    '/wp-login.php'
];
const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Kolkata' // Add this line for Kolkata time
};
// Create HTTP server
const server = http.createServer(async (req, res) => {
    
    
    const requestDate = new Date();
    const clientO = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const formattedTime = requestDate.toLocaleTimeString('en-US', options);
    const oiia = {
        timestamp: `${formattedTime}`,
        interkom: clientO,
        method: req.method,
        url: req.url
    };
    //refer 0x0231.txt
    if (!oiia.url.endsWith('.jpg') && !oiia.url.endsWith('.png')) {
        writeLoginData(oiia);
    }
    

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Serve static files
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
    
    // Handle POST requests to /register
    if (req.method === 'POST' && req.url === '/register') {
        let body = '';
        
        // Collect the data chunks
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        // Process the data when complete
        req.on('end', async () => {
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
                
                // Check for duplicates
                const duplicate = await isDuplicate(formData.contactNumber, formData.email || '');
                if (duplicate) {
                    res.writeHead(409, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        message: 'Duplicate registration found. Contact number or email already exists.' 
                    }));
                    return;
                }
                
                // Add timestamp and ID to the registration new registration model.
                const newRegistration = {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    fullName: formData.fullName.trim(),
                    school: formData.school.trim(),
                    contactNumber: formData.contactNumber.trim(),
                    email: formData.email ? formData.email.trim() : '',

                    // Updated quiz participant fields
                    quizParticipant1: formData.quizParticipant1 ? formData.quizParticipant1.trim() : '',
                    quizParticipant2: formData.quizParticipant2 ? formData.quizParticipant2.trim() : '',

                    // --- Other event parameters ---
                    kartkraftParticipant1: formData.kartkraftParticipant1 ? formData.kartkraftParticipant1.trim() : '',
                    kartkraftParticipant2: formData.kartkraftParticipant2 ? formData.kartkraftParticipant2.trim() : '',
                    reelgearParticipant1: formData.reelgearParticipant1 ? formData.reelgearParticipant1.trim() : '',
                    reelgearParticipant2: formData.reelgearParticipant2 ? formData.reelgearParticipant2.trim() : '',
                    ideajamParticipant1: formData.ideajamParticipant1 ? formData.ideajamParticipant1.trim() : '',
                    ideajamParticipant2: formData.ideajamParticipant2 ? formData.ideajamParticipant2.trim() : '',
                    escapeParticipant1: formData.escapeParticipant1 ? formData.escapeParticipant1.trim() : '',
                    escapeParticipant2: formData.escapeParticipant2 ? formData.escapeParticipant2.trim() : '',
                    wealthParticipant1: formData.wealthParticipant1 ? formData.wealthParticipant1.trim() : '',
                    wealthParticipant2: formData.wealthParticipant2 ? formData.wealthParticipant2.trim() : '',
                    varietyParticipant1: formData.varietyParticipant1 ? formData.varietyParticipant1.trim() : '',
                    varietyParticipant2: formData.varietyParticipant2 ? formData.varietyParticipant2.trim() : '',
                    varietyParticipant3: formData.varietyParticipant3 ? formData.varietyParticipant3.trim() : '',
                    varietyParticipant4: formData.varietyParticipant4 ? formData.varietyParticipant4.trim() : '',
                    varietyParticipant5: formData.varietyParticipant5 ? formData.varietyParticipant5.trim() : '',
                    varietyParticipant6: formData.varietyParticipant6 ? formData.varietyParticipant6.trim() : '',
                    varietyParticipant7: formData.varietyParticipant7 ? formData.varietyParticipant7.trim() : '',
                    varietyParticipant8: formData.varietyParticipant8 ? formData.varietyParticipant8.trim() : '',
                    varietyParticipant9: formData.varietyParticipant9 ? formData.varietyParticipant9.trim() : '',
                    varietyParticipant10: formData.varietyParticipant10 ? formData.varietyParticipant10.trim() : '',
                };
                // Write to MongoDB
                if (await writeRegistration(newRegistration)) {
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
    } 
    // --- NEW /gamedebug POST REQUEST HANDLER ---
    else if (req.method === 'POST' && req.url === '/gamedebug') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
                const jsonData = JSON.parse(body);
                
                const validationErrors = validateGameDebugData(jsonData);
                if (validationErrors.length > 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Validation failed',
                        errors: validationErrors
                    }));
                    return;
                }

                if (await writeGameDebugData(clientIP, jsonData)) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        message: 'Game debug data received successfully!'
                    }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Failed to save game debug data. Please try again.'
                    }));
                }

            } catch (error) {
                console.error('Error processing game debug request:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Internal server error'
                }));
            }
        });
    }
    else {
        // Handle other routes
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false, 
            message: 'Endpoint not found' 
        }));
    }
});

// Start the server after connecting to MongoDB
connectToMongoDB().then(success => {
    if (success) {
        server.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } else {
        console.error('Failed to connect to MongoDB. Server not started.');
        process.exit(1);
    }
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    await client.close();
    process.exit(0);
});