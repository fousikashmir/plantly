const express = require('express')
const user_route = express() 
const session = require('express-session');


const homeController = require("../controllers/userController/homeController")
const forgotController = require("../controllers/userController/forgotController")
const loginController = require("../controllers/userController/loginController")
const prodController = require("../controllers/userController/prodController")
const registerController = require("../controllers/userController/registerController")
const cartController = require("../controllers/userController/cartController")
const profileController = require("../controllers/userController/profileController")
const orderController = require("../controllers/userController/orderController")
const checkoutController = require("../controllers/userController/checkoutController")
const wishListController = require("../controllers/userController/wishListController")
const walletController = require("../controllers/userController/walletController")
const couponUserController = require("../controllers/userController/couponUserController")

const auth = require('../middlewares/auth')

user_route.set('views','./views/users')

user_route.use(express.json())
user_route.use(express.urlencoded({extended:true}))








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
user_route.get('/user-logout',auth.isLogin,homeController.userLogout)


//get product page
user_route.get('/product',prodController.getProductPage)

//cart
user_route.get('/cart',cartController.getCart) 
user_route.post('/addToCart',cartController.addToCart)

user_route.patch('/cartqntyincrease',auth.isLogin,cartController.cartQuantityIncrease,cartController.totalProductPrice)
user_route.delete('/removeproduct',auth.isLogin,cartController.postRemoveProduct)

//profile
user_route.get('/profile',profileController.getProfile)
user_route.get('/edit',profileController.editProfile)
user_route.post('/edit',profileController.updateProfile)
user_route.get('/add-address',profileController.getAddAddress)
user_route.post('/add-address',profileController.postAddAddress)
user_route.post('/delete-address/:index',profileController.deleteAddress)
user_route.get('/edit-address/:index',profileController.getEditAddress)
user_route.post('/edit-address/:index',profileController.postEditAddress)
user_route.get('/changepassword',profileController.loadChangePassword)
user_route.post('/changepassword',profileController.changePassword)
user_route.get('/shop', profileController.getShopPage)

user_route.get('/checkout',auth.isLogin,checkoutController.getCheckout)




//order

user_route.post('/applyCoupon',couponUserController.applyCoupon)
user_route.post('/checkout',checkoutController.placeOrder)
user_route.get('/placeorder',checkoutController.orderPlaced)
user_route.post('/verifyPayment',orderController.verifyOnlinePayment)
user_route.get('/myorders',orderController.getMyOrders)
user_route.get('/singleorderview',orderController.getSingleOrderView)

user_route.post('/cancelOrder',orderController.cancelOrder)
user_route.post('/returnorder',orderController.returnOrder)
user_route.get('/downloadOrderInvoice',orderController.downloadInvoice)


//wishlist
user_route.get('/wishlist',auth.isLogin,wishListController.getWishList)
user_route.post('/addtowishlist',auth.isLogin,wishListController.addToWishList)
user_route.post('/wishtoCart',auth.isLogin,wishListController.addToCartFromWishlist)
user_route.delete('/removewishproduct',auth.isLogin,wishListController.removeProduct)


user_route.post('/removeCoupon',couponUserController.removeCoupon)
user_route.get('/wallet',walletController.loadWallet)



module.exports = user_route