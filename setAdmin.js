const mongoose = require('mongoose');
const User = require('./models/user');

// Connect to the database
mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
    console.log('Database connected');

    // Replace 'adminUsername' with the username of the user you want to make an admin
    const username = 'pratik_dubariya';
    const user = await User.findOne({ username });

    if (user) {
        user.isAdmin = true;
        await user.save();
        console.log(`${username} is now an admin.`);
    } else {
        console.log('User not found');
    }

    mongoose.connection.close();
});
