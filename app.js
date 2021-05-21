require("dotenv").config();
const express = require("express");
const mongoose =require("mongoose");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const _ = require("lodash");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const LocalStrategy = require("passport-local").Strategy;
const jwt = require('jsonwebtoken');

const app = express();

app.use(express.json());
app.use(express.static("public"));

let refreshTokens = [];
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended : true
}));

//using session package
// required for passport session
app.use(session({
  secret: process.env.SECRET,
  saveUninitialized: true,
  resave: true
}));

//using passport and passport to deal with sessions
 app.use(passport.initialize());
 app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/NurseryNation",{
    useNewUrlParser : true,
    useUnifiedTopology : true,
    useCreateIndex : true
});


const userSchema = new mongoose.Schema({
  username : String,
  password : String,
  googleId : String,
  firstName :String,
  lastName :String,
  email : String,
  contact :String,
  address :String,
});

const sellerSchema = new mongoose.Schema({
  username : String,
  password : String,
  googleId : String,
  
});

const productSchema = new mongoose.Schema({
    username : String,
    productName : String,
    price : Number,
    productImage : String,
    productDetails : String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

sellerSchema.plugin(passportLocalMongoose);
sellerSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const Seller = new mongoose.model("Seller", sellerSchema);
const Products = new mongoose.model("Product",productSchema);

// passport.use(User.createStrategy());
// passport.use(Seller.createStrategy());

passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({
      username: username
  }, function(err, user) {
      // This is how you handle error
      if (err) return done(err);
      // When user is not found
      if (!user) return done(null, false);
      // When password is not correct
      if (!user.authenticate(password)) return done(null, false);
      // When all things are good, we return the user
      return done(null, user);
   });
}));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLEID,
    clientSecret: process.env.GOOGLESECRET,
    callbackURL: "http://localhost:3000/auth/google/products",
    userProfileURL : "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ username: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOKID,
    clientSecret: process.env.FACEBOOKSECRET,
    callbackURL: "http://localhost:3000/auth/facebook/products",
    profileFields : ['id', 'displayName']
    
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ username: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("/");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/products", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    
    res.redirect('/products');
  });

  app.get('/auth/facebook',
  passport.authenticate('facebook')
  );

app.get('/auth/facebook/products',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    
    res.redirect('/products');
  });

app.get("/",(req,res)=>{
    res.render("index");
});

app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/signup",(req,res)=>{
    res.render("signup");
});


app.get("/userDetails",(req,res)=>{

});

app.get("/sellersignup",(req,res)=>{
  res.render("seller/sellersignup");
});

app.get("/sellerlogin",(req,res)=>{
  res.render("seller/sellerlogin");
})

app.get("/sellerdetails",(req,res)=>{

});

app.get("/sellerdashboard",(req,res)=>{
  res.render("seller/sellerdashboard");
});

app.get("/products",(req,res)=>{
  console.log("In products ");
     if(req.isAuthenticated()){
        res.render("products");
    }else{
         res.redirect("/login");
    }
});

app.post("/signup",(req,res,next)=>{
    //passport-local-mongoose 

    User.register( {
      username : req.body.username,
      firstName : req.body.firstName,
      lastName : req.body.lastName,
      email : req.body.emailId,
      contact : req.body.contact,
      address : req.body.address
    },req.body.password,
      (err, result)=>{
          if(err){
              console.log("Error in registering user! "+err);
              res.redirect("/signup");
          }else{
            passport.authenticate("local")(req, res, ()=>{
              res.redirect("/products");
          })
          }
      });
});

app.post("/login",(req,res)=>{
  const user = new User({
      username : req.body.username,
      password : req.body.password
  });
  // console.log(user);

  req.login(user, function(err){
      if(err){
          console.log("Error in logging the user "+err);
      }else{
        // console.log("In else");
        passport.authenticate("local")(req,res ,()=>{
          res.redirect("/products");
      });
      }
  });
});



app.listen("3000" ,(req,res)=>{
    console.log("Server Started at port 3000");
});