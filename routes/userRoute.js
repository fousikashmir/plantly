const express = require('express')
const user_route = express() 
//const config = require('..config/config')

const userController = require("../controllers/userController")

const session = require('express-session')

user_route.set('view engine','ejs')
user_route.set('views','./views/users')


//user_route.use(express.json())
//user_route.use(express.urlencoded({extended:true}))

//USER CONTROLLER
user_route.get('/',userController.getLogin)

module.exports = user_route