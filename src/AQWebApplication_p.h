/***************************************************************************
 AQWebApplication_p.h
 -------------------
 begin                : 24/09/2010
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

#ifndef AQWEBAPPLICATION_P_H_
#define AQWEBAPPLICATION_P_H_

#define AQ_MSG_SEP QString::fromLatin1("¶")
#define AQ_WIDGET(I) reinterpret_cast<QWidget *>(I)
#define AQ_WIDGET_STC(I) static_cast<QWidget *>(I)
#define AQ_WID(W) reinterpret_cast<AQ_WIDPTR> (W)
#define AQ_AEV(E) static_cast<AQArgsEvent *>(E)
#define AQ_STR_NUMBER_COAL(NN) (NN == 0 ? QString::null : QString::number(NN))
#define AQ_MAX_CACHE 512
//#define AQ_VERBOSE

static AQWebApplication *aqWebApp = 0;

//#define AQ_WEB_MAIN
#ifdef AQ_WEB_MAIN
extern int aq_web_main(int, char **);
#else
int aq_web_main(int, char **)
{
}
#endif

extern bool qt_tryAccelEvent(QWidget *, QKeyEvent *); // def in qaccel.cpp

namespace AQ
{
  enum EventType {
    None                  = QEvent::None,
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
    Reparent              = QEvent::Reparent,
    Create                = QEvent::Create,
    Destroy               = QEvent::Destroy,
    Resize                = QEvent::Resize,
    Paint                 = QEvent::Paint,
    Enter                 = QEvent::Enter,
    Leave                 = QEvent::Leave,
    Close                 = QEvent::Close,
    WindowStateChange     = QEvent::WindowStateChange,
    WindowActivate        = QEvent::WindowActivate,
    WindowDeactivate      = QEvent::WindowDeactivate,

    ZOrderChange          = QEvent::User,
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

static inline AQ::EventType webEventTypeToAQEventType(const QString &str)
{
  if (str == "mv")
    return AQ::Move;
  else if (str == "rs")
    return AQ::Resize;
  else if (str == "mp")
    return AQ::MouseButtonPress;
  else if (str == "mr")
    return AQ::MouseButtonRelease;
  else if (str == "md")
    return AQ::MouseButtonDblClick;
  else if (str == "mm")
    return AQ::MouseMove;
  else if (str == "kp")
    return AQ::KeyPress;
  else if (str == "kr")
    return AQ::KeyRelease;
  else if (str == "en")
    return AQ::Enter;
  else if (str == "lv")
    return AQ::Leave;
  else if (str == "cl")
    return AQ::Close;
  else if (str == "up")
    return AQ::XUpload;
  else if (str == "pd")
    return AQ::XProgressDialog;
  else if (str == "ws")
    return AQ::WindowStateChange;
  return AQ::None;
}

static inline AQ::EventType guiEventTypeToAQEventType(const QString &str)
{
  if (str == "cr")
    return AQ::Create;
  else if (str == "ds")
    return AQ::Destroy;
  else if (str == "sh")
    return AQ::Show;
  else if (str == "hd")
    return AQ::Hide;
  else if (str == "mv")
    return AQ::Move;
  else if (str == "rs")
    return AQ::Resize;
  else if (str == "pc")
    return AQ::Reparent;
  else if (str == "fi")
    return AQ::FocusIn;
  else if (str == "zo")
    return AQ::ZOrderChange;
  else if (str == "xsti")
    return AQ::XStoreImage;
  else if (str == "wa")
    return AQ::WindowActivate;
  else if (str == "wd")
    return AQ::WindowDeactivate;

  else if (str == "xfrm")
    return AQ::XUpdateFrame;
  else if (str == "xbeg")
    return AQ::XBegin;
  else if (str == "xend")
    return AQ::XEnd;
  else if (str == "xsbg")
    return AQ::XSetWindowBackground;
  else if (str == "xcla")
    return AQ::XClearArea;
  else if (str == "xpnt")
    return AQ::XDrawPoint;
  else if (str == "xlin")
    return AQ::XDrawLine;
  else if (str == "xrec")
    return AQ::XDrawRect;
  else if (str == "xarc")
    return AQ::XDrawArc;
  else if (str == "xpnts")
    return AQ::XDrawPoints;
  else if (str == "xpat")
    return AQ::XDrawPath;
  else if (str == "xtxt")
    return AQ::XDrawText;
  else if (str == "ximg")
    return AQ::XDrawImage;
  else if (str == "xcnv")
    return AQ::XDrawCanvas;
  else if (str == "xscl")
    return AQ::XSetClip;
  else if (str == "xccl")
    return AQ::XClearClip;
  else if (str == "xsll")
    return AQ::XScroll;
  else if (str == "xsmt")
    return AQ::XSetMouseTracking;
  else if (str == "xsel")
    return AQ::XSetEnterLeave;
  else if (str == "xdwl")
    return AQ::XDownload;
  else if (str == "xupl")
    return AQ::XUpload;
  else if (str == "xcur")
    return AQ::XCursor;
  else if (str == "xgen")
    return AQ::XGeneric;

  return AQ::None;
}

class AQEvent
{
public:

  AQ::EventType type_;
  QEvent        *ev_;
  QWidget       *w_;
  AQWidgetInfo  *wInfo_;
  bool          ignore_;
  uint          ref_;
  static uint   eventsGlobalCount_;

  inline void init() {
    if (ev_)
      type_ = (AQ::EventType) ev_->type();
    ignore_ = false;
    ref_ = 0;
    ++eventsGlobalCount_;
  }

  inline AQEvent(QWidget *w, QEvent *ev) :
    ev_(ev), w_(w), wInfo_(0) {
    init();
  }

  inline AQEvent(QObject *obj, QEvent *ev) :
    ev_(ev), w_(AQ_WIDGET_STC(obj)), wInfo_(0) {
    init();
  }

  inline ~AQEvent() {
    delete ev_;
    --eventsGlobalCount_;
  }

  virtual QString toMsg() const;
};

class AQArgsEvent : public AQEvent
{
public:

  QStringList args_;
  QString     strType_;
  QString     joined_;

  inline AQArgsEvent(QWidget *w, const QString &type, const QStringList &args) :
    AQEvent(w, 0), args_(args) {
    strType_ = type;
    type_ = guiEventTypeToAQEventType(type);
  }

  QString toMsg() const;
};

uint AQEvent::eventsGlobalCount_ = 0;

extern uint32_t widgetImageHashKey(QWidget *, int * = 0);

class AQWidgetInfo
{
public:

  QWidget     *w_;
  QString     wid_;
  AQ_WIDPTR   initParentWid_;
  AQ_WIDPTR   parentWid_;
  QString     className_;
  Qt::WFlags  flags_;
  QSize       size_;
  bool        isRoot_;
  QWidget     *backActive_;

  QPtrList<AQEvent> events_;
  QValueList<int>   queueRefs_;
  uint              refs_;
  uint              totalRefs_;
  bool              created_;

  static AQWidgetInfo   *lastAppendWidget_;
  static AQWidgetInfo   *lastConsumeWidget_;
  static QDict<QString> dictDsMsgs_;

  uint32_t  lastKey_;
  bool      updateKey_;
  bool      ignoreDraw_;
  QString   paintClip_;
  QString   activeClip_;
  QString   lastClear_;
  QString   lastBg_;
  QString   lastCur_;
  QString   lastMt_;
  uint      lastResizeRef_;
  uint      lastZoRef_;
  QSize     lastSize_;

  inline void     appendEvent(AQEvent *ev);
  inline AQEvent  *consumeEvent();

  inline void showDebugInfo(int level = 0) {
    qWarning("# wInfo ###########################################");
    qWarning("Events Global Count: %u", AQEvent::eventsGlobalCount_);
    qWarning("wid_: " + wid_);
    if (level > 0 && w_) {
      qWarning("name: " + QString(w_->name()));
      qWarning("className_: " + QString(w_->className()));
    }
    if (level > 1) {
      qWarning("initParentWid_: " + QString::number(initParentWid_, 36));
      qWarning("parentWid_: " + QString::number(parentWid_, 36));
      qWarning("flags_: " + QString::number(flags_, 36));
      qWarning("size_: %d %d", size_.width(), size_.height());
      qWarning("isRoot_: %d", isRoot_);
    }
    qWarning("refs_: %u", refs_);
    qWarning("created_: %d", created_);
    qWarning("Events count: %u", events_.count());
    for (AQEvent *ev = events_.first(); ev; ev = events_.next()) {
      qWarning("    " + ev->toMsg().left(100));
    }
    qWarning("###################################################");
  }

  inline AQWidgetInfo(QWidget *w) :
    w_(w), refs_(0), totalRefs_(0), created_(false), backActive_(0) {
    wid_ = QString::number(AQ_WID(w_), 36);
    isRoot_ = (w_ == aqWebApp->desktop_);

    if (isRoot_) {
      initParentWid_ = 0;
    } else {
      QWidget *pW = w_->parentWidget(true);
      initParentWid_ = (pW ? AQ_WID(pW) : AQ_WID(aqWebApp->desktop_));
    }

    parentWid_ = initParentWid_;

    lastKey_ = 0;
    updateKey_ = false;
    ignoreDraw_ = false;
    lastResizeRef_ = 0;
    lastZoRef_ = 0;
    lastMt_ = "0";
  }

  inline void enqueueRefs() {
    if (refs_) {
      queueRefs_.append(refs_);
      refs_ = 0;
    }
  }

  inline void dequeueRefs() {
    if (queueRefs_.isEmpty())
      return;
    enqueueRefs();
    refs_ = queueRefs_.first();
    queueRefs_.remove(queueRefs_.begin());
  }

  inline void update(bool onCreate = true) {
    if (onCreate) {
      className_ = w_->className();
      flags_ = w_->testWFlags(0xffffffff);
      created_ = true;
    } else {
      if (isRoot_) {
        parentWid_ = 0;
      } else {
        QWidget *pW = w_->parentWidget(true);
        parentWid_ = (pW ? AQ_WID(pW) : AQ_WID(aqWebApp->desktop_));
      }
    }
  }

  inline void updateFlags() {
    flags_ = w_->testWFlags(0xffffffff);
  }

  inline void clear() {
    while (!events_.isEmpty())
      delete events_.take(0);
  }

  inline void recursiveDestroy() {
    const QObjectList *l = w_->children();

    if (!l)
      return;

    QObjectListIt it(*l);
    QObject *obj;
    AQWidgetInfo *wInfo;

    while ((obj = it.current()) != 0) {
      ++it;
      if (!obj->isWidgetType())
        continue;
      wInfo = aqWebApp->createdWidgets_.find(AQ_WIDGET_STC(obj));
      if (wInfo)
        aqWebApp->deleteWidgetInfo(wInfo, false);
    }
  }

  inline void reduceEvents() {
    AQEvent *first = events_.getFirst();
    AQ::EventType ft = first->type_;

    if (!ignoreDraw_ && ft > AQ::XUpdateFrame) {
      if (lastResizeRef_ > first->ref_) {
        first->ignore_ = true;
        return;
      }
      if (updateKey_) {
        if (lastSize_ == size_) {
          int state;
          uint32_t key = widgetImageHashKey(w_, &state);
          if (state == 2) {
            if (key != 0 && lastKey_ != 0 && lastKey_ == key)
              ignoreDraw_ = true;
            lastKey_ = key;
          }
        } else
          lastSize_ = size_;
        updateKey_ = false;
      }
    }

    if (ignoreDraw_ && (ft > AQ::XUpdateFrame || ft == AQ::Resize)) {
      first->ignore_ = true;
      return;
    }

    switch (ft) {
      case AQ::XBegin: {
        if (refs_ < 2)
          return;
        AQEvent *second = events_.at(1);
        if (second->type_ == AQ::XEnd) {
          first->ignore_ = true;
          second->ignore_ = true;
        } else {
          AQArgsEvent *aev = AQ_AEV(first);
          paintClip_ = aev->joined_ = aev->args_[0];
          activeClip_ = QString::null;
        }
        break;
      }

      case AQ::XClearClip: {
        if (activeClip_.isEmpty()) {
          first->ignore_ = true;
          return;
        }
        if (refs_ < 2)
          return;
        AQ::EventType st = events_.at(1)->type_;
        if (st == AQ::XEnd || st == AQ::XClearClip || st == AQ::XSetClip)
          first->ignore_ = true;
        else
          activeClip_ = QString::null;
        break;
      }

      case AQ::XSetClip: {
        AQArgsEvent *aev = AQ_AEV(first);
        aev->joined_ = aev->args_[0];
        if (activeClip_ == aev->joined_ || (activeClip_.isEmpty() && paintClip_ == aev->joined_)) {
          first->ignore_ = true;
          return;
        }
        if (refs_ < 2)
          return;
        AQ::EventType st = events_.at(1)->type_;
        if (st == AQ::XEnd || st == AQ::XClearClip || st == AQ::XSetClip)
          first->ignore_ = true;
        else
          activeClip_ = aev->joined_;
        break;
      }

      case AQ::XClearArea: {
        AQArgsEvent *aev = AQ_AEV(first);
        aev->joined_ = aev->args_.join(AQ_MSG_SEP);
        if (lastClear_ == aev->joined_)
          first->ignore_ = true;
        else
          lastClear_ = aev->joined_;
        break;
      }

      case AQ::XSetWindowBackground: {
        AQArgsEvent *aev = AQ_AEV(first);
        aev->joined_ = aev->args_[0];
        if (lastBg_ == aev->joined_)
          first->ignore_ = true;
        else
          lastBg_ = aev->joined_;
        break;
      }

      case AQ::XSetMouseTracking: {
        AQArgsEvent *aev = AQ_AEV(first);
        aev->joined_ = aev->args_[0];
        if (lastMt_ == aev->joined_)
          first->ignore_ = true;
        else
          lastMt_ = aev->joined_;
        break;
      }

      case AQ::XCursor: {
        AQArgsEvent *aev = AQ_AEV(first);
        aev->joined_ = aev->args_[0];
        if (lastCur_ == aev->joined_)
          first->ignore_ = true;
        else
          lastCur_ = aev->joined_;
        break;
      }

      case AQ::Resize:
        if (first->ref_ == lastResizeRef_)
          size_ = static_cast<QResizeEvent *>(first->ev_)->size();
        else
          first->ignore_ = true;
        break;

      case AQ::ZOrderChange:
        if (first->ref_ != lastZoRef_)
          first->ignore_ = true;
        break;
      default:
        if (ft > AQ::XClearArea)
          lastClear_ = QString::null;
    }
  }
};

AQWidgetInfo    *AQWidgetInfo::lastAppendWidget_  = 0;
AQWidgetInfo    *AQWidgetInfo::lastConsumeWidget_ = 0;
QDict<QString>  AQWidgetInfo::dictDsMsgs_;

inline void AQWidgetInfo::appendEvent(AQEvent *ev)
{
  if (lastAppendWidget_ != this) {
    lastAppendWidget_ = this;
    enqueueRefs();
  }

  ev->wInfo_ = this;
  ++refs_;
  ev->ref_ = ++totalRefs_;
  events_.append(ev);

  if (ev->type_ == AQ::Resize)
    lastResizeRef_ = totalRefs_;
  else if (ev->type_ == AQ::ZOrderChange)
    lastZoRef_ = totalRefs_;
}

inline AQEvent *AQWidgetInfo::consumeEvent()
{
  if (lastConsumeWidget_ != this) {
    lastConsumeWidget_ = this;
    dequeueRefs();
  }

  if (!refs_) {
    if (queueRefs_.isEmpty()) {
      updateKey_ = true;
      ignoreDraw_ = false;

      totalRefs_ = 0;
      lastResizeRef_ = 0;
      lastZoRef_ = 0;
    }
    lastConsumeWidget_ = 0;
    return 0;
  }

  reduceEvents();

  --refs_;
  return events_.take(0);
}

QString AQEvent::toMsg() const
{
  QString msgEvent;

  switch (ev_->type()) {
    case QEvent::Create:
      msgEvent = "cr";
      wInfo_->update();
      msgEvent += AQ_MSG_SEP + wInfo_->wid_;
      msgEvent += AQ_MSG_SEP + (wInfo_->isRoot_ ? "1" : "0");
      msgEvent += AQ_MSG_SEP + QString::number(wInfo_->flags_, 36);
      msgEvent += AQ_MSG_SEP + wInfo_->className_;
      msgEvent += AQ_MSG_SEP + QString::number(wInfo_->initParentWid_, 36);
      break;

    case QEvent::Destroy:
      msgEvent = "ds";
      msgEvent += AQ_MSG_SEP + wInfo_->wid_;
      break;

    case QEvent::Show:
      msgEvent = "sh";
      wInfo_->updateFlags();
      msgEvent += AQ_MSG_SEP + wInfo_->wid_;
      msgEvent += AQ_MSG_SEP + QString::number(wInfo_->flags_, 36);
      break;

    case QEvent::Hide:
      msgEvent = "hd";
      msgEvent += AQ_MSG_SEP + wInfo_->wid_;
      break;

    case QEvent::Move: {
      QMoveEvent *mv = static_cast<QMoveEvent *>(ev_);
      msgEvent = "mv";
      msgEvent += AQ_MSG_SEP + wInfo_->wid_;
      msgEvent += AQ_MSG_SEP + QString::number(mv->pos().x());
      msgEvent += AQ_MSG_SEP + QString::number(mv->pos().y());
      break;
    }

    case QEvent::Resize: {
      msgEvent = "rs";
      msgEvent += AQ_MSG_SEP + wInfo_->wid_;
      msgEvent += AQ_MSG_SEP + QString::number(wInfo_->size_.width());
      msgEvent += AQ_MSG_SEP + QString::number(wInfo_->size_.height());
      break;
    }

    case QEvent::Reparent:
      msgEvent = "pc";
      wInfo_->update(false);
      msgEvent += AQ_MSG_SEP + wInfo_->wid_;
      msgEvent += AQ_MSG_SEP + QString::number(wInfo_->parentWid_, 36);
      msgEvent += AQ_MSG_SEP + QString::number(wInfo_->w_->geometry().x());
      msgEvent += AQ_MSG_SEP + QString::number(wInfo_->w_->geometry().y());
      break;

    case QEvent::FocusIn:
      msgEvent = "fi";
      msgEvent += AQ_MSG_SEP + wInfo_->wid_;
      break;

    case QEvent::WindowActivate:
      msgEvent = "wa";
      msgEvent += AQ_MSG_SEP + wInfo_->wid_;
      break;

    case QEvent::WindowDeactivate:
      msgEvent = "wd";
      msgEvent += AQ_MSG_SEP + wInfo_->wid_;
      break;
  }

  return msgEvent;
}

QString AQArgsEvent::toMsg() const
{
  QString msgEvent(strType_);
  msgEvent += AQ_MSG_SEP + wInfo_->wid_;
  if (joined_.isEmpty())
    msgEvent += AQ_MSG_SEP + args_.join(AQ_MSG_SEP);
  else
    msgEvent += AQ_MSG_SEP + joined_;
  return msgEvent;
}

void aq_notify_gui_event(QWidget *w, QEvent *ev)
{
  aqWebApp->postAQEvent(new AQEvent(w, ev));
}

void aq_notify_gui_args_event(QWidget *w, const QString &type, const QStringList &args)
{
  aqWebApp->postAQEvent(new AQArgsEvent(w, type, args));
}

static inline QByteArray toBase64(const QByteArray &ba)
{
  const char alphabet[] = "ABCDEFGH" "IJKLMNOP" "QRSTUVWX" "YZabcdef"
                          "ghijklmn" "opqrstuv" "wxyz0123" "456789+/";
  const char padchar = '=';
  int padlen = 0;

  uint dsize = ba.size();
  char *ddata = ba.data();

  QByteArray tmp((dsize * 4) / 3 + 3);

  int i = 0;
  register char *out = tmp.data();
  while (i < dsize) {
    int chunk = 0;
    chunk |= int(uchar(ddata[i++])) << 16;
    if (i == dsize) {
      padlen = 2;
    } else {
      chunk |= int(uchar(ddata[i++])) << 8;
      if (i == dsize)
        padlen = 1;
      else
        chunk |= int(uchar(ddata[i++]));
    }

    int j = (chunk & 0x00fc0000) >> 18;
    int k = (chunk & 0x0003f000) >> 12;
    int l = (chunk & 0x00000fc0) >> 6;
    int m = (chunk & 0x0000003f);
    *out++ = alphabet[j];
    *out++ = alphabet[k];
    if (padlen > 1)
      *out++ = padchar;
    else
      *out++ = alphabet[l];
    if (padlen > 0)
      *out++ = padchar;
    else
      *out++ = alphabet[m];
  }

  tmp.truncate(out - tmp.data());
  return tmp;
}

inline bool qt_sendSpontaneousEvent(QObject *receiver, QEvent *event)
{
  return QApplication::sendSpontaneousEvent(receiver, event);
}

uint32_t aq_store_pixmap(QWidget *wi, const QPixmap *pixmap)
{
  uint32_t hash = pixmap->hashKey();

  if (!aqWebApp->pixmapsLoaded_.find(hash)) {
    aqWebApp->pixmapsLoaded_.insert(hash, wi);

    QByteArray ba;
    QBuffer buffer(ba);
    buffer.open(IO_WriteOnly);
    pixmap->save(&buffer, "PNG", 0);
    buffer.close();

    QStringList args;
    args << QString::number(hash);
    args << toBase64(ba);

    aqWebApp->postAQEvent(new AQArgsEvent(wi, "xsti", args));
  }

  return hash;
}

void aq_draw_pixmap(QWidget *wi, int dx, int dy, const QPixmap *pixmap,
                    int sx, int sy, int sw, int sh)
{
  uint32_t hash = pixmap->hashKey();
  QString hashStr(QString::number(hash));

  QStringList args;
  args << AQ_STR_NUMBER_COAL(dx);
  args << AQ_STR_NUMBER_COAL(dy);
  args << AQ_STR_NUMBER_COAL(sx);
  args << AQ_STR_NUMBER_COAL(sy);
  args << AQ_STR_NUMBER_COAL(sw);
  args << AQ_STR_NUMBER_COAL(sh);
  args << hashStr;

  if (!aqWebApp->pixmapsLoaded_.find(hash)) {
    aqWebApp->pixmapsLoaded_.insert(hash, wi);

    QByteArray ba;
    QBuffer buffer(ba);
    buffer.open(IO_WriteOnly);
    pixmap->save(&buffer, "PNG", 0);
    buffer.close();

    QStringList args2;
    args2 << hashStr;
    args2 << toBase64(ba);

    aqWebApp->postAQEvent(new AQArgsEvent(wi, "xsti", args2));
  }

  aqWebApp->postAQEvent(new AQArgsEvent(wi, "ximg", args));
}

const QRect &aq_desktop_geometry()
{
  return aqWebApp->desktopGeometry_;
}

void aq_exec_code(const QString &code)
{
  aqWebApp->sendGuiEvent(code);
}

#ifndef AQ_USE_NOTIFY
class AQEventFilter : public QObject
{
public:
  AQEventFilter(QObject *parent) :
    QObject(parent) {
  }
  bool eventFilter(QObject *obj, QEvent *ev);
};
#endif

#endif /* AQWEBAPPLICATION_P_H_ */
