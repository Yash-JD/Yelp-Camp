const Campground = require('../models/campground.js');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");
// const campground = require('../models/campground.js');

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index.ejs', { campgrounds });
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new.ejs');
}

module.exports.createCampground = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    const newCampground = new Campground(req.body.campground);
    newCampground.geometry = geoData.body.features[0].geometry;
    newCampground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    newCampground.author = req.user._id;
    await newCampground.save();
    console.log(newCampground);
    req.flash('success', 'Successfully made a new campground');
    res.redirect(`/campgrounds/${newCampground._id}`)
}

module.exports.showCampground = async (req, res) => {
    const camp = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!camp) {
        req.flash('error', 'Cannot find that campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show.ejs', { camp });
}

module.exports.renderEditForm = async (req, res) => {
    const camp = await Campground.findById(req.params.id);
    if (!camp) {
        req.flash('error', 'Cannot find that campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit.ejs', { camp });
}

module.exports.updateCampground = async (req, res) => {
    // below req.body.campground is the object(in ejs files see name is campgrond[...])
    // and "..." is used to spread the object 
    const camp = await Campground.findByIdAndUpdate(req.params.id, { ...req.body.campground });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    camp.images.push(...imgs);
    await camp.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await camp.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
    }
    req.flash('success', 'Successfully updated campground');
    res.redirect(`/campgrounds/${camp._id}`)
}

// module.exports.deleteCampground = async (req, res) => {
//     await Campground.findByIdAndDelete(req.params.id);
//     req.flash('success', 'Successfully deleted campground');
//     res.redirect(`/campgrounds`)
// }

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    
    const campground = await Campground.findById(id);

    // Allow deletion if the user is an admin or the author of the campground
    if (req.user.isAdmin || campground.author.equals(req.user._id)) {
        await Campground.findByIdAndDelete(id);
        req.flash('success', 'Successfully deleted campground!');
        res.redirect('/campgrounds');
    } else {
        req.flash('error', 'You do not have permission to do that!');
        res.redirect(`/campgrounds/${id}`);
    }
};
