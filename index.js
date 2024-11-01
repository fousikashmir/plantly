const dotenv = require('dotenv')
dotenv.config()

const express = require("express")
const path = require('path')
const mongoose = require("mongoose")
const session = require('express-session');
const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute')

const config = require('./config/config')

const app = express()

app.set('view engine','ejs')
app.use(express.static('public/users'));
app.use(express.static('public/admin'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: config.sessionSecret, 
    saveUninitialized: false,
    resave: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24} 
}));





mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  user: process.env.MONGODB_USER,
  pass: process.env.MONGODB_PASS,
  authSource: 'admin'
}).then(() => {
  console.log('Connected to MongoDB!');
}).catch((error) => {
  console.error('Connection error:', error);
});




app.use('/',userRoute)
app.use('/admin', adminRoute)



app.use((req,res,next)=>{
    res.status(404).render('404')
})

app.use((err, req, res, next) => {
    console.error(err.stack); 
    res.status(err.status || 500).render('error', { message: err.message }); 
});

const port = process.env.PORT ||3000
app.listen(port, '0.0.0.0', () => {
    console.log("Server is running");
});

