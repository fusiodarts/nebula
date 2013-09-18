/***************************************************************************
dock.js
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

var AQ_SQRT_2 = Math.sqrt(2);

function createDockItem(elem) {
  if (this.dock.items[elem.id] != null)
    return;

  var item = document.createElement('img');

  item.id = 'di_' + elem.id;
  item.className = 'dockItem';
  item.isDockItem = true;
  item.src = '_SESSION_/:images/default.png';
  item.style.width = toStrPx(this.dock.itemWidth);
  item.style.height = toStrPx(this.dock.itemWidth);
  item.elem = elem;
  item.eventsProxy = this.dockCtn;

  if (this.dock.valign == 'bottom')
    item.style.bottom = toStrPx(8);
  else
    item.style.top = toStrPx(8);

  this.dock.appendChild(item);
  this.dock.items[elem.id] = item;
  this.dock.nItems++;
  this.updateDock();

  if (this.dock.nItems == 1 && this.dockCtn.customHandler == null) {
    this.dock.eventsProxy = this.dockCtn;
    this.dockCtn.customHandler = function(e, el) {
      switch (e.type) {
        case 'mousemove':
          this.parentNode.updateDock(e);
          return true;
        case 'mouseover':
          if (el.isDockItem) {
            var ele = el.elem;
            if (ele.ctn.windowState & Qt.WindowMinimized)
              ele.ctn.setScaleFactor(1.5);
            if (!(ele.ctn.windowState & Qt.WindowActive)) {
              ele.ctn.oldZ = ele.ctn.style.zIndex;
              ele.ctn.style.zIndex = ele.rootElement.lastGlobalZIndex;
            }
            return true;
          }
          break;
        case 'mouseout':
          if (el.isDockItem) {
            var ele = el.elem;
            if (ele.ctn.windowState & Qt.WindowMinimized)
              ele.ctn.setScaleFactor(3);
            if (!(ele.ctn.windowState & Qt.WindowActive))
              ele.ctn.style.zIndex = ele.ctn.oldZ;
            return true;
          }
          break;
        case 'mouseup':
          if (el.isDockItem) {
            el.elem.setActiveWindow();
            return true;
          }
          break;
      }
      return false;
    };
  }
}

function removeDockItem(elem) {
  if (this.dock.nItems == 0)
    return;
  var item = this.dock.items[elem.id];
  if (item == null)
    return;
  this.dock.items[elem.id] = null;
  delete this.dock.items[elem.id];
  dojo.destroy(item.id);
  this.dock.nItems--;
  this.updateDock();
}

function updateDock(ev) {
  if (this.dock.nItems < 1) {
    this.dockCtn.style.visibility = 'hidden';
    this.dockCtn.style.zIndex = 0;
    return;
  }

  var totalWidth = 0;

  if (ev == null) {
    if (this.dock.valign == 'bottom') {
      this.dock.style.bottom = 0;
      this.dockCtn.style.bottom = 0;
    } else {
      this.dock.style.top = 0;
      this.dockCtn.style.top = 0;
    }

    this.dock.style.height = toStrPx(this.dock.barWidth);
    this.dockCtn.style.height = toStrPx(this.dock.itemMaxRadius + this.dock.proximity);

    for ( var key in this.dock.items) {
      var item = this.dock.items[key];
      totalWidth += this.dock.itemGap;
      item.style.width = toStrPx(this.dock.itemWidth);
      item.style.height = toStrPx(this.dock.itemWidth);
      item.style.left = toStrPx(totalWidth);
      if (item.elem.icon != null && item.src != item.elem.icon.src)
        item.src = item.elem.icon.src;
      totalWidth += this.dock.itemWidth;
    }

    this.dockCtn.style.visibility = 'visible';
    this.dockCtn.style.zIndex = 1;
  } else {
    for ( var key in this.dock.items) {
      var item = this.dock.items[key];
      var w = parseInt(item.style.width);
      var center = toPoint(w / 2, w);
      var pos = mapTo(item, ev) - center;
      var dis = Math.sqrt(Math.pow(pointX(pos), 2) + Math.pow(pointY(pos), 2));
      var radius = AQ_SQRT_2 * w;

      if (dis < radius)
        w = ((this.dock.itemMaxRadius * (1 - (dis / radius / 2))) / AQ_SQRT_2) * 2;
      else if (dis < (radius + this.dock.proximity))
        w = ((this.dock.itemMaxRadius / 2) / AQ_SQRT_2) * 2;
      else
        w = this.dock.itemWidth;

      totalWidth += this.dock.itemGap;
      item.style.width = toStrPx(w);
      item.style.height = toStrPx(w);
      item.style.left = toStrPx(totalWidth);
      totalWidth += w;
    }
  }

  totalWidth += this.dock.itemGap;
  this.dock.style.width = toStrPx(totalWidth);

  var rtWidth = parseInt(this.rootWidget.style.width);

  switch (this.dock.halign) {
    case 'left':
      this.dock.style.left = 0;
      break;
    case 'center':
      this.dock.style.left = toStrPx((rtWidth / 2) - (totalWidth / 2));
      break;
    case 'right':
      this.dock.style.left = toStrPx(rtWidth - totalWidth);
      break;
  }
}

function grabWidget(ctn, ctx, off) {
  var children = ctn.childNodes;
  for ( var i = 0; i < children.length; ++i) {
    var it = children[i];
    if (it.className == 'divWidget') {
      if (it.style.visibility == 'hidden' || it.width < 1 || it.height < 1)
        continue;
      var posx = pointX(off);
      var posy = pointY(off);
      ctx.save();
      ctx.fillStyle = it.style.backgroundColor;
      ctx.fillRect(posx, posy, it.width, it.height);
      ctx.restore();
      if (it.ctx != ctx)
        ctx.drawImage(it, posx, posy);
      continue;
    }
    if (it.className.isContainer)
      grabWidget(it, ctx, it.pos + off);
  }
}
