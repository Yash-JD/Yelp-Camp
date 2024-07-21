const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const catchAsync = require('./utils/catchAsync');   // client-side error validation
const ExpressError = require('./utils/ExpressError');   // client-side error validation
const methodOverride = require('method-override');

const campgrounds = require('./routes/campgournds.js')
const reviews = require('./routes/reviews.js')

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
app.use(express.static(path.join(__dirname, 'public')));

const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))

app.use(flash());

// flash middleware
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

// used routing method
app.use('/campgrounds', campgrounds)
app.use('/campgrounds/:id/reviews', reviews)


// home page
app.get('/', (req, res) => {
    res.render('home.ejs')
})

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