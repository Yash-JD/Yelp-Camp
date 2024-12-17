const Campground = require('../models/campground');
const review = require('../models/review');
const User = require('../models/user');


module.exports.renderRegister = (req, res) => {
    res.render('users/signup');
}

module.exports.register = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;

        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser && existingUser.isBlocked) {
            req.flash('error', 'You cannot create a new account with this email');
            return res.redirect('signup');
        }

        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Yelp Camp !');
            res.redirect('/campgrounds');
        })
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('signup');
    }
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login')
}

module.exports.login = (req, res) => {
    if (req.user.isBlocked) {
        req.flash('error', 'Your account has been blocked');
        return res.redirect('/login');
    }
    req.flash('success', 'Welcome back!');
    const redirectUrl = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.flash('success', "Logged out!");
        res.redirect('/campgrounds');
    });
}

module.exports.users = async (req, res) => {
    try {
        const users = await User.find({}).lean();
        for (let user of users) {
            user.campgrounds = await Campground.find({ author: user._id }).lean();
        }
        res.render('partials/users.ejs', { users });
    } catch (error) {
        console.log(error);
        req.flash('error', 'Cannot fetch users at the moment');
        res.redirect('/users');
    }
};

module.exports.blockCamp = async (req, res) => {
    try {
        const userId = req.params.id;
        console.log(userId);
        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/users');
        }

        // Find all campgrounds created by the user
        const camps = await Campground.find({ author: userId });

        // Collect campground IDs
        const campIds = camps.map(camp => camp._id);

        // Delete all reviews associated with the user's campgrounds
        await review.deleteMany({ campground: { $in: campIds } });

        // Delete the user's campgrounds
        await Campground.deleteMany({ author: userId });

        // Delete reviews made by the user on other campgrounds
        await review.deleteMany({ author: userId });

        // Set the user as blocked
        user.isBlocked = true;
        await user.save();

        req.flash('success', 'User and associated data deleted successfully');
        res.redirect('/users');
    } catch (error) {
        console.log(error);
        req.flash('error', 'An error occurred while deleting the user');
        res.redirect('/users');
    }
}
