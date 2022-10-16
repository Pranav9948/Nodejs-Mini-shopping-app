
var db=require('../config/connection')
var collection=require('../config/collections');
var bcrypt=require('bcrypt');
const { doSignup } = require('./userHelpers');
const { promise, reject } = require('bcrypt/promises');
const async = require('hbs/lib/async');
const { getMaxListeners } = require('../app');


module.exports={

    

adminSignup:(signDetails)=>{

   return new Promise(async(resolve,reject)=>{

    console.log(signDetails)

    signDetails.password= await bcrypt.hash(signDetails.password, 10);


    db.get().collection(collection.ADMIN_COLLECTION).insertOne(signDetails).then((response)=>{


        resolve(response.insertedId)
    })
   })
},

adminLogin:(loginDetails)=>{

    return new Promise(async(resolve,reject)=>{
    
    let loginStatus=false;
    let response={}
    
    let admin= await db.get().collection(collection.ADMIN_COLLECTION).findOne({email:loginDetails.email})

 if(admin){
    
    bcrypt.compare(loginDetails.password,admin.password).then((status)=>{


    
    if (status){
    
    console.log("login successs");
    response.admin=admin;
    response.status=true;
    resolve(response);
    
    
    }
    
    else{
    
        console.log("login failed");
        response.status=false;
        resolve({status:false})
    }
    
    })
    
    
    }
    else{
        console.log("login-failed")
        resolve({status:false})
    }
    
    })
    
    
}
}










