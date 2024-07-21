const express = require('express');
const router = express.Router();

const { campgroundSchema } = require('../schemas.js'); // joi schema

const catchAsync = require('../utils/catchAsync');   // client-side error validation
const ExpressError = require('../utils/ExpressError');   // client-side error validation

const Campground = require('../models/campground');

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

// show all camps
router.get('/', catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index.ejs', { campgrounds });
}))

// to create a new camp
router.get('/new', (req, res) => {
    res.render('campgrounds/new.ejs');
})
router.post('/', validateCampground, catchAsync(async (req, res, next) => {
    const newCampground = new Campground(req.body.campground);
    await newCampground.save();
    req.flash('success', 'Successfully made a new campground');
    res.redirect(`/campgrounds/${newCampground._id}`)
}))

// view particular camp
router.get('/:id', catchAsync(async (req, res) => {
    const camp = await Campground.findById(req.params.id).populate('reviews');
    if (!camp) {
        req.flash('error', 'Cannot find that campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show.ejs', { camp });
}))

// to edit/update a camp
router.get('/:id/edit', catchAsync(async (req, res) => {
    const camp = await Campground.findById(req.params.id);
    if (!camp) {
        req.flash('error', 'Cannot find that campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit.ejs', { camp });
}))
router.put('/:id', validateCampground, catchAsync(async (req, res) => {
    // below req.body.campground is the object(in ejs files see name is campgrond[...])
    // and "..." is used to spread the object 
    const camp = await Campground.findByIdAndUpdate(req.params.id, { ...req.body.campground });
    req.flash('success', 'Successfully updated campground');
    res.redirect(`/campgrounds/${camp._id}`)
}))

// to delele a camp
router.delete('/:id', catchAsync(async (req, res) => {
    await Campground.findByIdAndDelete(req.params.id);
    req.flash('success', 'Successfully deleted campground');
    res.redirect(`/campgrounds`)
}))

module.exports = router;