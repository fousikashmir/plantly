const users = require('../models/userModel')
const productsModel = require('../models/productModel')
const bcrypt = require('bcrypt')

const getAdminPanel = async(req,res)=>{
    try{
        res.render('admin-panel')
    }catch(error){
        console.log(error.message)
    }
}


const getLogin = async(req,res)=>{
    try{
        res.render('login')
    }catch(error){
        console.log(error.message)
    }
}

//post login

const postLogin = async(req,res)=>{
   try{
    const emailEntered = req.body.email
    const passwordEntered = req.body.password
    const adminDB = await users.findOne({email:emailEntered})

    if(adminDB){
        const matchPassword = await bcrypt.compare(passwordEntered,adminDB.password)
        if(matchPassword){
            if(adminDB.is_admin === 0){
                res.render('login',{message:'YOU ARE NOT ADMIN'})
            }
            else{
                req.session.admin_id = adminDB.admin_id
                res.redirect('/admin')
            }
        }
        else{
            res.render('login',{message:'Entered password is wrong'})
        }
   }else{
   res.render('login',{message:'Entered email-id is wrong'})
   }
}catch(error){
    console.log(error.message)
}
}

const getLogout = async(req,res)=>{
    try{
        req.session.destroy()
        res.redirect('/admin/login')
    }catch(error){
        console.log(error.message)

    }
}
module.exports = {
    getLogin,
    postLogin,
    getAdminPanel,
    getLogout


}
