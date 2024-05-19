const users = require("../models/userModel")

const getLogin = async(req,res)=>{
    try{
        res.render('login')
    }catch(error){
        console.log(error.message)
    }
}

const getRegister = async(req,res)=>{
    try{
        res.render("register")
    }catch(error){
        console.log(error.message)
    }
}

module.exports = {getLogin,
                 getRegister

}