var DashboardApp = angular.module('DashboardApp', ['ui.bootstrap']);

DashboardApp.controller('DashboardData', function ($scope, $sce, $compile, $templateRequest, $http, $interval) {

    $scope.updateData = function () {
        $http.get('/data').then(function (response) {
            //console.log(response);

            $scope.data = response.data;

            $scope.outback_data = response.data.outback_data.devstatus;

            gauges['soc'].redraw($scope.outback_data.ports[2].SOC, "%");
            gauges['voltage'].redraw($scope.outback_data.Sys_Batt_V, "v");
            gauges['kwh_in'].redraw($scope.outback_data.ports[2].In_kWh_today, "kWh");
            gauges['kwh_out'].redraw($scope.outback_data.ports[2].Out_kWh_today, "kWh");
            gauges['consumption_watts'].redraw($scope.data.outback_data.inv_out, "w");
            gauges['pv_in'].redraw($scope.data.outback_data.pv_in, "w");
            gauges['inv_in'].redraw($scope.data.outback_data.inv_in, "w");

            drawChart('watts_chart', 'Solar System - Watts', 'Watts', response.data.outback_watts);
            drawChart('voltage_chart', 'Solar System - Voltage', 'Voltage', response.data.outback_sys_batt_v);
            drawChart('generator_chart', 'Solar System - Generator Charge', 'Watts', response.data.outback_gen_charge_watts);
            drawChart('solar_chart', 'Solar System - Solar', 'Watts', response.data.outback_pv_watts);
            drawChart('soc_chart', 'Solar System - SOC', '%', response.data.data_soc);
        });
    }

    function drawChart(chartId, title, label, data_history) {
    if (!data_history)
          return;
          
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

    $interval($scope.updateData, 10000);
    $scope.updateData();
});