const express = require('express')
const user_route = express() 

const config = require('../config/config')

const homeController = require("../controllers/userController/homeController")
const forgotController = require("../controllers/userController/forgotController")
const loginController = require("../controllers/userController/loginController")
const prodController = require("../controllers/userController/prodController")
const registerController = require("../controllers/userController/registerController")

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
user_route.get('/',homeController.getHome)
user_route.get('/login',auth.isLogout,loginController.getLogin)
user_route.post('/login',loginController.postLogin)
user_route.get('/register',auth.isLogout,registerController.getRegister)
user_route.post('/register',registerController.postRegister)


//OTP verification

user_route.get('/otppage',registerController.getOtpPage)
user_route.post('/otppage',registerController.verifyOtp)
user_route.get('/resend-otp',registerController.resendOtp)

//forgot password
user_route.get('/forgotpassword', forgotController.loadforgotpassword)
user_route.post('/forgotpassword', forgotController.verifymail)
user_route.get('/forgotpassword/otp',forgotController.loadforgototp)
user_route.post('/forgotpassword/otp',forgotController.verifyforgototp)
user_route.get('/restpassword', forgotController.loadresetpassword)
user_route.post('/restpassword', forgotController.resetpassword)

//logout
user_route.get('/user-logout',homeController.userLogout)


//get product page
user_route.get('/product/:id',prodController.getProductPage)
user_route.get('/shop', prodController.getShopPage)








module.exports = user_route