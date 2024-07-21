const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;

const campgroundSchema = new Schema({
    title: String,
    image: String,
    price: Number,
    description: String,
    location: String,
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
});

// middleware function which delete the data from db permanently
// these is used reason when we delete camp it should also remove all its reviews
campgroundSchema.post('findOneAndDelete', async (doc) => {
    if (doc) {  // if some camp is deleted (doc)
        await Review.deleteMany({
            _id: {  // remove the field id in Review db
                $in: doc.reviews    // in the deleted reviews array
            }
        })
    }
})

const campground = mongoose.model('campground', campgroundSchema);
module.exports = campground;