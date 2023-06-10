const express = require('express');
const cors = require('cors');
require('./db/config');
const User = require('./db/User');
const Product = require('./db/Product')
const app = express();

const Jwt = require('jsonwebtoken');
const jwtkey = 'e-comm';

// Middleware
app.use(express.json());
app.use(cors());

//Signup

app.post('/signup', async (req, res) => {
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password;
    Jwt.sign({result}, jwtkey, { expiresIn: '2h' }, (err, token)=>{ 
        if(err){
            res.send({result: "Something went wrong try after sometime"})
        }else {
       res.send({result, auth: token});
        }   
    });
})

//Login


app.post('/login', async (req, res) => {
    // console.log(req.body)
    if (req.body.password && req.body.email) {
        
        let user = await User.findOne(req.body).select("-password")
        if (user) {

            Jwt.sign({user}, jwtkey, { expiresIn: '2h' }, (err, token)=>{ 
                if(err){
                    res.send({result: "Something went wrong try after sometime"})
                }else {
               res.send({user, auth: token});
                }   
            });

        } else {
            res.send({ request: 'No User Found' })
        }
    }else {
        res.send({ request: 'No User Found' }) 
    }

})

//Add Product

app.post('/add-product', verifyToken, async (req,res)=>{
    let product = new Product(req.body);
    let result = await product.save();
    res.send(result);
});

//Get Product List

app.get('/products', verifyToken, async (req,res)=>{
    let products = await Product.find();
    if(products.length>0){
        res.send(products)
    }else{
        res.send({result: "No Products found"})
    }
});

// Delete Product

app.delete('/product/:id', verifyToken, async (req,res)=>{
    const result = await Product.deleteOne({_id:req.params.id})
    res.send(result);
});

//Get Product for Update

app.get("/product/:id", verifyToken, async (req,res)=>{
    let result = await Product.findOne({_id:req.params.id});
    if(result){
        res.send(result)
    }else{
        res.send({result: "No Record Found"})
    }
});

//Update Product

app.put('/product/:id', verifyToken, async (req,res)=>{
    let result = await Product.updateOne(
        {_id:req.params.id},
        {
            $set : req.body
        }
    )
    res.send(result);
});

//Search Api

app.get('/search/:key', verifyToken, async (req,res)=>{
    let result = await Product.find({
        "$or":[
            { name: { $regex:req.params.key } },
            { company: { $regex:req.params.key } },
            { category: { $regex:req.params.key } }
        ]
    });
    res.send(result);
})

//Middleware

function verifyToken(req ,res , next){
    let token = req.headers['authorization'];
    if(token){
        token = token.split(' ')[1];
        Jwt.verify(token, jwtkey, (err, valid) => {
           if(err){
            res.status(401).send({result : "Please provide valid token with header"})
           }else{
            next();
           } 
        })
    }else{
        res.status(403).send({result : "Please add token with header"})
    }
}


app.listen(5000);