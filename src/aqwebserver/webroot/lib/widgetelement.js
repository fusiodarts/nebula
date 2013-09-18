/***************************************************************************
widgetelement.js
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

function createElement(event) {
  var element = this.createWidgetElement(event);
  var ctn;

  if (element.isRootWidget) {
    ctn = this;
    this.style.overflow = 'hidden';

    dojo.connect(window, 'onresize', this, resizeRootWidget);
    dojo.connect(window, 'onkeydown', this, eventHandlerClient);
    dojo.connect(window, 'onkeypress', this, eventHandlerClient);
    dojo.connect(window, 'onkeyup', this, eventHandlerClient);

    dojo.connect(ctn, 'onmousedown', this, eventHandlerClient);
    dojo.connect(ctn, 'onmouseup', this, eventHandlerClient);
    dojo.connect(ctn, 'onmousemove', this, eventHandlerClient);
    dojo.connect(ctn, 'onmouseover', this, eventHandlerClient);
    dojo.connect(ctn, 'onmouseout', this, eventHandlerClient);
    dojo.connect(ctn, 'ondblclick', this, eventHandlerClient);
  } else {
    ctn = document.createElement('div');
    ctn.id = '_' + element.id;
    ctn.className = 'divContainer';
    ctn.isContainer = true;

    ctn.style.visibility = 'hidden';
    ctn.style.overflow = 'hidden';
    ctn.style.background = element.style.background;
  }

  element.ctn = ctn;
  ctn.appendChild(element);

  ctn.style.width = '0px';
  ctn.style.height = '0px';
  ctn.style.left = '0px';
  ctn.style.top = '0px';

  ctn.pos = 0;
  ctn.inPos = 0;
  ctn.deltaX = 0;
  ctn.deltaY = 0;

  ctn.size = 0;
  ctn.inSize = 0;
  ctn.deltaW = 0;
  ctn.deltaH = 0;
  ctn.windowState = Qt.WindowNoState;

  ctn.scaleFactor = 1;
  ctn.scaleOut = function(n) {
    return Math.round(n * this.scaleFactor);
  };
  ctn.scaleIn = function(n) {
    return Math.round(n / this.scaleFactor);
  };
  ctn.setScaleFactor = function(n) {
    if (n == this.scaleFactor)
      return;

    this.scaleFactor = n;
    this.pos = 0;
    this.size = 0;
    updatePos(this);

    var children = this.childNodes;
    for ( var i = 0; i < children.length; ++i) {
      var it = children[i];
      if (it.isWidget && !it.isHidden) {
        updateSize(it);
        if (!it.ctn.hasFrame)
          updateCanvasSize(it, true);
      } else if (it.isContainer) {
        it.setScaleFactor(n);
      }
    }
  };
  ctn.destroy = function() {
    var children = this.childNodes;
    for ( var i = 0; i < children.length; ++i) {
      var it = children[i];
      if (it.isWidget || it.isContainer) {
        it.destroy();
        delete it;
      }
    }
    dojo.destroy(this.id);
  };

  return element;
}

function setParent(parent) {
  this.parentElem = parent;
  parent.ctn.appendChild(this.ctn);
  if (this.isTitleBar)
    this.parentElem.titleBar = this;
  this.ctn.setScaleFactor(parent.ctn.scaleFactor);
}

function moveToPos(pos) {
  var ctn = this.ctn;
  if (ctn.inPos != pos) {
    ctn.inPos = pos;
    updatePos(ctn);
  }
}

function changeSize(size) {
  var ctn = this.ctn;
  if (ctn.inSize != size) {
    ctn.inSize = size;
    updateSize(this);
  }
}

function hide() {
  if (this.isHidden == true)
    return;

  var rt = this.rootElement;

  //if (!this.isModal && this.ctn.hasFrame)
  //  rt.removeDockItem(this);
  //else 
  if (this.isModal)
    rt.setActiveOverlay(false);

  this.style.visibility = 'hidden';

  if (this.caption != null)
    this.caption.style.visibility = 'hidden';
  if (this.icon != null)
    this.icon.style.visibility = 'hidden';

  this.isHidden = true;
}

function show() {
  if (this.isHidden == false)
    return;

  var rt = this.rootElement;

  if (this.isModal) {
    rt.setActiveOverlay(true);
    this.ctn.style.zIndex = rt.lastGlobalZIndex;
  }

  this.style.visibility = 'visible';
  if (this.ctn.hasFrame) {
    if (this.caption != null)
      this.caption.style.visibility = 'visible';
    if (this.icon != null)
      this.icon.style.visibility = 'visible';
    //if (!this.isModal)
    //  rt.createDockItem(this);
    //else
    if (this.isModal)
      this.setActiveWindow();
  }

  this.isHidden = false;
}

function setCaption(ct) {
  if (this.caption == null) {
    this.caption = document.createElement('div');
    this.caption.className = 'divCaption';
    this.caption.id = 'ct_' + this.id;
    this.caption.style.visibility = 'hidden';
    this.caption.style.zIndex = 1;
    this.caption.innerHTML = ct;
    this.caption.eventsProxy = this;
    this.ctn.appendChild(this.caption);
  } else if (this.caption.innerHTML != ct)
    this.caption.innerHTML = ct;
}

function setIcon(ic) {
  var srcUrl = this.rootElement.jsonUrl + 'H' + ic;
  if (this.icon == null) {
    this.icon = document.createElement('img');
    this.icon.className = 'imgIcon';
    this.icon.id = 'ic_' + this.id;
    this.icon.style.visibility = 'hidden';
    this.icon.style.zIndex = 1;
    this.icon.src = srcUrl;
    this.icon.eventsProxy = this;
    this.ctn.appendChild(this.icon);
  } else if (this.icon.src != srcUrl) {
    this.icon.src = srcUrl;
    //this.rootElement.updateDock();
  }
}

function changeMaximize() {
  if (this.ctn.windowState & Qt.WindowMinimized)
    this.changeMinimize();
  if (this.ctn.windowState & Qt.WindowMaximized)
    this.ctn.windowState &= ~Qt.WindowMaximized;
  else
    this.ctn.windowState |= Qt.WindowMaximized;
  this.rootElement.postClientEvent( {
    T : AQ.WindowStateChange,
    I : this.id,
    S : this.ctn.windowState & ~Qt.WindowMinimized
  });
}

function changeMinimize() {
  if (this.ctn.windowState & Qt.WindowMinimized) {
    this.ctn.windowState &= ~Qt.WindowMinimized;
    this.ctn.setScaleFactor(1);
  } else {
    this.ctn.windowState |= Qt.WindowMinimized;
    this.ctn.setScaleFactor(3);
  }
}

function setActiveWindow() {
  if (this.ctn.windowState & Qt.WindowMinimized)
    this.changeMinimize();
  this.rootElement.postClientEvent( {
    T : AQ.WindowStateChange,
    I : this.id,
    S : this.ctn.windowState | Qt.WindowActive
  });
}

function close() {
  if (this.ctn.windowState & Qt.WindowMinimized)
    this.changeMinimize();
  this.rootElement.postClientEvent( {
    T : AQ.Close,
    I : this.id
  });
}

function destroy() {
  this.hide();
}

function updateFlags(flags) {
  if (this.isRootWidget)
    return;
  if (this.wFlags == flags)
    return;
  this.wFlags = flags;
  this.isModal = !!(this.wFlags & AQ.WShowModal);
  this.isPopup = !!(this.wFlags & AQ.WType_Popup);
}

function createWidgetElement(event) {
  var element = document.createElement('canvas');
  element.id = event.I;
  element.className = 'divWidget';
  element.wFlags = parseInt(event.W, 36);
  element.rootElement = this;
  element.ctx = element.getContext('2d');
  element.isWidget = true;
  
  element.style.width = '0px';
  element.style.height = '0px';
  element.style.left = '0px';
  element.style.top = '0px';
  element.width = 0;
  element.height = 0;
  element.style.zIndex = 0;

  if (event.R) { // is root widget  
    element.overlayZs = new Array();
    element.style.background = 'url(_SESSION_/:images/main-bg.gif)';
    element.isRootWidget = true;
    this.rootWidget = element;
    this.resizeRootWidget();
  } else {
    element.style.visibility = 'hidden';
    element.frameClipOn = false;
    element.paintClipOn = false;
    element.activeClipOn = false;
    element.pathPaintClip = new Array();
    element.pathActiveClip = new Array();

    element.isModal = !!(element.wFlags & AQ.WShowModal);
    element.isPopup = !!(element.wFlags & AQ.WType_Popup);
    element.qClassName = event.K;
    if (element.qClassName != null) {
      element.isSplitter = (element.qClassName == 'QSplitterHandle');
      element.isTitleBar = !element.isSplitter && (element.qClassName == 'QTitleBar' || element.qClassName == 'QDockWindowTitleBar');
    }

    resetStyleState(element.ctx);
  }

  element.setParent = setParent;
  element.loadImage = loadImage;
  element.draw = draw;
  element.changeSize = changeSize;
  element.moveToPos = moveToPos;
  element.hide = hide;
  element.show = show;
  element.setCaption = setCaption;
  element.setIcon = setIcon;
  element.changeMaximize = changeMaximize;
  element.changeMinimize = changeMinimize;
  element.setActiveWindow = setActiveWindow;
  element.close = close;
  element.destroy = destroy;
  element.updateFlags = updateFlags;

  dojo.connect(element, 'ondragstart', dojo, 'stopEvent');
  dojo.connect(element, 'oncontextmenu', dojo, 'stopEvent');

  return element;
}
