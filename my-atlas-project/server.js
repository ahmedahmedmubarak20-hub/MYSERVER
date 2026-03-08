const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const requestIp = require("request-ip");
const geoip = require("geoip-lite");
const UAParser = require("ua-parser-js");

const app = express();

/* MIDDLEWARE */

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* PORT */

const PORT = process.env.PORT || 3000;

/* DATABASE */

mongoose.connect(process.env.MONGO_URL)
.then(()=> console.log("MongoDB Atlas Connected ✅"))
.catch(err => console.log("Mongo Error ❌", err));

/* USER FORM MODEL */

const UserSchema = new mongoose.Schema({

name:String,
phone:String,
time:{
type:Date,
default:Date.now
}

});

const User = mongoose.model("User", UserSchema);

/* VISIT ANALYTICS MODEL */

const VisitSchema = new mongoose.Schema({

ip:String,
country:String,
city:String,

browser:String,
browserVersion:String,

device:String,
os:String,

language:String,
referer:String,

screen:String,
platform:String,

userAgent:String,

time:{
type:Date,
default:Date.now
}

});

const Visit = mongoose.model("Visit", VisitSchema);

/* FORM API */

app.post("/submit", async (req,res)=>{

try{

const {name,phone} = req.body;

const user = await User.create({name,phone});

res.json({
status:"success",
user
});

}catch(err){

res.status(500).json({error:"server error"});

}

});

/* GET USERS */

app.get("/users", async (req,res)=>{

const users = await User.find().sort({time:-1});

res.json(users);

});

/* VISITOR TRACKING */

app.post("/track", async (req,res)=>{

try{

const ip = requestIp.getClientIp(req);

const geo = geoip.lookup(ip);

const parser = new UAParser(req.headers["user-agent"]);

const ua = parser.getResult();

const visit = await Visit.create({

ip:ip,

country: geo ? geo.country : "unknown",
city: geo ? geo.city : "unknown",

browser: ua.browser.name,
browserVersion: ua.browser.version,

device: ua.device.type || "desktop",

os: ua.os.name,

language: req.headers["accept-language"],

referer: req.headers["referer"],

screen:req.body.screen,
platform:req.body.platform,

userAgent:req.headers["user-agent"]

});

res.json({status:"tracked"});

}catch(err){

res.status(500).json({error:"tracking error"});

}

});

/* VISITS DATA */

app.get("/visits", async (req,res)=>{

const visits = await Visit.find().sort({time:-1}).limit(100);

res.json(visits);

});

/* HOME */

app.get("/", (req,res)=>{

res.send("Server running 🚀");

});

/* START SERVER */

app.listen(PORT, ()=>{

console.log(`Server running on port ${PORT}`);

});
