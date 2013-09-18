/***************************************************************************
uploader.js
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

function createUploader() {
  this.uploader = document.createElement('div');
  this.uploader.className = 'divUploader';
  this.uploader.id = '_uploader';
  this.uploader.style.visibility = 'hidden';

  var inHtml;
  inHtml = "<div class='divUploaderTitle'>";
  inHtml += "<p style='margin:3px;'>Subir ficheros a AbanQ</p>";
  inHtml += "</div>";
  inHtml += "<p style='left:5px;position:absolute;top:22px;'>Carpeta destino:</p>";
  inHtml += "<p style='font-size:11px;left:5px;position:absolute;top:42px;' id='_uplpath'>path</p>";
  inHtml += "<p style='left:5px;position:absolute;top:65px;'>Ficheros:</p>";
  inHtml += "<input type='file' size='33' id='_uplfile' style='font-size:11px;left: 5px;position:absolute;top:95px;' multiple ";
  inHtml += "onchange='(function(x){if(x.value.length>0){dojo.byId(&#39_uplinit&#39).disabled=false;}})(this);'>"
  inHtml += "<button id='_uplinit' type='button' style='left:25px;position:absolute;top:135px;' ";
  inHtml += "onclick='javascript:parentNode.parentNode.uploadFiles();'>Iniciar</button>";
  inHtml += "<button id='_uplcancel' type='button' style='left:225px;position:absolute;top:135px;' ";
  inHtml += "onclick='javascript:parentNode.parentNode.exitUploader();'>Cancelar</button>";
  this.uploader.innerHTML = inHtml;

  this.appendChild(this.uploader);
}

function execUploader(id, x, y, path) {
  if (this.uploader == null)
    this.createUploader();

  this.setActiveOverlay(true);
  this.setActiveIndicator(true);

  dojo.byId('_uplpath').innerHTML = path;
  dojo.byId('_uplfile').value = "";
  dojo.byId('_uplinit').disabled = true;

  var upl = this.uploader;
  upl.eid = id;
  upl.style.left = toStrPx(x);
  upl.style.top = toStrPx(y);
  upl.style.zIndex = this.lastGlobalZIndex;
  upl.style.visibility = 'visible';
}

function exitUploader(deferred) {
  if (deferred) {
    setTimeout((function(ert) {
      return function() {
        ert.exitUploader();
      };
    })(this), 0);
    return;
  }
  this.uploader.style.visibility = 'hidden';
  this.setActiveIndicator(false);
  this.setActiveOverlay(false);
}

function uploadFiles() {
  this.uploader.style.visibility = 'hidden';
  this.exitUploader(true);

  var files = dojo.byId('_uplfile').files;
  var path = dojo.byId('_uplpath').innerHTML;

  for ( var i = 0; i < files.length; ++i) {
    var file = files[i];
    file.pt = path;
    file.rpos = 0;
    setTimeout((function(ert, fi) {
      return function() {
        ert.sendFile(fi);
      };
    })(this, file), 0);
  }
}

function sendFile(file) {
  var uplProgress = function(ert, fi, pid) {
    return function(e) {
      if (e.type == 'load') {
        ert.progressDialog(-1, 0, '', pid);
      } else if (e.lengthComputable && (e.loaded - fi.rpos) > (e.total / 100)) {
        fi.rpos = e.loaded;
        ert.progressDialog(e.loaded, e.total, 'Enviando ' + fi.name, pid);
      }
    };
  };

  var xhr = new XMLHttpRequest();
  var pid = this.progressDialogSeq++;
  var url = this.jsonUrl + dojo.toJson( {
    T : AQ.XUpload,
    I : this.uploader.eid,
    P : file.pt + file.name
  });

  xhr.upload.addEventListener('progress', uplProgress(this, file, pid), false);
  xhr.upload.addEventListener('load', uplProgress(this, file, pid), false);

  xhr.open('POST', url);
  xhr.setRequestHeader('Content-Type', file.type);
  xhr.send(file);
}

function progressDialog(loaded, total, args, pid) {
  if (pid == null)
    pid = this.progressDialogSeq;
  if (loaded < 0 || loaded >= total) {
    this.request(this.jsonUrl + dojo.toJson( {
      T : AQ.XProgressDialog,
      I : pid.toString()
    }));
  } else {
    this.request(this.jsonUrl + dojo.toJson( {
      T : AQ.XProgressDialog,
      I : pid.toString(),
      A : args,
      P : loaded.toString() + ';' + total.toString()
    }));
  }
}
