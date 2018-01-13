/* Author:

*/


  // data stolen from http://howmanyleft.co.uk/vehicle/jaguar_'e'_type
  var tax_data = [
       {"period": "2018 Q4", "licensed": 3407, "sorned": 660},
       {"period": "2017 Q4", "licensed": 3246, "sorned": 661},
       {"period": "2016 Q4", "licensed": 3171, "sorned": 676},
       {"period": "2015 Q4", "licensed": 3155, "sorned": 681},
       {"period": "2014 Q4", "licensed": 2726, "sorned": 620},
       {"period": "2013 Q4", "licensed": 2245, "sorned": null},
       {"period": "2012 Q4", "licensed": 1289, "sorned": null}
  ];

  var array_labels = ['Licensed', 'Off the road'];
  Morris.Line({
    element: 'hero-graph',		
    data: tax_data,		
    xkey: 'period',		
    ykeys: ['licensed', 'sorned'],		
    labels: array_labels,
    nbYkeys2: 0,
    resize: true
  }).options.lineColors.forEach(function(color, a){ 
    if (array_labels[a] != undefined) {
      $('#hero-graph').parent('div').find('div.legend').append($('<span style="margin-left: 15px;"></span>').html('&#x25A0; '+array_labels[a]).css('color', color));
    }
  });

  var pie_data = [
      {label: 'Jam', value: 25 },
      {label: 'Frosted', value: 40 },
      {label: 'Custard', value: 25 },
      {label: 'Sugar', value: 10 }
  ];

  Morris.Donut({
    element: 'hero-donut-pie',
    data: pie_data,
    donutType: 'pie',
    resize: true
  }).options.colors.forEach(function(color, a){ 
      if (pie_data[a] != undefined) {
        $('#hero-donut-pie').parent('div').find('div.legend').append($('<span style="margin-left: 15px;"></span>').html('&#x25A0; '+pie_data[a].label).css('color', color));
      }
    });

  Morris.Donut({
    element: 'hero-donut',
    data: pie_data,
    donutType: 'donut',
    showPercentage: true,
    dataLabels: true,
    resize: true
  }).options.colors.forEach(function(color, a){ 
      if (pie_data[a] != undefined) {
        $('#hero-donut').parent('div').find('div.legend').append($('<span style="margin-left: 15px;"></span>').html('&#x25A0; '+pie_data[a].label).css('color', color));
      }
    });

  array_labels = ['iPhone', 'iPad', 'iPod Touch'];
  Morris.Area({
    element: 'hero-area',
    data: [
      {period: '2016 Q1', iphone: 2666, ipad: null, itouch: 2647},
      {period: '2016 Q2', iphone: 2778, ipad: 2294, itouch: 2441},
      {period: '2016 Q3', iphone: 4912, ipad: 1969, itouch: 2501},
      {period: '2016 Q4', iphone: 3767, ipad: 3597, itouch: 5689},
      {period: '2017 Q1', iphone: 6810, ipad: 1914, itouch: 2293},
      {period: '2017 Q2', iphone: 5670, ipad: 4293, itouch: 1881},
      {period: '2017 Q3', iphone: 4820, ipad: 3795, itouch: 1588},
      {period: '2017 Q4', iphone: 15073, ipad: 5967, itouch: 5175},
      {period: '2018 Q1', iphone: 10687, ipad: 4460, itouch: 2028},
      {period: '2018 Q2', iphone: 8432, ipad: 5713, itouch: 1791}
    ],
    xkey: 'period',
    ykeys: ['iphone', 'ipad', 'itouch'],
    labels: array_labels,
    pointSize: 2,
    hideHover: 'auto',
    dataLabels: false,
    resize: true
  }).options.lineColors.forEach(function(color, a){ 
    if (array_labels[a] != undefined) {
      $('#hero-area').parent('div').find('div.legend').append($('<span style="margin-left: 15px;"></span>').html('&#x25A0; '+array_labels[a]).css('color', color));
    }
  });

  array_labels = ['Geekbench', 'Satisfaction'];
  Morris.Bar({
    element: 'hero-bar',
    data: [
      {device: 'iPhone 6', geekbench: 136, satisfaction: 86},
      {device: 'iPhone 7', geekbench: 137, satisfaction: 88},
      {device: 'iPhone 7S', geekbench: 275, satisfaction: 87},
      {device: 'iPhone 8', geekbench: 380, satisfaction: 86},
      {device: 'iPhone 8 Plus', geekbench: 655, satisfaction: 88},
      {device: 'iPhone X', geekbench: 1571, satisfaction: 96}
    ],
    xkey: 'device',
    ykeys: ['geekbench', 'satisfaction'],
    labels: array_labels,
    barRatio: 0.4,
    xLabelAngle: 35,
    nbYkeys2: 1,
    postUnits2: '%',
    resize: true,
    hideHover: 'auto'
  }).options.barColors.forEach(function(color, a){ 
    if (array_labels[a] != undefined) {
      $('#hero-bar').parent('div').find('div.legend').append($('<span style="margin-left: 15px;"></span>').html('&#x25A0; '+array_labels[a]).css('color', color));
    }
  });

  array_labels = ['Geekbench'];
  Morris.Bar({
    element: 'hero-bar-horizontal',
    data: [
      {device: 'iPhone 6', geekbench: 136, satisfaction: 86},
      {device: 'iPhone 7', geekbench: 137, satisfaction: 88},
      {device: 'iPhone 7S', geekbench: 275, satisfaction: 87},
      {device: 'iPhone 8', geekbench: 380, satisfaction: 86},
      {device: 'iPhone 8 Plus', geekbench: 655, satisfaction: 88},
      {device: 'iPhone X', geekbench: 1571, satisfaction: 96}
    ],
    xkey: 'device',
    ykeys: ['geekbench'],
    labels: array_labels,
    barRatio: 0.4,
    xLabelAngle: 35,
    nbYkeys2: 0,
    postUnits2: '%',
    resize: true,
    horizontal: true,
    hideHover: 'always'
  }).options.barColors.forEach(function(color, a){ 
    if (array_labels[a] != undefined) {
      $('#hero-bar-horizontal').parent('div').find('div.legend').append($('<span style="margin-left: 15px;"></span>').html('&#x25A0; '+array_labels[a]).css('color', color));
    }
  });

  new Morris.Line({
    element: 'examplefirst',
    xkey: 'year',
    ykeys: ['value'],
    labels: ['Value'],
    data: [
      {year: '2014', value: 20},
      {year: '2015', value: 10},
      {year: '2016', value: 5},
      {year: '2017', value: 5},
      {year: '2018', value: 20}
    ],
    resize: true
  });



