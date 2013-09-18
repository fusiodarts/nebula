/***************************************************************************
 EventQueue.h
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

#ifndef EVENTQUEUE_H_
#define EVENTQUEUE_H_

#include <QtGui>
#include <json.h>

namespace AQ
{
  enum EventType {
    None                  = QEvent::None + 1,
    MouseButtonDblClick   = QEvent::MouseButtonDblClick,
    MouseButtonPress      = QEvent::MouseButtonPress,
    MouseButtonRelease    = QEvent::MouseButtonRelease,
    MouseMove             = QEvent::MouseMove,
    KeyPress              = QEvent::KeyPress,
    KeyRelease            = QEvent::KeyRelease,
    Move                  = QEvent::Move,
    FocusIn               = QEvent::FocusIn,
    FocusOut              = QEvent::FocusOut,
    Show                  = QEvent::Show,
    Hide                  = QEvent::Hide,
    ParentChange          = QEvent::ParentChange,
    Create                = QEvent::Create,
    Destroy               = QEvent::Destroy,
    ZOrderChange          = QEvent::ZOrderChange,
    Resize                = QEvent::Resize,
    Paint                 = QEvent::Paint,
    Enter                 = QEvent::Enter,
    Leave                 = QEvent::Leave,
    Close                 = QEvent::Close,
    WindowStateChange     = QEvent::WindowStateChange,
    WindowActivate        = QEvent::WindowActivate,
    WindowDeactivate      = QEvent::WindowDeactivate,
    // Qt3 compat
    WType_TopLevel        = 0x00000001,
    WType_Dialog          = 0x00000002,
    WType_Popup           = 0x00000004,
    WType_Desktop         = 0x00000008,
    WSubWindow            = 0x10000000,
    WStyle_Minimize       = 0x00000200,
    WStyle_Maximize       = 0x00000400,
    WShowModal            = 0x04000000,
    // X
    XSetMouseTracking     = QEvent::User + 1,
    XSetEnterLeave        = QEvent::User + 2,
    XSetWindowBackground  = QEvent::User + 3,
    XStoreImage           = QEvent::User + 4,
    XDownload             = QEvent::User + 5,
    XUpload               = QEvent::User + 6,
    XProgressDialog       = QEvent::User + 7,
    XCursor               = QEvent::User + 8,
    XGeneric              = QEvent::User + 9,
    XUpdateFrame          = QEvent::User + 20,
    XBegin                = QEvent::User + 40,
    XEnd                  = QEvent::User + 41,
    XSetClip              = QEvent::User + 42,
    XClearClip            = QEvent::User + 43,
    XClearArea            = QEvent::User + 44,
    XDrawPoint            = QEvent::User + 45,
    XDrawLine             = QEvent::User + 46,
    XDrawRect             = QEvent::User + 47,
    XDrawArc              = QEvent::User + 48,
    XDrawPoints           = QEvent::User + 49,
    XDrawPath             = QEvent::User + 50,
    XDrawText             = QEvent::User + 51,
    XDrawImage            = QEvent::User + 52,
    XDrawCanvas           = QEvent::User + 53,
    XScroll               = QEvent::User + 54,
  };
}

class AQEvent
{
public:

  inline AQEvent(AQ::EventType type, const QString &widgetId = QString(),
                 const QStringList &args = QStringList(),
                 const QString &msgEvent = QString(),
                 Qt::EventPriority priority = Qt::LowEventPriority,
                 int levelPriority = 0) :
    type_(type), widgetId_(widgetId),
    args_(args), msgEvent_(msgEvent),
    priority_(priority), levelPriority_(levelPriority) {
  }

  inline AQ::EventType type() const {
    return type_;
  }

  inline QString widgetId() const {
    return widgetId_;
  }
  inline void setWidgetId(const QString &widgetId) {
    widgetId_ = widgetId;
  }

  inline QStringList args() const {
    return args_;
  }
  inline void setArgs(const QStringList &args) {
    args_ = args;
  }

  inline QString msgEvent() const {
    return msgEvent_;
  }

  inline Qt::EventPriority priority() const {
    return priority_;
  }

  inline int levelPriority() const {
    return levelPriority_;
  }

protected:

  AQ::EventType       type_;
  QString             widgetId_;
  QStringList         args_;
  QString             msgEvent_;
  Qt::EventPriority   priority_;
  int                 levelPriority_;
};

class GuiSession;

class EventQueue
{
private:

  EventQueue();

  void addEvent(AQEvent *event);

  QByteArray toJson();
  QByteArray cacheEvent(const QByteArray &evObj);
  QByteArray cacheGrpEvent(const QByteArray &evObj);
  QList<QByteArray> jsonEvent(AQEvent *event);

  GuiSession                    *guiSession_;
  QQueue<AQEvent *>             eventsHighPriority_;
  QMap<int, QQueue<AQEvent *> > eventsNormalLevelsPriority_;
  QQueue<AQEvent *>             eventsLowPriority_;
  uint                          eventsCount_;
  QString                       rootWidget_;

  // Caches
  QHash<QByteArray, uint>     eventsCache_;
  QHash<uint, QByteArray>     usedEventsCache_;
  QList<uint>                 recentEventsCache_;
  QHash<QByteArray, uint>     eventsGrpCache_;
  QHash<uint, QByteArray>     usedEventsGrpCache_;
  QList<uint>                 recentEventsGrpCache_;
  QList<QByteArray>           eventsGroup_;
  QByteArray                  lastEventGroup_;
  QByteArray                  lastRawEventGroup_;
  QHash<QString, uint>        colorsNamesCache_;
  uint                        nColorsNamesCache_;
  QHash<QString, uint>        fontsNamesCache_;
  uint                        nFontsNamesCache_;
  QHash<QString, uint>        schePathsCache_;
  uint                        nSchePathsCache_;
  QHash<QString, QString>     lastStrAttrs_;
  QHash<QString, int>         lastIntAttrs_;
  QHash<QString, qlonglong>   lastLongAttrs_;
  QHash<QString, qlonglong>   lastLongDifs_;

  int                         jsonIdsCount_;
  QHash<QString, QString>     widgetIdToJsonId_;
  QHash<QString, QString>     jsonIdToWidgetId_;

  friend class EventHandler;
};

#endif /* EVENTQUEUE_H_ */
