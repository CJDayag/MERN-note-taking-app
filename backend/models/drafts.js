const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
    noteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        trim: true
    },
    content: {
        type: String
    },
    tags: [{
        type: String,
        trim: true
    }],
    color: {
        type: String,
        default: 'default'
    },
    lastSaved: {
        type: Date,
        default: Date.now
    }
});

const Draft = mongoose.model('Draft', draftSchema);

module.exports = Draft;
