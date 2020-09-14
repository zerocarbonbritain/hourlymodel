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
    <link rel="stylesheet" type="text/css" href="font/ubuntu.css?family=Ubuntu:light,bold&subset=Latin">
    <!--<link href='http://fonts.googleapis.com/css?family=Ubuntu:300' rel='stylesheet' type='text/css'>-->
    <script type="text/javascript" src="jquery-1.11.3.min.js"></script>
    <script type="text/javascript" src="jszip/jszip.min.js"></script>
    <script type="text/javascript" src="jszip/jszip-utils.min.js"></script>
    <script language="javascript" type="text/javascript" src="flot/jquery.flot.min.js"></script>
    <script language="javascript" type="text/javascript" src="flot/jquery.flot.selection.min.js"></script>
    <script language="javascript" type="text/javascript" src="flot/jquery.flot.time.min.js"></script>
    <script language="javascript" type="text/javascript" src="flot/jquery.flot.stack.min.js"></script>
    <script type="text/javascript" src="stacks.js"></script>
    <link rel="stylesheet" type="text/css" href="style.css?v=3" />
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
          <div class="menu-item"><a href="#fullzcb2">ZeroCarbonBritain v2</a></div>
          <div class="menu-item"><a href="#fullzcb">ZeroCarbonBritain v1</a></div>
          <div class="menu-item"><a href="#dataset">ZCB Dataset</a></div>
        </div>
        
        <div class="menu-title" name="guides"><b>Guides</b></div>
        <div class="menu-items" name="guides">
          <div class="menu-item"><a href="#scenario_variations">1. Scenario Variations</a></div>
          <div class="menu-item"><a href="#community_scenario">2. Creating a community scale ZeroCarbonBritain scenario</a></div>
        </div>
              
        <div class="menu-title" name="examples"><b>Examples</b></div>
        <div class="menu-items" name="examples" style="display:none">
          <div class="menu-item"><a href="#varsupply">1. Variable supply</a></div>
          <div class="menu-item"><a href="#varsupply_flatdemand">2. Variable supply and flat demand</a></div>
          <div class="menu-item"><a href="#varsupply_traddemand">3. Variable supply, traditional electricity demand and oversupply</a></div>
          <div class="menu-item"><a href="#windandsun_flatdemand">4. Mixed supply and flat demand</a></div>
          <!--
          <div class="menu-item"><a href="#varsupply_spaceheatingdemand">5. Variable supply and space heating demand</a></div>
          <div class="menu-item"><a href="#electricvehicles">6. Electric Vehicles</a></div>
          <div class="menu-item"><a href="#all">7. Household electric only model</a></div>
          <div class="menu-item"><a href="#fullhousehold">8. Household full energy model</a></div>
          -->
          <div class="menu-item"><a href="#storage_algorithm">5. Storage Algorithms</a></div>
          <div class="menu-item"><a href="#hydrogen_backup">6. Hydrogen Backup</a></div>
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
            </div>
            
            <pre id="sourcecode" style="display:none"></pre>
        </div>
        <div id="description"></div>
        <div style="clear:both"></div>
      </div>
    </div>
    </div>
  
    <div id="footer"><a href="http://zerocarbonbritain.org/">ZeroCarbonBritain,</a> <a href="https://github.com/zerocarbonbritain/hourlymodel">Open Source on GitHub</a></div>

  </body>
</html>
<script language="javascript" type="text/javascript" src="vishelper.js?v=2"></script>

<script>
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
var v = 31;

view_mode = "";

var datastarttime = 32*365.25*24*3600*1000;
start = datastarttime;
end = datastarttime + 10*24*365*3600*1000;
interval = (end - start)/1000;

page = (window.location.hash).substring(1);
if (page=="") page = "fullzcb3";

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
    if (view_html[page]!=undefined) {
        $("#model").html(view_html[page]);
        $("#description").html(view_desc[page]);
    } else {
        $.ajax({url: "pages/"+page+".html?v="+v, async: false, success: function(data){
            view_html[page] = data;
        }});
        
        view_desc[page] = "";
        $.ajax({url: "descriptions/"+page+".html?v="+v, async: false, success: function(data){
            view_desc[page] = data;
        }});
        
        $("#model").html(view_html[page]);
        $("#description").html(view_desc[page]);
        
        // Load js
        $.ajax({
            url: "js/"+page+".js",
            dataType: 'script',
            async:false
        });
    }
    var init_fn = page+"_init";
    if (window[init_fn]!=undefined) window[init_fn]();
    var run_fn = page+"_run";
    if (window[run_fn]!=undefined) window[run_fn]();
    resize();
    var ui_fn = page+"_ui";
    if (window[ui_fn]!=undefined) window[ui_fn]();
    var view_fn = page+"_view";
    if (window[view_fn]!=undefined) window[view_fn](start,end,interval);
    
    $(".modelinput").each(function(){
        var varkey = $(this).attr("key");
        var type = $(this).attr("itype");
        var scale = 1.0;
        if (type=="%") scale = 100.0;
        
        $(this).val(window[varkey]*scale);
        //console.log(varkey);
    });
    
    $("#sourcecode").hide();
    $("#view-source").html("Show source code");
    
    var time_elapsed = (Date.now() - timerStart)
    loading_prc(100,"Load time "+(time_elapsed*0.001).toFixed(1)+"s");
}

$("#model").on("change",".modelinput",function(){
    var timerStart = Date.now();

    var varkey = $(this).attr("key");
    var type = $(this).attr("itype");
    var scale = 1.0;
    if (type=="%") scale = 100.0;
    window[varkey] = $(this).val();
    if (!isNaN(window[varkey])) window[varkey] /= scale;
    var run_fn = page+"_run";
    if (window[run_fn]!=undefined) window[run_fn]();
    var ui_fn = page+"_ui";
    if (window[ui_fn]!=undefined) window[ui_fn]();
    var view_fn = page+"_view";
    if (window[view_fn]!=undefined) window[view_fn](start,end,interval);

    var time_elapsed = (Date.now() - timerStart)
    loading_prc(100,"Calculation time "+(time_elapsed*0.001).toFixed(1)+"s");
});

$("#model").on("click",".viewmode",function(){
    
    view_mode = $(this).attr("view");
    
    var view_fn = page+"_view";
    if (window[view_fn]!=undefined) window[view_fn](start,end,interval);
});

$("#model").on("click",".view-source",function(){
    if (!$("#sourcecode").is(":visible")) {
        $.ajax({
            url: "js/"+page+".js",
            dataType: 'text',
            async:true,
            success: function (data){
                $("#sourcecode").html("Model file js/"+page+".js:\n\n"+data);
                $("#sourcecode").show();
                $(".view-source").html("Hide source code");
            }
        });
    } else {
        $("#sourcecode").hide();
        $(".view-source").html("Show source code");
    }
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
    
    if (print_view) {
        $(".topnav").hide();
        $(".sidenav").hide();
        $(".published").hide();
    }
      
    var width = $("#placeholder_bound").width();
    var height = $("#placeholder_bound").height();
    $("#placeholder").width(width);
    $("#placeholder").height(width*0.52);
    
    var view_fn = page+"_view";
    if (window[view_fn]!=undefined) window[view_fn](start,end,interval);
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
    
    if (name=="twitter") window.location = "https://twitter.com/trystanlea";
});
    
</script>


