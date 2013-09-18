/***************************************************************************
 AQWebApplication.cpp
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

#include <qtimer.h>
#include <qsocket.h>
#include <qcursor.h>
#include <qobjectlist.h>
#include <qtooltip.h>
#include <qbuffer.h>
#include <qdict.h>
#include <qfiledialog.h>
#include <qprogressdialog.h>
#include <qsizegrip.h>
#include <qtextcodec.h>

#include "AQWebApplication.h"
#include "AQWebApplication_p.h"

AQWebApplication::AQWebApplication(int &argc, char **argv) :
  QApplication(argc, argv), guiSocket_(0), ts_(0), desktop_(0), initDone_(false), inLoop_(false), finish_(false),
  ignoreEvents_(false), lastDeactivate_(0)
{
  aqWebApp = this;
  QToolTip::setGloballyEnabled(false);
  QPixmap::setDefaultOptimization(QPixmap::BestOptim);
  setCursorFlashTime(2000);
  pixmapsLoaded_.setMaxCost(AQ_MAX_CACHE);
  createdWidgets_.resize(499);

  guiTimer_ = new QTimer(this);
  connect(guiTimer_, SIGNAL(timeout()), this, SLOT(processAQEvents()));
  webTimer_ = new QTimer(this);
  connect(webTimer_, SIGNAL(timeout()), this, SLOT(processWebEvents()));

  Q_UINT16 guiPort = 2020;
  QString guiHost("localhost");

  for (int i = 1; i < argc; ++i) {
    if (qstrcmp(argv[i], "-guiport") == 0) {
      if (i != argc - 1) {
        ++i;
        guiPort = QString::fromLatin1(argv[i]).toUInt();
      }
    } else if (qstrcmp(argv[i], "-guihost") == 0) {
      if (i != argc - 1) {
        ++i;
        guiHost = QString::fromLatin1(argv[i]);
      }
    }
  }

  openConnection(guiHost, guiPort);

#ifndef AQ_USE_NOTIFY
  eventFilter_ = new AQEventFilter(this);
  qApp->installEventFilter(eventFilter_);
#endif

  desktop_ = QApplication::desktop();
  postAQEvent(new AQEvent(desktop_, new QEvent(QEvent::Create)));
}

AQWebApplication::~AQWebApplication()
{
  finish();
}

static inline int toQtButton(const QString &msg)
{
  if (msg.at(1) == "1")
    return Qt::LeftButton;
  if (msg.at(2) == "1")
    return Qt::MidButton;
  if (msg.at(3) == "1")
    return Qt::RightButton;
  return Qt::NoButton;
}

static inline int toQtButtonState(const QString &msg)
{
  int ret = Qt::NoButton;
  if (msg.at(1) == "1")
    ret |= Qt::LeftButton;
  if (msg.at(2) == "1")
    ret |= Qt::MidButton;
  if (msg.at(3) == "1")
    ret |= Qt::RightButton;
  if (msg.at(4) == "1")
    ret |= Qt::AltButton;
  if (msg.at(5) == "1")
    ret |= Qt::ControlButton;
  if (msg.at(6) == "1")
    ret |= Qt::ShiftButton;
  if (msg.at(7) == "1")
    ret |= Qt::MetaButton;
  return ret;
}

static inline int toQtKey(int keyCode)
{
  switch (keyCode) {
    case 8:
      return Qt::Key_Backspace;
    case 9:
      return Qt::Key_Tab;
    case 13:
      return Qt::Key_Enter;
    case 27:
      return Qt::Key_Escape;
    case 33:
      return Qt::Key_PageUp;
    case 34:
      return Qt::Key_PageDown;
    case 35:
      return Qt::Key_End;
    case 36:
      return Qt::Key_Home;
    case 37:
      return Qt::Key_Left;
    case 38:
      return Qt::Key_Up;
    case 39:
      return Qt::Key_Right;
    case 40:
      return Qt::Key_Down;
    case 45:
      return Qt::Key_Insert;
    case 46:
      return Qt::Key_Delete;
    case 112:
      return Qt::Key_F1;
    case 113:
      return Qt::Key_F2;
    case 114:
      return Qt::Key_F3;
    case 115:
      return Qt::Key_F4;
    case 116:
      return Qt::Key_F5;
    case 117:
      return Qt::Key_F6;
    case 118:
      return Qt::Key_F7;
    case 119:
      return Qt::Key_F8;
    case 120:
      return Qt::Key_F9;
    case 121:
      return Qt::Key_F10;
    case 122:
      return Qt::Key_F11;
    case 123:
      return Qt::Key_F12;
    default:
      return keyCode;
  }
}

void AQWebApplication::handleWebEvent(const QString &msgEvent)
{
  QStringList args(QStringList::split(AQ_MSG_SEP, msgEvent, true));
  AQ::EventType evT = webEventTypeToAQEventType(args[0]);
  QWidget *w;
  AQWidgetInfo *wInfo;

  if (evT != AQ::XProgressDialog) {
    w = AQ_WIDGET(args[1].toULongLong(0, 36));
    wInfo = createdWidgets_.find(w);
    if (!wInfo)
      return;
  }

  switch (evT) {
    case AQ::MouseButtonPress: {
      QWidget *popup = activePopupWidget();
      if (popup && popup != w->topLevelWidget())
        popup->close();

      w->raise();
      w->setActiveWindow();

      QPoint local(args[2].toInt(), args[3].toInt());
      QPoint global(w->mapToGlobal(local));
      QCursor::setPos(global);
      QMouseEvent mev(QEvent::MouseButtonPress, local, global, toQtButton(args[4]), toQtButtonState(args[5]));
      qt_sendSpontaneousEvent(w, &mev);
      break;
    }

    case AQ::MouseButtonRelease: {
      QPoint local(args[2].toInt(), args[3].toInt());
      QPoint global(w->mapToGlobal(local));
      QCursor::setPos(global);
      QMouseEvent mev(QEvent::MouseButtonRelease, local, global, toQtButton(args[4]), toQtButtonState(args[5]));
      qt_sendSpontaneousEvent(w, &mev);
      break;
    }

    case AQ::MouseButtonDblClick: {
      QPoint local(args[2].toInt(), args[3].toInt());
      QPoint global(w->mapToGlobal(local));
      QCursor::setPos(global);
      QMouseEvent mev(QEvent::MouseButtonDblClick, local, global, toQtButton(args[4]), toQtButtonState(args[5]));
      qt_sendSpontaneousEvent(w, &mev);
      break;
    }

    case AQ::MouseMove: {
      QPoint local(args[2].toInt(), args[3].toInt());
      QPoint global(w->mapToGlobal(local));
      QCursor::setPos(global);
      QMouseEvent mev(QEvent::MouseMove, local, global, toQtButton(args[4]), toQtButtonState(args[5]));
      qt_sendSpontaneousEvent(w, &mev);
      break;
    }

    case AQ::KeyPress:
    case AQ::KeyRelease: {
      int keyCode = args[2].toInt();
      QWidget *keywidget = QWidget::keyboardGrabber();
      bool grabbed = false;

      if (keywidget) {
        grabbed = true;
      } else {
        keywidget = focusWidget();
        if (!keywidget) {
          keywidget = activePopupWidget();
          if (!keywidget) {
            keywidget = activeWindow();
            if (!keywidget)
              keywidget = w->topLevelWidget();
          }
        }
      }

      if (keyCode < 0) {
        QKeyEvent kev((QEvent::Type) evT, 0, keyCode, toQtButtonState(args[3]), QChar(-keyCode));
        qt_sendSpontaneousEvent(keywidget, &kev);
      } else {
        if (evT == AQ::KeyPress && !grabbed) {
          QKeyEvent a((QEvent::Type) evT, toQtKey(keyCode), keyCode, toQtButtonState(args[3]));
          if (qt_tryAccelEvent(keywidget, &a))
            return;
        }
        QKeyEvent kev((QEvent::Type) evT, toQtKey(keyCode), keyCode, toQtButtonState(args[3]));
        qt_sendSpontaneousEvent(keywidget, &kev);
      }
      break;
    }

    case AQ::Move:
      if (w != desktop_) {
        ignoreEvents_ = true;
        w->move(args[2].toInt(), args[3].toInt());
        ignoreEvents_ = false;
      }
      break;

    case AQ::Resize:
      if (w != desktop_) {
        //ignoreEvents_ = true;
        w->resize(args[2].toInt(), args[3].toInt());
        //ignoreEvents_ = false;
      } else {
        int wt = args[2].toInt();
        int ht = args[3].toInt();
        desktopGeometry_.setRect(0, 0, wt, ht);
        desktop()->resize(wt, ht);
        postAQEvent(new AQEvent(w, new QResizeEvent(QSize(wt, ht), QSize())));
        emit desktop()->resized(0);
        if (!initDone_)
          QTimer::singleShot(0, this, SLOT(init()));
      }
      break;

    case AQ::XUpload: {
      QFileDialog *fd = ::qt_cast<QFileDialog *>(w);
      if (fd)
        fd->rereadDir();
      break;
    }

    case AQ::XProgressDialog: {
      uint pid = args[1].toUInt();
      if (args.size() == 2) {
        QProgressDialog *pd = progressDialogs_.take(pid);
        if (pd) {
          pd->close();
          pd->deleteLater();
        }
      } else {
        QProgressDialog *pd = progressDialogs_.find(pid);
        if (!pd) {
          pd = new QProgressDialog(args[2], QString(), args[3].section(';', 1, 1).toInt());
          progressDialogs_.insert(pid, pd);
        }
        pd->setProgress(args[3].section(';', 0, 0).toInt());
      }
      break;
    }

    case AQ::WindowStateChange: {
      w->setWindowState(args[2].toInt());
      break;
    }

    default: {
      QEvent ev((QEvent::Type) evT);
      qt_sendSpontaneousEvent(w, &ev);
    }
  }
}

void AQWebApplication::deleteWidgetInfo(AQWidgetInfo *wInfo, bool notify)
{
  wInfo->clear();
  while (pendingWidgets_.removeRef(wInfo));
  if (notify && wInfo->created_) {
    AQWidgetInfo::dictDsMsgs_.setAutoDelete(false);
    QString *s;
    while ((s = AQWidgetInfo::dictDsMsgs_.take(wInfo->wid_)) != 0)
      delete s;
    s = new QString("ds" + AQ_MSG_SEP + wInfo->wid_);
    AQWidgetInfo::dictDsMsgs_.insert(QString::number(wInfo->parentWid_, 36), s);
  }
  wInfo->recursiveDestroy();
  createdWidgets_.remove(wInfo->w_);
  delete wInfo;
}

AQWidgetInfo *AQWebApplication::createWidgetInfo(QWidget *w)
{
  AQWidgetInfo *wInfo = new AQWidgetInfo(w);
  createdWidgets_.insert(w, wInfo);
  return wInfo;
}

void AQWebApplication::postAQEvent(AQEvent *event)
{
  if (finish_ || ::qt_cast<QSizeGrip *>(event->w_)) {
    delete event;
    return;
  }

  AQ::EventType evT = event->type_;
  AQWidgetInfo *wInfo = 0;

  if (evT != AQ::Create) {
    wInfo = createdWidgets_.find(event->w_);
    if (!wInfo)
      evT = AQ::None;
  }

  switch (evT) {
    case AQ::Create:
      wInfo = createWidgetInfo(event->w_);
      wInfo->appendEvent(event);
      break;

    case AQ::Destroy:
      if (!event->w_->isHidden())
        event->w_->hide();
      deleteWidgetInfo(wInfo);
      delete event;
      wInfo = 0;
      break;

    case AQ::None:
      delete event;
      wInfo = 0;
      break;

    default:
      wInfo->appendEvent(event);
  }

  if (wInfo) {
    if (wInfo->refs_ == 1)
      pendingWidgets_.append(wInfo);
    if (AQEvent::eventsGlobalCount_ == 1)
      guiTimer_->start(0, true);
  }
}

void AQWebApplication::processAQEvents()
{
#ifdef AQ_VERBOSE
  qWarning("INI @@@@@@@@@@@@@@@@@@@@@@@@@@");
#endif

  AQWidgetInfo::lastAppendWidget_ = 0;
  AQWidgetInfo::lastConsumeWidget_ = 0;

  if (!AQWidgetInfo::dictDsMsgs_.isEmpty()) {
    QDictIterator<QString> it(AQWidgetInfo::dictDsMsgs_);
    for (; it.current(); ++it)
      sendGuiEvent(*(*it));
    AQWidgetInfo::dictDsMsgs_.setAutoDelete(true);
    AQWidgetInfo::dictDsMsgs_.clear();
  }

  AQEvent *ev;
  AQWidgetInfo *wInfo;
  while (!pendingWidgets_.isEmpty()) {
    wInfo = pendingWidgets_.take(0);
    while ((ev = wInfo->consumeEvent()) != 0) {
      if (!ev->ignore_)
        sendGuiEvent(ev->toMsg());
#ifdef AQ_VERBOSE
      else
        qWarning("**** " + ev->toMsg().left(100));
#endif
      delete ev;
    }
  }

#ifdef AQ_VERBOSE
  qWarning("FIN #############################");
#endif
}

void AQWebApplication::processWebEvents()
{
  inLoop_ = true;
  QString *sEvent = 0;
  while (!pendingWebEvents_.isEmpty()) {
    sEvent = pendingWebEvents_.dequeue();
    handleWebEvent(*sEvent);
    delete sEvent;
  }
  inLoop_ = false;
}

void AQWebApplication::sendGuiEvent(const QString &msgEvent)
{
#ifdef AQ_VERBOSE
  qWarning("<--- " + msgEvent.left(100));
#endif
  if (ts_ && guiSocket_)
    *ts_ << msgEvent << endl;
}

void AQWebApplication::recvWebEvents()
{
  if (pendingWebEvents_.isEmpty() || inLoop_)
    webTimer_->start(0, true);
  while (guiSocket_->canReadLine())
    pendingWebEvents_.enqueue(new QString(guiSocket_->readLine().stripWhiteSpace()));
}

void AQWebApplication::init()
{
  if (initDone_)
    return;
  initDone_ = true;
  aq_web_main(argc(), argv());
}

void AQWebApplication::finish()
{
  if (!initDone_ || finish_)
    return;

  finish_ = true;
  disconnect(guiSocket_, SIGNAL(readyRead()), this, SLOT(recvWebEvents()));
#ifndef AQ_USE_NOTIFY
  removeEventFilter(eventFilter_);
#endif

  sendGuiEvent("ds" + AQ_MSG_SEP + QString::number(AQ_WID(desktop_), 36));

  recvWebEvents();
  processEvents();

  processWebEvents();
  processAQEvents();

  QPtrDictIterator<AQWidgetInfo> it(createdWidgets_);
  AQWidgetInfo *wInfo;
  for (; it.current(); ++it) {
    wInfo = it.current();
    sendGuiEvent("ds" + AQ_MSG_SEP + wInfo->wid_);
    wInfo->clear();
    delete wInfo;
  }
  createdWidgets_.clear();

  closeConnection();
}

void AQWebApplication::openConnection(const QString &guiHost, Q_UINT16 guiPort)
{
  guiSocket_ = new QSocket(this);

  connect(guiSocket_, SIGNAL(error(int)), this, SLOT(showSocketError(int)));
  connect(guiSocket_, SIGNAL(readyRead()), this, SLOT(recvWebEvents()));
  connect(guiSocket_, SIGNAL(connectionClosed()), this, SLOT(closeConnection()));

  guiSocket_->connectToHost(guiHost, guiPort);

  delete ts_;
  ts_ = new QTextStream(guiSocket_);
  ts_->setCodec(QTextCodec::codecForName("ISO8859-1"));
}

void AQWebApplication::closeConnection()
{
  finish_ = true;
  guiSocket_->close();
  guiSocket_->deleteLater();
  guiSocket_ = 0;
}

void AQWebApplication::showSocketError(int e)
{
  qWarning(tr("Socket error number %1 occurred\n").arg(e));
}

#ifdef AQ_USE_NOTIFY
#define AQWEBAPP this
bool AQWebApplication::notify(QObject *obj, QEvent *ev)
#else
#define AQWEBAPP aqWebApp
bool AQEventFilter::eventFilter(QObject *obj, QEvent *ev)
#endif
{
  if (AQWEBAPP->ignoreEvents_ || ev->aq_ignore || !obj->isWidgetType())
#ifdef AQ_USE_NOTIFY
    return QApplication::notify(obj, ev);
#else
    return false;
#endif

  switch (ev->type()) {
    case QEvent::Show: {
      ev->aq_ignore = true;
      QApplication::sendEvent(obj, ev);
      ev->aq_ignore = false;
      AQWEBAPP->postAQEvent(new AQEvent(obj, new QEvent(QEvent::Show)));
      return true;
    }

    case QEvent::Hide: {
      ev->aq_ignore = true;
      QApplication::sendEvent(obj, ev);
      ev->aq_ignore = false;
      QWidget *w = AQ_WIDGET(obj);
      if (w->isTopLevel()) {
        //printf("hide %p %s\n", w, w->QObject::name());
        //if (AQWEBAPP->lastDeactivate_)
        //  printf("hide lastDeactivate_ %p %s\n", AQWEBAPP->lastDeactivate_, AQWEBAPP->lastDeactivate_->QObject::name());
        if (AQWEBAPP->lastDeactivate_ == w)
          AQWEBAPP->lastDeactivate_ = 0;
        AQWidgetInfo *wInfo = AQWEBAPP->createdWidgets_.find(w);
        if (wInfo && wInfo->backActive_) {
          //printf("hide backActive_ %p %s\n", wInfo->backActive_, wInfo->backActive_->QObject::name());
          if (AQWEBAPP->createdWidgets_.find(wInfo->backActive_))
            wInfo->backActive_->setActiveWindow();
          wInfo->backActive_ = 0;
        }
      }
      AQWEBAPP->postAQEvent(new AQEvent(obj, new QEvent(QEvent::Hide)));
      //break;
      return true;
    }

    case QEvent::Move: {
      QMoveEvent *mv = static_cast<QMoveEvent *>(ev);
      if (mv->pos() != mv->oldPos())
        AQWEBAPP->postAQEvent(new AQEvent(obj, new QMoveEvent(mv->pos(), mv->oldPos())));
      break;
    }

    case QEvent::Resize: {
      QResizeEvent *rs = static_cast<QResizeEvent *>(ev);
      if (rs->size() != rs->oldSize())
        AQWEBAPP->postAQEvent(new AQEvent(obj, new QResizeEvent(rs->size(), rs->oldSize())));
      break;
    }

    case QEvent::Reparent: {
      AQWEBAPP->postAQEvent(new AQEvent(obj, new QEvent(QEvent::Reparent)));
      break;
    }

    case QEvent::WindowActivate: {
      QWidget *w = AQ_WIDGET(obj);
      if (w->isTopLevel()) {
        //printf("activate %p %s\n", w, w->QObject::name());
        if (AQWEBAPP->lastDeactivate_ && AQWEBAPP->lastDeactivate_ != w) {
          AQWidgetInfo *wInfo = AQWEBAPP->createdWidgets_.find(w);
          if (wInfo) {
            wInfo->backActive_ = AQWEBAPP->lastDeactivate_;
            //printf("activate backActive_ %p %s\n", wInfo->backActive_, wInfo->backActive_->QObject::name());
          }
        }
        AQWEBAPP->postAQEvent(new AQEvent(obj, new QEvent(QEvent::WindowActivate)));
      }
      break;
    }

    case QEvent::WindowDeactivate: {
      QWidget *w = AQ_WIDGET(obj);
      if (w->isTopLevel()) {
        //printf("deactivate %p %s\n", w, w->QObject::name());
        AQWEBAPP->lastDeactivate_ = w;
        AQWEBAPP->postAQEvent(new AQEvent(obj, new QEvent(QEvent::WindowDeactivate)));
      }
      break;
    }

    case QEvent::CaptionChange: {
      QWidget *w = AQ_WIDGET(obj);
      if (w->isTopLevel() && !w->isPopup())
        aq_notify_gui_args_event(w, "xgen",
                                 QString::fromLatin1("caption:") +
                                 w->caption());
      break;
    }

    case QEvent::IconChange: {
      QWidget *w = AQ_WIDGET(obj);
      if (w->isTopLevel() && !w->isPopup())
        aq_notify_gui_args_event(w, "xgen",
                                 QString::fromLatin1("icon:") +
                                 QString::number(aq_store_pixmap(w, w->icon()), 36));
      break;
    }
  }

#ifdef AQ_USE_NOTIFY
  return QApplication::notify(obj, ev);
#else
  return false;
#endif
}
