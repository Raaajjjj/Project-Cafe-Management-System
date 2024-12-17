import express from 'express';
import path from 'path';
import url from 'url';
import { Server } from 'socket.io'; // Import Socket.IO
import http from 'http'; // Import http to create an HTTP server
import CategoryRoutes from './Category.js'; // Import Category routes
import ProductRoutes from './Product.js'; // Import Product routes
import BillRoutes from './Bill.js'; // Import Bill routes
import ViewBillRoutes from './ViewBill.js'
import loginRoutes from './login.js'

const app = express();
const server = http.createServer(app); // Create HTTP server and attach Express to it
const io = new Server(server); // Initialize Socket.IO with the HTTP server

// Define directory paths
const filename = url.fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const HTMLpath = path.join(dirname, 'HTML');

// Middleware
app.use(express.static(HTMLpath));
app.use(express.json());


// Routes
app.use(CategoryRoutes); // Mount Category routes
app.use(ProductRoutes); // Mount Product routes
app.use(BillRoutes); // Mount Bill routes
app.use(ViewBillRoutes)
app.use(loginRoutes)

// Serve the main HTML page
app.get('/', (req, resp) => {
    resp.sendFile(`${HTMLpath}/login.html`); // Serve the main HTML page
});


app.get('/manage-category', (req, res) => {
    res.sendFile(`${HTMLpath}/Category.html`);
});

app.get('/manage-product', (req, res) => {
    res.sendFile(`${HTMLpath}/Product.html`);
});

app.get('/generate-bill', (req, res) => {
    res.sendFile(`${HTMLpath}/Bill.html`);
});

app.get('/view-bill', (req, res) => {
    res.sendFile(`${HTMLpath}/ViewBill.html`);
});


// Socket.IO setup
io.on('connection', (socket) => {
    socket.on('disconnect', () => {
    });
});

// Make Socket.IO available in routes if needed
app.set('socketio', io);

// Start the server
server.listen(7000, () => {
    console.log('Server running on http://localhost:7000');
});
