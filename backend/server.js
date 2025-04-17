const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors'); 
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET; 
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const db_password = process.env.DB_PASSWORD; 


if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
}

// Set mongoose to use the new URL parser and unified topology
mongoose.set('strictQuery', true);

// Configure CORS
const corsOptions = {
    origin: FRONTEND_URL,
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

// Apply middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// MongoDB connection
const uri = `mongodb+srv://a2zeejey:${db_password}@cluster0.pdlu66z.mongodb.net/noteapp?retryWrites=true&w=majority`;

const clientOptions = {
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("Pinged your deployment. Successfully connected to MongoDB!");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
};

connectDB();

// Import Models
const User = require('./models/users');
const Note = require('./models/notes');
const Draft = require('./models/drafts');

// Middleware: Authenticate JWT
function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token is not valid' });
        req.user = user;
        next();
    });
}

// Middleware: Role-based access
function authorizeRoles(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        next();
    };
}

// Input validation function
function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
}

function validatePassword(password) {
    return typeof password === 'string' && password.length >= 8;
}

// Registration
app.post('/api/register', async (req, res) => {
    try {
        const { firstName, lastName, email, confirmPassword, password, role } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        if (!firstName || !lastName) {
            return res.status(400).json({ message: 'First name and last name are required' });
        }
        
        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        
        if (!validatePassword(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }
        
        // Role validation
        const validRoles = ['user', 'admin'];
        const userRole = role || 'user';
        if (role && !validRoles.includes(userRole)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedConfirmPassword = await bcrypt.hash(confirmPassword, 10);
        const user = new User({ firstName, lastName, email, password: hashedPassword, confirmPassword: hashedConfirmPassword, role: userRole });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict' 
        });
        res.json({ message: 'Logged in successfully' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// profile route 
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -confirmPassword');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'Profile retrieved successfully', user });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
app.put('/api/profile/update', authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName } = req.body;
        
        // Find user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Update fields
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        
        await user.save();
        
        // Return updated user without sensitive fields
        const updatedUser = await User.findById(req.user.id).select('-password -confirmPassword');
        
        res.json({ 
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin-only route example
app.get('/api/admin', authenticateToken, authorizeRoles('admin'), (req, res) => {
    res.json({ message: 'Welcome, admin!' });
});

// ===== NOTES ENDPOINTS =====

// Get all notes for the current user
app.get('/api/notes', authenticateToken, async (req, res) => {
    try {
        const filter = { 
            userId: req.user.id,
            isArchived: false // Get only non-archived notes by default
        };
        
        // Apply query filters if provided
        if (req.query.archived === 'true') {
            filter.isArchived = true;
        } else if (req.query.all === 'true') {
            delete filter.isArchived; // Show all notes regardless of archive status
        }
        
        // Filter by tag if provided
        if (req.query.tag) {
            filter.tags = req.query.tag;
        }
        
        // Search functionality
        if (req.query.search) {
            filter.$text = { $search: req.query.search };
        }

        // Get notes with sorting (pinned first, then by date)
        const notes = await Note.find(filter)
            .sort({ isPinned: -1, lastModified: -1 })
            .select('-__v');
            
        res.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a specific note by ID
app.get('/api/notes/:id', authenticateToken, async (req, res) => {
    try {
        const note = await Note.findOne({ 
            _id: req.params.id,
            userId: req.user.id
        });
        
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        
        res.json(note);
    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new note
app.post('/api/notes', authenticateToken, async (req, res) => {
    try {
        const { title, content, tags, color } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }
        
        // Create the new note
        const note = new Note({
            title,
            content,
            userId: req.user.id,
            tags: tags || [],
            color: color || 'default'
        });
        
        await note.save();
        
        // Clear any drafts if this was from a draft
        if (req.body.draftId) {
            await Draft.findOneAndDelete({ 
                _id: req.body.draftId,
                userId: req.user.id
            });
        }
        
        res.status(201).json(note);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a note
app.put('/api/notes/:id', authenticateToken, async (req, res) => {
    try {
        const { title, content, tags, color, isPinned, isArchived } = req.body;
        
        // Find the note
        const note = await Note.findOne({ 
            _id: req.params.id,
            userId: req.user.id
        });
        
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        
        // Update fields if provided
        if (title !== undefined) note.title = title;
        if (content !== undefined) note.content = content;
        if (tags !== undefined) note.tags = tags;
        if (color !== undefined) note.color = color;
        if (isPinned !== undefined) note.isPinned = isPinned;
        if (isArchived !== undefined) note.isArchived = isArchived;
        
        note.lastModified = Date.now();
        
        await note.save();
        
        // Clear any related draft
        await Draft.findOneAndDelete({ 
            noteId: note._id,
            userId: req.user.id
        });
        
        res.json(note);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a note
app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
    try {
        const result = await Note.findOneAndDelete({ 
            _id: req.params.id,
            userId: req.user.id
        });
        
        if (!result) {
            return res.status(404).json({ message: 'Note not found' });
        }
        
        // Delete any related drafts
        await Draft.findOneAndDelete({ 
            noteId: req.params.id,
            userId: req.user.id
        });
        
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle pin status
app.patch('/api/notes/:id/pin', authenticateToken, async (req, res) => {
    try {
        const note = await Note.findOne({ 
            _id: req.params.id,
            userId: req.user.id
        });
        
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        
        note.isPinned = !note.isPinned;
        note.lastModified = Date.now();
        
        await note.save();
        
        res.json({ isPinned: note.isPinned });
    } catch (error) {
        console.error('Error toggling pin status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle archive status
app.patch('/api/notes/:id/archive', authenticateToken, async (req, res) => {
    try {
        const note = await Note.findOne({ 
            _id: req.params.id,
            userId: req.user.id
        });
        
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        
        note.isArchived = !note.isArchived;
        note.lastModified = Date.now();
        
        await note.save();
        
        res.json({ isArchived: note.isArchived });
    } catch (error) {
        console.error('Error toggling archive status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all unique tags for current user
app.get('/api/tags', authenticateToken, async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.user.id });
        const tagsSet = new Set();
        
        notes.forEach(note => {
            note.tags.forEach(tag => tagsSet.add(tag));
        });
        
        res.json(Array.from(tagsSet));
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== DRAFT FUNCTIONALITY =====

// Auto-save draft
app.post('/api/drafts', authenticateToken, async (req, res) => {
    try {
        const { noteId, title, content, tags, color } = req.body;
        
        // Find existing draft or create new one
        let draft = await Draft.findOne({
            userId: req.user.id,
            ...(noteId ? { noteId } : {})
        });
        
        if (draft) {
            // Update existing draft
            if (title !== undefined) draft.title = title;
            if (content !== undefined) draft.content = content;
            if (tags !== undefined) draft.tags = tags;
            if (color !== undefined) draft.color = color;
            draft.lastSaved = Date.now();
            await draft.save();
        } else {
            // Create new draft
            draft = new Draft({
                noteId,
                userId: req.user.id,
                title,
                content,
                tags,
                color,
            });
            await draft.save();
        }
        
        res.status(200).json(draft);
    } catch (error) {
        console.error('Error saving draft:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get draft for a note
app.get('/api/drafts/:noteId?', authenticateToken, async (req, res) => {
    try {
        const query = { userId: req.user.id };
        if (req.params.noteId && req.params.noteId !== 'new') {
            query.noteId = req.params.noteId;
        } else if (req.params.noteId === 'new') {
            query.noteId = { $exists: false };
        }
        
        const draft = await Draft.findOne(query);
        
        if (!draft) {
            return res.status(404).json({ message: 'No draft found' });
        }
        
        res.json(draft);
    } catch (error) {
        console.error('Error fetching draft:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a draft
app.delete('/api/drafts/:id', authenticateToken, async (req, res) => {
    try {
        const result = await Draft.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });
        
        if (!result) {
            return res.status(404).json({ message: 'Draft not found' });
        }
        
        res.json({ message: 'Draft deleted successfully' });
    } catch (error) {
        console.error('Error deleting draft:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Allowing CORS for: ${FRONTEND_URL}`);
});