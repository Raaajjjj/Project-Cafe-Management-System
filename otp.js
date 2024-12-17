import express from 'express'; // Import Express framework
import path from 'path'; // Import path module for handling file paths
import url from 'url'; // Import URL module
import mailgun from 'mailgun-js'; // Import Mailgun SDK
import crypto from 'crypto'; // Import crypto for OTP generation
import dbConnect from './data1.js'; // Import MongoDB database connection function
import bodyParser from 'body-parser';
import mainRoutes from './Dashboard.js'; 


// Middleware
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(mainRoutes)




// Get the current file's directory
const filename = url.fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const HTMLpath = path.join(dirname, 'HTML'); // Define HTML path here

// Serve the OTP verification page
app.get('/otp', (req, resp) => {
    resp.sendFile(`${HTMLpath}/otp.html`); // Serve the registration HTML form
});

// Mailgun configuration
const mg = mailgun({
    apiKey: 'bf8bfd82fbef2959a08d2778b4b8a030-1b5736a5-41325fa3', // Your Mailgun API key
    domain: 'sandbox91ec0fbb5c5b45c4ba22eeeae93e3d2f.mailgun.org' // Your Mailgun sandbox domain
});

// In-memory OTP storage
const otpStorage = {};
const OTP_EXPIRATION_TIME = 30 * 1000; // 30 seconds

// Function to send OTP via email using Mailgun
const sendOtpEmail = (email, otp,type) => {
    let subject;
    let text;

    // Customize email subject and text based on the type
    if (type === "registration") {
        subject = 'OTP Code For Registration';  // Subject for registration
        text = `Your OTP code for registration is: ${otp}. It is valid for 30 seconds.`; // Body for registration
    } else if (type === "login") {
        subject = 'OTP Code For Login';  // Subject for login
        text = `Your OTP code for login is: ${otp}. It is valid for 30 seconds.`; // Body for login
    } else if (type === "forgot") {
        subject = 'OTP Code For Password Reset';  // Subject for forgot password
        text = `Your OTP code for password reset is: ${otp}. It is valid for 30 seconds.`; // Body for forgot password
    }

    const data = {
        from: 'Raj Tech <postmaster@sandbox91ec0fbb5c5b45c4ba22eeeae93e3d2f.mailgun.org>', // Your Mailgun address
        to: email, // Recipient's email
        subject, // Dynamic subject based on the type
        text // Dynamic text based on the type
    };

    console.log('Email Data:', data)

    mg.messages().send(data, (error, body) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent:', body);
        }
    });
};

// Generate and send OTP
export const generateOtp = (email,userData,type) => {
    const otp = crypto.randomInt(100000, 999999); // Generate 6-digit OTP
    const expiresAt = Date.now() + OTP_EXPIRATION_TIME; // Calculate expiration time
    otpStorage[email] = { otp, userData,type ,expiresAt}; // Store OTP, user data, and expiration time
    sendOtpEmail(email,otp,type); // Send OTP
    console.log(`OTP sent to ${email} : ${otp}`); // Log for debugging
};



// Verify OTP
app.post('/api/verify-otp', async (req, resp) => {  // Changed endpoint to /api/verify-otp
    const { email, otp, type } = req.body; // Get email and OTP from request body

    console.log('Received email server:', email); // Debug email
    console.log('Received OTP server:', otp);     // Debug OTP
    console.log('Received type server:', type);   // Debug type

    if (otpStorage[email].otp == otp) {
        if (Date.now() >= otpStorage[email].expiresAt) {
            console.log("otp has expired. Request for the new otp");
            return resp.send("expired");
        }
        else {
            console.log("otp is valid");
         
            const collection = await dbConnect(); // Connect to MongoDB
        


            if (type === "registration") {
                console.log('Processing registration...');  // Debug log for registration
                await collection.insertOne(otpStorage[email].userData); // Insert the user data in MongoDB after OTP verification
                delete otpStorage[email]; // Clear OTP storage once registration is successful
                return resp.send("Registration");
            }

            else if (type === "login") {
                console.log('Processing login...');
    

                const existingDetails = await collection.findOne({ email });
                if (existingDetails) {
                    console.log("OTP is valid.User data from DB:", existingDetails);
                    delete otpStorage[email]; // Clear OTP storage once registration is successful
                    return resp.send("Login")
                }
            }
            else if(type === "forgot"){
                const existingDetails = await collection.findOne({ email });
                if (existingDetails) {
                    console.log("OTP is valid.User data from DB:", existingDetails);
                    delete otpStorage[email]; // Clear OTP storage once registration is successful
                    return resp.send("password")
                }
            }


        }
    }
    else {
        console.log(`The otp inserted by you is ${otp}`);
        console.log("OTP is invalid");
        return resp.send("invalid");
    }
});


// Resend OTP
app.post('/api/resend-otp', (req, resp) => {
    const { email } = req.body; // Get email from form submission
    const userData = otpStorage[email].userData; // Get userData from stored OTP data
    const type = otpStorage[email].type;
    generateOtp(email, userData,type); // Generate and send new OTP
    return resp.send("success");

});


export default app;



