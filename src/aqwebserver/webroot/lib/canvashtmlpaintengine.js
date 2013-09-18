/***************************************************************************
canvashtmlpaintengine.js
-------------------
 begin                : 14/04/2010
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

function postPaintEvent(event) {
  if (this.pendingPaintEvents.length == 0) {
    setTimeout((function(ert) {
      return function() {
        ert.processPaintEvents();
      };
    })(this), 0);
  }
  this.pendingPaintEvents.push(event);
}

function processPaintEvents() {
  if (this.ignoreEvents)
    return;
  while (this.pendingPaintEvents.length) {
    var ev = this.pendingPaintEvents.shift();
    if (!ev.elem.draw(ev))
      break;
  }
}

function loadImage() {
  setTimeout((function(ert) {
    return function() {
      ert.processPaintEvents();
    };
  })(this.rootElement), 0);

  dojo.disconnect(this.tmpImg.hndl);
  this.ctx.drawImage(this.tmpImg,
                     this.tmpImg.sx,
                     this.tmpImg.sy,
                     this.tmpImg.sw,
                     this.tmpImg.sh,
                     this.tmpImg.dx,
                     this.tmpImg.dy,
                     this.tmpImg.sw,
                     this.tmpImg.sh);
}

function updatePen(ctx, rootE, str) {
  if (str.indexOf(';') == -1) {
    ctx.strokeStyle = cachedColor(rootE, parseInt(str));
    return;
  }

  var ss = str.split(';');
  // ### TODO pen style ss[0], for now only solid
  //var st = parseInt(ss[0]);

  if (ss.length == 2) {
    ctx.lineWidth = 1.0;
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'butt';
    ctx.strokeStyle = cachedColor(rootE, parseInt(ss[1]));
    ctx.delta = parseFloat((ctx.lineWidth % 2) / 2.0);
    return;
  }

  var w = toFloatCoal(ss[1]);
  ctx.lineWidth = (w <= 0 ? 1.0 : w);

  var js = parseInt(ss[2]);
  if (js == Qt.MiterJoin)
    ctx.lineJoin = 'miter';
  else if (js == Qt.BevelJoin)
    ctx.lineJoin = 'bevel';
  else
    ctx.lineJoin = 'round';

  var cs = parseInt(ss[3]);
  if (cs == Qt.FlatCap)
    ctx.lineCap = 'butt';
  else if (cs == Qt.SquareCap)
    ctx.lineCap = 'square';
  else
    ctx.lineCap = 'round';

  ctx.strokeStyle = cachedColor(rootE, parseInt(ss[4]));
  ctx.delta = (ctx.lineWidth % 2) / 2;
}

function updateBrush(ctx, rootE, str) {
  if (str.indexOf(';') == -1) {
    ctx.fillStyle = cachedColor(rootE, parseInt(str));
    return;
  }

  var ss = str.split(';');
  // ### TODO brush style ss[0], for now only solid
  //var st = parseInt(ss[0]);

  ctx.fillStyle = cachedColor(rootE, parseInt(ss[1]));
}

function styleState(ctx) {
  var st = new Object();
  st.w = ctx.lineWidth;
  st.j = ctx.lineJoin;
  st.c = ctx.lineCap;
  st.s = ctx.strokeStyle;
  st.f = ctx.fillStyle;
  st.fn = ctx.font;
  st.dl = ctx.delta;
  return st;
}

function setStyleState(ctx, st) {
  ctx.lineWidth = st.w;
  ctx.lineJoin = st.j;
  ctx.lineCap = st.c;
  ctx.strokeStyle = st.s;
  ctx.fillStyle = st.f;
  ctx.font = st.fn;
  ctx.delta = st.dl;
}

function resetStyleState(ctx) {
  ctx.lineWidth = 1.0;
  ctx.lineJoin = 'miter';
  ctx.lineCap = 'butt';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.delta = 0.5;
}

function activeClip(ctx, elem) {
  if (elem.activeClipOn || elem.pathActiveClip.length == 0)
    return;
  ctx.save();
  ctx.beginPath();
  tracePathObjectClip(ctx, elem.pathActiveClip);
  ctx.clip();
  elem.activeClipOn = true;
}

function clearActiveClip(ctx, elem) {
  if (!elem.activeClipOn)
    return;
  var sty = styleState(ctx);
  ctx.restore();
  elem.activeClipOn = false;
  setStyleState(ctx, sty);
}

function paintClip(ctx, elem) {
  if (elem.paintClipOn || elem.pathPaintClip.length == 0)
    return;
  ctx.save();
  ctx.beginPath();
  tracePathObjectClip(ctx, elem.pathPaintClip);
  ctx.clip();
  elem.paintClipOn = true;
}

function clearPaintClip(ctx, elem) {
  clearActiveClip(ctx, elem);
  if (!elem.paintClipOn)
    return;
  var sty = styleState(ctx);
  ctx.restore();
  elem.paintClipOn = false;
  setStyleState(ctx, sty);
}

function frameClip(ctx, ctn, elem) {
  if (elem.frameClipOn)
    return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(pointX(ctn.inPos), pointY(ctn.inPos), pointX(ctn.inSize), pointY(ctn.inSize));
  ctx.clip();
  elem.frameClipOn = true;
}

function clearFrameClip(ctx, elem) {
  clearPaintClip(ctx, elem);
  if (!elem.frameClipOn)
    return;
  var sty = styleState(ctx);
  ctx.restore();
  elem.frameClipOn = false;
  setStyleState(ctx, sty);
}

function draw(event) {
  var ctx = this.ctx;
  var rootE = this.rootElement;
  var doNextPaintEvent = true;

  if (this.ctn.sizeDirty)
    updateCanvasSize(this);

  switch (event.T) {
    case AQ.XClearArea: {
      var rr = listToArray(event.R);
      ctx.clearRect(rr[0], rr[1], rr[2], rr[3]);
      break;
    }

    case AQ.XBegin:
      if (this.style.zIndex == 0)
        this.style.zIndex = 1;
      if (event.E != null) {
        buildPathObject(this.pathPaintClip, event.E);
        paintClip(ctx, this);
      }
      break;

    case AQ.XEnd:
      clearPaintClip(ctx, this);
      this.pathPaintClip.length = 0;
      this.pathActiveClip.length = 0;
      break;

    case AQ.XDrawPoint: {
      if (event.U == 1 || event.U == 3) {
        updatePen(ctx, rootE, event.P);
      }
      var nn = listToArray(event.N);
      drawPoint(ctx, nn[0], nn[1]);
      break;
    }

    case AQ.XDrawLine: {
      if (event.U == 1 || event.U == 3) {
        updatePen(ctx, rootE, event.P);
      }
      var ll = listToArray(event.L);
      drawLine(ctx, ll[0], ll[1], ll[2], ll[3]);
      break;
    }

    case AQ.XDrawRect: {
      var rr = listToArray(event.R);
      if (event.U > 1) {
        updateBrush(ctx, rootE, event.B);
        ctx.fillRect(rr[0], rr[1], rr[2], rr[3]);
      }
      if (event.U == 1 || event.U == 3) {
        updatePen(ctx, rootE, event.P);
        ctx.strokeRect(rr[0] + ctx.delta, rr[1] + ctx.delta, rr[2], rr[3]);
      }
      break;
    }

    case AQ.XDrawArc:
      ctx.beginPath();
      tracePath(ctx, event.E);
      if (event.U > 1) {
        updateBrush(ctx, rootE, event.B);
        ctx.closePath();
        ctx.fill();
      }
      if (event.U == 1 || event.U == 3) {
        updatePen(ctx, rootE, event.P);
        ctx.stroke();
      }
      break;

    case AQ.XDrawPoints:
      // ### TODO
      break;

    case AQ.XDrawPath:
      ctx.beginPath();
      tracePath(ctx, event.E);
      if (event.U > 1) {
        updateBrush(ctx, rootE, event.B);
        ctx.closePath();
        ctx.fill();
      }
      if (event.U == 1 || event.U == 3) {
        updatePen(ctx, rootE, event.P);
        ctx.stroke();
      }
      break;

    case AQ.XDrawText:
      ctx.font = cachedFont(rootE, event.F);
      var mm = listToArray(event.M);
      if (event.U > 1) {
        var sty = styleState(ctx);
        updateBrush(ctx, rootE, event.B);
        ctx.fillText(event.X, mm[0], mm[1]/*, mm[2]*/);
        setStyleState(ctx, sty);
      }
      if (event.U == 1 || event.U == 3) {
        updatePen(ctx, rootE, event.P);
        ctx.strokeText(event.X, mm[0], mm[1]/*, mm[2]*/);
      }
      break;

    case AQ.XDrawImage: {
      if (this.style.zIndex == 0)
        this.style.zIndex = 1;
      var rr = listToArray(event.D);
      var dx = rr[0];
      var dy = rr[1];
      var sx = rr[2];
      var sy = rr[3];
      var sw = rr[4];
      var sh = rr[5];
      var hash = event.H;
      if (rootE.vecImages[hash] != null) {
        ctx.drawImage(rootE.vecImages[hash], sx, sy, sw, sh, dx, dy, sw, sh);
      } else {
        doNextPaintEvent = false;
        this.tmpImg = new Image();
        this.tmpImg.dx = dx;
        this.tmpImg.dy = dy;
        this.tmpImg.sx = sx;
        this.tmpImg.sy = sy;
        this.tmpImg.sw = sw;
        this.tmpImg.sh = sh;
        this.tmpImg.hndl = dojo.connect(this.tmpImg, 'onload', this, loadImage);
        rootE.vecImages[hash] = this.tmpImg;
        rootE.vecImages[hash].src = rootE.jsonUrl + 'H' + hash;
      }
      break;
    }

    case AQ.XDrawCanvas: {
      if (this.style.zIndex == 0)
        this.style.zIndex = 1;
      var srcElem;

      if (event.H != null)
        srcElem = dojo.byId(parseInt(event.H, 36).toString());
      else
        srcElem = this;

      if (srcElem) {
        var rr = listToArray(event.D);
        var dx = rr[0];
        var dy = rr[1];
        var sx = rr[2];
        var sy = rr[3];
        var sw = rr[4];
        var sh = rr[5];
        ctx.drawImage(srcElem, sx, sy, sw, sh, dx, dy, sw, sh);
      }
      break;
    }

    case AQ.XSetClip:
      clearActiveClip(ctx, this);
      buildPathObject(this.pathActiveClip, event.E);
      activeClip(ctx, this);
      break;

    case AQ.XClearClip:
      clearActiveClip(ctx, this);
      this.pathActiveClip.length = 0;
      break;

    case AQ.XScroll: {
      var ed = parseInt(event.V, 36);
      var dx = pointX(ed);
      var dy = pointY(ed);
      var x = dx;
      var y = dy;
      var w = this.width;
      var h = this.height;
      if (dy < 0) {
        y = -dy;
        h += dy;
        dy = 0;
      } else {
        y = 0;
        h -= dy;
      }
      if (dx < 0) {
        x = -dx;
        w += dx;
        dx = 0;
      } else {
        x = 0;
        w -= dx;
      }
      if (w <= 0 || h <= 0)
        break;
      ctx.drawImage(this, x, y, w, h, dx, dy, w, h);
      break;
    }
  }

  return doNextPaintEvent;
}

function drawFrame(elem) {
  if (elem.ctn.inSize == 0)
    return;
  if (elem.ctn.sizeDirty)
    updateCanvasSize(elem);

  var ctn = elem.ctn;
  var ctx = elem.ctx;

  clearFrameClip(ctx, elem);

  var sty = styleState(ctx);

  if (ctx.frameFillStyle == null) {
    var rgbaGrd = '';
    rgbaGrd += '0.0:rgba(25,25,25,1);';
    rgbaGrd += '0.33:rgba(39,44,48,1);';
    rgbaGrd += '0.66:rgba(61,69,75,1);';
    rgbaGrd += '1.0:rgba(76,86,94,1)'
    ctx.frameFillStyle = createLinearGradient(ctx, 0, 0, 0, ctn.ftop, rgbaGrd);
  }
  ctx.foreColor = ((ctn.windowState & Qt.WindowActive) || elem.isModal ? 'rgba(255,255,255,1)'
                                                                      : 'rgba(180,180,180,1)');

  ctx.fillStyle = ctx.frameFillStyle;
  ctx.fillRect(0, 0, elem.width, ctn.ftop);
  ctx.fillRect(0, ctn.ftop, ctn.fleft, elem.height);
  ctx.fillRect(0, elem.height - ctn.fbottom, elem.width, ctn.fbottom);
  ctx.fillRect(elem.width - ctn.fright, ctn.ftop, ctn.fright, elem.height);
  setStyleState(ctx, sty);

  addCloseFrameButton(elem);

  if (elem.wFlags & AQ.WStyle_Maximize) {
    addMaxFrameButton(elem, ctn.closeFrameButton.x);
  } else if (ctn.maxFrameButton != null) {
    dojo.destroy(ctn.maxFrameButton.id);
    ctn.maxFrameButton = null;
  }

  if (elem.wFlags & AQ.WStyle_Minimize) {
    addMinFrameButton(elem, (ctn.maxFrameButton != null ? ctn.maxFrameButton.x
                                                       : ctn.closeFrameButton.x));
  } else if (ctn.minFrameButton != null) {
    dojo.destroy(ctn.minFrameButton.id);
    ctn.minFrameButton = null;
  }

  frameClip(ctx, ctn, elem);
  paintClip(ctx, elem);
  activeClip(ctx, elem);

  if (elem.caption != null) {
    var w = 0;
    if (ctn.minFrameButton != null)
      w = ctn.minFrameButton.x - 5;
    else if (ctn.maxFrameButton != null)
      w = ctn.maxFrameButton.x - 5;
    else if (ctn.closeFrameButton != null)
      w = ctn.closeFrameButton.x - 5;
    else
      w = elem.width - 4;
    w -= ctn.ftop;
    elem.caption.style.color = ctx.foreColor;
    elem.caption.style.fontSize = toStrPx(ctn.scaleIn(12));
    elem.caption.style.marginTop = elem.caption.style.marginBottom = toStrPx(ctn.scaleIn(5));
    elem.caption.style.left = toStrPx(ctn.scaleIn(ctn.ftop));
    elem.caption.style.width = toStrPx(ctn.scaleIn(w));
    elem.caption.style.height = toStrPx(ctn.scaleIn(ctn.ftop - 10));
    elem.caption.style.visibility = 'visible';
  }
  if (elem.icon != null) {
    var l = ctn.scaleIn(ctn.ftop - 10);
    elem.icon.style.left = elem.icon.style.marginTop = elem.icon.style.marginBottom = toStrPx(ctn
        .scaleIn(5));
    elem.icon.style.width = elem.icon.style.height = toStrPx(l);
    elem.icon.style.visibility = 'visible';
  }
  // ###
  //if (elem.style.zIndex == 0)
  //  elem.style.zIndex = 1;
}

function addCloseFrameButton(elem) {
  var margin = 4;
  var ctn = elem.ctn;
  var but;

  if (ctn.closeFrameButton == null) {
    but = document.createElement('div');
    ctn.appendChild(but);
    ctn.closeFrameButton = but;

    but.id = 'bc_' + ctn.id;
    but.elem = elem;
    but.className = 'divFrameButton';
    but.style.visibility = 'visible';
    but.style.zIndex = 1;
    but.customHandler = function(e) {
      var sk = false;
      var hv = false;
      switch (e.type) {
        case 'mousedown':
          sk = true;
        case 'mouseover':
          hv = true;
        case 'mouseout': {
          var el = this.elem;
          clearFrameClip(el.ctx, el);
          drawCloseFrameButton(el.ctx, this.x, this.y, this.w, this.h, sk, hv);
          frameClip(el.ctx, el.ctn, el);
          paintClip(el.ctx, el);
          activeClip(el.ctx, el);
          return true;
        }
        case 'mouseup':
          this.elem.close();
          return true;
      }
      return false;
    };
  } else
    but = ctn.closeFrameButton;

  but.w = ctn.ftop - margin * 2;
  but.h = but.w;
  but.x = elem.width - but.w - margin;
  but.y = margin;
  but.style.left = toStrPx(ctn.scaleIn(but.x));
  but.style.top = toStrPx(ctn.scaleIn(but.y));
  but.style.width = toStrPx(ctn.scaleIn(but.w));
  but.style.height = toStrPx(ctn.scaleIn(but.h));

  drawCloseFrameButton(elem.ctx, but.x, but.y, but.w, but.h, false, false);
}

function addMaxFrameButton(elem, offset) {
  var margin = 4;
  var ctn = elem.ctn;
  var but;

  if (ctn.maxFrameButton == null) {
    but = document.createElement('div');
    ctn.appendChild(but);
    ctn.maxFrameButton = but;

    but.id = 'bx_' + ctn.id;
    but.elem = elem;
    but.className = 'divFrameButton';
    but.style.visibility = 'visible';
    but.style.zIndex = 1;
    but.customHandler = function(e) {
      var sk = false;
      var hv = false;
      switch (e.type) {
        case 'mousedown':
          sk = true;
        case 'mouseover':
          hv = true;
        case 'mouseout': {
          var el = this.elem;
          clearFrameClip(el.ctx, el);
          drawMaxFrameButton(el.ctx, this.x, this.y, this.w, this.h, sk, hv, el.ctn.windowState);
          frameClip(el.ctx, el.ctn, el);
          paintClip(el.ctx, el);
          activeClip(el.ctx, el);
          return true;
        }
        case 'mouseup':
          this.elem.changeMaximize();
          return true;
      }
      return false;
    };
  } else
    but = ctn.maxFrameButton;

  but.w = ctn.ftop - margin * 2;
  but.h = but.w;
  but.x = offset - but.w - margin;
  but.y = margin;
  but.style.left = toStrPx(ctn.scaleIn(but.x));
  but.style.top = toStrPx(ctn.scaleIn(but.y));
  but.style.width = toStrPx(ctn.scaleIn(but.w));
  but.style.height = toStrPx(ctn.scaleIn(but.h));

  drawMaxFrameButton(elem.ctx, but.x, but.y, but.w, but.h, false, false, ctn.windowState);
}

function addMinFrameButton(elem, offset) {
  var margin = 4;
  var ctn = elem.ctn;
  var but;

  if (ctn.minFrameButton == null) {
    but = document.createElement('div');
    ctn.appendChild(but);
    ctn.minFrameButton = but;

    but.id = 'bz_' + ctn.id;
    but.elem = elem;
    but.className = 'divFrameButton';
    but.style.visibility = 'visible';
    but.style.zIndex = 1;
    but.customHandler = function(e) {
      var sk = false;
      var hv = false;
      switch (e.type) {
        case 'mousedown':
          sk = true;
        case 'mouseover':
          hv = true;
        case 'mouseout': {
          var el = this.elem;
          clearFrameClip(el.ctx, el);
          drawMinFrameButton(but, sk, hv);
          frameClip(el.ctx, el.ctn, el);
          paintClip(el.ctx, el);
          activeClip(el.ctx, el);
          return true;
        }
        case 'mouseup':
          this.elem.changeMinimize();
          return true;
      }
      return false;
    };
  } else
    but = ctn.minFrameButton;

  but.w = ctn.ftop - margin * 2;
  but.h = but.w;
  but.x = offset - but.w - margin;
  but.y = margin;
  but.style.left = toStrPx(ctn.scaleIn(but.x));
  but.style.top = toStrPx(ctn.scaleIn(but.y));
  but.style.width = toStrPx(ctn.scaleIn(but.w));
  but.style.height = toStrPx(ctn.scaleIn(but.h));

  drawMinFrameButton(but, false, false);
}

function drawMinFrameButton(but, sunken, hover) {
  drawFrameButton(but.elem.ctx, but.x, but.y, but.w, but.h, sunken, hover);

  var el = but.elem;
  var srcUrl = (el.ctn.windowState & Qt.WindowMinimized) ? '_SESSION_/:images/restore.png'
                                                        : '_SESSION_/:images/miniature.png';
  var img = el.rootElement.vecImages[srcUrl];

  if (img == null || !img.complete) {
    if (img != null)
      delete img;
    img = el.rootElement.vecImages[srcUrl] = new Image();
    img.but = but;
    img.onload = function() {
      var el = this.but.elem;
      clearFrameClip(el.ctx, el);
      el.ctx.drawImage(this, this.but.x, this.but.y, this.but.w, this.but.h);
      frameClip(el.ctx, el.ctn, el);
      paintClip(el.ctx, el);
      activeClip(el.ctx, el);
    };
    img.src = srcUrl;
  } else {
    clearFrameClip(el.ctx, el);
    el.ctx.drawImage(img, but.x, but.y, but.w, but.h);
    frameClip(el.ctx, el.ctn, el);
    paintClip(el.ctx, el);
    activeClip(el.ctx, el);
  }
}

function drawMaxFrameButton(ctx, x, y, w, h, sunken, hover, state) {
  drawFrameButton(ctx, x, y, w, h, sunken, hover);

  var margin = 4;
  var lt = x + margin;
  var tp = y + margin;
  var rt = x + w - margin;
  var bt = y + h - margin;
  var wh = w - (margin * 2);

  ctx.save();
  resetStyleState(ctx);
  ctx.strokeStyle = ctx.foreColor;
  ctx.strokeRect(lt + ctx.delta, tp + ctx.delta, wh, wh);
  if (state & Qt.WindowMaximized)
    ctx.strokeRect(lt + ctx.delta, tp + ctx.delta + 3, wh - 3, wh - 3);
  else
    drawLine(ctx, lt, tp + 1, rt, tp + 1);
  ctx.restore();
}

function drawCloseFrameButton(ctx, x, y, w, h, sunken, hover) {
  drawFrameButton(ctx, x, y, w, h, sunken, hover);

  var margin = 4;
  var lt = x + margin;
  var tp = y + margin;
  var rt = x + w - margin;
  var bt = y + h - margin;

  ctx.save();
  resetStyleState(ctx);
  ctx.lineCap = 'round';
  ctx.strokeStyle = ctx.foreColor;
  ctx.beginPath();
  traceLine(ctx, lt + 1, tp, rt, bt - 1);
  traceLine(ctx, lt, tp, rt, bt);
  traceLine(ctx, lt, tp + 1, rt - 1, bt);
  traceLine(ctx, rt - 1, tp, lt, bt - 1);
  traceLine(ctx, lt, bt, rt, tp);
  traceLine(ctx, rt, tp + 1, lt + 1, bt);
  ctx.stroke();
  ctx.restore();
}

function drawFrameButton(ctx, x, y, w, h, sunken, hover) {
  var rt = x + w;
  var bt = y + h;

  ctx.save();

  if (sunken) {
    ctx.fillStyle = 'rgba(40,40,40,0.5)';
    ctx.fillRect(x + 1, y + 1, w - 1, h - 1);
  } else if (hover) {
    ctx.fillStyle = 'rgba(80,80,80,0.5)';
    ctx.fillRect(x + 1, y + 1, w - 1, h - 1);
  } else {
    ctx.fillStyle = ctx.frameFillStyle;
    ctx.fillRect(x, y, w + 2, h + 2);
  }

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(75,83,89,1)';

  ctx.beginPath();
  traceLine(ctx, x + 2, y, rt - 2, y);
  traceLine(ctx, x + 2, bt, rt - 2, bt);
  traceLine(ctx, x, y + 2, x, bt - 2);
  traceLine(ctx, rt, y + 2, rt, bt - 2);
  ctx.stroke();

  drawPoint(ctx, x + 1, y + 1);
  drawPoint(ctx, rt - 1, y + 1);
  drawPoint(ctx, x + 1, bt - 1);
  drawPoint(ctx, rt - 1, bt - 1);

  var centerX = x + (w / 2);
  var lg = ctx.createLinearGradient(centerX, y, centerX, bt);
  lg.addColorStop(0, 'rgba(90,100,108,0.25)');
  lg.addColorStop(1, 'rgba(10,20,28,0.25)');
  ctx.strokeStyle = lg;

  drawLine(ctx, rt + 1, y + 2, rt + 1, bt - 2);
  drawPoint(ctx, rt, y + 1);

  drawLine(ctx, x + 2, bt + 1, rt - 2, bt + 1);
  drawPoint(ctx, x + 1, bt);
  drawPoint(ctx, rt - 1, bt);
  drawPoint(ctx, rt, bt - 1);

  ctx.restore();
}
