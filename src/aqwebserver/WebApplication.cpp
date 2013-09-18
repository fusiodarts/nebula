/***************************************************************************
 WebApplication.cpp
 -------------------
 begin                : 10/07/2010
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

#include "WebServer.h"
#include "EventHandler.h"
#include "GuiWebProxy.h"
#include "WebApplication.h"

WebApplication::WebApplication(const QString &program, quint16 port) :
  program_(program), webServer_(0), port_(port)
{
  webServer_ = new WebServer(port);
  connect(webServer_, SIGNAL(sessionBegin(WebSession *)), this, SLOT(createGuiSession(WebSession *)));
}

WebApplication::~WebApplication()
{
  delete webServer_;
}

void WebApplication::createGuiSession(WebSession *ws)
{
  // ###
  if (GuiSession::guiSessionCount_ > 4) {
    qWarning() << "No mas sesiones disponibles";
    return;
  }

  GuiWebProxy *wProxy = new GuiWebProxy(ws, port_);
  emit newGuiSession(wProxy->guiSession_);

  QProcess::startDetached(program_, QStringList() << "-guiport" << QString::number(wProxy->guiport_), QString(), &wProxy->guiPid_);
}
