const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Middleware to parse JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/loginapp', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => console.error('Error connecting to MongoDB:', error));

// User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

const User = mongoose.model('User', userSchema);

// Register route
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// Login route
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            res.json({ success: true, message: 'Login successful', redirectTo: '/admin' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Import the Contact model
const Contact = require('./models/contact.js');

// Contact form route
app.post('/contact', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        const newContact = new Contact({ name, email, phone, message });
        await newContact.save();
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error saving contact message:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
});

// Fetch all contacts
app.get('/contacts', async (req, res) => {
    try {
        const contacts = await Contact.find({});
        res.json(contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
    }
});

// Admin page route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Define a schema for enquiries
const enquirySchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    message: String,
    date: { type: Date, default: Date.now }
});

// Create a model for enquiries
const Enquiry = mongoose.model('Enquiry', enquirySchema);

// Handle enquiry form submission
app.post('/submit-enquiry', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        const newEnquiry = new Enquiry({ name, email, phone, message });
        await newEnquiry.save();
        res.status(200).json({ success: true, message: 'Enquiry submitted successfully' });
    } catch (error) {
        console.error('Error submitting enquiry:', error);
        res.status(500).json({ success: false, message: 'Error submitting enquiry' });
    }
});

// Fetch all enquiries
app.get('/enquiries', async (req, res) => {
    try {
        const enquiries = await Enquiry.find({});
        res.json(enquiries);
    } catch (error) {
        console.error('Error fetching enquiries:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch enquiries' });
    }
});

// Delete an enquiry
app.delete('/enquiries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Enquiry.deleteOne({ _id: id });

        if (result.deletedCount === 1) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Enquiry not found' });
        }
    } catch (error) {
        console.error('Error deleting enquiry:', error);
        res.status(500).json({ error: 'Failed to delete enquiry' });
    }
});

// Delete a contact
app.delete('/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Contact.deleteOne({ _id: id });

        if (result.deletedCount === 1) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Contact not found' });
        }
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ error: 'Failed to delete contact details' });
    }
});
// Add these routes in your server file (e.g., app.js)

app.get('/enquiries/count', async (req, res) => {
    try {
        const count = await Enquiry.countDocuments();
        res.json({ count });
    } catch (error) {
        console.error('Error fetching enquiry count:', error);
        res.status(500).json({ error: 'Failed to fetch enquiry count' });
    }
});

app.get('/contacts/count', async (req, res) => {
    try {
        const count = await Contact.countDocuments();
        res.json({ count });
    } catch (error) {
        console.error('Error fetching contact count:', error);
        res.status(500).json({ error: 'Failed to fetch contact count' });
    }
});


// Change password route
app.post('/change-password', async (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        const user = await User.findOne({ username });

        if (!user || !await bcrypt.compare(currentPassword, user.password)) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        await user.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ success: false, message: 'Password change failed' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});