import express from 'express'; // Import Express framework
import dbConnect from './data1.js'; // Import MongoDB database connection function
import bcrypt from 'bcrypt'; // Import bcrypt for password hashing
import path from 'path'; // Import path module for handling file paths
import url from 'url'; // Import URL module
import bodyParser from 'body-parser'; // Import body-parser for form data handling
import otpRoutes, { generateOtp } from './otp.js'; 


const app = express();

const filename = url.fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const HTMLpath = path.join(dirname, 'HTML');

app.use(express.static(HTMLpath));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(otpRoutes)


app.get('/forgot', (req, resp) => {
    resp.sendFile(`${HTMLpath}/forgotpassword.html`); // Serve the main HTML page
});

app.post('/api/forgotpassword',async(req,resp)=>{
    const {email}=req.body;
    const collection=await dbConnect();
    const existingEmail=await collection.findOne({email});
    if(existingEmail){
        const userdata={email}
        const type="forgot"
        generateOtp(email,userdata,type)
        return resp.send("forgot1")

    }
    else{
        return resp.send("no_email")

    }
})

app.post('/api/resetpassword',async(req,resp)=>{
    const{email,newPassword,confirmPassword}=req.body
    console.log("Received data:", email, newPassword, confirmPassword);
    if(newPassword!==confirmPassword){
        return resp.send("passwordMismatch")
    }
    else{
        const collection=await dbConnect();
        const existingEmail=await collection.findOne({email});
        if(existingEmail){
            console.log("Found email in database");  
            const comparepassword=await bcrypt.compare(newPassword, existingEmail.password);
            if(comparepassword){
                return resp.send("passwordMatch")
            }
            else{
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                await collection.updateOne({ email }, { $set: { password: hashedPassword}})
                return resp.send("passwordUpdated")
            }
        }
    }

})

export default app;
