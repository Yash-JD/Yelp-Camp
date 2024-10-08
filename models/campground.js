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

const opts = { toJSON: { virtuals: true } };

const campgroundSchema = new Schema({
    title: String,
    images: [ImageSchema],
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
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
}, opts);

campgroundSchema.virtual('properties.popUpMarkup').get(function () {
    return `
        <strong><a href="/campgrounds/${this._id}">${this.title}</a><strong>
        <p>${this.description.substring(0, 20)}...</p>`
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