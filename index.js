const dotenv = require('dotenv')
dotenv.config()



const express = require("express")
const app = express()

app.set('view engine','ejs')
app.use(express.static('public/users'));
app.use(express.static('public/admin'));

const path = require('path')

app.use(express.static(path.join(__dirname, 'public')));




const userRoute = require('./routes/userRoute')
app.use('/',userRoute)
const adminRoute = require('./routes/adminRoute')
app.use('/admin', adminRoute)
const mongoose = require("mongoose")

mongoose.connect(process.env.MONGODB_URL)
console.log('MongoDB URL:', process.env.MONGODB_URL);

app.use((req,res,next)=>{
    res.status(404).render('404')
})

const port = process.env.PORT ||3000



app.listen(port,function(){
    console.log("Server is running")
})