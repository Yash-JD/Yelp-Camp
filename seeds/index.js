const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const campground = require('../models/campground');

mongoose.connect('mongodb://localhost:27017/yelp-camp');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

// selecting random sample from seedHelpers arrays 
const sample = array => array[Math.floor(Math.random() * array.length)];

// delete all data in db and add new data
const seedDB = async () => {
    await campground.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new campground({
            author: '66a1e4daae98c8cc374d6695',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit.Nisi et obcaecati, eius soluta a, consectetur placeat officiis velit temporibus alias aliquid quod harum repudiandae odit eligendi quo error tempore ex',
            price,
            images: [
                {
                    url: 'https://res.cloudinary.com/dqnlnueto/image/upload/v1722936457/YelpCamp/mqqmiqjbtfmdectuanid.png',
                    filename: 'YelpCamp/mqqmiqjbtfmdectuanid'
                },
                {
                    url: 'https://res.cloudinary.com/dqnlnueto/image/upload/v1722936457/YelpCamp/t5lp8ov077kbblvbuibq.png',
                    filename: 'YelpCamp/t5lp8ov077kbblvbuibq'
                }
            ]
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close;
})