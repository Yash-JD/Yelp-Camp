const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const { campgroundSchema } = require('./schemas.js');
const catchAsync = require('./utils/catchAsync');   // client-side error validation
const ExpressError = require('./utils/ExpressError');   // client-side error validation
const methodOverride = require('method-override');
const campground = require('./models/campground');

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

// define a Joi validation middleware funciton
const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
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
    const campgrounds = await campground.find({});
    res.render('campgrounds/index.ejs', { campgrounds });
})

// to create a new camp
app.get('/campgrounds/new', (req, res) => {
    res.render('campgrounds/new.ejs');
})
app.post('/campgrounds', validateCampground, catchAsync(async (req, res, next) => {
    const newCampground = new campground(req.body.campground);
    await newCampground.save();
    res.redirect(`/campgrounds/${newCampground._id}`)
}))

// view particular camp
app.get('/campgrounds/:id', catchAsync(async (req, res) => {
    const camp = await campground.findById(req.params.id);
    res.render('campgrounds/show.ejs', { camp });
}))

// to edit/update a camp
app.get('/campgrounds/:id/edit', catchAsync(async (req, res) => {
    const camp = await campground.findById(req.params.id);
    res.render('campgrounds/edit.ejs', { camp });
}))
app.put('/campgrounds/:id', validateCampground, catchAsync(async (req, res) => {
    // below req.body.campground is the object(in ejs files see name is campgrond[...])
    // and "..." is used to spread the object 
    const camp = await campground.findByIdAndUpdate(req.params.id, { ...req.body.campground });
    res.redirect(`/campgrounds/${camp._id}`)
}))

// to delele a camp
app.delete('/campgrounds/:id', catchAsync(async (req, res) => {
    await campground.findByIdAndDelete(req.params.id);
    res.redirect(`/campgrounds`)
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