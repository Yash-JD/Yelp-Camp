const Campground = require('../models/campground');
const Review = require('../models/review');

module.exports.createReview = async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success', 'Created new review!');
    res.redirect(`/campgrounds/${campground._id}`);
}

// module.exports.deleteReview = async (req, res) => {
//     const { id, reviewId } = req.params;
//     await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
//     await Review.findByIdAndDelete(reviewId);
//     req.flash('success', 'Successfully deleted review')
//     res.redirect(`/campgrounds/${id}`);
// }

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;

    console.log(req.user);
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    const review = await Review.findById(reviewId);
    if (req.user.isAdmin || review.author.equals(req.user._id)) {
        
        await Review.findByIdAndDelete(reviewId);
        req.flash('success', 'Successfully deleted review!');
    } else {
        req.flash('error', 'You do not have permission to do that!');
    }

    res.redirect(`/campgrounds/${id}`);
};