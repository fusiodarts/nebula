/***************************************************************************
drawutils.js
-------------------
 begin                : 14/11/2010
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

function drawPoint(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.beginPath();
  if (ctx.lineCap == 'round')
    ctx.arc(x + ctx.delta, y + ctx.delta, ctx.lineWidth / 2, 0, Math.PI * 2, true);
  else
    ctx.rect(x, y, ctx.lineWidth, ctx.lineWidth);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  traceLine(ctx, x1, y1, x2, y2);
  ctx.stroke();
}

function tracePoint(ctx, x, y) {
  if (ctx.lineCap == 'round')
    ctx.arc(x + ctx.delta, y + ctx.delta, ctx.lineWidth / 2, 0, Math.PI * 2, true);
  else
    ctx.rect(x, y, ctx.lineWidth, ctx.lineWidth);
}

function traceLine(ctx, x1, y1, x2, y2) {
  ctx.moveTo(x1 + ctx.delta, y1 + ctx.delta);
  ctx.lineTo(x2 + ctx.delta, y2 + ctx.delta);
}

function tracePath(ctx, ee) {
  var els = ee.split(';');
  for ( var j = 0; j < els.length; ++j) {
    switch (els[j]) {
      case 'm':
        ctx.moveTo(toFloatCoal(els[++j]) + ctx.delta, toFloatCoal(els[++j]) + ctx.delta);
        break;
      case 'c':
        ctx.bezierCurveTo(toFloatCoal(els[++j]),
                          toFloatCoal(els[++j]),
                          toFloatCoal(els[++j]),
                          toFloatCoal(els[++j]),
                          toFloatCoal(els[++j]),
                          toFloatCoal(els[++j]));
        break;
      default:
        ctx.lineTo(toFloatCoal(els[j]) + ctx.delta, toFloatCoal(els[++j]) + ctx.delta);
    }
  }
}

function tracePathClip(ctx, ee) {
  var els = ee.split(';');
  for ( var j = 0; j < els.length; ++j) {
    switch (els[j]) {
      case 'm':
        ctx.moveTo(toFloatCoal(els[++j]), toFloatCoal(els[++j]));
        break;
      case 'c':
        ctx.bezierCurveTo(toFloatCoal(els[++j]),
                          toFloatCoal(els[++j]),
                          toFloatCoal(els[++j]),
                          toFloatCoal(els[++j]),
                          toFloatCoal(els[++j]),
                          toFloatCoal(els[++j]));
        break;
      default:
        ctx.lineTo(toFloatCoal(els[j]), toFloatCoal(els[++j]));
    }
  }
}

function buildPathObject(pp, ee) {
  var els = ee.split(';');
  pp.length = 0;
  for ( var j = 0; j < els.length; ++j) {
    switch (els[j]) {
      case 'm':
        pp.push(null);
        pp.push(toFloatCoal(els[++j]));
        pp.push(toFloatCoal(els[++j]));
        break;
      case 'c':
        pp.push(Infinity);
        pp.push(toFloatCoal(els[++j]));
        pp.push(toFloatCoal(els[++j]));
        pp.push(toFloatCoal(els[++j]));
        pp.push(toFloatCoal(els[++j]));
        pp.push(toFloatCoal(els[++j]));
        pp.push(toFloatCoal(els[++j]));
        break;
      default:
        pp.push(toFloatCoal(els[j]));
        pp.push(toFloatCoal(els[++j]));
    }
  }
}

function tracePathObjectClip(ctx, pp) {
  for ( var j = 0; j < pp.length; ++j) {
    switch (pp[j]) {
      case null:
        ctx.moveTo(pp[++j], pp[++j]);
        break;
      case Infinity:
        ctx.bezierCurveTo(pp[++j], pp[++j], pp[++j], pp[++j], pp[++j], pp[++j]);
        break;
      default:
        ctx.lineTo(pp[j], pp[++j]);
    }
  }
}

function createLinearGradient(ctx, x0, y0, x1, y1, ss) {
  var lg = ctx.createLinearGradient(x0, y0, x1, y1);
  var stops = ss.split(';'), stop;
  for ( var j = 0; j < stops.length; ++j) {
    stop = stops[j].split(':');
    lg.addColorStop(toFloatCoal(stop[0]), stop[1]);
  }
  return lg;
}
