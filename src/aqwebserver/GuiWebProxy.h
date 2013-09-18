/***************************************************************************
 GuiWebProxy.h
 -------------------
 begin                : 09/07/2010
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

#ifndef GUICLIENT_H_
#define GUICLIENT_H_

#include <QtNetwork>

class WebApplication;
class WebSession;
class EventHandler;
class GuiWebProxy;

struct GuiSession {
  inline GuiSession() :
    webSession_(0), eventHandler_(0),
    guiWebProxy_(0), id_(++guiSessionCount_) {
  }

  inline ~GuiSession() {
    --guiSessionCount_;
  }

  WebSession    *webSession_;
  EventHandler  *eventHandler_;
  GuiWebProxy   *guiWebProxy_;
  int           id_;

  static int guiSessionCount_;
};

class GuiWebProxy : public QTcpServer
{
  Q_OBJECT

public slots:

  void processGuiEvents();
  void sendWebEvent(const QString &msgEvent);

private slots:

  void recvGuiEvents();
  void openConnection();
  void closeConnection();
  void showSocketError(QAbstractSocket::SocketError socketError);

private:

  GuiWebProxy(WebSession *ws, quint16 port = 1818);
  ~GuiWebProxy();

  GuiSession      *guiSession_;
  QTcpSocket      *guiSocket_;
  quint16         guiport_;
  QTextStream     *ts_;
  QQueue<QString> pendingGuiEvents_;
  QTimer          *timer_;
  qint64          guiPid_;

  friend class WebApplication;
};

#endif /* GUICLIENT_H_ */
