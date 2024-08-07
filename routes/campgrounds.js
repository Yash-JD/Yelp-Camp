const express = require('express');
const router = express.Router();
const campgrounds = require('../controllers/campgrounds.js');
const catchAsync = require('../utils/catchAsync.js');   // client-side error validation
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware.js'); // authentication middleware
const Campground = require('../models/campground.js');
const multer = require('multer');
const { storage } = require('../cloudinary/index.js');
const upload = multer({ storage })


router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground))

router.get('/new', isLoggedIn, campgrounds.renderNewForm)

router.route('/:id')
    .get(catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground))


router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm))


module.exports = router;