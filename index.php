<?php
    $highres = 0;
    if (isset($_GET['highres']) && $_GET['highres']==1) $highres = 1;
?>
<!DOCTYPE html>
<html lang="en">
<meta charset="utf-8">

  <head>
    <title>ZeroCarbonBritain Hourly Model</title>
    <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300&display=swap" rel="stylesheet"> 
    
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/2.6.1/jszip.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip-utils/0.1.0/jszip-utils.min.js"></script>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.selection.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.time.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.stack.min.js"></script>

    <script src="https://cdn.jsdelivr.net/npm/vue@2"></script>

    <script type="text/javascript" src="ui/stacks.js?v=1"></script>
    <link rel="stylesheet" type="text/css" href="ui/style.css?v=2" />
  </head>

  <body>
    <div class="wrap">
  
    <div class="topnav">
      <div class="logo-bound-top">
        <div class="logo"></div>
        <div class="logo-title">ZeroCarbonBritain Hourly Model</div>
      </div>
    </div>
  
    <div class="sidenav" style="display:none">
      <div class="sidenav_inner">
        <div class="logo-bound-side">
          <div class="logo"></div>
          <div class="logo-title">ZCB Hourly Model</div>
        </div>
        <div style="clear:both"></div>
        
        <br>
        <div class="menu-items" name="fullmodel">
          <div class="menu-item"><a href="#overview">Overview</a></div>      
          <div class="menu-item"><a href="#supply">Supply</a></div>
          <div class="menu-item"><a href="#lac">Lighting & Appliances</a></div>
          <div class="menu-item"><a href="#spacewaterheat">Space & Water heat demand</a></div>   
          <div class="menu-item"><a href="#heatingsystems">Heating systems</a></div>
          <div class="menu-item"><a href="#transport">Transport</a></div>
          <div class="menu-item"><a href="#industry">Industry</a></div>                    
          <div class="menu-item"><a href="#elec_storage">Electricity Storage</a></div>                    
          <div class="menu-item"><a href="#backup">Storage & Backup</a></div>     
          <div class="menu-item"><a href="#balance">Final balance</a></div>
          <div class="menu-item"><a href="#scaled">Scaled by</a></div>
          <div class="menu-item"><a href="#manufacturing_energy">Manufacturing Energy</a></div>                                      
        </div>
        
        <div class="menu-title" name="guides"><b>Guides</b></div>
        <div class="menu-items" name="guides">
          <div class="menu-item"><a href="#scenario_variations">Scenario Variations</a></div>
          <div class="menu-item"><a href="#community_scenario">Creating a community scale ZeroCarbonBritain scenario</a></div>
          <div class="menu-item"><a href="#dataset">ZCB Dataset</a></div>
          <div class="menu-item"><a href="ZCB-Methodology-Papers-2019.pdf">ZCB Methodology 2019 (PDF)</a></div>        
        </div>
        
      </div>
    </div>

    
    <div class="page">
      <div class="page_inner">
        
        <div class="loading">
        <div style="font-size:22px; color:#888; margin-top:20px">Loading datasets for hourly energy model</div>
        <img src="img/ajax-loader.gif" style="width:32px; margin:40px">
        <div style="font-size:16px; color:#888; margin-bottom:20px">Downloading 906 kB</div>
        </div>
        
        <div id="model-bound">
            <div id="model">
            <?php require "model.html"; ?>
            </div>
            <div id="page" style="display:none">
            
            </div>
        </div>
        <div style="clear:both"></div>
      </div>
    </div>
    </div>
  
    <div id="footer"><a href="http://zerocarbonbritain.org/">ZeroCarbonBritain,</a> <a href="https://github.com/zerocarbonbritain/hourlymodel">Open Source on GitHub</a></div>

  </body>
</html>

<script>
function normalise_profile(profile) {
    var sum = 0
    for (var z=0; z<24; z++) sum += profile[z]
    for (var z=0; z<24; z++) profile[z] /= sum
    return profile
}
</script>

<script language="javascript" type="text/javascript" src="defaults.js?v=3"></script>
<script language="javascript" type="text/javascript" src="model.js?v=2"></script>
<script language="javascript" type="text/javascript" src="ui/vishelper.js?v=1"></script>
<script language="javascript" type="text/javascript" src="ui/zcem.js?v=2"></script>

<script>

var sidenav_visible = true;
var window_width = 0;
var load_high_res = <?php echo $highres; ?>;
var files_to_load = 2;

loading_prc("0","")
var timerStart = Date.now();
var view_html = {};
var view_desc = {};
var v = 43;

var view_mode = "electricity";

view.start = 32*365.25*24*3600;
view.end = view.start + 87648*3600;
view.calc_interval();

var page = "model";

var datasets = 0;
var pageload = 0;

var filename = "tenyearsdata.csv.zip";
if (load_high_res) filename = "highresolution.csv.zip";

load_capacityfactor_dataset(filename,function(){
    console.log("capacityfactor dataset loaded");
    datasets ++;
    loading_prc(datasets*10,"capacityfactor dataset");
    
    if (datasets==files_to_load) load_page(page);
});


load_temperature_dataset("temperature.csv.zip",function(){
    console.log("temperature dataset loaded");
    datasets ++;
    loading_prc(datasets*10,"temperature dataset");

    if (datasets==files_to_load) load_page(page);
});

$(window).on('hashchange', function() {
    timerStart = Date.now();
    scroll_to_hash();
});

function scroll_to_hash() {
    var section = (window.location.hash).substring(1);
    
    if (section=="scenario_variations" || section=="community_scenario" || section=="dataset") {
        $.ajax({url: "pages/"+section+".html?v="+v, async: false, success: function(data){
            $("#page").html(data);
            $("#model").hide();
            $("#page").show();
        }});
    } else if (section!="") {
        $("#model").show();
        $("#page").hide();
    
        $(".inner").hide();
        $(".inner[name='overview']").show();
        $(".inner[name='balance']").show();
        $(".inner[name='"+section+"']").show();
        $(".inner[name='"+section+"']").parent().get(0).scrollIntoView();    
    }
}

function load_page(page)
{
    $(".loading").hide();

    model.init();
    model.run();
            
    var time_elapsed = (Date.now() - timerStart)
    loading_prc(100,"Load time "+(time_elapsed*0.001).toFixed(1)+"s");
    
    var app = new Vue({
        el: '#app',
        data: {
            i: i,
            o: o
        },
        methods: {
          update: function () {
            model.run();
            model_view();
          },
          pan_left: function () {
            view.pan_left();
            model_view();
          },
          pan_right: function () {
            view.pan_right();
            model_view();          
          },
          zoom_in: function () {
            view.zoom_in();
            model_view(); 
          },
          zoom_out: function () {
            view.zoom_out();
            model_view();      
          },
          reset: function () {
            view.start = 32*365.25*24*3600;
            view.end = view.start + 87648*3600;
            view.calc_interval();
            model_view();
          },
          view_mode: function (_view_mode) {
            view_mode = _view_mode
            model_view();
          },
          auto_scale: function(val,baseunit) {

            var scale = 1;
            var units = "";
            var dp = 0;

            if (baseunit=="kW") {
                scale = 1; units = " kW"; dp = 0;
                if (val>=10000) {scale=0.001; units=" MW"; dp=0;}
                if (val>=10000000) {scale=0.000001; units=" GW"; dp=0;}
            }
            
            if (baseunit=="kWh") {
                scale = 1; units = " kWh"; dp = 0;
                if (val>=10000) {scale=0.001; units=" MWh"; dp=0;}
                if (val>=10000000) {scale=0.000001; units=" GWh"; dp=0;}
                if (val>=10000000000) {scale=0.000000001; units=" TWh"; dp=0;}
            }

            if (baseunit=="m2") {
                scale = 1; units = " m2"; dp = 0;
                if (val>=10000*10) {scale=0.0001; units=" ha"; dp=0;}
                if (val>=10000*10*1000) {scale=0.0001*0.001; units=" kha"; dp=0;}
                if (val>=10000*10*1000*1000) {scale=0.0001*0.001*0.001; units=" Mha"; dp=0;}
            } 
            
            return "<span>"+(1*val*scale).toFixed(dp)+"</span><span style='font-size:90%'>"+units+"</span>"

          }       
        },
        filters: {
          format_energy: function(val) {
            return (val * 0.1 * 0.001).toFixed(1);
          },
          format_prc: function(val) {
            return (val * 100).toFixed(1);
          },
          toFixed: function(val,dp) {
            if (isNaN(val)) {
              return val;
            } else {
              return (1*val).toFixed(dp)
            }
          }       
        }
    });

    resize();
    model_ui();
    scroll_to_hash();
}

$("#model").on("click",".viewmode",function(){
    view_mode = $(this).attr("view");
    model_view();
});

$("#model").on("click",".box-title",function(){
   var box = $(this).parent().find(".inner");
   if (box.is(":visible")) box.hide(); else box.show();
});

function loading_prc(prc,msg) {
    $(".loading_prc").html(msg);
}

// ------------------------------------------

function resize() {
    window_width = $(window).width();

    var sidenav_space = (window_width-960)*0.5;

    if (sidenav_space>300) {
        sidenav_visible = true;
    } else {
        sidenav_visible = false;
    }
    draw_sidebar();
      
    var width = $("#placeholder_bound").width();
    var height = $("#placeholder_bound").height();
    $("#placeholder").width(width);
    $("#placeholder").height(width*0.52);
    
    model_view();
}


$(window).on('load', function(){
    resize();
});

$(window).resize(function() {
    resize();
});

$(".logo").click(function(){
    if (sidenav_visible) {
        sidenav_visible = false;
    } else {
        sidenav_visible = true;
    }
    
    draw_sidebar();
});


function draw_sidebar() {
    if (sidenav_visible) {
        $(".sidenav").show();
        $(".topnav").hide();
        
        var sidenav_space = (window_width-960)*0.5;
        if (sidenav_space>300) {
            $(".page").css("margin","0 0 0 300px");
        } else {
            $(".page").css("margin","0 auto 0 auto");
        }
        
    } else {
        $(".sidenav").hide();
        $(".topnav").show();    
        $(".page").css("margin","0 auto 0 auto");
    } 
}

$(".menu-title").click(function(){
    var name = $(this).attr("name");
    $(".menu-items[name="+name+"]").toggle();
});
    
</script>


