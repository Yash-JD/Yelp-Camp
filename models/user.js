const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});

// this plugin method of repository passportLocalMongoose is going to provide username & password field to UserSchema and
// and also maintain uniqueness or no duplicates
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);