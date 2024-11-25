if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError.js"); // client-side error validation
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const http = require("http");
const scoketio = require("socket.io");

const userRoutes = require("./routes/users.js");
const campgroundRoutes = require("./routes/campgrounds.js");
const reviewRoutes = require("./routes/reviews.js");

mongoose.connect("mongodb://localhost:27017/yelp-camp");

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const app = express();
const server = http.createServer(app);
const io = scoketio(server);

// io for chat
io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  socket.on("joinRoom", ({ userId, campgroundId }) => {
    const room = `${userId}-${campgroundId}`;
    socket.join(room);

    // Notify the owner that a user has joined the chat
    socket.broadcast.to(room).emit("message", "A user has joined the chat");
  });

  // Listen for chat messages
  socket.on("chatMessage", async ({ roomId, message }) => {
    const [userId, campgroundId] = roomId.split('-');
  
    // Save message to the database
    const chat = await Chat.findOne({ campgroundId, userId }) || new Chat({ campgroundId, userId });
    chat.messages.push({ sender: socket.id, text: message });
    await chat.save();

    io.to(roomId).emit('message', message);
  });

  socket.on("disconnect", () => {
    console.log("User has left");
  });
});

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true })); // tell the express to parse url encoded to json body
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const sessionConfig = {
  secret: "thisshouldbeabettersecret!",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));

app.use(flash());

// authentication
app.use(passport.initialize());
app.use(passport.session());
// passport.use(new LocalStrategy(User.authenticate()));
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// flash middleware
app.use((req, res, next) => {
  // console.log(req.session);
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// used routing method
app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);
// app.use("/users",blockUser);

// home page
app.get("/", (req, res) => {
  res.render("home.ejs");
});

// error handler for any user route error
// app.all("*", (req, res, next) => {
//   next(new ExpressError("Page Not Found", 404));
// });

// error handling for server side
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err; // default value
  if (!err.message) err.message = "Something went wrong!";
  res.status(statusCode).render("error", { err });
});

app.listen(3000, () => {
  console.log("Listening on PORT 3000");
});
