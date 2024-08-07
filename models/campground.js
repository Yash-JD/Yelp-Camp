const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;

// https://res.cloudinary.com/douqbebwk/image/upload/w_300/v1600113904/YelpCamp/gxgle1ovzd2f3dgcpass.png

const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

const campgroundSchema = new Schema({
    title: String,
    images: [ImageSchema],
    price: Number,
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
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