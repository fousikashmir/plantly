const dotenv = require('dotenv')
dotenv.config()



const express = require("express")
const app = express()

app.set('view engine','ejs')

app.use(express.static('public/users'));
app.use(express.static('public/admin'));


//app.use(express.static(path.join(__dirname, 'public')));

const userRoute = require('./routes/userRoute')
app.use('/',userRoute)
const adminRoute = require('./routes/adminRoute')
app.use('/admin', adminRoute)
const mongoose = require("mongoose")
//mongoose.connect(process.env.MONGODB_URL)
mongoose.connect("mongodb://127.0.0.1:27017/plantly")




app.listen(3000,function(){
    console.log("Server is running")
})