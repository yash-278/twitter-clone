const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "My little twitter database secret",
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
  "mongodb+srv://admin-yash:admin4321@cluster0-d0lkx.mongodb.net/twitterDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

const tweetSchema = new mongoose.Schema({
  username: String,
  tweet: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

const Tweet = mongoose.model("Tweet", tweetSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.get("/", function(req, res) {
  res.render("index");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/signin", function(req, res) {
  res.render("sign-up");
});

app.get("/home", function(req, res) {
  if (req.isAuthenticated()) {
    Tweet.find({}, function(err, tweets) {
      res.render("home", {
        tweets: tweets
      });
    }).sort({ _id: -1 });
  } else {
    res.redirect("login");
  }
});

app.get("/compose", function(req, res) {
  res.render("compose");
});

app.get("/logout", function(req, res) {
  req.logout();
  res.render("index");
});

app.post("/signin", function(req, res) {
  User.register({ username: req.body.username }, req.body.password, function(
    err,
    user
  ) {
    if (err) {
      console.log(err);
      res.redirect("/signin");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/home");
      });
    }
  });
});

app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/home");
      });
    }
  });
});

app.post("/compose", function(req, res) {
  const tweetContent = req.body.tweetContent;
  const currentUser = req.user.username;

  const tweet = new Tweet({
    username: currentUser,
    tweet: tweetContent
  });

  tweet.save(function(err) {
    if (!err) {
      res.redirect("/home");
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
  console.log("Started local server");
}
app.listen(port);
