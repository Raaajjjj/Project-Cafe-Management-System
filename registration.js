import express from 'express'; // Import Express framework
import dbConnect from './data1.js'; // Import MongoDB database connection function
import bcrypt from 'bcrypt'; // Import bcrypt for password hashing
import path from 'path'; // Import path module for handling file paths
import url from 'url'; // Import URL module
import bodyParser from 'body-parser'; // Import body-parser for form data handling
import otpRoutes, { generateOtp } from './otp.js'; // <-- Make sure this line is present and correct


const app = express(); // Create an Express app

// Get the current file's directory
const filename = url.fileURLToPath(import.meta.url); 
const dirname = path.dirname(filename);
const HTMLpath = path.join(dirname, 'HTML'); // Define HTML path here

// Middleware
app.use(express.static(HTMLpath)); // Serve static HTML files
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(otpRoutes)



// Serve the registration page
app.get('/register', (req, resp) => {
    resp.sendFile(`${HTMLpath}/registration.html`); // Serve the registration HTML form
});

// Handle form submission for registration
app.post('/register', async (req, resp) => {
    const { name, age, mobile, email, password } = req.body; // Destructure registration data from form

    console.warn("Received registration data", { name, age, mobile, email, password }); // Log form data

    try {
        // Connect to the MongoDB database
        const collection = await dbConnect(); 

        // Check if email, mobile, or Aadhaar number already exist
        const existingEmail = await collection.findOne({ email });
        const existingMobile = await collection.findOne({ mobile });
        

        // Alert message for existing fields
        const message = [];
        if (existingEmail) message.push("Email ID");
        if (existingMobile) message.push("Mobile Number");
        
        let alertMessage = "";
        if (message.length > 1) {
            const lastField = message.pop();
            alertMessage = `${message.join(", ")} and ${lastField} already registered.`; // Create alert for multiple fields
        } else if (message.length === 1) {
            alertMessage = `${message[0]} already registered.`; // Create alert for one field
        }

        // If there are any existing entries, show the alert
        if (alertMessage) {
            return resp.send(`<script>alert("${alertMessage}"); window.history.back();</script>`);
        } else {
            // Hash the password before generating OTP
            const hashedPassword = await bcrypt.hash(password, 10); // Hash password securely

            // Store user data for OTP generation (handled in otp.js)
            const userData = { name, age: parseInt(age), mobile, email, password: hashedPassword };
            const type = "registration";
            // Call generateOtp function here to send OTP
            generateOtp(email,userData,type); // <=== OTP generation called here
            
            
            // Redirect to OTP page (create an OTP verification page)
            return resp.send(`
                <script>
                    alert("An OTP has been sent to ${email}. Please verify to complete registration.");
                    window.location.href = '/otp?email=${email}&type=registration'; 
                </script>
            `);
        }

    } catch (error) {
        console.error('Error inserting data:', error); // Log any errors
        resp.status(500).send('Error registering user.'); // Send error response
    }
});

export default app
