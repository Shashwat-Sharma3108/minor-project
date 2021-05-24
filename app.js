require("dotenv").config();
const express = require("express");
const mongoose =require("mongoose");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const _ = require("lodash");
const session = require('express-session');
const jwt = require('jsonwebtoken');
const multer = require("multer");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.json());
app.use(express.static("public"));

const storage = multer.diskStorage({
  destination : function(req,file,cb){
    cb(null, 'public/images/')
  },
  filename : function(req,file,cb){
    cb(null, Date.now() + file.originalname)
  }
});

const upload = multer({storage : storage});

app.use(cookieParser());

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

var globalToken;


mongoose.connect("mongodb://localhost:27017/NurseryNation",{
    useNewUrlParser : true,
    useUnifiedTopology : true,
    useCreateIndex : true
});


const userSchema = new mongoose.Schema({
  username : {type : String, required : true, unique:true},
  firstName :{type : String, required : true},
  lastName :{type : String, required : true},
  email : {type : String, required : true, unique:true},
  contact :{type : String, required : true},
  address :{type : String, required : true},
  password : {type : String, required : true}
});

const sellerSchema = new mongoose.Schema({
  username : {type : String, required : true, unique:true},
  password : {type : String, required : true},
  firstName :{type : String, required : true},
  lastName :{type : String, required : true},
  email : {type : String, required : true, unique:true},
  contact :{type : String, required : true},
  address :{type : String, required : true},
});

const productSchema = new mongoose.Schema({
    productName : String,
    price : Number,
    productImage : String,
});

const User = new mongoose.model("User", userSchema);
const Seller = new mongoose.model("Seller", sellerSchema);
const Products = new mongoose.model("Product",productSchema);


const auth = async function(req,res,next){
  const token = req.cookies.authToken;
  if(!token){
    console.log("Token not present please login!");
    res.redirect("/login");
    return;
  }
  try {
    const verified = jwt.verify(token, process.env.SECRET);
    console.log(verified);
    req.user = verified;
    next();
  } catch (error) {
    console.log("Invalid token "+error);
    res.redirect("/login");
  }
}

const auth2 = async function(req,res,next){
  const token = req.cookies.authToken;
  if(!token){
    console.log("Token not present please login!");
    res.redirect("/sellerlogin");
    return;
  }
  try {
    const verified = jwt.verify(token, process.env.SECRET);
    req.user = verified;
    next();
  } catch (error) {
    console.log("Invalid token "+error);
    res.redirect("/sellerlogin");
  }
}
app.get("/logout",(req,res)=>{
    res.clearCookie("authToken");
    res.redirect("/");
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

app.get("/products",auth,async (req,res)=>{
       Products.find((err,result)=>{
         if(err){
           console.log("Error in retriving data from products "+err);
         }else{
          res.render("products",{
            products : result
          });
         }
       });
});

app.post("/signup",(req,res)=>{
    
  if(req.body.username === "" || req.body.password==="" ||
    req.body.firstName === "" || req.body.lastName === "" ||
    req.body.emailId === "" || req.body.contact === "" ||
    req.body.address === ""
  ){
    console.log("All field are necessary");
    res.redirect("/signup");
    return;
  }

  User.findOne({email: req.body.emailId},(err,result)=>{
      if(err){
        console.log("error in finding email : "+err);
      }else{
        if(result){
          console.log("Email Already in use");
          res.redirect("/signup");
          return;
        }
        else{
          User.findOne({username : req.body.username},(err,result)=>{
            if(err){
              console.log("Error in finding user "+err);
            }else{
              if(result){
                console.log("Username already exists ");
                res.redirect("/signup");
              }else{
                console.log("Registering new user!");
                bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
                  const user = new User({
                    username : req.body.username,
                      firstName : req.body.firstName,
                      lastName : req.body.lastName,
                      email : req.body.emailId,
                      contact : req.body.contact,
                      address : req.body.address,
                      password: hash,
                  });
                  
                  user.save((err)=>{
                    if(err){
                      console.log("Error in registering user "+err);
                    }else{
                      res.redirect("/login");
                    }
                  })
              });
              }
            }
          });
        }
      }
    });
});

app.post("/login",(req,res)=>{
  
  const username = req.body.username;
  const password = req.body.password;

   User.findOne({username : username},(err, foundUser)=>{
    if(err){
      console.log("Error in logging user "+err);
    }else{
      if(!foundUser){
        console.log("Username not found");
        res.redirect("/login");
      }
      else if(foundUser){
        bcrypt.compare(password, foundUser.password, (err,result)=>{
          if(err){
            console.log("Error in checking password "+err);
          }else{
            if(result === false){
              console.log("Incorrect Password!");
              res.redirect("/login");
            }
            if(result === true){
              //create and assign token
              const token = jwt.sign({username : foundUser.username},process.env.SECRET);
              res.cookie("authToken",token,{maxAge: 900000});
              res.redirect("/products");
            }
          }
        });
      }
    }
  });
});


app.get("/sellers",auth2,(req,res)=>{
  res.render("seller/seller");
});


app.post("/sellersignup",(req,res)=>{
  //passport-local-mongoose 

  if(req.body.username === "" || req.body.password==="" ||
    req.body.firstName === "" || req.body.lastName === "" ||
    req.body.emailId === "" || req.body.contact === "" ||
    req.body.address === ""
  ){
    console.log("All field are necessary");
    res.redirect("/sellersignup");
    return;
  }

  Seller.findOne({email: req.body.emailId},(err,result)=>{
      if(err){
        console.log("error in finding email : "+err);
      }else{
        if(result){
          console.log("Email Already in use");
          res.redirect("/sellersignup");
          return;
        }
        else{
          Seller.findOne({username : req.body.username},(err,result)=>{
            if(err){
              console.log("Error in finding user "+err);
            }else{
              if(result){
                console.log("Username already exists ");
                res.redirect("/sellersignup");
              }else{
                console.log("Registering new user!");
                bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
                  const seller = new Seller({
                    username : req.body.username,
                      firstName : req.body.firstName,
                      lastName : req.body.lastName,
                      email : req.body.emailId,
                      contact : req.body.contact,
                      address : req.body.address,
                      password: hash,
                  });
                  
                  seller.save((err)=>{
                    if(err){
                      console.log("Error in registering user "+err);
                    }else{
                      res.redirect("/sellerlogin");
                    }
                  })
              });
              }
            }
          });
        }
      }
    });
});

app.post("/sellerlogin",(req,res)=>{
  
  const username = req.body.username;
  const password = req.body.password;

   Seller.findOne({username : username},(err, foundUser)=>{
    if(err){
      console.log("Error in logging user "+err);
    }else{
      if(!foundUser){
        console.log("Username not found");
        res.redirect("/sellerlogin");
      }
      else if(foundUser){
        bcrypt.compare(password, foundUser.password, (err,result)=>{
          if(err){
            console.log("Error in checking password "+err);
          }else{
            if(result === false){
              console.log("Incorrect Password!");
              res.redirect("/sellerlogin");
            }
            if(result === true){
              //create and assign token
              const token = jwt.sign({username : foundUser.username},process.env.SECRET);
              res.cookie("authToken",token,{maxAge: 900000});
              res.redirect("/sellers");
            }
          }
        });
      }
    }
  });
});

app.post("/sellers", upload.single('image'),(req,res)=>{
  const fileinfo = req.file.filename;
  const productName = req.body.productName;
  const productPrize = req.body.productPrice;

  const product = new Products({
    productName : productName,
    price : productPrize,
    productImage : fileinfo
  });

  console.log(product);

  product.save((err)=>{
    if(err){
      console.log("Error in uploading products data "+err);
    }else{
      res.redirect("/products");
    }
  })
});

app.listen("3000" ,(req,res)=>{
    console.log("Server Started at port 3000");
});