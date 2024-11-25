const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatSchema = new Schema({
  campgroundId: {
    type: Schema.Types.ObjectId,
    ref: 'campground',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [
    {
      sender: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      text: String,
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('Chat', chatSchema);