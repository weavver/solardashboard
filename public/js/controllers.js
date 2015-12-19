var DashboardApp = angular.module('DashboardApp', ['ui.bootstrap']);

DashboardApp.controller('DashboardData', function ($scope, $sce, $compile, $templateRequest, $http, $interval) {

    $scope.updateData = function () {
        $http.get('/data').then(function (response) {
            //console.log(response);

            $scope.data = response.data;

            $scope.outback_data = response.data.outback_data.devstatus;

            gauges['soc'].redraw($scope.outback_data.ports[3].SOC, "%");
            gauges['voltage'].redraw($scope.outback_data.Sys_Batt_V, "v");
            gauges['kwh_in'].redraw($scope.outback_data.ports[3].In_kWh_today, "kWh");
            gauges['kwh_out'].redraw($scope.outback_data.ports[3].Out_kWh_today, "kWh");
            gauges['kwh_net'].redraw($scope.outback_data.ports[3].Net_CFC_kWh, "kWh");
            gauges['consumption_watts'].redraw($scope.data.outback_data.inv_out, "w");
            gauges['pv_watts'].redraw($scope.data.outback_data.pv_watts, "w");
            gauges['pv_kwh'].redraw($scope.data.outback_data.pv_kwh, "kWh");
            gauges['inv_in'].redraw($scope.data.outback_data.inv_in, "w");
        });
    }


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
    $interval($scope.updateDataHistory, 30000);
    $scope.updateData();
    $scope.updateDataHistory();
});
