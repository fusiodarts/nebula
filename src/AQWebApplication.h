/***************************************************************************
 AQWebApplication.h
 -------------------
 begin                : 13/07/2010
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

#ifndef AQWEBAPPLICATION_H_
#define AQWEBAPPLICATION_H_

#include <qapplication.h>
#include <qptrqueue.h>
#include <qcache.h>
#include <qptrdict.h>
#include <qintdict.h>
#include <qintcache.h>
#include <qpixmap.h>

//#define AQ_USE_NOTIFY
#define AQ_WIDPTR Q_ULLONG

class QSocket;
class QProgressDialog;
class AQWidgetInfo;
class AQEvent;
class AQArgsEvent;
class AQEventFilter;

class AQWebApplication : public QApplication
{
  Q_OBJECT

public:

  AQWebApplication(int &argc, char **argv);
  virtual ~AQWebApplication();

  void postAQEvent(AQEvent *event);
#ifdef AQ_USE_NOTIFY
  bool notify(QObject *obj, QEvent *ev);
#endif

public slots:

  void processAQEvents();
  void processWebEvents();
  void sendGuiEvent(const QString &msgEvent);

private slots:

  void init();
  void finish();
  void recvWebEvents();
  void openConnection(const QString &guiHost, Q_UINT16 guiPort);
  void closeConnection();
  void showSocketError(int e);

private:

  void handleWebEvent(const QString &msgEvent);
  void deleteWidgetInfo(AQWidgetInfo *wInfo, bool notify = true);
  AQWidgetInfo *createWidgetInfo(QWidget *w);

  QPtrList<AQWidgetInfo>    pendingWidgets_;
  QPtrQueue<QString>        pendingWebEvents_;
  QPtrDict<AQWidgetInfo>    createdWidgets_;
  QIntCache<QWidget>        pixmapsLoaded_;
  QIntDict<QProgressDialog> progressDialogs_;

  QSocket     *guiSocket_;
  QTextStream *ts_;
  QWidget     *desktop_;
  QRect       desktopGeometry_;
  bool        initDone_;
  bool        inLoop_;
  bool        finish_;
  bool        ignoreEvents_;
  QTimer      *guiTimer_;
  QTimer      *webTimer_;
  QWidget     *lastDeactivate_;

#ifndef AQ_USE_NOTIFY
  AQEventFilter *eventFilter_;
  friend class AQEventFilter;
#endif

  friend class AQWidgetInfo;
  friend void aq_draw_pixmap(QWidget *, int, int, const QPixmap *, int, int, int, int);
  friend uint32_t aq_store_pixmap(QWidget *, const QPixmap *);
  friend const QRect &aq_desktop_geometry();
};

#endif
