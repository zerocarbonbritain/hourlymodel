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
    <link rel="stylesheet" type="text/css" href="ui/style.css?v=1" />
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
        <div class="menu-title" name="fullmodel"><b>Full Model</b></div>
        <div class="menu-items" name="fullmodel">
          <div class="menu-item"><a href="#fullzcb3">ZeroCarbonBritain v3</a></div>
          <div class="menu-item"><a href="#dataset">ZCB Dataset</a></div>
        </div>
        
        <div class="menu-title" name="guides"><b>Guides</b></div>
        <div class="menu-items" name="guides">
          <div class="menu-item"><a href="#scenario_variations">1. Scenario Variations</a></div>
          <div class="menu-item"><a href="#community_scenario">2. Creating a community scale ZeroCarbonBritain scenario</a></div>
        </div>

        <div class="menu-title" name="methodology"><b>Methodology Papers (PDF)</b></div>
        <div class="menu-items" name="methodology" style="display:none">
          <div class="menu-item"><a href="Methodology/Hourly Energy Model Methodology.pdf">1. Hourly Energy Model</a></div>
          <div class="menu-item"><a href="Methodology/Renewable Energy Supply Methodology.pdf">2. Renewable Energy Supply</a></div>
          <div class="menu-item"><a href="Methodology/Power Down Methodology 2 7 13.pdf">3. Power Down</a></div>
          <div class="menu-item"><a href="Methodology/Food and diets methodology.pdf">4. Food and diets</a></div>
          <div class="menu-item"><a href="Methodology/Land Use Methodology 30.6.13.pdf">5. Land Use</a></div>          
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
            <?php require "pages/fullzcb3.html"; ?>
            </div>
        </div>
        <div style="clear:both"></div>
      </div>
    </div>
    </div>
  
    <div id="footer"><a href="http://zerocarbonbritain.org/">ZeroCarbonBritain,</a> <a href="https://github.com/zerocarbonbritain/hourlymodel">Open Source on GitHub</a></div>

  </body>
</html>

<script language="javascript" type="text/javascript" src="defaults.js?v=2"></script>
<script language="javascript" type="text/javascript" src="model.js?v=2"></script>
<script language="javascript" type="text/javascript" src="ui/vishelper.js?v=1"></script>
<script language="javascript" type="text/javascript" src="ui/zcem.js?v=1"></script>

<script>

var scenario_name = "main";
var sidenav_visible = true;
var window_width = 0;
var print_view = false;
var run_zcb_test = false;
var load_high_res = <?php echo $highres; ?>;
var files_to_load = 2;
if (run_zcb_test) files_to_load = 3;

loading_prc("0","")
var timerStart = Date.now();
var view_html = {};
var view_desc = {};
var d = {};
var v = 43;
var o = {transport:{}}
    

var view_mode = "electricity";

view.start = 32*365.25*24*3600;
view.end = view.start + 87648*3600;
view.calc_interval();

var page = "fullzcb3";

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


if (run_zcb_test) {
    load_test_dataset("test.csv.zip",function(){
        console.log("test dataset loaded");
        datasets ++;
        loading_prc(datasets*10,"test dataset");
        
        if (datasets==files_to_load) load_page(page);
    });
}

// load_page(page);

$(window).on('hashchange', function() {
    timerStart = Date.now();
    page = (window.location.hash).substring(1);
    load_page(page);
});

function load_page(page)
{
    $(".loading").hide();
    
    //var out = "";
    //for (var scenario_name in scenarios) {
    //    out += "<option>"+scenario_name+"</option>"
    //}
    //$("#select_scenario").html(out);


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
            fullzcb3_view();
          },
          pan_left: function () {
            view.pan_left();
            fullzcb3_view();
          },
          pan_right: function () {
            view.pan_right();
            fullzcb3_view();          
          },
          zoom_in: function () {
            view.zoom_in();
            fullzcb3_view(); 
          },
          zoom_out: function () {
            view.zoom_out();
            fullzcb3_view();      
          },
          reset: function () {
            view.start = 32*365.25*24*3600;
            view.end = view.start + 87648*3600;
            view.calc_interval();
            fullzcb3_view();
          },
          view_mode: function (_view_mode) {
            view_mode = _view_mode
            fullzcb3_view();
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
    fullzcb3_ui();
        
}

$("#model").on("click",".viewmode",function(){
    view_mode = $(this).attr("view");
    fullzcb3_view();
});

$("#model").on("click",".box-title",function(){
   var box = $(this).parent().find(".inner");
   if (box.is(":visible")) box.hide(); else box.show();
});

/*
$("#model").on("change","#select_scenario",function(){
    scenario_name = $(this).val();

    for (var z in scenarios.main) window[z] = scenarios.main[z]     
    if (scenario_name!="main") {
        for (var z in scenarios[scenario_name]) window[z] = scenarios[scenario_name][z]  
    }

    var timerStart = Date.now();
    
    model.run();
    fullzcb3_ui();
    fullzcb3_view();

    var time_elapsed = (Date.now() - timerStart)
    loading_prc(100,"Calculation time "+(time_elapsed*0.001).toFixed(1)+"s"); 
});*/

function loading_prc(prc,msg) {
    $(".loading_prc").html(msg);
}

/*
function save_scenario() {

    var save = {};

    for (var z in scenarios.main) {
        if (window[z] != scenarios.main[z]) {
            save[z] = window[z]
        }
    }
    console.log(JSON.stringify(save))
}*/

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
    
    if (print_view) {
        $(".topnav").hide();
        $(".sidenav").hide();
        $(".published").hide();
    }
      
    var width = $("#placeholder_bound").width();
    var height = $("#placeholder_bound").height();
    $("#placeholder").width(width);
    $("#placeholder").height(width*0.52);
    
    fullzcb3_view();
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

function normalise_profile(profile) {
    var sum = 0
    for (var z=0; z<24; z++) sum += profile[z]
    for (var z=0; z<24; z++) profile[z] /= sum
    return profile
}
    
</script>


