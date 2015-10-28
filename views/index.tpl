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
          var gauges = [];
          function createGauge(name, label, min, max) {
               var config =
               {
                    size: 150,
                    label: label,
                    min: undefined != min ? min : 0,
                    max: undefined != max ? max : 100,
                    minorTicks: 5
               }
               var range = config.max - config.min;
               config.yellowZones = [{ from: config.min + range * 0.75, to: config.min + range * 0.9 }];
               config.redZones = [{ from: config.min + range * 0.9, to: config.max }];
               gauges[name] = new Gauge(name, config);
               gauges[name].render();
          }

          function createGauges() {
               createGauge("soc", "SOC", 0, 100);
               createGauge("voltage", "Voltage", 0, 60);
               createGauge("kwh_in", "kWh In", 0, 60);
               createGauge("kwh_out", "kWh Out", 0, 60);
               createGauge("consumption_watts", "Watts", 0, 5000);
               createGauge("pv_in", "Solar", 0, 2000);
               createGauge("inv_in", "Charge", 0, 5000);
          }

          function getRandomValue(gauge) {
               var overflow = 0; //10;
               return gauge.config.min - overflow + (gauge.config.max - gauge.config.min + overflow * 2) * Math.random();
          }

          function initialize() {
               createGauges();
          }

     </script>

     <style type="text/css">
          body {
               background-color: #003D5C;
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
               height: 200px;
               margin-bottom: 25px;
          }
     </style>
</head>
<body id="#Dashboard" ng-controller="DashboardData" onload="initialize()">
     <div class="wrapper container-fluid">
          <div class="row-fluid" style="margin-top: 20px;">
               <div class=" col-xs-1 col-md-1 col-md-offset-1"><span id="soc"></span></div>
               <div class="col-xs-1 col-md-1"><span id="voltage"></span></div>
               <div class="col-xs-1 col-md-1"><span id="kwh_in"></span></div>
               <div class="col-xs-1 col-md-1"><span id="kwh_out"></span></div>
               <div class="col-xs-1 col-md-1"><span id="consumption_watts"></span></div>
               <div class="col-xs-1 col-md-1"><span id="pv_in"></span></div>
               <div class="col-xs-1 col-md-1"><span id="inv_in"></span></div>
          </div>
<div class="row-fluid" style="margin-top: 20px;">
      <input type="date" class="form-control" uib-datepicker-popup ng-model="dt" is-open="status.opened" min-date="minDate" max-date="maxDate" datepicker-options="dateOptions" date-disabled="disabled(date, mode)" ng-required="true" close-text="Close" />
</div>
     </div>
     <div class="wrapper container-fluid">
          <div class="row-fluid" style="margin-top: 15px;">
               <div id="graphColumn" class="col-md-12" style="margin-bottom: 25px;">
                    <div id="watts_chart" class="chart"></div>
                    <div id="voltage_chart" class="chart"></div>
                    <div id="generator_chart" class="chart"></div>
                    <div id="solar_chart" class="chart"></div>
                    <div id="soc_chart" class="chart"></div>
               </div>
          </div>
     </div>
     <script src="/bower_components/angular/angular.js"></script>
     <script src="/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js"></script>
     <script src="/js/controllers.js"></script>
     #extra_scripts#
</body>
</html>
