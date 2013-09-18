/***************************************************************************
eventhandler.js
-------------------
 begin                : 12/10/2010
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

// The coordinates of a point are encapsulated in an integer (32 bits).
// The first 16 bits for the X component and the 16 least significant bits
// for the Y component
function toPoint(x, y) {
  return ((x == 0 && y == 0) ? 0 : (x << 17) | (y & 0x7fff));
}
function pointX(p) {
  return (p != 0 ? (p >> 17) + ((p & 0x10000) >> 16) : 0);
}
function pointY(p) {
  return (p != 0 ? (p << 17) >> 17 : 0);
}

// Absolute offset of element (Left-Top point)
// Include his offset plus the offsets of his parents
function absOffset(elem) {
  var pOffset = toPoint(elem.offsetLeft, elem.offsetTop);
  if (elem.offsetParent)
    return pOffset + absOffset(elem.offsetParent);
  return pOffset;
}

// Translates the event coordinate clientX-clientY
// to the coordinate system of element
function mapTo(elem, ev) {
  return toPoint(ev.clientX, ev.clientY) - absOffset(elem);
}

function ctnLocalPos(ctn, event) {
  var pos = mapTo(ctn, event);
  var posx = pointX(pos);
  var posy = pointY(pos);

  if (posx < 0)
    posx = 0;
  if (posy < 0)
    posy = 0;
  if (posx > ctn.limitX)
    posx = ctn.limitX;
  if (posy > ctn.limitY)
    posy = ctn.limitY;

  return toPoint(posx, posy);
}

function toStrCoal(nn) {
  if (nn == null || isNaN(nn) || nn == 0)
    return '';
  return nn.toString();
}

function strCoal(ss) {
  if (ss == null)
    return '';
  return ss;
}

function toFloatCoal(ss) {
  var ret = parseFloat(ss);
  if (isNaN(ret))
    return 0;
  return ret;
}

function toStrPx(nn) {
  if (isNaN(nn))
    nn = 0;
  return nn.toString() + 'px';
}

function listToArray(l) {
  var a = l.split(';');
  for ( var i = 0; i < a.length; ++i)
    a[i] = toFloatCoal(a[i]);
  return a;
}

function mouseKeyState(ev, state, inverse) {
  // reserved button(l|m|r) altKey ctrlKey shiftKey metaKey
  //    1            b b b    b       b       b       b

  var ret = (state == null ? 0 : state);

  if (ev.metaKey ^ inverse)
    ret |= 1;
  else
    ret &= ~1;
  if (ev.shiftKey ^ inverse)
    ret |= 2;
  else
    ret &= ((~2) << 1) >>> 1;
  if (ev.ctrlKey ^ inverse)
    ret |= 4;
  else
    ret &= ((~4) << 1) >>> 1;
  if (ev.altKey ^ inverse)
    ret |= 8;
  else
    ret &= ((~8) << 1) >>> 1;
  var bb = [ 0x40, 0x20, 0x10 ];
  if (inverse)
    ret &= ((~bb[ev.button]) << 1) >>> 1;
  else
    ret |= bb[ev.button];
  return ret;
}

function xor64Bits(a, v) {
  var pow32 = Math.pow(2, 32);

  var msbA = Math.floor(a / pow32);
  var msbASign = (msbA | 0) < 0 ? 1 : 0;
  var lsbA = (a >>> 32);
  var lsbASign = (lsbA | 0) < 0 ? 1 : 0;

  var msbV = Math.floor(v / pow32);
  var msbVSign = (msbV | 0) < 0 ? 1 : 0;
  var lsbV = (v >>> 32);
  var lsbVSign = (lsbV | 0) < 0 ? 1 : 0;

  if (msbASign == 1)
    msbA = ((msbA * 2) >>> 1);
  if (lsbASign == 1)
    lsbA = ((lsbA * 2) >>> 1);
  if (msbVSign == 1)
    msbV = ((msbV * 2) >>> 1);
  if (lsbVSign == 1)
    lsbV = ((lsbV * 2) >>> 1);

  var msbT = msbA ^ msbV;
  var lsbT = lsbA ^ lsbV;
  msbT += (msbASign ^ msbVSign) * pow32 / 2;
  lsbT += (lsbASign ^ lsbVSign) * pow32 / 2;

  return (msbT * pow32) + lsbT;
}

function getElementsByClass(searchClass, node, tag) {
  var classElements = new Array();
  if (node == null)
    node = document;
  if (tag == null)
    tag = '*';
  var els = node.getElementsByTagName(tag);
  var elsLen = els.length;
  for ( var i = 0, j = 0; i < elsLen; ++i) {
    if (els[i].className == searchClass) {
      classElements[j] = els[i];
      ++j;
    }
  }
  return classElements;
}

function updateDeltaGeo(ctn) {
  var dx = ctn.deltaX;
  var dy = ctn.deltaY;
  var dw = ctn.deltaW;
  var dh = ctn.deltaH;

  if (ctn.hasFrame) {
    dx = -1 * (ctn.fleft);
    dy = -1 * (ctn.ftop);
    dw = ctn.fleft + ctn.fright;
    dh = ctn.ftop + ctn.fbottom;
  } else {
    var topContainer = ctn.parentNode;
    if (!topContainer || topContainer == this) { // root ctn
      dx = 0;
      dy = 0;
    } else if (topContainer.hasFrame) {
      dx = topContainer.fleft;
      dy = topContainer.ftop;
    }
  }

  ctn.deltaX = dx;
  ctn.deltaY = dy;
  ctn.deltaW = dw;
  ctn.deltaH = dh;
}

function updatePos(ctn) {
  var posx = pointX(ctn.inPos) + ctn.deltaX;
  var posy = pointY(ctn.inPos) + ctn.deltaY;
  var nPos = toPoint(posx, posy);

  if (ctn.pos != nPos) {
    ctn.style.left = toStrPx(ctn.parentNode.scaleIn(posx));
    ctn.style.top = toStrPx(ctn.parentNode.scaleIn(posy));
    ctn.pos = nPos;
  }
}

function updateSize(elem) {
  var ctn = elem.ctn;
  var w = pointX(ctn.inSize) + ctn.deltaW;
  var h = pointY(ctn.inSize) + ctn.deltaH;
  var nSize = toPoint(w, h);

  if (ctn.size != nSize) {
    ctn.sizeDirty = true;
    ctn.style.width = toStrPx(ctn.scaleIn(w));
    ctn.style.height = toStrPx(ctn.scaleIn(h));
    ctn.limitX = parseInt(ctn.style.width);
    ctn.limitY = parseInt(ctn.style.height);
    ctn.size = nSize;

    if (ctn.hasFrame)
      drawFrame(elem);
  }
}

function updatePosFromStyle(elem) {
  var ctn = elem.ctn;
  var posx = ctn.parentNode.scaleOut(parseInt(ctn.style.left));
  var posy = ctn.parentNode.scaleOut(parseInt(ctn.style.top));
  var pos = toPoint(posx, posy);

  if (pos != ctn.pos) {
    ctn.pos = pos;
    ctn.inPos = pos - toPoint(ctn.deltaX, ctn.deltaY);
    elem.rootElement.postClientEvent( {
      T : AQ.Move,
      I : elem.id,
      P : pos
    });
  }
}

function updateSizeFromStyle(elem) {
  var ctn = elem.ctn;
  var w = parseInt(ctn.style.width);
  var h = parseInt(ctn.style.height);
  var size = toPoint(ctn.scaleOut(w), ctn.scaleOut(h));

  if (size != ctn.size) {
    ctn.sizeDirty = true;
    ctn.limitX = w;
    ctn.limitY = h;
    ctn.size = size;
    ctn.inSize = size - toPoint(ctn.deltaW, ctn.deltaH);

    if (ctn.hasFrame)
      drawFrame(elem);
    elem.rootElement.postClientEvent( {
      T : AQ.Resize,
      I : elem.id,
      W : pointX(ctn.inSize),
      H : pointY(ctn.inSize)
    });
  }
}

function updateFrame(elem) {
  var ctn = elem.ctn;
  var updt = false;

  if (ctn.inPos <= 0) {
    ctn.inPos = toPoint(-ctn.deltaX, -ctn.deltaY);
    updt = true;
  }

  ctn.frameDirty = false;
  updateSize(elem);
  updatePos(ctn);

  var children = ctn.childNodes;
  for ( var i = 0; i < children.length; ++i) {
    var it = children[i];
    if (it.isContainer)
      updatePos(it);
  }

  if (updt)
    updatePosFromStyle(elem);
}

function updateCanvasSize(elem, noErase) {
  var ctn = elem.ctn;

  ctn.sizeDirty = false;
  elem.style.width = ctn.style.width;
  elem.style.height = ctn.style.height;

  if (noErase == true)
    return;

  var w = ctn.scaleOut(parseInt(ctn.style.width));
  var h = ctn.scaleOut(parseInt(ctn.style.height));

  if (elem.width != w || elem.height != h) {
    elem.width = w;
    elem.height = h;
  }
}

function cachedColor(rootE, idx) {
  return rootE.colorsNamesCache[idx];
}

function registerColor(rootE, colorName) {
  var cln = colorName.toString();
  var aret = cln.split(':');
  var idx = parseInt(aret.pop());
  cln = aret[0];
  rootE.colorsNamesCache[idx] = cln;
}

function cachedFont(rootE, idx) {
  return rootE.fontsNamesCache[idx];
}

function registerFont(rootE, fontName) {
  var fn = fontName.toString();
  var aret = fn.split(':');
  var idx = parseInt(aret.pop());
  fn = aret[0];
  rootE.fontsNamesCache[idx] = fn;
}

function cachedSche(rootE, idx) {
  return rootE.schePathsCache[idx];
}

function registerSche(rootE, sche) {
  var sc = sche.toString();
  var aret = sc.split(':');
  var idx = parseInt(aret.pop());
  sc = aret[0];
  rootE.schePathsCache[idx] = sc;
}

function simetricPath(path) {
  if (path.indexOf('@') == -1)
    return path.split(';');

  var ret = new Array();
  var list = path.split(';');
  var midSize = 0;

  for ( var i = 0; i < list.length; ++i) {
    if (list[i] == '@') {
      for ( var j = i - midSize; midSize > 0; ++j) {
        if (list[j].length == 0)
          ret.push(list[j]);
        else
          ret.push('-' + list[j]);
        --midSize;
      }
      continue;
    }
    if (list[i] == 'm') {
      ret.push('m');
      ret.push(list[++i]);
      ret.push(list[++i]);
      continue;
    }
    if (list[i] == 'c') {
      ret.push('c');
      ret.push(list[++i]);
      ret.push(list[++i]);
      ret.push(list[++i]);
      ret.push(list[++i]);
      ret.push(list[++i]);
      ret.push(list[++i]);
      continue;
    }
    ret.push(list[i]);
    ++midSize;
  }

  return ret;
}

function simplifiedPath(path) {
  var list = simetricPath(path);
  var ret = "";
  var mx = 0, my = 0;

  for ( var i = 0; i < list.length; ++i) {
    if (i > 0)
      ret += ';';
    if (list[i] == 'm') {
      ret += 'm;' + list[i + 1] + ';' + list[i + 2];
      mx = toFloatCoal(list[++i]);
      my = toFloatCoal(list[++i]);
      continue;
    }
    if (list[i] == 'c') {
      ret += 'c;';
      ret += list[++i] + ';';
      ret += list[++i] + ';';
      ret += list[++i] + ';';
      ret += list[++i] + ';';
      ret += list[++i] + ';';
      ret += list[++i];
      continue;
    }
    mx += toFloatCoal(list[i]);
    my += toFloatCoal(list[++i]);
    ret += toStrCoal(mx) + ';' + toStrCoal(my);
  }

  return ret;
}

function sumLists(s1, s2) {
  var a1 = s1.split(';');
  var a2 = s2.split(';');
  var ret = "";
  var it = "";
  var tmpN = 0;
  for ( var i = 0; i < a2.length; ++i) {
    if (i > 0)
      ret += ';';
    it = a2[i];
    if (it.length != 0) {
      tmpN = toFloatCoal(a1[i]) + toFloatCoal(it);
      ret += tmpN.toString();
    } else
      ret += a1[i];
  }
  return ret;
}

function calcDifListAttr(rootE, an, va, ka) {
  if (ka == null)
    ka = an;
  if (va == null || va.length == 0)
    return rootE.lastStrAttrs[ka];
  if (rootE.lastStrAttrs[ka] == null) {
    rootE.lastStrAttrs[ka] = va;
    return va;
  }
  var ret = sumLists(rootE.lastStrAttrs[ka], va);
  rootE.lastStrAttrs[ka] = ret;
  return ret;
}

function calcDifPathAttr(rootE, s, p) {
  var sche = cachedSche(rootE, s);
  var difList = calcDifListAttr(rootE, sche, p);
  return simplifiedPath(difList);
}

function calcDifLongAttr(rootE, an, va) {
  if (va == null)
    return rootE.lastLongAttrs[an].toString(36);
  if (va.charAt(0) != '_') {
    if (rootE.lastLongAttrs[an] == null) {
      rootE.lastLongDifs[an] = rootE.lastLongAttrs[an] = parseInt(va, 36);
      return va;
    }
    rootE.lastLongDifs[an] = va = parseInt(va, 36);
  } else {
    if (va == '_')
      rootE.lastLongDifs[an] = va = -rootE.lastLongDifs[an];
    else
      rootE.lastLongDifs[an] = va = -parseInt(va.slice(1), 36);
  }
  var ret = rootE.lastLongAttrs[an] + va;
  rootE.lastLongAttrs[an] = ret;
  return ret.toString(36);
}

function calcDifIntAttr(rootE, an, va) {
  if (va == null)
    return rootE.lastIntAttrs[an];
  if (rootE.lastIntAttrs[an] == null) {
    rootE.lastIntAttrs[an] = va;
    return va;
  }
  var ret = rootE.lastIntAttrs[an] + va;
  rootE.lastIntAttrs[an] = ret;
  return ret;
}

function calcStrAttr(rootE, an, va) {
  if (va == null || va.length == 0)
    return rootE.lastStrAttrs[an];
  rootE.lastStrAttrs[an] = va;
  return va;
}

function calcIntAttr(rootE, an, va) {
  if (va == null || va == 0)
    return rootE.lastIntAttrs[an];
  rootE.lastIntAttrs[an] = va;
  return va;
}

function aqDiffMouseEvent(rootE, ev) {
  if (rootE.lastMouseI != ev.I)
    rootE.lastMouseI = ev.I;
  else
    delete ev.I;

  if (rootE.lastMouseT != ev.T)
    rootE.lastMouseT = ev.T;
  else
    delete ev.T;

  if (rootE.lastMouseP != ev.P) {
    var evp = ev.P;
    ev.P -= rootE.lastMouseP;
    rootE.lastMouseP = evp;
  } else
    delete ev.P;

  if (rootE.lastMouseB != ev.B)
    rootE.lastMouseB = ev.B;
  else
    delete ev.B;

  if (rootE.lastMouseS != ev.S)
    rootE.lastMouseS = ev.S;
  else
    delete ev.S;

  return ev;
}

function setXCursor(event) {
  var el = event.elem;
  if (el.style.visibility == 'hidden' || el.ctn.hasFrame)
    return;
  switch (event.O) {
    case 2:
      el.style.cursor = 'crosshair';
      break;
    case 3:
      el.style.cursor = 'wait';
      break;
    case 4:
      el.style.cursor = 'text';
      break;
    case 5:
    case 6:
    case 7:
    case 8:
      break;
    case 9:
      el.style.cursor = 'move';
      break;
    case 11:
      el.style.cursor = 'row-resize';
      break;
    case 12:
      el.style.cursor = 'col-resize';
      break;
    case 13:
      el.style.cursor = 'pointer';
      break;
    case 15:
      el.style.cursor = 'help';
      break;
    case 16:
      el.style.cursor = 'progress';
      break;
    default:
      event.O = 0;
      el.style.cursor = 'default';
  }
  el.xCursor = event.O;
}

function updateResizeCursor(el, pos) {
  if (el.ctn.hasFrame) {
    var posx = pointX(pos);
    var posy = pointY(pos);
    var ctn = el.ctn;

    if (posx < 4) {
      if (posy < 4) {
        el.style.cursor = 'nw-resize';
        el.xCursor = 8;
      } else if (posy >= (ctn.limitY - 2)) {
        el.style.cursor = 'sw-resize';
        el.xCursor = 7;
      } else {
        el.style.cursor = 'w-resize';
        el.xCursor = 6;
      }

      return true;
    }

    if (posx >= (ctn.limitX - 2)) {
      if (posy < 4) {
        el.style.cursor = 'ne-resize';
        el.xCursor = 7;
      } else if (posy >= (ctn.limitY - 2)) {
        el.style.cursor = 'se-resize';
        el.xCursor = 8;
      } else {
        el.style.cursor = 'e-resize';
        el.xCursor = 6;
      }

      return true;
    }

    if (posy < 4) {
      el.style.cursor = 'n-resize';
      el.xCursor = 5;
      return true;
    }

    if (posy >= (ctn.limitY - 2)) {
      el.style.cursor = 's-resize';
      el.xCursor = 5;
      return true;
    }

    el.style.cursor = 'default';
    return false;
  }

  switch (el.xCursor) {
    case 5:
      if (pointY(pos) < 4)
        el.style.cursor = 'n-resize';
      else
        el.style.cursor = 's-resize';
      return true;
    case 6:
      if (pointX(pos) < 4)
        el.style.cursor = 'w-resize';
      else
        el.style.cursor = 'e-resize';
      return true;
    case 7:
      if (pointX(pos) < 4)
        el.style.cursor = 'sw-resize';
      else
        el.style.cursor = 'ne-resize';
      return true;
    case 8:
      if (pointX(pos) < 4)
        el.style.cursor = 'nw-resize';
      else
        el.style.cursor = 'se-resize';
      return true;
    default:
      return false;
  }
}

function eventTarget(e) {
  e = e || window.event;
  return e.target || e.srcElement;
}

// Root functions
function resizeRootWidget(event) {
  this.rootWidget.style.width = toStrPx(window.innerWidth);
  this.rootWidget.style.height = toStrPx(window.innerHeight);
  //this.updateDock();

  this.postClientEvent( {
    T : AQ.Resize,
    I : this.rootWidget.id,
    W : window.innerWidth,
    H : window.innerHeight
  });
}

function setActiveOverlay(active) {
  if (active) {
    this.rootWidget.style.opacity = 0.8;
    this.rootWidget.overlayZs.push(this.rootWidget.style.zIndex);
    this.rootWidget.style.zIndex = this.lastGlobalZIndex++;
  } else if (this.rootWidget.overlayZs.length > 0) {
    var oldZ = this.rootWidget.overlayZs.pop();
    if (oldZ == 0)
      this.rootWidget.style.opacity = 1;
    this.rootWidget.style.zIndex = oldZ;
  }
}

function setActiveIndicator(active) {
  if (active) {
    this.indi.style.visibility = 'visible';
    this.indi.style.zIndex = this.lastGlobalZIndex;
  } else
    this.indi.style.visibility = 'hidden';
}

function updateActiveWindow(elem, active) {
  if (active) {
    elem.ctn.windowState |= Qt.WindowActive;
    elem.ctn.style.zIndex = this.lastGlobalZIndex++;
  } else
    elem.ctn.windowState &= ~Qt.WindowActive;

  if (elem.ctn.hasFrame) {
    if (!elem.isModal)
      drawFrame(elem);
    if (active && elem.ctn.scaleFactor > 1)
      elem.ctn.setScaleFactor(1.5);
  }
}

function postClientEvent(event) {
  if (this.pendingClientEvents.length == 0) {
    setTimeout((function(ert) {
      return function() {
        ert.processClientEvents();
      };
    })(this), 30);
  }
  this.pendingClientEvents.push(event);
}

function processClientEvents() {
  if (this.pendingClientEvents.length != 0) {
    this.request(this.jsonUrl, dojo.toJson(this.pendingClientEvents));
    this.pendingClientEvents.length = 0;
  }
}

function updateDragState() {
  var ele = this.mousePressTarget;
  var pos = this.mousePressPos;

  if (ele.ctn.hasFrame && ele.ctn.scaleOut(pointY(pos)) < ele.ctn.ftop) {
    this.dragState = 1;
    return;
  }

  if (ele.isTitleBar && ele.ctn.scaleOut(pointX(pos)) < (ele.width - 50)) {
    this.dragState = 1;
    this.mousePressTarget = ele.parentElem;
    return;
  }

  this.dragState = 0;
}

function mousePress(event, ele) {
  if (!ele.isWidget)
    return;

  var pos = mapTo(ele, event);
  var mst = mouseKeyState(event);

  this.postClientEvent(aqDiffMouseEvent(this, {
    T : AQ.MouseButtonPress,
    I : ele.id,
    P : toPoint(ele.ctn.scaleOut(pointX(pos)), ele.ctn.scaleOut(pointY(pos))),
    B : mst,
    S : this.mouseButtonState
  }));

  this.mouseButtonState |= mst;
  this.mousePressTarget = ele;
  this.mousePressPos = pos;
  if (event.button == 0) {
    if (ele.isSplitter)
      this.dragState = 1;
    else if (this.cursorResizeMode)
      this.dragState = 3;
    else
      this.updateDragState();
  }
}

function mouseRelease(event, ele) {
  if (this.dragState == 2) {
    updatePosFromStyle(this.mousePressTarget);
  } else if (this.dragState > 3) {
    if (this.dragState == 5)
      updatePosFromStyle(this.mousePressTarget);
    updateSizeFromStyle(this.mousePressTarget);
  }

  if (ele.isWidget) {
    var pos = mapTo(ele, event);
    var posScaled = toPoint(ele.ctn.scaleOut(pointX(pos)), ele.ctn.scaleOut(pointY(pos)));
    var mst = mouseKeyState(event);

    if (ele != this.mousePressTarget && this.dragState < 3) {
      var el = this.mousePressTarget;
      this.postClientEvent(aqDiffMouseEvent(this, {
        T : AQ.MouseButtonRelease,
        I : el.id,
        P : posScaled,
        B : mst,
        S : this.mouseButtonState
      }));
      if (el.titleBar != null && ele != el.titleBar) {
        this.postClientEvent(aqDiffMouseEvent(this, {
          T : AQ.MouseButtonRelease,
          I : el.titleBar.id,
          P : 0,
          B : mst,
          S : this.mouseButtonState
        }));
      }
    }

    if (ele == this.mousePressTarget || !ele.isPopup) {
      this.postClientEvent(aqDiffMouseEvent(this, {
        T : AQ.MouseButtonRelease,
        I : ele.id,
        P : posScaled,
        B : mst,
        S : this.mouseButtonState
      }));
      if (ele.titleBar != null && this.dragState < 3) {
        this.postClientEvent(aqDiffMouseEvent(this, {
          T : AQ.MouseButtonRelease,
          I : ele.titleBar.id,
          P : posScaled,
          B : mst,
          S : this.mouseButtonState
        }));
      }
    }
  }

  this.mouseButtonState = mouseKeyState(event, this.mouseButtonState, true) & 0xf0;
  this.mousePressTarget = null;
  this.mousePressPos = null;
  this.dragState = 0;
}

function mouseMove(event, element) {
  //No drag, only track mouse movement, if proceed
  if (this.dragState == 0) {
    var ele = (this.mousePressTarget != null ? this.mousePressTarget : element);
    if (!ele.isWidget)
      return;

    var butPressed = (this.mouseButtonState & 0xf0) != 0;
    var pos = ctnLocalPos(ele.ctn, event);
    this.cursorResizeMode = (butPressed ? false : updateResizeCursor(ele, pos));

    if (ele.hasMouseTracking == true || butPressed) {
      this.postClientEvent(aqDiffMouseEvent(this, {
        T : AQ.MouseMove,
        I : ele.id,
        P : toPoint(ele.ctn.scaleOut(pointX(pos)), ele.ctn.scaleOut(pointY(pos))),
        B : (mouseKeyState(event) & 0xf),
        S : this.mouseButtonState
      }));
    }
    return;
  }

  // Drag moving
  if (this.dragState < 3) {
    var ctn = this.mousePressTarget.ctn;
    var pos = ctnLocalPos(ctn.parentNode, event) - this.mousePressPos;

    ctn.style.left = toStrPx(pointX(pos));
    ctn.style.top = toStrPx(pointY(pos));
    this.dragState = 2;
    return;
  }

  // Drag resizing
  var ele = this.mousePressTarget;
  var ctn = ele.ctn;
  var pOffset = toPoint(ele.offsetLeft, ele.offsetTop);
  if (ele.offsetParent)
    pOffset += toPoint(ele.offsetParent.offsetLeft, ele.offsetParent.offsetTop);
  var pos = ctnLocalPos(ctn.parentNode, event) - pOffset;
  var cw;
  var ch;

  switch (ele.xCursor) {
    case 5: { // v|^
      var posy = pointY(pos);
      if (ele.style.cursor == 'n-resize') { // |^
        ctn.style.top = toStrPx(parseInt(ctn.style.top) + posy);
        ch = parseInt(ctn.style.height) - posy;
        ctn.style.height = toStrPx(ch);
        this.dragState = 5;
      } else { // v|
        ch = posy;
        ctn.style.height = toStrPx(ch);
        this.dragState = 4;
      }
      break;
    }

    case 6: { // <-->
      var posx = pointX(pos);
      if (ele.style.cursor == 'w-resize') { // <-
        ctn.style.left = toStrPx(parseInt(ctn.style.left) + posx);
        cw = parseInt(ctn.style.width) - posx;
        ctn.style.width = toStrPx(cw);
        this.dragState = 5;
      } else { // ->
        cw = posx;
        ctn.style.width = toStrPx(cw);
        this.dragState = 4;
      }
      break;
    }

    case 7: { //  v/^
      var posx = pointX(pos);
      var posy = pointY(pos);
      if (ele.style.cursor == 'ne-resize') { // /^
        ctn.style.top = toStrPx(parseInt(ctn.style.top) + posy);
        ch = parseInt(ctn.style.height) - posy;
        ctn.style.height = toStrPx(ch);
        cw = posx;
        ctn.style.width = toStrPx(cw);
      } else { // v/
        ctn.style.left = toStrPx(parseInt(ctn.style.left) + posx);
        cw = parseInt(ctn.style.width) - posx;
        ctn.style.width = toStrPx(cw);
        ch = posy;
        ctn.style.height = toStrPx(ch);
      }
      this.dragState = 5;
      break;
    }

    case 8: { //  ^\v
      var posx = pointX(pos);
      var posy = pointY(pos);
      if (ele.style.cursor == 'nw-resize') { // ^\
        ctn.style.left = toStrPx(parseInt(ctn.style.left) + posx);
        cw = parseInt(ctn.style.width) - posx;
        ctn.style.width = toStrPx(cw);
        ctn.style.top = toStrPx(parseInt(ctn.style.top) + posy);
        ch = parseInt(ctn.style.height) - posy;
        ctn.style.height = toStrPx(ch);
        this.dragState = 5;
      } else { // \v
        cw = posx;
        ctn.style.width = toStrPx(cw);
        ch = posy;
        ctn.style.height = toStrPx(ch);
        this.dragState = 4;
      }
      break;
    }
  }

  // ### TODO Check maximum a minimum size
  if (cw != null && cw < 100)
    ctn.style.width = toStrPx(100);
  if (ch != null && ch < 30)
    ctn.style.height = toStrPx(30);

  if (ctn.hasFrame) {
    ctn.sizeDirty = true;
    drawFrame(ele);
  } else {
    ele.style.width = ctn.style.width;
    ele.style.height = ctn.style.height;
  }
}

function eventHandlerClient(event) {
  var elem = eventTarget(event);

  if (elem.eventsProxy != null) {
    var proxy = elem.eventsProxy;
    if (proxy.customHandler != null && proxy.customHandler(event, elem) == true)
      return;
    elem = proxy;
  } else if (elem.customHandler != null && elem.customHandler(event, this) == true)
    return;

  switch (event.type) {
    case 'keydown':
      this.postClientEvent( {
        T : AQ.KeyPress,
        I : this.rootWidget.id,
        K : event.keyCode || event.which,
        S : mouseKeyState(event)
      });
      break;

    case 'keypress':
      event.preventDefault();
      if (this.keyPressed || event.charCode != 0) {
        var mst = mouseKeyState(event);
        if (mst == 0 || mst == 2) {
          this.postClientEvent( {
            T : AQ.KeyPress,
            I : this.rootWidget.id,
            K : (event.charCode != 0) ? (-event.charCode) : (event.keyCode || event.which),
            S : mst
          });
        }
      }
      this.keyPressed = true;
      break;

    case 'keyup':
      event.preventDefault();
      this.keyPressed = false;
      this.postClientEvent( {
        T : AQ.KeyRelease,
        I : this.rootWidget.id,
        K : event.keyCode || event.which,
        S : mouseKeyState(event)
      });
      break;

    case 'mousedown':
      event.preventDefault();
      this.mousePress(event, elem);
      break;

    case 'mouseup':
      event.preventDefault();
      this.mouseRelease(event, elem);
      break;

    case 'mousemove':
      event.preventDefault();
      this.mouseMove(event, elem);
      break;

    case 'mouseover':
      if (elem.isWidget) {
        event.preventDefault();
        if (elem.ctn.scaleFactor > 1) {
          var topContainer = elem.ctn;
          while (topContainer && !(topContainer.windowState & Qt.WindowMinimized))
            topContainer = topContainer.parentNode;
          if (topContainer) {
            if (this.minimizedCtn != null) {
              var ctn = this.minimizedCtn;
              if (ctn.windowState & Qt.WindowMinimized)
                ctn.setScaleFactor(1.5);
              this.minimizedCtn = null;
            }
            topContainer.setScaleFactor(1);
            this.minimizedCtn = topContainer;
          }
        }
        if (elem.hasEnterLeave) {
          this.postClientEvent( {
            T : AQ.Enter,
            I : elem.id
          });
        }
      }
      break;

    case 'mouseout':
      if (elem.isWidget) {
        event.preventDefault();
        if (this.minimizedCtn != null) {
          var ctn = this.minimizedCtn;
          if (ctn.windowState & Qt.WindowMinimized) {
            var pos = mapTo(ctn, event);
            var posx = pointX(pos);
            var posy = pointY(pos);
            if (posx < 0 || posy < 0 || posx + 1 > ctn.limitX || posy + 1 > ctn.limitY) {
              ctn.setScaleFactor(3);
              this.minimizedCtn = null;
            }
          } else
            this.minimizedCtn = null;
        }
        if (elem.hasEnterLeave) {
          this.postClientEvent( {
            T : AQ.Leave,
            I : elem.id
          });
        }
      }
      break;

    case 'dblclick': {
      if (elem.isWidget) {
        event.preventDefault();
        this.postClientEvent(aqDiffMouseEvent(this, {
          T : AQ.MouseButtonDblClick,
          I : elem.id,
          P : mapTo(elem, event),
          B : mouseKeyState(event),
          S : this.mouseButtonState
        }));
      }
      break;
    }
  }
}

function prepareEvent(event) {
  if (event.CODE != null) {
    setTimeout((function(code, ert) {
      return function() {
        ert.execScript(code);
      };
    })(event.CODE, this), 0);
    return null;
  }

  var retEv;

  if (event.Q != null) {
    var nq = event.Q;
    if (this.recentEventsCache.lastIndexOf != null) {
      var idx = this.recentEventsCache.lastIndexOf(nq);
      this.recentEventsCache.push(this.recentEventsCache.splice(idx, 1)[0]);
    } else
      alert('TODO: this.recentEventsCache.lastIndexOf');
    retEv = dojo.clone(this.eventsCache[nq]);
  } else {
    var ne = this.recentEventsCache.length;
    if (ne == this.maxCache) {
      ne = this.recentEventsCache[0];
      this.recentEventsCache.push(this.recentEventsCache.shift());
    } else
      this.recentEventsCache.push(ne);
    this.eventsCache[ne] = dojo.clone(event);
    retEv = event;
  }

  retEv.I = calcDifIntAttr(this, 'I', retEv.I).toString(36);
  retEv.T = calcIntAttr(this, 'T', retEv.T);

  if (retEv.T == AQ.XDownload) {
    if (dojo.isChrome) {
      window.open(this.jsonUrl + dojo.toJson( {
        T : AQ.XDownload,
        F : retEv.F
      }));
    } else {
      location.href = this.jsonUrl + dojo.toJson( {
        T : AQ.XDownload,
        F : retEv.F
      });
    }
    return null;
  }
  if (retEv.T == AQ.XUpload) {
    this.execUploader(retEv.I, retEv.X, retEv.Y, retEv.P);
    return null;
  }

  if (retEv.T > AQ.XSetMouseTracking) {
    if (retEv.CL != null)
      registerColor(this, retEv.CL);
    if (retEv.FN != null)
      registerFont(this, retEv.FN);
    if (retEv.SC != null)
      registerSche(this, retEv.SC);
  }

  retEv.elem = dojo.byId(retEv.I);

  switch (retEv.T) {
    case AQ.Create:
      if (retEv.elem != null)
        retEv.elem.ctn.destroy();
      retEv.W = calcDifLongAttr(this, 'W', retEv.W);
      retEv.A = calcDifIntAttr(this, 'A', retEv.A).toString(36);
      if (retEv.K != null)
        retEv.K = calcStrAttr(this, 'K', retEv.K);
      retEv.elem = this.createElement(retEv);
      if (retEv.elem.isRootWidget)
        return retEv;
      retEv.elem.setParent(dojo.byId(retEv.A));
      break;
    case AQ.Show:
      retEv.W = calcDifLongAttr(this, 'W', retEv.W);
      if (retEv.elem != null) {
        if (retEv.elem.isRootWidget)
          return retEv;
        retEv.elem.updateFlags(parseInt(retEv.W, 36));
      }
      break;
    case AQ.ZOrderChange:
      retEv.Z = calcDifIntAttr(this, 'Z', retEv.Z);
      break;
    case AQ.ParentChange:
      retEv.A = calcDifIntAttr(this, 'A', retEv.A).toString(36);
      if (retEv.elem != null)
        retEv.elem.setParent(dojo.byId(retEv.A));
      break;
    case AQ.XBegin:
      if (retEv.E != null)
        retEv.E = simplifiedPath(retEv.E);
      break;
    case AQ.XSetWindowBackground:
      retEv.C = calcIntAttr(this, 'C', retEv.C);
      break;
    case AQ.XClearArea:
      retEv.R = calcDifListAttr(this, 'R', retEv.R);
      break;
    case AQ.XDrawPoint:
      retEv.U = calcIntAttr(this, 'U', retEv.U);
      if (retEv.U == 1 || retEv.U == 3) {
        retEv.P = calcStrAttr(this, 'P', retEv.P);
      }
      retEv.N = calcDifListAttr(this, 'N', retEv.N);
      break;
    case AQ.XDrawLine:
      retEv.U = calcIntAttr(this, 'U', retEv.U);
      if (retEv.U == 1 || retEv.U == 3) {
        retEv.P = calcStrAttr(this, 'P', retEv.P);
      }
      retEv.L = calcDifListAttr(this, 'L', retEv.L);
      break;
    case AQ.XDrawRect:
      retEv.U = calcIntAttr(this, 'U', retEv.U);
      if (retEv.U > 1) {
        retEv.B = calcStrAttr(this, 'B', retEv.B);
      }
      if (retEv.U == 1 || retEv.U == 3) {
        retEv.P = calcStrAttr(this, 'P', retEv.P);
      }
      retEv.R = calcDifListAttr(this, 'R', retEv.R);
      break;
    case AQ.XDrawArc:
      retEv.U = calcIntAttr(this, 'U', retEv.U);
      retEv.E = simplifiedPath(retEv.E);
      if (retEv.U > 1) {
        retEv.B = calcStrAttr(this, 'B', retEv.B);
      }
      if (retEv.U == 1 || retEv.U == 3) {
        retEv.P = calcStrAttr(this, 'P', retEv.P);
      }
      break;
    case AQ.XDrawPath:
      retEv.S = calcIntAttr(this, 'S', retEv.S);
      retEv.U = calcIntAttr(this, 'U', retEv.U);
      if (retEv.U > 1) {
        retEv.B = calcStrAttr(this, 'B', retEv.B);
      }
      if (retEv.U == 1 || retEv.U == 3) {
        retEv.P = calcStrAttr(this, 'P', retEv.P);
      }
      if (this.resumeEvent == true) {
        this.resumeEvent = false;
        retEv.E = calcDifPathAttr(this, retEv.S, retEv.E);
      } else {
        this.resumeEvent = true;
        return null;
      }
      break;
    case AQ.XDrawText:
      retEv.U = calcIntAttr(this, 'U', retEv.U);
      retEv.F = calcIntAttr(this, 'F', retEv.F);
      retEv.M = calcStrAttr(this, 'M', retEv.M);
      if (retEv.U > 1) {
        retEv.B = calcStrAttr(this, 'B', retEv.B);
      }
      if (retEv.U == 1 || retEv.U == 3) {
        retEv.P = calcStrAttr(this, 'P', retEv.P);
      }
      if (retEv.X == null)
        return null;
      break;
    case AQ.XDrawImage:
      retEv.D = calcDifListAttr(this, 'D', retEv.D);
      break;
    case AQ.XDrawCanvas:
      retEv.D = calcDifListAttr(this, 'D', retEv.D);
      break;
    case AQ.XSetClip:
      retEv.S = calcIntAttr(this, 'S', retEv.S);
      retEv.E = calcDifPathAttr(this, retEv.S, retEv.E);
      break;
    case AQ.XSetMouseTracking:
      retEv.M = calcDifIntAttr(this, 'M', retEv.M);
      break;
    case AQ.XSetEnterLeave:
      retEv.M = calcDifIntAttr(this, 'M', retEv.M);
      break;
  }

  return retEv;
}

function handleGeneric(event) {
  var idx = event.X.indexOf(':');
  var type = event.X.slice(0, idx);
  var args = event.X.slice(idx + 1);

  switch (type) {
    case 'caption':
      event.elem.setCaption(args);
      break;
    case 'icon':
      event.elem.setIcon(args);
      break;
  }
}

function eventHandlerServer(event) {
  var element = event.elem;

  if (element == null)
    return;
  
  if (event.T != AQ.Create && event.T != AQ.Destroy) {
    if (element.ctn.frameDirty)
      updateFrame(element);
    if (event.T > AQ.XUpdateFrame) {
      this.postPaintEvent(event);
      return;
    }
  }

  switch (event.T) {
    case AQ.Create:
      updateDeltaGeo(element.ctn);
      updatePos(element.ctn);
      break;

    case AQ.Destroy:
      if (element != null)
        element.ctn.destroy();
      break;

    case AQ.ZOrderChange:
      if (event.Z == 0) {
        element.ctn.style.zIndex = 0;
        break;
      }
      if (element.ctn.hasFrame || element.isPopup) {
        if (this.lastGlobalZIndex > event.Z)
          this.lastGlobalZIndex = element.ctn.style.zIndex = event.Z;
        else
          element.ctn.style.zIndex = this.lastGlobalZIndex++;
      }
      break;

    case AQ.Move:
      element.moveToPos(parseInt(event.O, 36));
      break;

    case AQ.Resize:
      element.changeSize(parseInt(event.S, 36));
      break;

    case AQ.Hide:
      element.hide();
      break;

    case AQ.Show:
      element.show();
      break;

    case AQ.ParentChange:
      updateDeltaGeo(element.ctn);
      element.moveToPos(parseInt(event.P, 36));
      break;

    case AQ.WindowActivate:
      this.updateActiveWindow(element, true);
      break;

    case AQ.WindowDeactivate:
      this.updateActiveWindow(element, false);
      break;

    case AQ.XUpdateFrame: {
      if (element.titleBar != null)
        return;

      if (event.L == 0 && event.R == 0 && event.O == 0 && event.B == 0)
        return;

      element.ctn.fleft = event.L;
      element.ctn.fright = event.R;
      element.ctn.ftop = event.O;
      element.ctn.fbottom = event.B;
      element.ctn.hasFrame = true;
      element.ctn.frameDirty = true;

      updateDeltaGeo(element.ctn)
      var children = element.ctn.childNodes;
      for ( var i = 0; i < children.length; ++i) {
        var it = children[i];
        if (it.isContainer)
          updateDeltaGeo(it);
      }
      break;
    }

    case AQ.XSetMouseTracking:
      element.hasMouseTracking = (event.M == 1);
      break;

    case AQ.XSetEnterLeave:
      element.hasEnterLeave = (event.M == 1);
      break;

    case AQ.XSetWindowBackground:
      element.ctn.style.background = cachedColor(this, event.C);
      element.style.background = element.ctn.style.background;
      break;

    case AQ.XCursor:
      setXCursor(event);
      break;

    case AQ.XGeneric:
      handleGeneric(event);
      break;
  }
}

function setUpWebClientObject(webclient) {
  if (webclient.attributes['src'])
    webclient.baseUrl = webclient.attributes['src'].value + '/';
  else
    webclient.baseUrl = window.location.host + '/';

  if (webclient.baseUrl.indexOf('http://') == -1)
    webclient.baseUrl = 'http://' + webclient.baseUrl;

  if (webclient.attributes['session'])
    webclient.baseUrl += webclient.attributes['session'].value + '/';

  sessionHandlerSetupObject(webclient);

  webclient.id = 'webclient' + webclientCounter++;
  webclient.jsonUrl = webclient.baseUrl + 'j';

  webclient.createWidgetElement = createWidgetElement;
  webclient.createElement = createElement;
  webclient.prepareEvent = prepareEvent;
  webclient.eventHandlerServer = eventHandlerServer;
  webclient.eventHandlerClient = eventHandlerClient;
  webclient.resizeRootWidget = resizeRootWidget;

  webclient.pendingClientEvents = new Array();
  webclient.postClientEvent = postClientEvent;
  webclient.processClientEvents = processClientEvents;

  webclient.pendingPaintEvents = new Array();
  webclient.postPaintEvent = postPaintEvent;
  webclient.processPaintEvents = processPaintEvents;
  webclient.ignoreEvents = false;
  
  webclient.maxCache = 999;
  webclient.eventsCache = new Array(webclient.maxCache);
  webclient.recentEventsCache = new Array();
  webclient.eventsGrpCache = new Array(webclient.maxCache);
  webclient.recentEventsGrpCache = new Array();
  webclient.colorsNamesCache = new Array();
  webclient.fontsNamesCache = new Array();
  webclient.schePathsCache = new Array();
  webclient.lastStrAttrs = new Array();
  webclient.lastIntAttrs = new Array();
  webclient.lastLongAttrs = new Array();
  webclient.lastLongDifs = new Array();
  webclient.vecImages = new Array();

  webclient.lastMouseP = 0;

  webclient.createUploader = createUploader;
  webclient.execUploader = execUploader;
  webclient.exitUploader = exitUploader;
  webclient.uploadFiles = uploadFiles;
  webclient.sendFile = sendFile;

  webclient.lastGlobalZIndex = 0;
  webclient.setActiveOverlay = setActiveOverlay;
  webclient.indi = getElementsByClass('imgIndicator', webclient)[0];
  webclient.indi.id = '_in_' + webclient.id;
  webclient.setActiveIndicator = setActiveIndicator;
  webclient.progressDialogSeq = 0;
  webclient.progressDialog = progressDialog;
  webclient.updateActiveWindow = updateActiveWindow;

  webclient.keyPressed = false;
  webclient.mouseButtonState = 0;
  webclient.mousePress = mousePress;
  webclient.mouseRelease = mouseRelease;
  webclient.mouseMove = mouseMove;

  webclient.dragState = 0;
  webclient.updateDragState = updateDragState;

  //webclient.dock = getElementsByClass('dock', webclient)[0];
  //webclient.dock.id = '_dc_' + webclient.id;
  //webclient.dock.barWidth = 24;
  //webclient.dock.itemWidth = 16;
  //webclient.dock.maxItemWidth = 48;
  //webclient.dock.itemMaxRadius = AQ_SQRT_2 * (webclient.dock.maxItemWidth / 2);
  //webclient.dock.proximity = 32;
  //webclient.dock.itemGap = 5;
  //webclient.dock.halign = 'center';
  //webclient.dock.valign = 'bottom';
  //webclient.dock.items = new Array();
  //webclient.dock.nItems = 0;
  //webclient.dockCtn = getElementsByClass('dockContainer', webclient)[0];
  //webclient.dockCtn.id = '_dcc_' + webclient.id;
  //webclient.createDockItem = createDockItem;
  //webclient.removeDockItem = removeDockItem;
  //webclient.updateDock = updateDock;

  webclient.netServerTraffic = netServerTraffic;
  webclient.updateNetMonitor = updateNetMonitor;
  webclient.flushBackingNetMonitor = flushBackingNetMonitor;

  webclient.execScript = function(code) {
    eval(code);
  };
}

dojo.addOnLoad(function() {
  var webclients = getElementsByClass('webclient');
  for ( var i = 0; i < webclients.length; ++i) {
    var webclient = webclients[i];
    setUpWebClientObject(webclient);
    webclient.requestIdle();
  }
});
