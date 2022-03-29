const mongoose = require('mongoose')

const PostSchema = mongoose.Schema({
    firstname: {
        type: String,
        required: true,
        max: 50
    },
    userid: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
        max: 50
    },
    username: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    }
}, { timestamps: true }
)

PostSchema.index({ '$**': 'text' });

module.exports = mongoose.model('Post', PostSchema)
