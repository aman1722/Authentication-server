const express = require("express");
const cors = require("cors");
const { connection, client } = require("./config/db");
const { userrouter } = require("./routes/user.routes");
const { usermodel } = require("./model/user.model");
require("dotenv").config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const passport = require("passport");
const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser')

const app = express();


app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/user", userrouter);




app.get("/", (req, res) => {
    res.send("Welcome to Real Talk Authentication server!")
})


// GitHub Oauth ----------------->
app.get("/githubOauth", (req, res) => {
    res.sendFile(__dirname + "/index.html")
})


app.get("/auth/github", async(req, res) => {
    const { code } = req.query
    // console.log(code);
    const accessToken = await fetch("https://github.com/login/oauth/access_token",{
        method:"POST",
        headers:{
            Accept:"application/json",
            "content-type":"application/json"
        },
        body:JSON.stringify({
            client_id:process.env.GITHUB_CLIENT_ID,
            client_secret:process.env.GITHUB_CLIENT_SECRET,
            code
        })
    }).then((res)=>res.json())
    // console.log(accessToken)

    const user = await fetch("https://api.github.com/user",{
        headers:{
            Authorization:`Bearer ${accessToken.access_token}`
        }
    }).then((res)=>res.json());


    console.log(user);

    const userdata = new usermodel({
        name:user.name,
        email:`${user.login}@gmail.com`,
        password:uuidv4(),
        accessToken:accessToken.access_token,
    });
    await userdata.save();

    const cookieOptions = {
        domain: '.railway.app',
        path: '/',
        httpOnly: true,
        secure: true,
        maxAge: 3600 // Expires in 1 hour
      };
    // res.send(user);
    // res.sendFile(__dirname+"/public/index.html")
    // res.send(user);
    res.cookie(`userInfo`,userdata,cookieOptions);
    // res.send(user)
    res.redirect('https://gilded-taffy-ad9e7e.netlify.app/');
})





// Google Auth ------------------->
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile','email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login',session:false }),
  function(req, res) {
    // console.log(req.user)
    const data = JSON.stringify(req.user);
    console.log(data)
    // Successful authentication, redirect home.
    const cookieOptions = {
        domain: '.railway.app',
        path: '/',
        httpOnly: true,
        secure: true,
        maxAge: 3600 // Expires in 1 hour
      };
    res.cookie(`userInfo`,data,cookieOptions);
    // res.send(req.user)
    res.redirect('https://gilded-taffy-ad9e7e.netlify.app/');
    // res.sendFile(__dirname+"/redirct.html");
  });



var GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://authentication-server-production.up.railway.app/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, cb) {
    let email = profile._json.email;
    let name = profile._json.name;
    const user = new usermodel({
        name,
        email,
        password: uuidv4(),
        accessToken
    })
    await user.save();
      return cb(null, user);
    
    
  }
));





app.listen(process.env.PORT, async () => {
    try {
        await connection;
        console.log("Database is connected ");
        await client.connect();
        console.log("Redis connected");
    } catch (err) {
        console.log(err)
    }
    console.log(`server is running on port ${process.env.PORT}!`);
})