/***************************************************************************
 WebApplication.h
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

#ifndef WEBAPPLICATION_H_
#define WEBAPPLICATION_H_

#include <QtCore>

class WebServer;
class WebSession;
class EventHandler;
class GuiSession;
class GuiWebProxy;

class WebApplication : public QObject
{
  Q_OBJECT

public:

  WebApplication(const QString &program, quint16 port = 1818);
  ~WebApplication();

signals:

  void newGuiSession(GuiSession *);

private slots:

  void createGuiSession(WebSession *ws);

private:

  QString   program_;
  WebServer *webServer_;
  quint16   port_;
};

#endif /* WEBAPPLICATION_H_ */
