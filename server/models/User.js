const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  college: {
    type: String,
    required: true
  },
  department: String,
  year: Number,
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  avatar: String,
  bio: String,
  skills: [{
    name: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced']
    }
  }],
  interests: [String],
  lookingFor: [{
    type: String,
    enum: ['hackathon', 'project', 'networking', 'mentorship']
  }],
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  hackathonHistory: [{
    name: String,
    date: Date,
    role: String,
    achievement: String,
    projectLink: String
  }],
  connectedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
