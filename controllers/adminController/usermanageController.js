
const productsModel = require('../../models/productModel')
const category = require('../../models/categoryModel')
const bcrypt = require('bcrypt')
const users = require('../../models/userModel')


const getUserManagement = async(req,res)=>{
    try{
       const userDatas = await users.find({$and:[{is_verified:1},{is_admin:0}]})
       res.render('users',{message:userDatas})
    }catch(error){
        console.log(error.message)
    }
}

const blockUser = async(req,res)=>{
    try{
        const id=req.query.id
        await users.updateOne({_id:id},{$set:{is_block:1}})
        res.redirect('/admin/users')

    }catch(error){
        console.log(error.message)
    }
}

const unblockUser = async(req,res)=>{
    try{
        const id=req.query.id
        await users.updateOne({_id:id},{$set:{is_block:0}})
        res.redirect('/admin/users')
    }catch(error){
        console.log(error.message)
    }
}


module.exports = { 
    getUserManagement,
    blockUser,
    unblockUser,
   }
