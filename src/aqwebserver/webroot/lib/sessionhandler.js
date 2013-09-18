/***************************************************************************
sessionhandler.js
-------------------
 begin                : 16/10/2010
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

var webclientCounter = 0;
var AQ = new Object();
var Qt = new Object();

function request(theurl, thedata) {
  dojo.xhrPost( {
    url : theurl,
    postData : thedata,
    timeout : 0,
    handleAs : 'json',
    failOk : true,

    headers : {
      'User-Agent' : '_',
      'Accept' : '_',
      'Accept-Language' : '_',
      'Content-Type' : '_'
    },

    load : (function(webclient) {
      return function(response) {
        webclient.response(response);
      }
    })(this)
  });
}

function requestIdle() {
  dojo.xhrPost( {
    url : this.idleUrl,
    timeout : 0,
    handleAs : 'json',
    failOk : true,

    headers : {
      'User-Agent' : '_',
      'Accept' : '_',
      'Accept-Language' : '_',
      'Content-Type' : '_'
    },

    load : (function(webclient) {
      return function(response) {
        webclient.response(response);
      }
    })(this),

    handle : (function(webclient) {
      return function(response) {
        if (response)
          webclient.requestIdle();
      }
    })(this)
  });
}

function response(jsonEvents) {
  if (!jsonEvents)
    return;

  var preEvents = new Array();

  for ( var i = 0; i < jsonEvents.length; ++i) {
    var event = jsonEvents[i];
    if (event.aqenum != null) {
      var k = i;
      do {
        i = k;
        // Make available Qt namespace
        if (event.aqenum.substr(0, 4) == 'Qt::')
          Qt[event.aqenum.substr(4)] = event.val;
        else
        // Make available AQ namespace
        if (event.aqenum.substr(0, 4) == 'AQ::')
          AQ[event.aqenum.substr(4)] = event.val;
        if (++k == jsonEvents.length)
          return;
        event = jsonEvents[k];
      } while (event.aqenum);
      continue;
    }

    if (event.q != null) {
      var nq = event.q;
      if (this.recentEventsGrpCache.lastIndexOf != null) {
        var idx = this.recentEventsGrpCache.lastIndexOf(nq);
        this.recentEventsGrpCache.push(this.recentEventsGrpCache.splice(idx, 1)[0]);
      } else
        alert('TODO: this.recentEventsGrpCache.lastIndexOf');
      event = dojo.clone(this.eventsGrpCache[nq]);
    } else if (event.G != null) {
      var ne = this.recentEventsGrpCache.length;
      if (ne == this.maxCache) {
        ne = this.recentEventsGrpCache[0];
        this.recentEventsGrpCache.push(this.recentEventsGrpCache.shift());
      } else
        this.recentEventsGrpCache.push(ne);
      this.eventsGrpCache[ne] = dojo.clone(event);
    }

    if (event.G != null) {
      for ( var j = 0; j < event.D.length; ++j) {
        var qev = new Object();
        if (event.D[j] != null)
          qev[event.G] = event.D[j];
        preEvents.push(this.prepareEvent(qev));
      }
    } else
      preEvents.push(this.prepareEvent(event));
  }

  for ( var key in preEvents) {
    var ev = preEvents[key];
    if (ev == null || ev.aqenum != null)
      continue;
    this.eventHandlerServer(ev);
  }
}

function sessionHandlerSetupObject(webclient) {
  webclient.request = request;
  webclient.requestIdle = requestIdle;
  webclient.response = response;
  webclient.idleUrl = webclient.baseUrl + "i";
}
