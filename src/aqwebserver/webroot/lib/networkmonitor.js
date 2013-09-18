/***************************************************************************
networkmonitor.js
-------------------
 begin                : 13/11/2010
 copyright            : (C) 2003-2010 by InfoSiAL S.L.
 email                : mail@infosial.com
***************************************************************************/
/***************************************************************************
 *   This program is free software; you can redistribute it and/or modify  *
 *   it under the terms of the GNU General Public License as published by  *
 *   the Free Software Foundation; version 2 of the License.               *
 ***************************************************************************/
/***************************************************************************
   Este  programa es software libre. Puede redistribuirlo y/o modificarlo
   bajo  los  términos  de  la  Licencia  Pública General de GNU   en  su
   versión 2, publicada  por  la  Free  Software Foundation.
 ***************************************************************************/

var netLimN = 4;
var netWidthChart = 320.0;
var netHeightChart = 130.0;
var netTopChart = 30.0;
var netLeftChart = 10.0;
var netDeltaX = 16.0;
var netMaxY = 32768.0;
var netStepsY = 4;
var netRelY = (netHeightChart / netMaxY);

function toStrIECUnit(val) {
  if (val < 1024)
    return Math.round(val).toString() + ' byte';
  if (val < 1048576) {
    val /= 1024;
    return val.toFixed(1).toString() + ' KiB';
  }
  if (val < 1073741824) {
    val /= 1048576;
    return val.toFixed(1).toString() + ' MiB';
  }
  val /= 1073741824;
  return val.toFixed(1).toString() + ' GiB';
}

function calcChartX(x) {
  if (x <= 0)
    return 0;
  return x - (Math.floor(x / netWidthChart) * netWidthChart);
}

function calcChartY(y) {
  if (y <= 0)
    return netHeightChart;
  if (y > netMaxY)
    return 1.0;
  return netHeightChart - (netRelY * y);
}

function drawYAxis(ctx) {
  var step = netMaxY / netStepsY;
  var xx = netLeftChart + netWidthChart;

  ctx.strokeStyle = '#bbbbbb';
  for ( var i = 1; i <= netStepsY; ++i) {
    var ss = i * step;
    var yy = Math.floor(netTopChart + calcChartY(ss)) + 0.5;

    ctx.fillStyle = '#393d41';
    ctx.fillRect(netWidthChart + 10, yy, 51, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(toStrIECUnit(ss) + '/s', netWidthChart + 59, yy + 8);

    ctx.beginPath();
    ctx.moveTo(xx - 1.5, yy);
    ctx.lineTo(xx - 1.0, yy);
    ctx.stroke();
  }
}

function drawTimelineMark(ctx, second, x, y) {
  ctx.fillStyle = '#bbbbbb';
  ctx.fillRect(x, y, 1.0, netHeightChart);
  ctx.fillText(second.toString() + ' s.', x + 1.0, y + 10.0);
}

function drawBaseNetMonitor(ctx) {
  resetStyleState(ctx);

  ctx.fillStyle = '#393d41';
  ctx.fillRect(5, 5, netWidthChart + 59, netHeightChart + 85);
  ctx.strokeStyle = '#202020';
  ctx.strokeRect(5, 5, netWidthChart + 59, netHeightChart + 85);
  ctx.fillStyle = '#202020';
  ctx.fillRect(netLeftChart, netLeftChart, netWidthChart + 50, 15);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('AbanQ Nebula Network Monitor', 14, 20);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.fillText('Sending', 72, netHeightChart + 52);
  ctx.fillText('Total', 72, netHeightChart + 65);
  ctx.fillText('Average', 72, netHeightChart + 78);
  ctx.fillText('Receiving', 227, netHeightChart + 52);
  ctx.fillText('Total', 227, netHeightChart + 65);
  ctx.fillText('Average', 227, netHeightChart + 78);

  var tt = Number(netHeightChart + 65).toString();
  var tb = Number(netHeightChart + 45).toString();

  ctx.fillStyle = '#8d519e';
  ctx.fillRect(75, netHeightChart + 43, 75, 11);
  ctx.fillRect(75, netHeightChart + 56, 75, 11);
  ctx.fillRect(75, netHeightChart + 69, 75, 11);
  ctx.beginPath();
  tracePath(ctx, 'm;10;' + tt + ';20;' + tb + ';30;' + tt + ';10;' + tt);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#418ebe';
  ctx.fillRect(230, netHeightChart + 43, 75, 11);
  ctx.fillRect(230, netHeightChart + 56, 75, 11);
  ctx.fillRect(230, netHeightChart + 69, 75, 11);
  ctx.beginPath();
  tracePath(ctx, 'm;155;' + tb + ';165;' + tt + ';175;' + tb + ';155;' + tb);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  drawYAxis(ctx);
}

function drawRatesNetMonitor(ctx, s, r) {
  ctx.fillStyle = '#8d519e';
  ctx.fillRect(75, netHeightChart + 43, 75, 11);
  ctx.fillStyle = '#418ebe';
  ctx.fillRect(230, netHeightChart + 43, 75, 11);

  ctx.fillStyle = '#ffffff';
  ctx.fillText(toStrIECUnit(s) + '/s', 147, netHeightChart + 52);
  ctx.fillText(toStrIECUnit(r) + '/s', 302, netHeightChart + 52);
}

function drawTotalsNetMonitor(ctx, s, r) {
  ctx.fillStyle = '#8d519e';
  ctx.fillRect(75, netHeightChart + 56, 75, 11);
  ctx.fillStyle = '#418ebe';
  ctx.fillRect(230, netHeightChart + 56, 75, 11);

  ctx.fillStyle = '#ffffff';
  ctx.fillText(toStrIECUnit(s), 147, netHeightChart + 65);
  ctx.fillText(toStrIECUnit(r), 302, netHeightChart + 65);
}

function drawAvgsNetMonitor(ctx, s, r) {
  ctx.fillStyle = '#8d519e';
  ctx.fillRect(75, netHeightChart + 69, 75, 11);
  ctx.fillStyle = '#418ebe';
  ctx.fillRect(230, netHeightChart + 69, 75, 11);

  ctx.fillStyle = '#ffffff';
  ctx.fillText(toStrIECUnit(s) + '/s', 147, netHeightChart + 78);
  ctx.fillText(toStrIECUnit(r) + '/s', 302, netHeightChart + 78);
}

function interPolNeville(x, y, xx) {
  var n = x.length;
  var xdif = new Array(n);
  var p = y.toString().split(',');
  for ( var i = 0; i < n; ++i)
    xdif[i] = xx - x[i];
  --n;
  for ( var j = 1; j <= n; j++) {
    for ( var i = n; i >= j; --i) {
      p[i] = (xdif[i] * p[i - 1] - xdif[i - j] * p[i]) / (xdif[i] - xdif[i - j]);
    }
  }
  return p[n];
}

function drawChartNetMonitor(ert, tl, n) {
  var vx = new Array();
  var vsy = new Array();
  var vry = new Array();

  for ( var i = n - netLimN; i <= n; ++i) {
    vx[vx.length] = parseFloat(i * netDeltaX);
    var tn = tl[i];
    if (tn != null) {
      vsy[vsy.length] = parseFloat(tn.RR);
      vry[vry.length] = parseFloat(tn.RW);
    } else {
      vsy[vsy.length] = 0.0;
      vry[vry.length] = 0.0;
    }
  }

  var cnvBack = ert.cnvBack;
  var ctxBack = ert.ctxBack;
  var x_ = vx[netLimN]
  var x_1 = vx[netLimN - 1];
  var cx_1 = calcChartX(x_1) + 0.5;
  var xx_ = 0;

  ctxBack.strokeStyle = '#8d519e';
  ctxBack.beginPath();
  ctxBack.moveTo(cx_1, calcChartY(interPolNeville(vx, vsy, x_1)) + 0.5);
  for ( var xx = x_1; xx <= x_; xx += 0.5) {
    xx_ = calcChartX(xx);
    if (xx_ == 0 && xx == x_)
      ctxBack.lineTo(netWidthChart + 0.5, calcChartY(interPolNeville(vx, vsy, xx)) + 0.5);
    else
      ctxBack.lineTo(xx_ + 0.5, calcChartY(interPolNeville(vx, vsy, xx)) + 0.5);
  }
  ctxBack.stroke();

  ctxBack.strokeStyle = '#418ebe';
  ctxBack.beginPath();
  ctxBack.moveTo(cx_1, calcChartY(interPolNeville(vx, vry, x_1)) + 0.5);
  for ( var xx = x_1; xx <= x_; xx += 0.5) {
    xx_ = calcChartX(xx);
    if (xx_ == 0 && xx == x_)
      ctxBack.lineTo(netWidthChart + 0.5, calcChartY(interPolNeville(vx, vry, xx)) + 0.5);
    else
      ctxBack.lineTo(xx_ + 0.5, calcChartY(interPolNeville(vx, vry, xx)) + 0.5);
  }
  ctxBack.stroke();

  drawRatesNetMonitor(ert.rootWidget.ctx, vsy[netLimN], vry[netLimN]);

  if ((n % 10) == 0)
    drawTimelineMark(ctxBack, n, xx_, 0);
}

function netServerTraffic(written, read) {
  var dte = new Date();

  if (this.timeStart == null) {
    this.timeLine = new Array();
    this.timeStart = dte.getTime();
    this.lastTime = 0;
    this.ticTac = netLimN;
    this.pixPointer = 0;

    this.cnvBack = document.createElement('canvas');
    this.cnvBack.className = 'divWidget';
    this.cnvBack.style.top = 250;
    this.cnvBack.style.left = netLeftChart;
    this.cnvBack.width = netWidthChart + 1;
    this.cnvBack.height = netHeightChart;
    this.cnvBack.style.width = toStrPx(this.cnvBack.width);
    this.cnvBack.style.height = toStrPx(this.cnvBack.height);
    this.cnvBack.style.zIndex = -1;
    this.cnvBack.style.visibility = 'hidden';
    this.ctxBack = this.cnvBack.getContext('2d');
    this.appendChild(this.cnvBack);

    this.timeLine[0] = {
      R : read,
      W : written,
      RR : 0.0,
      RW : 0.0
    };

    this.updateNetMonitor();
    this.flushBackingNetMonitor();
  } else {
    var curTime = Math.round((dte.getTime() - this.timeStart) / 1000);
    var rateRead = 0.0;
    var rateWrite = 0.0;
    var ds = curTime - this.lastTime;

    if (ds > 0) {
      var prev = this.timeLine[this.lastTime];
      rateRead = (read - prev.R) / ds;
      rateWrite = (written - prev.W) / ds;
    }

    this.timeLine[curTime] = {
      R : read,
      W : written,
      RR : rateRead,
      RW : rateWrite
    };
    this.lastTime = curTime;

    drawTotalsNetMonitor(this.rootWidget.ctx, read, written);
    drawAvgsNetMonitor(this.rootWidget.ctx, read / curTime, written / curTime);
  }
}

function updateNetMonitor() {
  var rw = this.rootWidget;

  if (rw.width != window.innerWidth || rw.height != window.innerHeight) {
    rw.width = window.innerWidth;
    rw.height = window.innerHeight;
    drawBaseNetMonitor(rw.ctx);
  }

  var dte = new Date();
  var curTime = Math.round((dte.getTime() - this.timeStart) / 1000);

  if (this.ticTac < curTime) {
    drawChartNetMonitor(this, this.timeLine, this.ticTac);
    this.ticTac++;
  }

  setTimeout((function(ert) {
    return function() {
      ert.updateNetMonitor();
    };
  })(this), 1000);
}

function flushBackingNetMonitor() {
  var ticTacX = calcChartX(this.ticTac * netDeltaX);
  var speed = (ticTacX > this.pixPointer) ? 100 - ticTacX + this.pixPointer : 100 - ticTacX;
  if (speed < 0)
    speed = 0;

  setTimeout((function(ert) {
    return function() {
      ert.flushBackingNetMonitor();
    };
  })(this), speed);

  if (this.ticTac > netLimN) {
    var rw = this.rootWidget;

    if ((this.pixPointer % 4) == 0)
      drawYAxis(rw.ctx);

    rw.ctx.drawImage(rw,
                     netLeftChart + 1.0,
                     netTopChart,
                     netWidthChart - 1.0,
                     netHeightChart,
                     netLeftChart,
                     netTopChart,
                     netWidthChart - 1.0,
                     netHeightChart);
    rw.ctx.drawImage(this.cnvBack,
                     this.pixPointer,
                     0,
                     1.0,
                     netHeightChart,
                     netLeftChart + netWidthChart - 2.0,
                     netTopChart,
                     1.0,
                     netHeightChart);
    this.ctxBack.clearRect(this.pixPointer, 0, 1.0, netHeightChart);

    this.pixPointer++;
    if (this.pixPointer > netWidthChart)
      this.pixPointer = 0;
  }
}
