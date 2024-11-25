const { campgroundSchema, reviewSchema } = require('./schemas.js'); // joi schema
const ExpressError = require('./utils/ExpressError.js');   // client-side error validation
const Campground = require('./models/campground.js');
const Review = require('./models/review.js');


module.exports.isLoggedIn = (req, res, next) => {
    // console.log("User", req.user);
    if (!req.isAuthenticated()) {
        // store the url at which they are currently requesting
        // and after they login redirect to where they leaved previously
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}

// define a Joi validation middleware funciton (server-side validation)
module.exports.validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)    // this will redirect to server side route handler
    } else {
        next();
    }
}

// authorization middleware
module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground.author.equals(req.user._id) && !req.user.isAdmin) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id) && !req.user.isAdmin) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

// In middleware/index.js
module.exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        return next();
    }
    req.flash('error', 'You must be an admin to view that page');
    res.redirect('/');
};  