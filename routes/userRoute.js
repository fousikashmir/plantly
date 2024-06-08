const express = require('express')
const user_route = express() 

const config = require('../config/config')

const userController = require("../controllers/userController")
const forgotController = require("../controllers/forgotController")

const session = require('express-session')
const auth = require('../middleware/auth')




user_route.set('view engine','ejs')
user_route.set('views','./views/users')
const bodyParser = require('body-parser')
user_route.use(bodyParser.json())
user_route.use(express.json())
user_route.use(express.urlencoded({extended:true}))


user_route.use(session({
    secret:config.sessionSecret,
    saveUninitialized:true,
    resave:false,
    cookie:{maxAge : 600000},
}))





//USER CONTROLLER
user_route.get('/',userController.getHome)
user_route.get('/login',auth.isLogout,userController.getLogin)
user_route.post('/login',userController.postLogin)
user_route.get('/register',auth.isLogout,userController.getRegister)
user_route.post('/register',userController.postRegister)


//OTP verification

user_route.get('/otppage',userController.getOtpPage)
user_route.post('/otppage',userController.verifyOtp)
user_route.get('/resend-otp',userController.resendOtp)

//forgot password
user_route.get('/forgotpassword', forgotController.loadforgotpassword)
user_route.post('/forgotpassword', forgotController.verifymail)
user_route.get('/forgotpassword/otp', forgotController.loadforgototp)
user_route.post('/forgotpassword/otp', forgotController.verifyforgototp)
user_route.get('/restpassword', forgotController.loadresetpassword)
user_route.post('/restpassword', forgotController.resetpassword)

//logout
user_route.get('/user-logout',userController.userLogout)


//get product page
user_route.get('/product',userController.getProductPage)
user_route.get('/shop', userController.getShopPage)








module.exports = user_route