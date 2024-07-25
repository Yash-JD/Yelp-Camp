const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync.js');   // client-side error validation
const Campground = require('../models/campground.js');
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware.js'); // authentication middleware


// show all camps
router.get('/', catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index.ejs', { campgrounds });
}))

// to create a new camp
router.get('/new', isLoggedIn, (req, res) => {
    res.render('campgrounds/new.ejs');
})
router.post('/', isLoggedIn, validateCampground, catchAsync(async (req, res, next) => {
    const newCampground = new Campground(req.body.campground);
    newCampground.author = req.user._id;
    await newCampground.save();
    req.flash('success', 'Successfully made a new campground');
    res.redirect(`/campgrounds/${newCampground._id}`)
}))

// view particular camp
router.get('/:id', catchAsync(async (req, res) => {
    const camp = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    console.log(camp);
    if (!camp) {
        req.flash('error', 'Cannot find that campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show.ejs', { camp });
}))

// to edit/update a camp
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const camp = await Campground.findById(req.params.id);
    if (!camp) {
        req.flash('error', 'Cannot find that campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit.ejs', { camp });
}))
router.put('/:id', isLoggedIn, isAuthor, validateCampground, catchAsync(async (req, res) => {
    // below req.body.campground is the object(in ejs files see name is campgrond[...])
    // and "..." is used to spread the object 
    const camp = await Campground.findByIdAndUpdate(req.params.id, { ...req.body.campground });
    req.flash('success', 'Successfully updated campground');
    res.redirect(`/campgrounds/${camp._id}`)
}))

// to delele a camp
router.delete('/:id', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    await Campground.findByIdAndDelete(req.params.id);
    req.flash('success', 'Successfully deleted campground');
    res.redirect(`/campgrounds`)
}))

module.exports = router;