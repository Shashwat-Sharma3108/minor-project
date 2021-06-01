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
const cloudinary = require("cloudinary").v2;

const app = express();

app.use(express.json());
app.use(express.static("public"));

const storage = multer.diskStorage({});

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

cloudinary.config({ 
  cloud_name: process.env.CLOUDNAME, 
  api_key: process.env.APIKEY, 
  api_secret: process.env.APISECRET 
});

mongoose.connect("mongodb+srv://admin_Shashwat:"+process.env.PASSWORD+"@cluster1.yglo4.mongodb.net/NurseryNation?retryWrites=true&w=majority",{
    useNewUrlParser : true,
    useUnifiedTopology : true,
    useCreateIndex : true,
    useFindAndModify : false
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
    category : String,
    details : String,
    sellername : String
});

const feedbackSchema = new mongoose.Schema({
  username : String,
  firstName : String,
  lastName : String,
  feedback : String
})

const User = new mongoose.model("User", userSchema);
const Seller = new mongoose.model("Seller", sellerSchema);
const Products = new mongoose.model("Product",productSchema);
const Feedback = new mongoose.model("Feedback",feedbackSchema);

const auth = async function(req,res,next){
  const token = req.cookies.authToken;
  if(!token){
    console.log("Token not present please login!");
    res.redirect("/login");
    return;
  }
  try {
    const verified = jwt.verify(token, process.env.SECRET);
    req.user = verified;
    User.findOne({username : req.user.username},(err,result)=>{
      if(err){
        console.log(err);
      }else{
        if(!result){
          errors.push({msg : "Username not found!"});
          res.redirect("/login");
        }else{
          next();
        }
      }
    });
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
    Seller.findOne({username : req.user.username},(err,result)=>{
      if(err){
        console.log(err);
      }else{
        if(!result){
          errors.push({msg : "Username not found!"});
          res.redirect("/sellerlogin");
        }else{
          next();
        }
      }
    })
  } catch (error) {
    console.log("Invalid token "+error);
    res.redirect("/sellerlogin");
  }
}

let errors = [];

app.get("/logout",(req,res)=>{
    res.clearCookie("authToken");
    res.redirect("/");
});

app.get("/",(req,res)=>{
    Feedback.find((err,result)=>{
      if(err){
        console.log("Error in fetching feedbacks");
      }else{
        if(!result){
          res.render("index",{
            feedback : "Be the first to submit a feedback" 
          });
        }else{
          // console.log(result);
          res.render("index",{
            feedback : result
          });
        }
      }
    });
    
});

app.get("/login",(req,res)=>{
    res.render("login",{
      error: errors
    });
    errors= [];
});

app.get("/signup",(req,res)=>{
    res.render("signup",{
      error : errors
    });
    errors = [];
});

app.get("/sellersignup",(req,res)=>{
  res.render("seller/sellersignup",{
    error : errors
  });
  errors = [];
});

app.get("/sellerlogin",(req,res)=>{
  res.render("seller/sellerlogin",{
    error : errors
  });
  errors = [];
});

app.get("/userdetails",auth,(req,res)=>{
  const username = req.user.username;

  User.findOne({username : username},(err,result)=>{
    if(!result){
      errors.push({msg : "Login as Customer!"});
      res.redirect("/login");
    }else{
      res.render("userdetails",{
        username : result.username,
        firstName : result.firstName,
        lastName : result.lastName,
        emailId : result.email,
        contact : result.contact,
        address : result.address,
        error : errors
      });
      errors = [];
    }
});
});

app.get("/sellerdetails",auth2,(req,res)=>{
  const username = req.user.username;

  Seller.findOne({username : username},(err,result)=>{
    if(!result){
      errors.push({msg : "Login as seller!"});
      res.redirect("/sellerlogin");
    }else{
    res.render("seller/sellerdetails",{
      username : result.username,
      firstName : result.firstName,
      lastName : result.lastName,
      emailId : result.email,
      contact : result.contact,
      address : result.address,
      error : errors
    });
    errors = [];
    }
  });
});

app.get("/sellerdashboard",(req,res)=>{
  res.render("seller/sellerdashboard");
});

app.get("/checkout",auth,(req,res)=>{
  const username = req.user.username;
  let name, emailId, contact;

  User.findOne({username : username},(err,result)=>{
    if(err){
      console.log("Error in finding the user "+err);
    }else{
      if(!result){
        errors.push({msg : "Login as a user!"});
        res.redirect("/login");
        return;
      }else{
        name = result.firstName + " " + result.lastName;
        emailId = result.email;
        contact = result.contact;
     
     res.render("checkouts",{
       name:name,
       email:emailId,
       contact :contact
     }); 
      }
    }
  }); 
});
  
app.get("/products",auth,async (req,res)=>{
      
      Products.find({category : "Indoor Plant"},(err,indoor)=>{
        if(err){
          console.log("Error in finding indoor plants "+err);
        }else{
          Products.find({category : "Outdoor Plant"},(err2,outdoor)=>{
            if(err2){
              console.log("Error in finding outdoor plants "+err2);
            }else{
              Products.find({category : "Pot"},(err3,pot)=>{
                if(err3){
                  console.log("Error in finding pots "+err3);
                }else{
                  Products.find({category : "Fertilizer"},(err4,fertilizer)=>{
                    if(err4){
                      console.log("Error in finding fetlizers "+err4);
                    }else{
                     Products.find({category : {$nin : ["Indoor Plant","Outdoor Plant","Pot","Fertilizer"]}},(err,result)=>{
                      res.render("products",{
                        indoor : indoor,
                        outdoor : outdoor,
                        pots : pot,
                        fertilizer : fertilizer,
                        others : result
                      });
                     })
                    }
                  })
                }
              })
            }
          })
        }
      })
});

app.get("/feedbacks",auth,(req,res)=>{
  User.findOne({username : req.user.username},(err,result)=>{
    if(err){
      console.log("Error in finding the user "+err);
    }else{
      if(!result){
        errors.push({msg : "Username not found!"});
        res.redirect("/login");
      }else{
        res.render("feedback",{
          error : errors,
          username : result.username,
          firstName : result.firstName,
          lastName : result.lastName
        });
      }
    }
  })
})

app.get("/sellers",auth2,(req,res)=>{
  res.render("seller/seller",{
    error:errors,
    username : req.user.username
  });
  errors=[];
});

app.post("/signup",(req,res)=>{
    
  if(req.body.username === "" || req.body.password==="" ||
    req.body.firstName === "" || req.body.lastName === "" ||
    req.body.emailId === "" || req.body.contact === "" ||
    req.body.address === ""
  ){
    errors.push({msg : "Erros! Please fill all fields!"});
    console.log("All field are necessary");
    res.redirect("/signup");
    return;
  }

  User.findOne({email: req.body.emailId},(err,result)=>{
      if(err){
        console.log("error in finding email : "+err);
      }else{
        if(result){
          errors.push({msg: "Error! Email Already in use"})
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
                errors.push({msg : "Error! Username already in use!"})
                console.log("Username already exists ");
                res.redirect("/signup");
              }else{
                if(req.body.password.length < 6){
                  errors.push({msg : "Error! Password must be of atleast 6 characters!"});
                  console.log("Password too small");
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
                      errors.push({msg : "Registered Successfully! Please login"});
                      console.log("Success! Registered successfully!");
                      res.redirect("/login");
                    }
                  })
              });
              }
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

  if(!username || !password){
    errors.push({msg : "Error! Please fill all fields!"});
    console.log("Empty fields!");
    res.redirect("/login");
    return;
  }else{
    User.findOne({username : username},(err, foundUser)=>{
      if(err){
        console.log("Error in logging user "+err);
      }else{
        if(!foundUser){
          errors.push({msg : "Error! Username not found!"})
          console.log("Username not found");
          res.redirect("/login");
        }
        else if(foundUser){
          bcrypt.compare(password, foundUser.password, (err,result)=>{
            if(err){
              console.log("Error in checking password "+err);
            }else{
              if(result === false){
                errors.push({msg : "Error! Incorrect Password"})
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
  }
});

app.post("/sellersignup",(req,res)=>{

  if(req.body.username === "" || req.body.password==="" ||
    req.body.firstName === "" || req.body.lastName === "" ||
    req.body.emailId === "" || req.body.contact === "" ||
    req.body.address === ""
  ){
    errors.push({msg:"Error! All fields are necessary"})
    console.log("All field are necessary");
    res.redirect("/sellersignup");
    return;
  }

  Seller.findOne({email: req.body.emailId},(err,result)=>{
      if(err){
        console.log("error in finding email : "+err);
      }else{
        if(result){
          errors.push({msg: "Email Already in use"})
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
                errors.push({msg : "Error! Username already exists "})
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
                      errors.push({msg:"Registered Successfully! Please Login"})
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

  if(!username || !password){
    errors.push({msg : "Error! All fields are necessary"});
    console.log("Empty Fields");
    res.redirect("/sellerlogin");
    return;
  }else{
    Seller.findOne({username : username},(err, foundUser)=>{
      if(err){
        console.log("Error in logging user "+err);
      }else{
        if(!foundUser){
          errors.push({msg: "Error! Username not found"})
          console.log("Username not found");
          res.redirect("/sellerlogin");
        }
        else if(foundUser){
          bcrypt.compare(password, foundUser.password, (err,result)=>{
            if(err){
              console.log("Error in checking password "+err);
            }else{
              if(result === false){
                errors.push({msg : "Error! Incorrect Password"});
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
  }
});

app.post("/sellers",upload.single('image'),async(req,res)=>{

  
  if(req.file === "" || req.body.productName === "" || 
  req.body.productPrice === "" || req.body.category === "" || req.body.details === ""){
    errors.push({msg : "Error! Please fill all the fields!"});
    console.log("All fields are necessary!");
    res.redirect("/sellers");
    return;
  }

  const fileinfo = await cloudinary.uploader.upload(req.file.path);
  const productName = req.body.productName;
  const productPrize = req.body.productPrice;
  const category = req.body.category;
  const detail = req.body.details;
  const sellername = req.body.username;

  console.log(detail);
  const product = new Products({
    productName : productName,
    price : productPrize,
    productImage : fileinfo.url,
    category : category,
    details : detail,
    sellername : sellername
  });

  product.save((err)=>{
    if(err){
      console.log("Error in uploading products data "+err);
    }else{
      console.log("Saved Successfully!");
      res.redirect("/products");
    }
  })
});

app.post("/userdetails",auth,(req,res)=>{
  
    const username = req.user.username;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const emailId = req.body.email;
    const contact = req.body.contact;
    const address = req.body.address;

    if( !firstName || !lastName ||
        !emailId || !contact || !address
      ){
        errors.push({msg : "All field are required!"});
        res.redirect("/userdetails");
    }else{
      User.findOne({username : username , email :emailId},(err,result)=>{
        if(err){
          errors.push({msg : "Username or email not found"});
          console.log("Error in finding user with the given username and emailId "+err);
          res.redirect("/userdetails");
        }else{
          if(contact.length<10 || contact.length>10){
            errors.push({msg : "Enter a valid phone number!"});
            console.log("Invalid contact number!");
            res.redirect("/userdetails");
          }else{
            User.findOneAndUpdate(
              {username : username},
              {firstName : firstName,
               lastName : lastName,
               emailId : emailId,
               contact : contact,
               address : address
              },(err,result)=>{
                if(err){
                  console.log("Error in updating details");
                  errors.push({msg : "Error in updating details"});
                  res.redirect("/userdetails");
                }else{
                  errors.push({msg : "Updated Successfully!"});
                  res.redirect("/userdetails");
                }
              })
          }
        }
      })
    }
});

app.post("/sellerdetails",auth2,(req,res)=>{
  
  const username = req.user.username;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const emailId = req.body.email;
  const contact = req.body.contact;
  const address = req.body.address;

  if( !firstName || !lastName ||
      !emailId || !contact || !address
    ){
      errors.push({msg : "All field are required!"});
      res.redirect("/sellerdetails");
  }else{
    User.findOne({username : username , email :emailId},(err,result)=>{
      if(err){
        errors.push({msg : "Username or email not found"});
        console.log("Error in finding user with the given username and emailId "+err);
        res.redirect("/sellerdetails");
      }else{
        if(contact.length<10 || contact.length>10){
          errors.push({msg : "Enter a valid phone number!"});
          console.log("Invalid contact number!");
          res.redirect("/sellerdetails");
        }else{
          User.findOneAndUpdate(
            {username : username},
            {firstName : firstName,
             lastName : lastName,
             emailId : emailId,
             contact : contact,
             address : address
            },(err,result)=>{
              if(err){
                console.log("Error in updating details");
                errors.push({msg : "Error in updating details"});
                res.redirect("/sellerdetails");
              }else{
                errors.push({msg : "Updated Successfully!"});
                res.redirect("/sellerdetails");
              }
            })
        }
      }
    })
  }
});

app.post("/feedbacks",(req,res)=>{
  console.log(req.body.username , req.body.firstName, req.body.lastName);
  if(req.body.details === ""){
    errors.push({msg : "Please provide a feedback!"});
    res.redirect("/feedbacks");
    return;
  }else{
    const feedback = new Feedback({
      username : req.body.username,
      firstName : req.body.firstName,
      lastName : req.body.lastName,
      feedback : req.body.details
    });

    feedback.save((err)=>{
      if(err){
        console.log("Error in submitting a feedback "+err);
        errors.push({msg : "Sorry! cannot submit your feedback"});
      }else{
        console.log("Feedback submitted!");
        res.redirect("/");
      }
    })
  }
})

app.listen("3000" ,(req,res)=>{
    console.log("Server Started at port 3000");
});