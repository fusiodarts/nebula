/***************************************************************************
 GuiWebProxy.cpp
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

#include <sys/types.h>
#include <signal.h>

#include "AQWebServer.h"
#include "WebApplication.h"
#include "EventHandler.h"
#include "WebServer.h"
#include "GuiWebProxy.h"

int GuiSession::guiSessionCount_ = 0;

GuiWebProxy::GuiWebProxy(WebSession *ws, quint16 port) :
  guiSocket_(0), ts_(0), guiPid_(0)
{
  guiSession_ = new GuiSession;
  guiSession_->webSession_ = ws;
  guiSession_->eventHandler_ = new EventHandler(guiSession_);
  guiSession_->guiWebProxy_ = this;
  guiport_ = port + guiSession_->id_;
  connect(ws, SIGNAL(sessionEnd()), this, SLOT(deleteLater()));

  timer_ = new QTimer(this);
  timer_->setInterval(0);
  timer_->setSingleShot(true);
  connect(timer_, SIGNAL(timeout()), this, SLOT(processGuiEvents()));

  connect(this, SIGNAL(newConnection()), this, SLOT(openConnection()));
  if (listen(QHostAddress::Any, guiport_)) {
    DEBUG << tr("GuiWebProxy is listening on IP:%1  port:%2") .arg(serverAddress().toString()).arg(guiport_);
    return;
  }

  ws->close();
  DEBUG << tr("Unable to start GuiWebProxy: %1").arg(errorString());
}

GuiWebProxy::~GuiWebProxy()
{
  DEBUG << tr("GuiWebProxy closed on IP:%1  port:%2") .arg(serverAddress().toString()).arg(guiport_);

  delete ts_;
  delete guiSession_->eventHandler_;
  delete guiSession_;
  guiSession_ = 0;
  if (guiSocket_)
    guiSocket_->abort();
  if (guiPid_)
    ::kill(pid_t(guiPid_), SIGKILL);
}

void GuiWebProxy::processGuiEvents()
{
  while (!pendingGuiEvents_.isEmpty())
    guiSession_->eventHandler_->handleGuiEvent(pendingGuiEvents_.dequeue().trimmed());
}

void GuiWebProxy::sendWebEvent(const QString &msgEvent)
{
  if (ts_ && guiSocket_)
    *ts_ << msgEvent << endl;
}

void GuiWebProxy::recvGuiEvents()
{
  if (pendingGuiEvents_.isEmpty())
    timer_->start();
  while (guiSocket_->canReadLine())
    pendingGuiEvents_.enqueue(guiSocket_->readLine());
}

void GuiWebProxy::openConnection()
{
  if (guiSocket_) {
    DEBUG << "GuiClient already in use";
    return;
  }

  guiSocket_ = nextPendingConnection();

  guiSocket_->setSocketOption(QAbstractSocket::LowDelayOption, 1);
  guiSocket_->setSocketOption(QAbstractSocket::KeepAliveOption, 1);

  connect(guiSocket_, SIGNAL(readyRead()), this, SLOT(recvGuiEvents()));
  connect(guiSocket_, SIGNAL(disconnected()), this, SLOT(closeConnection()));
  connect(guiSocket_, SIGNAL(error(QAbstractSocket::SocketError)), this,
          SLOT(showSocketError(QAbstractSocket::SocketError)));

  delete ts_;
  ts_ = 0;

  if (guiSocket_->state() == QAbstractSocket::ConnectedState) {
    ts_ = new QTextStream(guiSocket_);
    ts_->setCodec("ISO 8859-1");
    DEBUG << "New GUI connection";
  }
}

void GuiWebProxy::closeConnection()
{
  if (guiSession_) {
    DEBUG << "Close GUI connection";

    recvGuiEvents();
    disconnect(guiSocket_, SIGNAL(error(QAbstractSocket::SocketError)), this,
               SLOT(showSocketError(QAbstractSocket::SocketError)));
    guiSocket_->abort();
    guiSocket_ = 0;
    guiSession_->webSession_->close();
  }
}

void GuiWebProxy::showSocketError(QAbstractSocket::SocketError socketError)
{
  switch (socketError) {
    case QAbstractSocket::RemoteHostClosedError:
      break;
    case QAbstractSocket::HostNotFoundError:
      DEBUG << tr("The host was not found. Please check the host name and port settings.");
      break;
    case QAbstractSocket::ConnectionRefusedError:
      DEBUG << tr("The connection was refused by the peer.");
      break;
    default: {
      QTcpSocket *socket = static_cast<QTcpSocket *>(sender());
      DEBUG << tr("The following error occurred: %1.") .arg(socket->errorString());
    }
  }
}
