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

mongoose.connect(process.env.MONGODB_URL)
console.log('MongoDB URL:', process.env.MONGODB_URL);


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
app.listen(port,function(){
    console.log("Server is running")
})