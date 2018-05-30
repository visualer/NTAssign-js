
'use strict';

function drawPlot(placeholder, params) {

  let defaultRadius = 4, xMin = params.point[0] - 0.5, xMax = params.point[0] + 0.5;
  let yMin = params.isMetal ? -0.01 : params.point[1] - 0.4, yMax = params.isMetal ? 0.45 : params.point[1] + 0.4;
  let font = {
    size: 20,
    lineHeight: 20,
    family: 'serif'
  };
  let options = {
    xaxis: {
      // aver
      show: true,
      position: 'bottom',
      min: xMin,
      max: xMax,
      font: font,
      tickLength: 10,
      tickColor: 'rgb(255, 0, 0)',
      color: 'rgb(255, 0, 0)'
    },
    yaxis: {
      show: true,
      min: yMin,
      max: yMax,
      font: font,
      tickLength: 10,
      tickColor: 'rgb(0, 0, 0)',
      color: 'rgb(0, 0, 0)'
    },
    series: {
      hoverable: true
      // shadowSize: 0
    },
    grid: {
      borderColor: {
        top: 'rgb(0, 0, 255)',
        bottom: 'rgb(255, 0, 0)',
        left: 'rgb(0, 0, 0)',
        right: 'rgb(0, 0, 0)'
      },
      hoverable: true,
      minBorderMargin: 0
    }
  };

  let series = [];
  for (let i = 0; i < params.rbm.length; i++)
    series.push({
      color: 'rgb(208, 208, 208)', // use the shadow
      data: params.rbm[i],
      shadowSize: 5,
      hoverable: false
    });
  let laser = [1240 / 785, 1240 / 633, 1240 / 532];
  let laser_color = ['rgb(136, 136, 136)', 'rgb(245, 0, 0)', 'rgb(12, 127, 15)'];

  for (let i = 0; i < laser.length; i++) {
    series = series.concat([{
      id: `laser${i.toString()}`,
      color: laser_color[i],
      data: [[-10, 2 * (-10 - laser[i])], [10, 2 * (10 - laser[i])]],
      shadowSize: 0
    }, {
      id: `laser_minus${i.toString()}`,
      color: laser_color[i],
      data: [[-10, -2 * (-10 - laser[i])], [10, -2 * (10 - laser[i])]],
      shadowSize: 0
    }, {
      fillBetween: `laser${i.toString()}`,
      color: laser_color[i],
      data: [[-10, 2 * (-10 - (laser[i] - 0.1))], [10, 2 * (10 - (laser[i] - 0.1))]], // 100 meV
      lines: {
        fill: 0.3,
        lineWidth: 0
      }
    }, {
      fillBetween: `laser_minus${i.toString()}`,
      color: laser_color[i],
      data: [[-10, -2 * (-10 - (laser[i] - 0.1))], [10, -2 * (10 - (laser[i] - 0.1))]], // 100 meV
      lines: {
        fill: 0.3,
        lineWidth: 0
      }
    }, {
      fillBetween: `laser${i.toString()}`,
      color: laser_color[i],
      data: [[-10, 2 * (-10 - (laser[i] + 0.1))], [10, 2 * (10 - (laser[i] + 0.1))]], // 200 meV
      lines: {
        fill: 0.3,
        lineWidth: 0
      }
    }, {
      fillBetween: `laser_minus${i.toString()}`,
      color: laser_color[i],
      data: [[-10, -2 * (-10 - (laser[i] + 0.1))], [10, -2 * (10 - (laser[i] + 0.1))]], // 200 meV
      lines: {
        fill: 0.3,
        lineWidth: 0
      }
    }]);
  }

  for (let i = 0; i < params.all.length; i++) {
    let mod_i = (params.allLabel[i][0][0] * 2 + params.allLabel[i][0][1]) % 3;
    series.push({
      color: params.isMetal || mod_i === 2 ? 'rgb(0, 0, 0)' : 'rgb(255, 0, 0)',
      data: params.all[i],
      points: {
        show: true,
        radius: params.isMetal ? 78 / 0.1 * 0.015 / 2  : defaultRadius, //15 meV
        symbol: params.isMetal ? 'circle' : mod_i === 2 ? 'square' : 'triangle'
      },
      lines: {
        show: true
      },
      point_labels: params.allLabel[i],
      hoverable: true
    });
  }
  for (let i = 0; i < params.result.length; i++) {
    let mod_i = (params.resultLabel[i][0] * 2 + params.resultLabel[i][1]) % 3;
    series.push({
      color: params.isMetal || mod_i === 2 ? 'rgb(0, 0, 0)' : 'rgb(255, 0, 0)',
      data: [params.result[i]],
      points: {
        show: true,
        radius: params.isMetal ? 78 / 0.1 * 0.015 / 2 : defaultRadius,
        symbol: params.isMetal ? 'circle' : mod_i === 2 ? 'square' : 'triangle',
        fill: true,
        fillColor: params.isMetal || mod_i === 2 ? 'rgb(0, 0, 0)' : 'rgb(255, 0, 0)'
      },
      point_labels: [params.resultLabel[i]],
      hoverable: true
    });
  }


  // blue point is diamond, otherwise square
  if (params.pointType !== 'none') {
    series.push({
      color: params.pointType === 'green' ? 'rgb(12, 180, 15)' : 'rgb(255, 0, 0)',
      data: [params.point],
      points: {
        show: true,
        symbol: params.pointType === 'green' ? 'diamond' : 'square',
        radius: defaultRadius,
        fill: true,
        fillColor: params.pointType === 'green' ? 'rgba(0, 0, 0, 0)' : 'rgb(255, 0, 0)'
      },
      hoverable: false
    });
  }
  if (params.bluePoint !== null)
    series.push({
      color: 'rgb(0, 0, 255)',
      data: [params.bluePoint],
      points: {
        show: true,
        symbol: 'diamond',
        radius: defaultRadius,
        fill: true,
        fillColor: 'rgba(0, 0, 0, 0)'
      },
      hoverable: false,
      shadowSize: 0
    });

  let $placeholder = $(`#${placeholder}`);
  let plot = $.plot($placeholder, series, options);

  let previousPoint = null;
  $placeholder.bind('plothover', function(event, pos, item) {
    if (item) {
      if (previousPoint !== item.dataIndex) {
        previousPoint = item.dataIndex;
        $('#tooltip').remove();
        showTooltip(item.pageX, item.pageY,
          `(${item.series.point_labels[item.dataIndex][0]}, ${item.series.point_labels[item.dataIndex][1]})`);
      }
    } else {
      $('#tooltip').remove();
      previousPoint = null;
    }
  });

  if (params.isMetal) {
    for (let i = 0; i < params.all.length; i++) {
      let s = Math.floor(params.all.length / 2);
      let p = params.all[i][params.all[i].length - 1];
      let p1 = params.allLabel[i][params.all[i].length - 1];
      let o = plot.pointOffset({ x: p[0], y: p[1] });
      let axes = plot.getAxes();
      let xaxis = axes.xaxis, yaxis = axes.yaxis;
      if (i % 2 === s % 2 && p[0] <= xaxis.max && p[0] >= xaxis.min &&
        p[1] <= yaxis.max - 0.05 && p[1] >= yaxis.min + 0.05)
        $placeholder.append(`
                    <div class="series_label" style="left: ${o.left - (i === s ? 60 : 10)}px; top: ${o.top - 30}px;">
                        <p>${i === s ? '2<i>n</i>+<i>m</i>=' : ''}${p1[0] * 2 + p1[1]}</p>
                    </div>
                `);
    }
  } else {
    let mid = Math.round(params.all.length / 2);
    let pMid = params.allLabel[mid][params.all[mid].length - 1];
    let divMid = Math.floor((pMid[0] * 2 + pMid[1]) / 3); //use ceil, for right is scattered, left is dense

    for (let i = 0; i < params.all.length; i++) {
      let p = params.all[i][params.all[i].length - 1];
      let p1 = params.allLabel[i][params.all[i].length - 1];
      let o = plot.pointOffset({ x: p[0], y: p[1] });
      let axes = plot.getAxes();
      let xaxis = axes.xaxis, yaxis = axes.yaxis;
      let div = Math.round((p1[0] * 2 + p1[1]) / 3);
      let mod = (p1[0] * 2 + p1[1]) % 3;
      if (divMid % 2 === div % 2) {
        if (p[0] <= xaxis.max - 0.02 && p[0] >= xaxis.min + 0.02 && p[1] <= yaxis.max - 0.1 &&
          p[1] >= yaxis.min + 0.1) {
          let dA = {
            color: mod === 1 ? '#FF0000' : '#000000',
            left: o.left - (divMid === div ? 60 : 10),
            top: o.top - (mod === 1 ? -15 : (
                divMid === div && p[1] <= yaxis.max - 0.15 && p[1] >= yaxis.min + 0.18 ? 60 : 30
              )
            ),
            c1: divMid !== div
              ? ''
              : ((mod === 2 && p[1] <= yaxis.max - 0.15
                ? '<b>MOD2</b><br/>'
                : '') + '2<i>n</i>+<i>m</i>='),
            c2: p1[0] * 2 + p1[1],
            c3: divMid === div && mod === 1 && p[1] >= yaxis.min + 0.12
              ? '<br/><b>MOD1</b>'
              : ''
          };
          $placeholder.append(`
                        <div class="series_label" style="color:${dA.color};left:${dA.left}px;top:${dA.top - 0}px;">
                            <p>${dA.c1}${dA.c2}${dA.c3}</p>
                        </div>
                    `); // workaround to let editor know that dA.top is integer
        }
      }
    }
  }

  for (let i = 0; i < params.rbm.length; i++) {
    if (i % 2 === 0 || params.rbm.length === 1) {
      let o1 = plot.pointOffset({ x: params.rbmPos[i], y: yMax });
      $placeholder.append(`
                <div class="rbm_label" style="left:${o1.left - 15}px;top:${o1.top - 30}px;">
                    <p>${params.rbmLabel[i]}</p>
                </div>
            `);
    }
  }
}

function showTooltip(x, y, contents) {
  $(`
        <div id="tooltip" class="tooltip right in">
            <div class="tooltip-arrow" style="top: 50%;"></div>
            <div class="tooltip-inner">${contents}</div>
        </div>
    `)
    .css({
      display: 'block',
      top: y,
      left: x
    }).appendTo('body').fadeIn(200);
}

