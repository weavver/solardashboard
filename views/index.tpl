<html lang="en" ng-app="DashboardApp">
<head>
     <meta charset="utf-8">
     <meta http-equiv="X-UA-Compatible" content="IE=edge">
     <meta name="viewport" content="width=device-width, initial-scale=1">
     <title>My Dashboard</title>
     <link rel="stylesheet" href="/bower_components/bootstrap/dist/css/bootstrap.css">
     <link rel="stylesheet" href="/bower_components/angular-bootstrap/ui-bootstrap-csp.css">
     <script src="/bower_components/jquery/dist/jquery.min.js"></script>
     <script src="/bower_components/bootstrap/dist/js/bootstrap.min.js"></script>
     <script src="/js/d3.min.js"></script>
     <script src="/js/gauge.js"></script>
     <script type="text/javascript"
          src="https://www.google.com/jsapi?autoload={
            'modules':[{
              'name':'visualization',
              'version':'1',
              'packages':['corechart']
            }]
          }"></script>
     <script>

          //function initialize() {
          //     createGauges();
          //}

     </script>

     <style type="text/css">
          body {
               background-color: #3b3b3b;
               margin: 0px;
               padding: 0px;
          }

          .col-xs-1, .col-md-1, .col-md-2 {
               text-align: center;
               min-width: 180px;
          }

          .table {
               background-color: #FFFFFF;
          }

          .chart {
               width: 100%;
               height: 150px;
               margin-bottom: 25px;
          }

          .header
          {
               background-position: top;
               background-image: url('images/header-background.png');
               background-repeat: repeat-x;
               /*margin-left: 0px;*/
               background-color: #CCCCCC;
          }

          .footer-text
          {
               margin-left: 18px;
               margin-top: 65px;
               font-size: 13px;
          }

          .footer-links-div
          {
               margin-right: 15px;
               float: left;
               color: #000000;
               text-decoration: none;
          }

          .footer-links
          {
               color: #000000;
               font-family: Cambria,Georgia,Myriad;
               text-decoration: none;
          }

          #footer
          {
               /*background-image: url("/images/footer-background.jpg");*/
               /* background-attachment: scroll;
               background-position: bottom;
               background-repeat: repeat-x; */
               background-color: #ebebeb;
               color: #000000;
               font-size: 10pt;
               vertical-align: bottom;
               z-index:4;
               opacity: .95;
               padding-top: 6px;
               padding-bottom: 6px;
          }

     </style>
</head>
<body id="#Dashboard" ng-controller="DashboardData" onload="">
   <div class="header">

<div id="topbar" style='background-color: #59b8ee; border-bottom: 0px solid black; z-index: 100000; clear: both;'>
     <div style='clear: both;'></div>
     </div>
     <div style="margin: auto; text-align: center;">
          &nbsp;&nbsp;

          <img src="images/logo.png" style="padding: 10px; height: 70px; margin-right: 20px;" />
          <span style="font-weight: bold; font-size: 28px; display: inline-block; vertical-align: bottom; margin-bottom:
           10px;">Solar Dashboard</span>

          <div style="float:right; height:10px;width: auto; color: Black; padding-bottom: 5px;">
               <div style='clear: both;'></div>
          </div>
     </div>
</div>
     <div class="wrapper container-fluid">
          <div id="GaugeLayer" class="row-fluid" style="margin-top: 20px;">
               <!--<div class="col-xs-1 col-md-1 col-md-offset-1"><span id="soc"></span></div>
               <div class="col-xs-1 col-md-1"><span id="voltage"></span></div>
               <div class="col-xs-1 col-md-1"><span id="kwh_in"></span></div>
               <div class="col-xs-1 col-md-1"><span id="kwh_out"></span></div>
               <div class="col-xs-1 col-md-1"><span id="kwh_net"></span></div>
               <div class="col-xs-1 col-md-1"><span id="buy_watts"></span></div>
               <div class="col-xs-1 col-md-1"><span id="consumption_watts"></span></div>
               <div class="col-xs-1 col-md-1"><span id="pv_watts"></span></div>
               <div class="col-xs-1 col-md-1"><span id="pv_kwh"></span></div>
               <div class="col-xs-1 col-md-1"><span id="inv_in"></span></div>-->
          </div>
     </div>
     <!--<div class="wrapper container-fluid">
          <div class="row-fluid" style="margin-top: 15px;">
               <div id="graphColumn" class="col-md-12" style="margin-bottom: 25px;">
                    Start<br />
                    <input type="number" class="form-control" uib-datepicker-popup ng-model="number">
                    End<br />
                    <div style="margin-bottom: 5px;">
                         Ending <input type="date" class="form-control" uib-datepicker-popup ng-model="dt"
                         is-open="status.opened" min-date="minDate" max-date="maxDate" datepicker-options="dateOptions" date-disabled="disabled(date, mode)" ng-required="true" close-text="Close" />
                    </div>
                    <div id="buy_chart" class="chart"></div>
                    <div id="watts_chart" class="chart"></div>
                    <div id="voltage_chart" class="chart"></div>
                    <div id="generator_chart" class="chart"></div>
                    <div id="solar_chart" class="chart"></div>
                    <div id="soc_chart" class="chart"></div>
                    <div id="kwh_in_chart" class="chart"></div>
                    <div id="kwh_out_chart" class="chart"></div>
                    <div id="kwh_net_chart" class="chart"></div>
               </div>
          </div>
     </div>-->

     <div id="footer" class="footer" style="position:fixed;bottom:0px;width:100%; height: 35px;">
          <div style="padding-left: 25px; padding-right: 15px; text-decoration: none; float:left;">
               &copy;Weavver&reg;, Inc. 2016
          </div>
          <div style="float:right; padding-right: 25px; text-decoration: none;">
               <a class="footer-links" href="https://github.com/weavver/solardashboard">GitHub</a>&nbsp;&nbsp;|&nbsp;&nbsp;
               <div style="float:right;">
                    <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
                    <input type="hidden" name="cmd" value="_s-xclick">
                    <input type="hidden" name="hosted_button_id" value="SQ6E4DZWVA522">
                    <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
                    <img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
                    </form>
               </div>
          </div>
          <div style="clear: both;" />
     </div>


     <script src="/bower_components/angular/angular.js"></script>
     <script src="/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js"></script>
     <script src="/js/controllers.js"></script>
     #extra_scripts#
</body>
</html>
