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

app.set('views',path.join(__dirname,'views'));

//set view engine
app.set('view engine', 'ejs');
app.use(session({
  secret: "sosecret",
  saveUninitialized: false,
  resave: false
}));

// middleware to make 'user' available to all templates
app.use(function(req, res, next) {
  res.locals.user = req.session.user;
  next();
});
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.use('/assets',express.static(__dirname + '/public'));

const apiKey = process.env.SHOPIFY_API_KEY || '1c9be099aa9c15a6e4cfb342e22e495c';
const apiSecret = process.env.SHOPIFY_API_SECRET|| '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';


const forwardingAddress = "https://obscure-forest-68133.herokuapp.com"; // Replace this with your HTTPS Forwarding address

const scopes = 'read_products,write_script_tags'; 

const port = process.env.PORT || 6000;

app.listen(port, () => console.log(`Listening on ${ port }`));

app.get('/', (req, res) => {
  res.send('Hello World!');
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
      const shopRequestUrl = 'https://' + shop + '/admin/api/2020-04/products.json';
      const shopRequestHeaders = {
        'X-Shopify-Access-Token': accessToken,
      };
      
      // res.render('home',{ shop_data : "hello sachin" });
      request.get(shopRequestUrl, { headers: shopRequestHeaders })
      .then((shopResponse) => {
            var shop_data = {};
            let sql = "SELECT * FROM shop_data";
            let query = conn.query(sql, (err, results) => {
              console.log(results);
             if (results.rows.length>0) 
                {
                   shop_data['shop_data'] =  results.rows;
                   shop_data['product_data'] = shopResponse;
                  res.render('home',{ shop_data : shop_data });
                } 
             else {
                  res.render('home',{ shop_data : err });
                 }
           });
        // res.status(200).end(shopResponse);
      })
      .catch((error) => {
        res.status(error.statusCode).send(error.error.error_description);
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
  
  var shop_name = req.body.shop_name;
  var cust_id   = req.body.cust_id;
  var pro_id    = req.body.pro_id;
  
   let data = {shop_name: req.body.shop_name, cust_id: req.body.cust_id, pro_id: req.body.pro_id};
    const  query = {
            text: 'INSERT INTO shop_data(shop_name, customer_id, product_id ) VALUES($1, $2, $3)',
            values: [data.shop_name, data.cust_id, data.pro_id ],
           }
     conn.query(query, (err, results) => {
      if (err)
       {
        res.send(err);
       } 
      else {
           res.send(data);
         }
   });
});