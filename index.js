const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const request = require('request-promise');
var graphqlHTTP = require('express-graphql');
var { buildSchema } = require('graphql');
const { Client }=require('graphql-js-client');
var schema = buildSchema(`type Query {hello: String}`);
// const { Client }  = require('graphql-js-client');
const types= require('./types.js');

// const gclient = new Client(types, {
//   url: 'https://jayka-new.myshopify.com/api/graphql',
//   fetcherOptions: {
//     headers: { 
//       // Authorization: 'Basic aGV5LXRoZXJlLWZyZWluZCA=' 
// 'X-Shopify-Storefront-Access-Token': 'b1a3ae8e5c637e903c33c1d31b7b90c1'
//     }
//   }
// });
//  const query = gclient.query((root) => {
//   root.add('shop', (shop) => {
//     shop.add('name');
//     shop.addConnection('products', {args: {first: 10}}, (product) => {
//       product.add('title');
//     });
//   });
// });
// let objects;
// gclient.send(query);
// .then(({model, data}) => {
//   objects = model;
//   console.log(model); // The serialized model with rich features
//   console.log(data); // The raw data returned from the API endpoint
// });
 // console.log("over");

// const query = client.query((root) => {
//   root.add('shop', (shop) => {
//     shop.add('name');
//     shop.addConnection('products', {args: {first: 10}}, (product) => {
//       product.add('title');
//     });
//   });
// });

var root = {
  hello: () => {
    return 'Hello world!';
  },
};
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));
// const apiKey = process.env.SHOPIFY_API_KEY;

const apiKey = process.env.SHOPIFY_API_KEY || '1c9be099aa9c15a6e4cfb342e22e495c';
const apiSecret = process.env.SHOPIFY_API_SECRET|| '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';

 const globalShop='';
 const globalAccessToken='';

// const apiSecret = process.env.SHOPIFY_API_SECRET;
// read_content,write_content,read_themes,write_themes,read_checkouts,write_checkouts,write_price_rules,write_script_tags,read_script_tags,read_products,write_products
const scopes = 'read_content,write_content,read_themes,write_themes,read_checkouts,write_checkouts,write_price_rules,write_script_tags,read_script_tags,read_products,write_products';
const forwardingAddress = "https://obscure-forest-68133.herokuapp.com"; // Replace this with your HTTPS Forwarding address
app.get('/', (req, res) => {
  // console.log(GraphQLClient);
// console.log(req);  
  res.send('inside app');
// res.redirect(installUrl);
});
// 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
// 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
// https://e5575b26.ngrok.io/shopify?shop=jayka-new.myshopify.com
// https://jayka-new.myshopify.com/admin/oauth/authorize?client_id=f9593c4010eb0dd6bfc86e3828234140&scope=read_products&state=158616823714000&redirect_uri=https://e8a9f169.ngrok.io/shopify/callback
// https://https//jayka-new.myshopify.com/admin/oauth/authorize?client_id=f9593c4010eb0dd6bfc86e3828234140&scope=read_products&state=158616795608900&redirect_uri=https://e8a9f169.ngrok.io/shopify/callback
app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});

app.get('/shopify', (req, res) => {
  const shop = req.query.shop;
  if (shop) {
    const state = nonce();
    const redirectUri = forwardingAddress + '/shopify/callback';
    const installUrl = 'https://' + shop +
      '/admin/oauth/authorize?client_id=' + apiKey +
      '&scope=' + scopes +
      '&state=' + state +
      '&redirect_uri=' + redirectUri;
    // console.log(installUrl);
    res.cookie('state', state);
    res.redirect(installUrl);
  } else {
    return res.status(400).send('Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request');
  }
});

app.get('/shopify/callback', (req, res) => {
  // console.log("callback"+req);
  const { shop, hmac, code, state } = req.query;
  const stateCookie = cookie.parse(req.headers.cookie).state;

  if (state !== stateCookie) {
    return res.status(403).send('Request origin cannot be verified');
  }
  if (shop && hmac && code) {
    // DONE: Validate request is from Shopify
    const map = Object.assign({}, req.query);
    delete map['signature'];
    delete map['hmac'];
    const message = querystring.stringify(map);
    const providedHmac = Buffer.from(hmac, 'utf-8');
    const generatedHash = Buffer.from(
      crypto
        .createHmac('sha256', apiSecret)
        .update(message)
        .digest('hex'),
        'utf-8'
      );
    let hashEquals = false;
    try {
      hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac)
    } catch (e) {
      hashEquals = false;
    };

    if (!hashEquals) {
      return res.status(400).send('HMAC validation failed');
    }

    // DONE: Exchange temporary code for a permanent access token
    const accessTokenRequestUrl = 'https://' + shop + '/admin/oauth/access_token';
    const accessTokenPayload = {
      client_id: apiKey,
      client_secret: apiSecret,
      code,
    };

    request.post(accessTokenRequestUrl, { json: accessTokenPayload })
    .then((accessTokenResponse) => {
      const accessToken = accessTokenResponse.access_token;
       // globalShop=shop;
       // globalAccessToken=accessToken;      
      console.log(accessToken);
      // res.status(200).send("Got an access token, let's do something with it");
      // TODO
 // POST /admin/api/2020-01/products.json
// https://c1c73404.ngrok.io/shopify?shop=jayka-new.myshopify.com
  
  // ****************add new product to store*********************
   // let new_product = {
   //      product: {
   //          title: "Burton Custom Freestyle 151",
   //          body_html: "<strong>Good snowboard!</strong>",
   //          vendor: "Burton",
   //          product_type: "Snowboard"
   //          // tags: req.body.tags
   //      }
   //  };
     // const shopUrl = 'https://' + shop;
    //  let url = 'https://' + shop + '/admin/api/2020-04/products.json';
    //  let options = {
    //     method: 'POST',
    //     uri: url,
    //     json: true,
    //     resolveWithFullResponse: true,//added this to view status code
    //     headers: {
    //         'X-Shopify-Access-Token':accessToken,
    //         'content-type': 'application/json'
    //     },
    //      body: new_product//pass new product object - NEW - request-promise problably updated
    // };
    // request.post(options)
    //     .then(function (response) {
    //         console.log(response.body);
    //         if (response.statusCode == 201) {
    //             res.json(true);
    //         } else {
    //             res.json(false);
    //         }
    //     })
    //     .catch(function (err) {
    //          console.log(err);
    //         res.json(false);
    //     });
   // **********************end product add************************

   // ***************theme get product*****************// 
   const themeJsonUrl = 'https://' + shop + '/admin/themes.json';
     const loadd = {
     'X-Shopify-Access-Token': accessToken,
     };
    request.get(themeJsonUrl, { headers: loadd})
    // request.post(optionss)
        .then(function (response) {
           const padata = JSON.parse(response);
           console.log('https://c1c73404.ngrok.io/shopify?shop=jayka-new.myshopify.com');
           const themeid=parseInt(padata.themes[0].id);
           console.log(themeid);
           //assets json data
        const asetsJsonUrl ='https://' + shop + '/admin/api/2020-04/themes/'+themeid+'/assets.json';
        const asetsheader = {
         'X-Shopify-Access-Token': accessToken
        };
//*************************get assets***************************
        //    request.get(asetsJsonUrl, { headers: asetsheader})
         //  .then(function (response) {
        //          console.log('response');
        //   return res.status(200).send(response);
        //    })
         //  .catch(function (error) {
         //        console.log('error');
        //         console.log(error);
        //         res.end(error);
         //       //res.status(error).send(error);       
        // // res.json(false);
         //  });
//*************************get assets end***************************************
//*************************get specific file start******************************
        const asetsFileUrl ='https://' + shop + '/admin/api/2020-04/themes/'+themeid+'/assets.json?asset[key]=templates/index1.liquid';
           request.get(asetsFileUrl, { headers: asetsheader})
          .then(function (response) {
                 const parsedResponce = JSON.parse(response);
//  console.log(parsedResponce.asset.key);
     const filedata=parsedResponce.asset.value+'{{helooo successfully updated}}';
 //*********************get upload data start********************

     let add_assets_asset = {
                    "asset": {
                      "key": "templates/index1.liquid",
                     "value": filedata
                    }
                };
     let assests_optionssss = {
        method: 'PUT',
        uri: asetsJsonUrl,
        json: true,
        resolveWithFullResponse: true,//added this to view status code
        headers: {
            'X-Shopify-Access-Token':accessToken
        },
         body: add_assets_asset//pass new product object - NEW - request-promise problably updated
     };  
     request.put(assests_optionssss)
        .then(function (response) {
            console.log("response");
         return res.status(200).send(response);
        })
        .catch(function (err) {
             console.log(err);
            res.json(false);
        });



 //*********************get upload data end**********************
         // return res.status(200).send(parsedResponce.asset.value);
           })
          .catch(function (error) {
                console.log('error');
                console.log(error);
                res.end(error);
               //res.status(error).send(error);       
        // res.json(false);
          });


  //*********************get specific file end*******************

  //***************put assests file add start***************
    // let add_assets = {
    //                 "asset": {
    //                   "key": "assets/script.js",
    //                   "src": "https://newdiscount.000webhostapp.com/script.js"
    //                 }
    //               };
    //  let assests_options = {
    //     method: 'PUT',
    //     uri: asetsJsonUrl,
    //     json: true,
    //     resolveWithFullResponse: true,//added this to view status code
    //     headers: {
    //         'X-Shopify-Access-Token':accessToken
    //     },
    //      body: add_assets//pass new product object - NEW - request-promise problably updated
    //  };  
    //      request.put(assests_options)
    //     .then(function (response) {
    //         console.log(response);
    //      return res.status(200).send(response);
    //     })
    //     .catch(function (err) {
    //          console.log(err);
    //         res.json(false);
    //     });
  //***************put assests file add end***************
        })
        .catch(function (error) {
             // console.log(err);
          res.status(error.statusCode).send(error);
   
            // res.json(false);
        });
      // const graphqlpath = 'https://' + shop + '/admin/api/graphql';
     // const shopRequestUrl = 'https://' + shop + '/admin/api/2020-04/products.json';
     // const shopRequestHeaders = {
     // 'X-Shopify-Access-Token': accessToken,
     // };
     //   request.get(shopRequestUrl, {
     //    headers: shopRequestHeaders 
     //   })
     //   .then((shopResponse) => {
     //   res.end(shopResponse);
     //   })
       // .catch((error) => {
       //   res.status(error.statusCode).send(error.error.error_description);
       // });
      // Use access token to make API call to 'shop' endpoint
     })
    .catch((error) => {
      res.status(error.statusCode).send(error.error.error_description);
    });

  } else {
    res.status(400).send('Required parameters missing');
  }
});
// const path=require('path');
// const fs=require('fs');
// const http=require('http');
// const hostname="localhost";
// const port =3000;
// const server=http.createServer((req,res)=>{
//  // console.log(req.headers);
//  console.log('request' +req.url+'by method'+req.method);
// if(req.method=='GET'){
//  var fileURL;
//  if(req.url=='/'){
//    fileURL='/index.html';
//  }else{
//    fileURL=req.url;
//  }
// var filePath=path.resolve('public'+fileURL);
// // console.log(filePath);
// const fileExt=path.extname(filePath);
//   if(fileExt=='.html'){
//     fs.exists(filePath,(exists)=>{
//      if(!exists){
//      res.statusCode=404;
//      res.setHeader('Content-Type','text/html');
//      res.end('<html><body><h1>error 404:'+fileURL+' does not exists</h1></body></html>');
//        }
//     res.statusCode=200;
//  res.setHeader('Content-Type','text/html');
//  fs.createReadStream(filePath).pipe(res);// for convert whole responce into byte and show via pipe// its ver important
//  // res.end('<html><body><h1>server connection success:)</h1></body></html>');   
//     })
//    }else{
//      res.statusCode=404;
//      res.setHeader('Content-Type','text/html');
//      res.end('<html><body><h1>error 404:'+fileURL+' does not a html file</h1></body></html>');
//    }
// }else{
//      res.statusCode=404;
//      res.setHeader('Content-Type','text/html');
//      res.end('<html><body><h1>error 404:'+fileURL+' does not supported (comes other files)</h1></body></html>');
 
// }
//  // res.statusCode=200;
//  // res.setHeader('Content-Type','text/html');
//  // res.end('<html><body><h1>server connection success:)</h1></body></html>');
// });
// server.listen(port,hostname,()=>{
//  console.log(`server running at http://${hostname}:${port}`);
// });