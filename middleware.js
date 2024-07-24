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