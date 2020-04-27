const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const request = require('request-promise');


const path = require('path');
const session = require('express-session');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mysql = require('mysql');

var createError = require("http-errors");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var query_string = require('querystring')

let pg = require('pg');
if (process.env.DATABASE_URL) {
  pg.defaults.ssl = true;
}

let connString = process.env.DATABASE_URL || 'postgres://vhoxtymthgmope:ad8f78b9a8d8c73ffbb40c45092acefdb7dd3c38af5810ee374c99503bd60cbd@ec2-34-204-22-76.compute-1.amazonaws.com:5432/dcq47h4pjsdfrk';
const { Pool } = require('pg');

const conn = new Pool({
  connectionString : connString
});
// conn.query(
//   'CREATE TABLE shop_data(id SERIAL PRIMARY KEY, shop_name VARCHAR(255) not null, customer_id VARCHAR(255), product_id VARCHAR(255) not null)');
// conn.query(
// 'DROP TABLE product_data');

// conn.query(
// 'CREATE TABLE user_data(id SERIAL PRIMARY KEY, customer_id VARCHAR(255) not null, customer_name VARCHAR(255), customer_email VARCHAR(255), shop_name VARCHAR(255) not null)');


// conn.query(
// 'CREATE TABLE product_data(id SERIAL PRIMARY KEY, shop_name VARCHAR(255) not null, customer_id VARCHAR(255), product_id VARCHAR(255) not null, product_title VARCHAR(255) not null, product_src VARCHAR(255) not null, product_price VARCHAR(255) not null, product_url VARCHAR(255) not null, product_time VARCHAR(255) not null)');

// conn.query(
// 'CREATE TABLE wish_list(id SERIAL PRIMARY KEY, shop_name VARCHAR(255) not null, customer_id VARCHAR(255))');

app.set('views',path.join(__dirname,'views'));
app.set('view engine', 'ejs');

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use('/assets',express.static(__dirname + '/public'));

const apiKey = process.env.SHOPIFY_API_KEY || '1c9be099aa9c15a6e4cfb342e22e495c';
const apiSecret = process.env.SHOPIFY_API_SECRET|| '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';


const forwardingAddress = "https://obscure-forest-68133.herokuapp.com"; // Replace this with your HTTPS Forwarding address

const scopes = 'read_content,write_content,read_themes,write_themes,read_products,write_script_tags';

const port = process.env.PORT || 6000;

app.listen(port, () => console.log(`Listening on ${ port }`));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

var filedata = '';

const fs = require('fs')

fs.readFileSync('test.txt', (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  console.error(filedata)
  filedata = data;
})

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

    res.cookie('state', state);
    res.redirect(installUrl);
  } else {
    return res.status(400).send('Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request');
  }
});

app.get('/shopify/callback', (req, res) => {
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
      // DONE: Use access token to make API call to 'shop' endpoint
      // const shopRequestUrl = 'https://' + shop + '/admin/api/2020-04/products.json';
      // const shopRequestHeaders = {
      //   'X-Shopify-Access-Token': accessToken,
      // }; 
      
       const themeJsonUrl = 'https://' + shop + '/admin/themes.json';
         const loadd = {
         'X-Shopify-Access-Token': accessToken,
         };
        request.get(themeJsonUrl, { headers: loadd})
            .then(function (response) {
               const padata = JSON.parse(response);
               const themeid=parseInt(padata.themes[0].id);
         
                const asetsJsonUrl ='https://' + shop + '/admin/api/2020-04/themes/'+themeid+'/assets.json';
                const asetsheader = {
                 'X-Shopify-Access-Token': accessToken
                };


               let add_assets_asset = {


                                "asset": {
                                   "key": "templates/index.liquid",
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
                          // res.json(false);
                      });
         })
        .catch(function (error) {
          res.status(error.statusCode).send(error);
        });

    })
    .catch((error) => {
      res.status(error.statusCode).send(error.error.error_description);
    });

  } else {
    res.status(400).send('Required parameters missing');
  }
});


app.post('/add-to-wish',(req, res) => {  
  
  var form_obj = req.body.form_data;
  var form_data = query_string.parse(form_obj);
  var shop_name = req.body.shop_name;
  var cust_id = form_data.cust_id;
  var cust_name = form_data.cust_first_name+' '+ form_data.cust_last_name;
  var remove_currency = form_data.pro_price.split(' ');
  var price = parseInt(remove_currency[1])/100;
  var pro_price = remove_currency[0]+' '+parseInt(price).toFixed(2);
  var pro_time = new Date().toISOString();
  // var cust_id   = req.body.cust_id;
  
   var wish_list_data = {shop_name: req.body.shop_name, cust_id: form_data.cust_id };
   var cust_data = {shop_name: req.body.shop_name, cust_id: form_data.cust_id, cust_name: cust_name, cust_email: form_data.cust_email };
   var prod_data = {shop_name: req.body.shop_name, cust_id: form_data.cust_id, pro_id: form_data.pro_id, pro_title: form_data.pro_title, pro_img: form_data.pro_img, pro_price: pro_price, pro_url: form_data.pro_url, pro_time: pro_time };
     
      let sql_cust = "SELECT * FROM user_data WHERE customer_id='"+form_data.cust_id+"'";
      let query_pro = conn.query(sql_cust, (err, results) => {
    
       if ( results.rows.length > 0 ) 
            { console.log("user already exist.");  }
          
       else {  
               const  query = {
                text: 'INSERT INTO user_data(shop_name, customer_id, customer_name, customer_email ) VALUES($1, $2, $3, $4)',
                values: [cust_data.shop_name, cust_data.cust_id, cust_data.cust_name, cust_data.cust_email ],
               }
               conn.query(query, (err, results) => {
                if (err) { console.log("111"); } 
                else { 
                         const  query = {
                                text: 'INSERT INTO wish_list(shop_name, customer_id ) VALUES($1, $2)',
                                values: [wish_list_data.shop_name, wish_list_data.cust_id ],
                               }
                          conn.query(query, (err, results) => {
                          if (err) { console.log("222"); } 
                          else { }
                        });
                     }  
               });
             }
              let sql_pro = "SELECT * FROM product_data WHERE customer_id='"+form_data.cust_id+"' AND product_id='"+prod_data.pro_id+"'";
              let query_pro = conn.query(sql_pro, (err, results) => {
               // var obj = {};
               // obj['err'] = err;
               //  obj['results'] = results;
               //  res.send(obj);
               if (  results.rows.length > 0  ) 
               {  console.log("product already exist."); }
               else{
                  const query = {
                        text: 'INSERT INTO product_data(shop_name, customer_id, product_id,  product_title, product_src, product_price, product_url, product_time ) VALUES($1, $2, $3, $4, $5, $6, $7,$8)',
                        values: [prod_data.shop_name, prod_data.cust_id, prod_data.pro_id, prod_data.pro_title, prod_data.pro_img, prod_data.pro_price, prod_data.pro_url, prod_data.pro_time ],
                       }
                       conn.query(query, (err, results) => {
                        if (err) { res.send(err); } 
                        else {
                             res.send(query);
                             }
                       });                
                   }
              });
     });       
});

app.post('/remove_prod',(req, res) => {  
  var pro_id = req.body.pro_id;
  var cust_id = req.body.cust_id;
  var shop_name = req.body.shop_name;

  let sql_user = "SELECT * FROM product_data WHERE shop_name='"+shop+"' AND product_id='"+pro_id+"'";
            let query_user = conn.query(sql_user, (err, results) => {
              // console.log(results);
             if (results.rows.length >1) 
                {
                   
               }
             else if(results.rows.length == 1) 
             {

             }
             else {
                  // res.render('home',{ shop_data : err });
                 }
           });
  
});

// app.get('/dashboard',(req, res) => {  
//   res.render('dashboard' ,{ "shop_data" : shop_data } );
// });

// app.use('/admin', express.static('./node_modules/admin-lte'));