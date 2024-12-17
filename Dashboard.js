import express from 'express'; // Import Express framework
import path from 'path'; // Import path module for handling file paths
import url from 'url'; // Import URL module
import bodyParser from 'body-parser'; // Import body-parser for form data handling


const app = express();

const filename = url.fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const HTMLpath = path.join(dirname, 'HTML');

// Middleware setup
app.use(express.static(HTMLpath));
app.use(bodyParser.urlencoded({ extended: true }));

import jwt from 'jsonwebtoken';
const SECRET_KEY = '1234567890';  // Use your actual secret key for signing/verification

// Serve HTML pages
app.get('/Dashboard', (req, res) => {
    res.sendFile(`${HTMLpath}/Dashboard.html`);
});


app.get('/api/validate-token', (req, resp) => {
    const token = req.headers['authorization']?.split(' ')[1];  // Extract token from header

    if (!token) {
        return resp.status(401).json({ error: 'No token provided' });  // Return error if no token
    }

    // Verify token with the secret key
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return resp.status(401).json({ error: 'Invalid token' });  // Invalid token
        }

        // If valid, send success message
        console.log("Token is valid:", decoded);
        resp.status(200).json({ message: 'Token received and valid' });
    });
});

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});





export default app;