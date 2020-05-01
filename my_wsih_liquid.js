{% if my_wish_list == 'my_wish_link' %}
<style>
body {
  font-family: "Lato", sans-serif;
}

.sidenav {
  height: 100%;
  width: 0;
  position: fixed;
  z-index: 1;
  top: 0;
  right: 0;
  background-color: #f9fafb;
  overflow-x: hidden;
  transition: 0.5s;
  padding-top: 60px;
}

.sidenav a {
  padding: 8px 8px 8px 32px;
  text-decoration: none;
  font-size: 12px;
  color: #818181;
  display: block;
  transition: 0.3s;
}

.sidenav a:hover {
  color: #f1f1f1;
}

.sidenav .closebtn {
  position: absolute;
  top: 0;
  right: 25px;
  font-size: 36px;
  margin-left: 50px;
}

@media screen and (max-height: 450px) {
  .sidenav {padding-top: 15px;}
  .sidenav a {font-size: 12px;}
}
.my_wsih_head{
    text-align: center;
    font-size: 20px;
    left: 40px;
}

.my_wish_pro{
   font-size: 12px;
    color: black;
    border-bottom: 0px solid currentColor;
}  
</style>
<div id="mySidenav" class="sidenav">
<!--   <a href="javascript:void(0)" class="closebtn">&times;</a> -->
<h3 class="my_wsih_head">My Wish List</h3>
<div class="">
       <table class="table table-striped">
        <thead>
          <tr role="row">
            <th class="table_head sorting_disabled" style="width: 250px;">Products</th>
            <th class="table_head sorting_disabled" style="width: 100px;">Action</th>
          </tr>
        </thead>    
      <tbody>
         <tr role="row" class="replace_row odd">
         </tr>
      </tbody>
 </table>
</div>
</div>
	<a class="my_wish_View" href="#">Wishlist (<span class="my_wish_Count">0</span>)</a>
{% elsif my_wish_list == 'my_wish_product' %}
<div class="my_wish_AddWrap">
	<a class="my_wish_Add add_to_wish_list" href="#" data-product="{{ product.id }}" p_currency="{{ cart.currency.symbol }}">Add to Wishlist</a>
	{% unless customer %}<p class="my_wish_LoginMsg" style="display: none;">Your wishlist has been temporarily saved. Please <a href="/account/login">Log in</a> to save it permanently.</p>{% endunless %}
</div>
{% elsif my_wish_list == 'my_wish_Collection' %}
	<a class="my_wish_AddColl my_wish_check" href="#" data-variant="{{ product.variants.first.id }}" data-product="{{ product.id }}" data-pTitle="{{ product.title | escape }}">Add to Wishlist</a>
{% elsif my_wish_list == 'my_wish_footer' %}
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
<script>
// function openNav() {
//   document.getElementById("mySidenav").style.width = "350px";
// }

// function closeNav() {
//   document.getElementById("mySidenav").style.width = "0";
// }
</script>
<script type="text/javascript">
jQuery(document).ready(function(){
	jQuery(document).on('click','.add_to_wish_list',function(){    
	  var pro_id             = __st.rid;
	  var cust_id            = __st.cid;
      var my_wish_list_count =  0;
	  var p_currency = jQuery(this).attr('p_currency');
      data = {"cust_id": cust_id, "pro_id": pro_id,"p_currency": p_currency, "shop_name": Shopify.shop};
      if(cust_id != '') {
	  jQuery.ajax({
	      type:'POSt',
	      url: 'https://cors-anywhere.herokuapp.com/'+'https://obscure-forest-68133.herokuapp.com/add-to-wish',
	      data: data,
	      dataType: "json",
	      success: function (data) {
            console.log(data);
//             if(data == 1){
//               my_wish_list_count++;
//               jQuery('.my_wish_Count').text(my_wish_list_count);
//              }
//              else
//              {
             
//              }
            },
	      error: function (xhr, status, error) {
	          console.log('Error: ' + error.message);
	          jQuery('#lblResponse').html('Error connecting to the server.');
	      },
	   
	     });
       }
	  });
     
    jQuery(document).on('click','.my_wish_View',function(){ 
     jQuery('#mySidenav').css({"width":"350px"});
     var i         = '';
     var trHTML    = '';
	   var cust_id   = __st.cid;
	   data = {"cust_id": cust_id,"shop_name": Shopify.shop};
	  console.log(data);
      if(cust_id != '') {
	  jQuery.ajax({
	      type:'POSt',
	      url: 'https://cors-anywhere.herokuapp.com/'+'https://obscure-forest-68133.herokuapp.com/get_wish_list',
	      data: data,
	      dataType: "json",
	      success: function (data) {

            trHTML += '<tr role="row" class="replace_row odd">';
            for(i = 0; i< data.length; i++ )
             {
              console.log(data[i]);
             trHTML +='<td class="table_data"><a href="'+data[i].product_url+'" class="my_wish_pro"><img src="'+data[i].product_src+'" height="50" width="50" alt=""></a><a href="'+data[i].product_url+'" class="my_wish_pro">Antique Drawers</a></td>'

             trHTML +='<td class="table_data"><a href="#" pro_id="4938577248300" class="my_wish_pro recDelete_pro"><i class="fa fa-trash-o" aria-hidden="true"></i> REMOVE</a></td>'
             }
             trHTML +='</tr>'
            jQuery('.replace_row').replaceWith(trHTML);
          }
	     });
       }
	  });
      
        jQuery('body').click(function() {
          jQuery('#mySidenav').css({"width":"0px"});
      });
	}); 
</script>
{% endif %}