var db=require('../config/connection')
var collection=require('../config/collections')
const { promise, reject } = require('bcrypt/promises')
var objectId = require('mongodb').ObjectId


module.exports={


addProduct:(products,callback)=>{

db.get().collection('product').insertOne(products).then((data)=>{

callback( data.insertedId)

})

},

getAllProducts : ()=>{

return new Promise(async(resolve,reject)=>{

let productz= await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()

resolve(productz)

})



},

deleteProduct : (proId)=>{

console.log(proId)
return new Promise((resolve,reject)=>{

db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(proId)}).then((response)=>{

    resolve(response)
})


})
  

},


editProduct:(proId)=>{
return new Promise((resolve,reject)=>{
db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((response)=>{

    resolve(response)
})

})

},


updateProduct:(proDetails,proId)=>{

return new Promise((resolve,reject)=>{

db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{

      $set:{
              
        sl:proDetails.sl,
        model:proDetails.model,
        Highlights:proDetails.Highlights,
        Feautures:proDetails.Feautures,
        op:proDetails.op,
        p:proDetails.p,
        dis:proDetails.dis
      }

}).then((response)=>{
    resolve()
})
})
}

}