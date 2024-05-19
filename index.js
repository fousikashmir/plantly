const mongoose = require("mongoose")
mongoose.connect("mongodb://127.0.0.1:27017/plantly")

const express = require("express")
const app = express()
app.set('view-engine','ejs')
app.use(express.static('public/users'));
const userRoute = require('./routes/userRoute')

app.use('/',userRoute)

app.listen(3000,function(){
    console.log("Server is running")
})