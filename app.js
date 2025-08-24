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
const MONGODB_URI = process.env.MONGODB_URI || "nah, you ain't getting the API key, api_scraper_BOT";//my api key
const DB_NAME = "registration_db";
const COLLECTION_NAME = "registrations";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Connect to MongoDB
let db, registrationsCollection;

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully!");
    
    db = client.db(DB_NAME);
    registrationsCollection = db.collection(COLLECTION_NAME);
    
    // Create indexes for efficient duplicate checking
    
    // In connectToMongoDB()
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
const server = http.createServer(async (req, res) => {
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
  } else {
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