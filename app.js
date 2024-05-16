const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const { campgroundSchema, reveiwSchema } = require('./schemas.js');
const catchAsync = require('./utils/catchAsync');   // client-side error validation
const ExpressError = require('./utils/ExpressError');   // client-side error validation
const methodOverride = require('method-override');
const Campground = require('./models/campground');
const Review = require('./models/review.js');

mongoose.connect('mongodb://localhost:27017/yelp-camp');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true })) // tell the express to parse url encoded to json body
app.use(methodOverride('_method'));

// define a Joi validation middleware funciton (server-side validation)
const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)    // this will redirect to server side route handler
    } else {
        next();
    }
}
const validateReview = (req, res, next) => {
    const { error } = reveiwSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)    // this will redirect to server side route handler
    } else {
        next();
    }
}


app.get('/', (req, res) => {
    res.render('home.ejs')
})

// show all camps
app.get('/campgrounds', async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index.ejs', { campgrounds });
})

// to create a new camp
app.get('/campgrounds/new', (req, res) => {
    res.render('campgrounds/new.ejs');
})
app.post('/campgrounds', validateCampground, catchAsync(async (req, res, next) => {
    const newCampground = new Campground(req.body.campground);
    await newCampground.save();
    res.redirect(`/campgrounds/${newCampground._id}`)
}))

// view particular camp
app.get('/campgrounds/:id', catchAsync(async (req, res) => {
    const camp = await Campground.findById(req.params.id).populate('reviews');
    res.render('campgrounds/show.ejs', { camp });
}))

// to edit/update a camp
app.get('/campgrounds/:id/edit', catchAsync(async (req, res) => {
    const camp = await Campground.findById(req.params.id);
    res.render('campgrounds/edit.ejs', { camp });
}))
app.put('/campgrounds/:id', validateCampground, catchAsync(async (req, res) => {
    // below req.body.campground is the object(in ejs files see name is campgrond[...])
    // and "..." is used to spread the object 
    const camp = await Campground.findByIdAndUpdate(req.params.id, { ...req.body.campground });
    res.redirect(`/campgrounds/${camp._id}`)
}))

// to delele a camp
app.delete('/campgrounds/:id', catchAsync(async (req, res) => {
    await Campground.findByIdAndDelete(req.params.id);
    res.redirect(`/campgrounds`)
}))

// to submit the review to server
app.post('/campgrounds/:id/reviews', validateReview, catchAsync(async (req, res) => {
    const camp = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    camp.reviews.push(review);
    await review.save();
    await camp.save();
    res.redirect(`/campgrounds/${camp.id}`)
}));

// to delete a review in a particular campground
app.delete('/campgrounds/:id/reviews/:reviewId', catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });   // pull operator is used to remove all existing instances of values that match a condition 
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/campgrounds/${id}`);
}))

// error handler for any user route error
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

// error handling for server side
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;   // default value
    if (!err.message) err.message = 'Something went wrong!';
    res.status(statusCode).render('error', { err });
})

app.listen(3000, () => {
    console.log("Listening on PORT 3000")
})