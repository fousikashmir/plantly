const users = require("../../models/userModel")

const product = require('../../models/productModel')
const category = require('../../models/categoryModel')
const wishlist = require('../../models/wishlistModel')

const shortid = require('shortid');
const bcrypt = require('bcrypt')

const session = require('express-session')



const getHome = async function(req,res){
    const session=req.session.user_id
    const userData = await users.findOne({_id:session})
    const productData = await product.find({is_blocked:false}).limit(8)
    
    try{
        if(session){
            res.render('users/home',{userData,session,productData})
        }else{
            res.render('users/home',{userData,session,productData})
        }
    }catch(error){
        console.log(error.message)

    }

  }

  const userLogout = async(req,res)=>{
    try{
        req.session.destroy()
        res.redirect('/')

    }catch(error){
        console.log(error.message)
    }
}


  module.exports = {
    getHome,
    userLogout
  }
