var DashboardApp = angular.module('DashboardApp', ['ui.bootstrap']);

DashboardApp.controller('DashboardData', function ($scope, $sce, $compile, $templateRequest, $http, $interval) {


     var gauges = [];
     $scope.assertGauge = function(name, label, min, max, val, suffix) {
          $('#GaugeLayer').append('<div class="col-xs-1 col-md-1"><span id="' + name + '"></span></div>');

          if (gauges[name] == undefined) {
               var config =
               {
                    size: 150,
                    label: label,
                    min: undefined != min ? min : 0,
                    max: undefined != max ? max : 100,
                    minorTicks: 5
               };
               var range = config.max - config.min;
               config.yellowZones = [{from: config.min + range * 0.75, to: config.min + range * 0.9}];
               config.redZones = [{from: config.min + range * 0.9, to: config.max}];
               gauges[name] = new Gauge(name, config);
               gauges[name].render();
          }
          gauges[name].redraw(val, suffix);
     };

     //function getRandomValue(gauge) {
     //     var overflow = 0; //10;
     //     return gauge.config.min - overflow + (gauge.config.max - gauge.config.min + overflow * 2) * Math.random();
     //}


     $scope.updateData = function () {
          $http.get('/data').then(function (response) {
               console.log(response.data);

               // auto reloads the browser window after a code change and nodejs is reloaded
               if ($scope.data != undefined &&
                    $scope.data.boot_date != undefined &&
                    response.data != undefined &&
                    response.data.boot_date != undefined &&
                    $scope.data.boot_date != response.data.boot_date)
                    window.location.reload(false);

               $scope.data = response.data;

               if (response.data.outback_data == undefined ||
                    response.data.outback_data.devstatus == undefined ||
                    response.data.outback_data.devstatus.ports == undefined)
                    return;

               $scope.outback_data = response.data.outback_data.devstatus;

               var total_fxr_watts_sell = 0;
               var total_fxr_watts_buy = 0;
               var total_cc_watts_in = 0;
               var total_cc_kwh = 0;

               $scope.outback_data.ports.forEach(function (item) {
                    var gauge_id = 'gauge-' + item.Port;
                    var gauge_name = item.Dev;
                    if (item.Type != undefined)
                         gauge_name += '-' + item.Type;

                         switch (item.Dev) {
                              case "FXR":
                                   var inv = item;
                                   item.watts_sell = (inv.Inv_I_L2 * inv.VAC_out_L2) + ((inv.Buy_I_L2 * inv.VAC_out_L2) - (inv.Chg_I_L2 * inv.VAC1_in_L2));
                                   item.watts_buy  = (inv.Buy_I_L2 * inv.VAC1_in_L2);

                                   total_fxr_watts_sell += item.watts_sell;
                                   total_fxr_watts_buy += item.watts_buy;

                                   $scope.assertGauge(gauge_id + '-inv_sell', gauge_name, 0, 4000, item.watts_sell, 'w sell');
                                   $scope.assertGauge(gauge_id + '-inv_buy', gauge_name, 0, 3000, item.watts_buy, 'w buy');
                                   $scope.assertGauge(gauge_id + '-inv_v', gauge_name, 0, 60, item.Batt_V, 'v');
                                   break;

                              case "CC":
                                   var a = item.Out_I * item.Batt_V;
                                   var cc_watts = Math.round(a / 10) * 10;
                                   total_cc_watts_in += cc_watts;
                                   total_cc_kwh += item.Out_kWh;

                                   $scope.assertGauge(gauge_id + '-cc_watts', gauge_name, 0, 4000, cc_watts, 'w');
                                   $scope.assertGauge(gauge_id + '-kwh_in', gauge_name, 0, 40, item.Out_kWh, ' kWh');
                                   break;

                              case "FNDC":
                                   $scope.assertGauge(gauge_id + '-soc', gauge_name, 0, 100, item.SOC, '%');
                                   $scope.assertGauge(gauge_id + '-v', gauge_name, 0, 60, item.Batt_V, 'v');
                                   $scope.assertGauge(gauge_id + '-in_kwh', gauge_name, 0, 50, item.In_kWh_today, ' kWh In');
                                   $scope.assertGauge(gauge_id + '-out_kwh', gauge_name, 0, 50, item.Out_kWh_today, ' kWh Out');
                                   break;
                         }
               });

               $scope.assertGauge('total_cc_watts_in', 'CC Total', 0, 4500, total_cc_watts_in, 'w');
               $scope.assertGauge('total_cc_kwh', 'CC Total', 0, 4500, total_cc_kwh, 'kWh');

               $scope.assertGauge('total_fxr_watts_buy', 'Total FXR In', 0, 8000, total_fxr_watts_buy, 'w');
               $scope.assertGauge('total_fxr_watts_sell', 'Total FXR Out', 0, 3000, total_fxr_watts_sell, 'w');

               $scope.assertGauge('total_watts_in', 'Total In', 0, 6000, total_fxr_watts_buy + total_cc_watts_in, 'w');
               $scope.assertGauge('total_watts_out', 'Total Out', 0, 12000, total_fxr_watts_sell, 'w');
          });
     };

     $scope.updateDataHistory = function () {
          $http.get('/data_history').then(function (response) {
               drawChart('watts_chart', 'Solar System - Watts', 'Watts', response.data.outback_watts);
               drawChart('voltage_chart', 'Solar System - Voltage', 'Voltage', response.data.outback_sys_batt_v);
               drawChart('generator_chart', 'Solar System - Generator Charge', 'Watts', response.data.outback_gen_charge_watts);
               drawChart('solar_chart', 'Solar System - Solar Watts', 'Watts', response.data.outback_pv_watts);
               drawChart('soc_chart', 'Solar System - SOC', '%', response.data.outback_sys_soc);
               drawChart('kwh_in_chart', 'Solar System - kWh In', 'kWh', response.data.outback_kwh_in);
               drawChart('kwh_out_chart', 'Solar System - kWh Out', 'kWh', response.data.outback_kwh_out);
               drawChart('kwh_net_chart', 'Solar System - kWh Net', 'kWh', response.data.outback_kwh_net);
          });
     };

     function drawChart(chartId, title, label, data_history) {
          if (!data_history) {
               console.log('there is no data history for this chart: ' + chartId);
               return;
          }
          
        var data = new google.visualization.DataTable();

        var sampleData = [
            //['1', 33],
            //['2', 44]
        ];
        data.addColumn('datetime', 'Date Time');
        data.addColumn('number', label);

        var lastDateTime = null;
        for (i = 0; i < data_history.length; i++) {
            //var datetime = new Date(data_history[i].timestamp + ' UTC');
             //console.log(data_history[i]);
            var datetime = new Date(data_history[i].timestamp_unix);

            if (i == 0) {
                lastDateTime = datetime;
            }

            while (lastDateTime < new Date(datetime.getTime() - 60000)) {
                lastDateTime = new Date(lastDateTime.getTime() + 60000);
                var z = [lastDateTime, null];
                sampleData.push(z);
            }

            var row = [datetime, data_history[i].value];
            sampleData.push(row);
              console.log(data_history[i]);

            lastDateTime = datetime;
        }

        data.addRows(sampleData);

        //console.log(sampleData);
        var options = {
            title: title,
            titlePosition: 'out',
            curveType: 'function',
            'chartArea': {'left': 50, 'width': '95%'},
            legend: {position: 'bottom'},
            interpolateNulls: false
        };

        var chart = new google.visualization.LineChart(document.getElementById(chartId));
        chart.draw(data, options);
    }

    $scope.loadExtra = function (callback, fileName) {
        var templateUrl = $sce.getTrustedResourceUrl('extras/' + fileName);
        $templateRequest(templateUrl).then(function (template) {
            $('#extraTable').html(template).contents();
            $compile($('#extraTable'))($scope);
            callback();
        }, function () {
        });
    }

    $interval($scope.updateData, 5000);
    //$interval($scope.updateDataHistory, 30000);
    $scope.updateData();
    //$scope.updateDataHistory();
});
