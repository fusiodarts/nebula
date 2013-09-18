/***************************************************************************
 EventHandler.h
 -------------------
 begin                : 06/07/2010
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

#ifndef EVENTHANDLER_H_
#define EVENTHANDLER_H_

#include <EventQueue.h>

class HttpResponse;
class HttpRequest;
class GuiSession;

class EventHandler : public QObject
{
  Q_OBJECT

public:

  EventHandler(GuiSession *gs);

  void storeImage(const QByteArray &image, quint64 hash);

public slots:

  void handleGuiEvent(const QString &msgEvent);
  void handleWebRequest(HttpRequest *httpRequest, HttpResponse *httpResponse);
  void processEvents();

private:

  void handleJson(HttpRequest *httpRequest, HttpResponse *httpResponse);
  void handleJson(json_object *request, HttpResponse *httpResponse, HttpRequest *httpRequest = 0);
  void handleUpload(json_object *request, HttpResponse *httpResponse, HttpRequest *httpRequest) const;
  void handleEvent(json_object *request, AQ::EventType evType) const;
  void handleImage(const QString &hash, HttpResponse *httpResponse) const;
  void handleImage(json_object *request, HttpResponse *httpResponse) const;
  void handleMouse(json_object *request, AQ::EventType evType);
  void handleKey(json_object *request, AQ::EventType evType) const;
  void handleMove(json_object *request) const;
  void handleResize(json_object *request) const;
  void handleProgressDialog(json_object *request) const;
  void handleWindowState(json_object *request) const;

  void postEvent(AQEvent *event);

  EventQueue        events_;
  QQueue<AQEvent *> pendingEvents_;
  uint              eventsCount_;
  bool              firstRequest_;
  GuiSession        *guiSession_;
  QTimer            *timer_;

  // Caches
  QCache<quint64, QByteArray> imgCache_;
  QString                     lastIdTarget_;
  AQ::EventType               lastEventType_;
  int                         lastMouseP_;
  int                         lastMouseB_;
  int                         lastMouseS_;
};

#endif /* EVENTHANDLER_H_ */
