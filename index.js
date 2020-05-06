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
// 'DELETE FROM user_data');
// conn.query(
// 'DELETE FROM wish_list');
// conn.query(
// 'DELETE FROM product_data');

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

const scopes = 'read_content,write_content,read_themes,write_themes,read_customers,read_products,write_script_tags';

const port = process.env.PORT || 6000;

app.listen(port, () => console.log(`Listening on ${ port }`));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

let accessToken = '' ;
let filedata    = '' ;
let global_req  = '' ;

const getScript = (url) => {
    return new Promise((resolve, reject) => {
        const http      = require('http'),
              https     = require('https');

        let client = http;

        if (url.toString().indexOf("https") === 0) {
            client = https;
        }

        client.get(url, (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                resolve(data);
            });

        }).on("error", (err) => {
            reject(err);
        });
    });
};

(async (url) => {
    var data_url = await getScript(url);
    filedata = data_url;
    // console.log("data_url");
    // console.log(data_url);
})('https://digitalcodingkloud.000webhostapp.com/my-wish-list.liquid');


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
    global_req = request ;
    request.post(accessTokenRequestUrl, { json: accessTokenPayload })
    .then((accessTokenResponse) => {
       accessToken = accessTokenResponse.access_token;
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

              var file_data = "ssssssssssssssssss"
               let add_assets_asset = {


                                "asset": {
                                   "key": "snippets/my_wish_list.liquid",
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
                          // console.log("response");
                       // return res.status(200).send(response);
                      })
                      .catch(function (err) {
                      });

           
            var shop_data = {};
            let sql_user = "SELECT * FROM user_data WHERE shop_name='"+shop+"' ORDER BY id DESC";
            let query_user = conn.query(sql_user, (err, results) => {
              // console.log(results);
             if (results) 
                {
                   shop_data['user_data'] =  results.rows;
                   let sql_pro = "SELECT * FROM product_data WHERE shop_name='"+shop+"' ORDER BY id DESC";
                    let query_pro = conn.query(sql_pro, (err, results) => {
                      // console.log(results);
                     if (results) 
                        {  
                          shop_data['product_data'] =  results.rows;
                          shop_data['current_time'] = new Date().toISOString();
                          res.render('index' ,{ shop_data : shop_data });
                        } 
                 });
              }
             else {
                  // res.render('home',{ shop_data : err });
                 }
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
   
  var cust_resp = [];
  var shop_resp = [];
  var pro_obj   = req.body.pro_arr;
  var pro_arr   = JSON.parse(pro_obj);
  var shop_name = req.body.shop_name;

    const shopRequestUrl_cust = 'https://' + shop_name + '/admin/api/2020-04/customers/'+req.body.cust_id+'.json';
    const shopRequestHeaders_cust = {
       'X-Shopify-Access-Token': accessToken,
     };

    global_req.get(shopRequestUrl_cust, { headers: shopRequestHeaders_cust })
    .then((cust_response) => {
         cust_resp = JSON.parse(cust_response);
         // res.send(cust_response);
       })
    .catch((error) => {
      res.send(error);
    });  
   
    async function getData() {
    for await (var i = 0; i < pro_arr.length; i++) {
      
    const shopRequestUrl_prod = 'https://' + shop_name + '/admin/api/2020-04/products/'+pro_arr[i].product_id+'.json';
    const shopRequestHeaders_prod = {
      'X-Shopify-Access-Token': accessToken,
    };

    global_req.get(shopRequestUrl_prod, { headers: shopRequestHeaders_prod })
    .then((shopResponse) => {
    shop_resp = JSON.parse(shopResponse);

    var cust_id    = req.body.cust_id;
    var cust_name  = cust_resp.customer.first_name+' '+ cust_resp.customer.last_name;
    var cust_email = cust_resp.customer.email;
    var url        = shop_resp.product.title.replace(/\s+/g, '-').toLowerCase();
    var pro_url    = 'https://' + req.body.shop_name+'/products/'+url;
    var pro_price  =  req.body.p_currency+' '+shop_resp.product.variants[0].price;
    var pro_time   = new Date().toISOString();
    
  
    var wish_list_data = {shop_name: shop_name, cust_id: cust_id };
    var cust_data = {shop_name: shop_name, cust_id: cust_id, cust_name: cust_name, cust_email: cust_email };
    var prod_data = {shop_name: shop_name, cust_id: cust_id, pro_id: shop_resp.product.id, pro_title: shop_resp.product.title, pro_img: shop_resp.product.image.src, pro_price: pro_price, pro_url: pro_url, pro_time: pro_time };

    let sql_cust = "SELECT * FROM user_data WHERE customer_id='"+cust_id+"' AND shop_name='"+shop_name+"'";
    let query_cust = conn.query(sql_cust, (err, results) => {
    
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
            }); 
            let sql_pro = "SELECT * FROM product_data WHERE customer_id='"+cust_id+"' AND product_id='"+prod_data.pro_id+"' AND shop_name='"+shop_name+"'";
            let query_pro = conn.query(sql_pro, (err, results) => {

             if (  results.rows.length > 0  ) 
             {  console.log("product already exist."); }
             else{
                const query = {
                      text: 'INSERT INTO product_data(shop_name, customer_id, product_id,  product_title, product_src, product_price, product_url, product_time ) VALUES($1, $2, $3, $4, $5, $6, $7,$8)',
                      values: [prod_data.shop_name, prod_data.cust_id, prod_data.pro_id, prod_data.pro_title, prod_data.pro_img, prod_data.pro_price, prod_data.pro_url, prod_data.pro_time ],
                     }
                     conn.query(query, (err, results) => {
                      if (err) { console.log("333"); } 
                      else {

                           }
                     });                
                 }
            }); 
       })
      .catch((error) => {
        res.send(error);
      });   
   }
  }
 getData().then( function(){
 res.send("success");  
  
 } );  
 
  
});

app.post('/remove_prod',(req, res) => {  
  var pro_id = req.body.pro_id;
  var cust_id = req.body.cust_id;
  var shop_name = req.body.shop_name;

  let sql_user = "SELECT * FROM product_data WHERE shop_name='"+shop_name+"' AND customer_id='"+cust_id+"'";
        let query_user = conn.query(sql_user, (err, results) => {
          // var lengthq  = results.rows.length;
          // console.log(results);
         if (results.rows.length >1) 
            {
               let del_user = "DELETE FROM product_data WHERE shop_name='"+shop_name+"' AND product_id='"+pro_id+"' AND customer_id='"+cust_id+"'";
                 conn.query(del_user, (err, results) => {   
                });
               res.send("sss");           
            }
         else if(results.rows.length == 1) 
         { 
            let del_pro = "DELETE FROM product_data WHERE shop_name='"+shop_name+"' AND product_id='"+pro_id+"' AND customer_id='"+cust_id+"'";
             conn.query(del_pro, (err, results) => {   
            });

            let del_wish = "DELETE FROM wish_list WHERE shop_name='"+shop_name+"' AND customer_id='"+cust_id+"'";
             conn.query(del_wish, (err, results) => {   
            });
           
           let del_user = "DELETE FROM user_data WHERE shop_name='"+shop_name+"' AND customer_id='"+cust_id+"'";
             conn.query(del_user, (err, results) => {   
            });
           if(results) {
            res.send("hhhh");
           }
        }
      });
  });

app.post('/get_wish_list',(req, res) => {  
   var shop_name       =  req.body.shop_name;
   var cust_id         =  req.body.cust_id;
  
   if( cust_id ) {
   let sql_pro = "SELECT * FROM product_data WHERE customer_id='"+cust_id+"' AND shop_name='"+shop_name+"'";
            let query_pro = conn.query(sql_pro, (err, results) => {
              console.log("results");
             if (results) 
                {  
                  res.send(results.rows);
                } 
         });
    }
});

// app.use('/admin', express.static('./node_modules/admin-lte'));