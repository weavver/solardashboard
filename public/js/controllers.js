
﻿

var DashboardApp = angular.module('DashboardApp', []);

DashboardApp.controller('DashboardData', function ($scope, $sce, $compile, $templateRequest, $http, $interval) {
     $scope.voltage = 0;
     $scope.consumption_watts = 0;
     $scope.pv_in = 0;

     $scope.updateData = function () {
          $http.get('/data').then(function (response) {
               //console.log(response);
               $scope.financial = response.data.financial;

               $scope.outback_data = response.data.outback_data.devstatus;
               $scope.voltage = $scope.outback_data.Sys_Batt_V;
               var cc = $scope.outback_data.ports[1];
               var a = cc.Out_I * cc.Batt_V;
               $scope.pv_in = Math.round(a / 10) * 10;
               var inv = $scope.outback_data.ports[0];
               $scope.consumption_watts = (inv.Inv_I_L2 * inv.VAC_out_L2) + ((inv.Buy_I_L2 * inv.VAC_out_L2) - (inv.Chg_I_L2 * inv.VAC1_in_L2));
               $scope.inv_in = inv.Chg_I_L2 * inv.VAC1_in_L2;

               drawChart('watts_chart', 'Solar System - Watts', 'Watts', response.data.data_watts);
               drawChart('voltage_chart', 'Solar System - Voltage', 'Voltage', response.data.data_voltage);
               drawChart('generator_chart', 'Solar System - Generator Charge', 'Watts', response.data.data_generator);
               drawChart('solar_chart', 'Solar System - Solar', 'Watts', response.data.data_solar);
               drawChart('soc_chart', 'Solar System - SOC', '%', response.data.data_soc);

               gauges['soc'].redraw($scope.outback_data.ports[2].SOC, "%");
               gauges['voltage'].redraw($scope.outback_data.Sys_Batt_V, "v");
               gauges['kwh_in'].redraw($scope.outback_data.ports[2].In_kWh_today, "kWh");
               gauges['kwh_out'].redraw($scope.outback_data.ports[2].Out_kWh_today, "kWh");
               gauges['consumption_watts'].redraw($scope.consumption_watts, "w");
               gauges['pv_in'].redraw($scope.pv_in, "w");
               gauges['inv_in'].redraw($scope.inv_in, "w");
          });
     }

     function drawChart(chartId, title, label, data_history) {
         var data = new google.visualization.DataTable();

         var sampleData = [
               //['1', 33],
               //['2', 44]
         ];
         data.addColumn('datetime', 'Date Time');
         data.addColumn('number', label);

         var lastDateTime = null;
         for (i = 0; i < data_history.length; i++) {
              var datetime = new Date(data_history[i].timestamp + ' UTC');
              
              if (i == 0) {
                   lastDateTime = datetime;
              }
              
              while (lastDateTime < new Date(datetime.getTime() - 60000)) {
                   lastDateTime = new Date(lastDateTime.getTime() + 60000);
                   var z = [lastDateTime, null];
                   sampleData.push(z);
              }

              var row = [datetime, data_history[i].Value];
              sampleData.push(row);

              lastDateTime = datetime;
         }

         data.addRows(sampleData);

         //console.log(sampleData);
         var options = {
              title: title,
              titlePosition: 'out',
              curveType: 'function',
              'chartArea': { 'left': 50, 'width': '95%' },
              legend: { position: 'bottom' },
              interpolateNulls: false
         };

         var chart = new google.visualization.LineChart(document.getElementById(chartId));
         chart.draw(data, options);
    }

    $scope.loadExtra = function (callback, fileName)
    {
          var templateUrl = $sce.getTrustedResourceUrl('extras/' + fileName);
          $templateRequest(templateUrl).then(function (template) {
		$('#extraTable').html(template).contents();
                $compile($('#extraTable'))($scope);
               callback();
          }, function () { });
     }

     $interval($scope.updateData, 10000);
     $scope.updateData();
});
