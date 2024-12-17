import express from 'express'; // Import Express framework
import dbConnect from './data1.js'; // Import MongoDB database connection function
import bcrypt from 'bcrypt'; // Import bcrypt for password hashing
import path from 'path'; // Import path module for handling file paths
import url from 'url'; // Import URL module
import bodyParser from 'body-parser'; // Import body-parser for form data handling
import registerRoutes from './registration.js'; // Import registration routes
import otpRoutes, { generateOtp } from './otp.js';
import forgotRoutes from './forgotpassword.js'
import jwt from 'jsonwebtoken'; // Import JWT library
import mainRoutes from './Dashboard.js';

const SECRET_KEY = '1234567890'; // Replace with a strong secret key


const app = express();

const filename = url.fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const HTMLpath = path.join(dirname, 'HTML');

// Middleware setup
app.use(express.static(HTMLpath));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(otpRoutes)
app.use(registerRoutes);
app.use(forgotRoutes)
app.use(mainRoutes)

// Existing login route
app.post('/api/login', async (req, resp) => {
    const { email, password } = req.body;

    const collection = await dbConnect();

    const existingEmail = await collection.findOne({ email });
    if (existingEmail) {
        const isPasswordCorrect = await bcrypt.compare(password, existingEmail.password);

        if (isPasswordCorrect) {
            // Generate JWT
            const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '1h' });
            return resp.json({ token });
        } else {
            console.log("wrong password");
            return resp.status(401).send("wrong password");
        }
    } else {
        console.log("Unregistered email");
        return resp.status(404).send("unregistered_email");
    }
});

export default app;