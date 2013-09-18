/***************************************************************************
 EventHandler.cpp
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

#include "AQWebServer.h"
#include "WebApplication.h"
#include "WebServer.h"
#include "FileServer.h"
#include "GuiWebProxy.h"
#include "EventHandler.h"

#define AQ_ADD_ENUM(E) \
  obj = json_object_new_object(); \
  json_object_object_add(obj, (char *) "aqenum", \
                         json_object_new_string((char *) #E)); \
  json_object_object_add(obj, (char *) "val", json_object_new_int(E)); \
  json_object_array_add(array, obj);

static inline QByteArray aqNamespace()
{
  json_object *array = json_object_new_array();
  json_object *obj;

  // Qt::WindowType
  AQ_ADD_ENUM(Qt::Widget);
  AQ_ADD_ENUM(Qt::Window);
  AQ_ADD_ENUM(Qt::Dialog);
  AQ_ADD_ENUM(Qt::Popup);
  AQ_ADD_ENUM(Qt::SubWindow);
  // Qt::PenStyle
  AQ_ADD_ENUM(Qt::NoPen);
  AQ_ADD_ENUM(Qt::SolidLine);
  // Qt::PenJoinStyle
  AQ_ADD_ENUM(Qt::MiterJoin);
  AQ_ADD_ENUM(Qt::BevelJoin);
  AQ_ADD_ENUM(Qt::RoundJoin);
  // Qt::PenCapStyle
  AQ_ADD_ENUM(Qt::FlatCap);
  AQ_ADD_ENUM(Qt::SquareCap);
  AQ_ADD_ENUM(Qt::RoundCap);
  // Qt::BrushStyle
  AQ_ADD_ENUM(Qt::NoBrush);
  AQ_ADD_ENUM(Qt::LinearGradientPattern);
  // Qt::ClipOperation
  AQ_ADD_ENUM(Qt::NoClip);
  AQ_ADD_ENUM(Qt::ReplaceClip);
  AQ_ADD_ENUM(Qt::IntersectClip);
  AQ_ADD_ENUM(Qt::UniteClip);
  // Qt::WindowState
  AQ_ADD_ENUM(Qt::WindowNoState);
  AQ_ADD_ENUM(Qt::WindowMinimized);
  AQ_ADD_ENUM(Qt::WindowMaximized);
  AQ_ADD_ENUM(Qt::WindowFullScreen);
  AQ_ADD_ENUM(Qt::WindowActive);

  // AQ namespace
  AQ_ADD_ENUM(AQ::None);
  AQ_ADD_ENUM(AQ::MouseButtonDblClick);
  AQ_ADD_ENUM(AQ::MouseButtonPress);
  AQ_ADD_ENUM(AQ::MouseButtonRelease);
  AQ_ADD_ENUM(AQ::MouseMove);
  AQ_ADD_ENUM(AQ::KeyPress);
  AQ_ADD_ENUM(AQ::KeyRelease);
  AQ_ADD_ENUM(AQ::Move);
  AQ_ADD_ENUM(AQ::FocusIn);
  AQ_ADD_ENUM(AQ::FocusOut);
  AQ_ADD_ENUM(AQ::Show);
  AQ_ADD_ENUM(AQ::Hide);
  AQ_ADD_ENUM(AQ::ParentChange);
  AQ_ADD_ENUM(AQ::Create);
  AQ_ADD_ENUM(AQ::Destroy);
  AQ_ADD_ENUM(AQ::ZOrderChange);
  AQ_ADD_ENUM(AQ::Resize);
  AQ_ADD_ENUM(AQ::Paint);
  AQ_ADD_ENUM(AQ::Enter);
  AQ_ADD_ENUM(AQ::Leave);
  AQ_ADD_ENUM(AQ::Close);
  AQ_ADD_ENUM(AQ::WindowStateChange);
  AQ_ADD_ENUM(AQ::WindowActivate);
  AQ_ADD_ENUM(AQ::WindowDeactivate);
  // Qt3 compat
  AQ_ADD_ENUM(AQ::WType_TopLevel);
  AQ_ADD_ENUM(AQ::WType_Dialog);
  AQ_ADD_ENUM(AQ::WType_Popup);
  AQ_ADD_ENUM(AQ::WType_Desktop);
  AQ_ADD_ENUM(AQ::WSubWindow);
  AQ_ADD_ENUM(AQ::WStyle_Minimize);
  AQ_ADD_ENUM(AQ::WStyle_Maximize);
  AQ_ADD_ENUM(AQ::WShowModal);
  // X
  AQ_ADD_ENUM(AQ::XUpdateFrame);
  AQ_ADD_ENUM(AQ::XBegin);
  AQ_ADD_ENUM(AQ::XEnd);
  AQ_ADD_ENUM(AQ::XSetWindowBackground);
  AQ_ADD_ENUM(AQ::XClearArea);
  AQ_ADD_ENUM(AQ::XDrawPoint);
  AQ_ADD_ENUM(AQ::XDrawLine);
  AQ_ADD_ENUM(AQ::XDrawRect);
  AQ_ADD_ENUM(AQ::XDrawArc);
  AQ_ADD_ENUM(AQ::XDrawPoints);
  AQ_ADD_ENUM(AQ::XDrawPath);
  AQ_ADD_ENUM(AQ::XDrawText);
  AQ_ADD_ENUM(AQ::XDrawImage);
  AQ_ADD_ENUM(AQ::XDrawCanvas);
  AQ_ADD_ENUM(AQ::XSetClip);
  AQ_ADD_ENUM(AQ::XClearClip);
  AQ_ADD_ENUM(AQ::XScroll);
  AQ_ADD_ENUM(AQ::XSetMouseTracking);
  AQ_ADD_ENUM(AQ::XSetEnterLeave);
  AQ_ADD_ENUM(AQ::XDownload);
  AQ_ADD_ENUM(AQ::XUpload);
  AQ_ADD_ENUM(AQ::XProgressDialog);
  AQ_ADD_ENUM(AQ::XCursor);
  AQ_ADD_ENUM(AQ::XGeneric);

  return json_object_to_json_string(array);
}

static inline AQ::EventType strToAQEventType(const QString &str)
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
    return AQ::ParentChange;
  else if (str == "zo")
    return AQ::ZOrderChange;
  else if (str == "fi")
    return AQ::FocusIn;
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

EventHandler::EventHandler(GuiSession *gs) :
  eventsCount_(0), firstRequest_(true), guiSession_(gs),
  lastEventType_(AQ::None), lastMouseP_(0), lastMouseB_(0), lastMouseS_(0)
{
  guiSession_->eventHandler_ = this;
  events_.guiSession_ = guiSession_;
  imgCache_.setMaxCost(AQ_MAX_CACHE * 2);

  connect(guiSession_->webSession_, SIGNAL(requestContent(HttpRequest *, HttpResponse *)), this,
          SLOT(handleWebRequest(HttpRequest *, HttpResponse *)));

  timer_ = new QTimer(this);
  timer_->setSingleShot(true);
  connect(timer_, SIGNAL(timeout()), this, SLOT(processEvents()));
}

void EventHandler::storeImage(const QByteArray &image, quint64 hash)
{
  if (!imgCache_.contains(hash))
    imgCache_.insert(hash, new QByteArray(image));
}

void EventHandler::handleGuiEvent(const QString &msgEvent)
{
  //DEBUG << "handleGuiEvent" << msgEvent.left(150);

  QStringList args(msgEvent.split(AQ_MSG_SEP));
  if (args.size() < 2) {
    events_.addEvent(new AQEvent(AQ::None, QString(), QStringList(), msgEvent));
    return;
  }

  AQ::EventType evType = strToAQEventType(args[0]);

  switch (evType) {
    case AQ::Create:
      postEvent(new AQEvent(evType, args[1], args, msgEvent, Qt::HighEventPriority));
      break;

    case AQ::Destroy:
      postEvent(new AQEvent(evType, args[1], QStringList(), msgEvent));
      break;

    case AQ::XUpdateFrame:
      postEvent(new AQEvent(evType, args[1], args, msgEvent, Qt::HighEventPriority));
      break;

    case AQ::XStoreImage:
      storeImage(QByteArray::fromBase64(args[3].toLocal8Bit()), args[2].toULong());
      break;

    case AQ::XSetMouseTracking:
      postEvent(new AQEvent(evType, args[1], args, msgEvent, Qt::NormalEventPriority));
      break;

    case AQ::XSetWindowBackground:
      postEvent(new AQEvent(evType, args[1], args, msgEvent, Qt::NormalEventPriority, 1));
      break;

    default:
      postEvent(new AQEvent(evType, args[1], args, msgEvent));
  }
}

void EventHandler::handleWebRequest(HttpRequest *httpRequest, HttpResponse *httpResponse)
{
  //DEBUG << "handleWebRequest" << httpRequest->m_path << httpRequest->m_body;

  if (httpRequest->m_json) {
    handleJson(httpRequest, httpResponse);
    return;
  }

  if (httpRequest->m_idle) {
    if (firstRequest_) {
      firstRequest_ = false;
      httpResponse->m_deflate = true;
      httpResponse->m_contentType = "text/plain";
      httpResponse->m_body = aqNamespace();
      return;
    }
    if (events_.eventsCount_) {
      httpResponse->m_contentType = "text/plain";
      httpResponse->m_body = events_.toJson();
      httpResponse->m_deflate = (httpResponse->m_body.size() > 64);
    }
  }
}

#define AQ_ID_TOTARGET  \
  QString id(json_object_get_string(json_object_object_get(request, (char*) "I"))); \
  id = events_.jsonIdToWidgetId_.value(id);

#define AQ_CALC_DIFF_ID_TOTARGET  \
  QString id; \
  json_object *jObj = json_object_object_get(request, (char*) "I"); \
  if (jObj) \
    lastIdTarget_ = id = json_object_get_string(jObj); \
  else \
    id = lastIdTarget_; \
  id = events_.jsonIdToWidgetId_.value(id);

void EventHandler::handleJson(HttpRequest *httpRequest, HttpResponse *httpResponse)
{
  json_object *request = 0;
  if (httpRequest->m_content_length > 0 && httpRequest->m_path == "/j") {
    if (guiSession_->webSession_->fileServer()->writeBody(httpRequest))
      request = json_tokener_parse((char *) httpRequest->m_body.constData());
  } else if (httpRequest->m_path.startsWith("/jH")) {
    handleImage(httpRequest->m_path.mid(3), httpResponse);
    return;
  } else
    request = json_tokener_parse((char *) httpRequest->m_path.mid(2).constData());
  if (!request)
    return;

  if (json_object_is_type(request, json_type_array)) {
    const int len = json_object_array_length(request);
    for (int i = 0; i < len; ++i)
      handleJson(json_object_array_get_idx(request, i), httpResponse, httpRequest);
  } else
    handleJson(request, httpResponse, httpRequest);

  json_object_put(request);
}

void EventHandler::handleJson(json_object *request, HttpResponse *httpResponse, HttpRequest *httpRequest)
{
  AQ::EventType evType;
  json_object *tObj = json_object_object_get(request, (char *) "T");
  if (tObj)
    evType = (AQ::EventType) json_object_get_int(tObj);
  else
    evType = lastEventType_;

  switch (evType) {
    case AQ::XDownload: {
      QString fi(json_object_get_string(json_object_object_get(request, (char *) "F")));
      guiSession_->webSession_->fileServer()->handleDownload(fi.toULong(0, 36), httpResponse);
    }
    break;

    case AQ::XUpload:
      handleUpload(request, httpResponse, httpRequest);
      break;

    case AQ::XProgressDialog:
      handleProgressDialog(request);
      break;

    case AQ::XDrawImage:
      handleImage(request, httpResponse);
      break;

    case AQ::Close:
    case AQ::Enter:
    case AQ::Leave:
      handleEvent(request, evType);
      break;

    case AQ::MouseMove:
    case AQ::MouseButtonDblClick:
    case AQ::MouseButtonRelease:
    case AQ::MouseButtonPress:
      lastEventType_ = evType;
      handleMouse(request, evType);
      break;

    case AQ::KeyPress:
    case AQ::KeyRelease:
      handleKey(request, evType);
      break;

    case AQ::Move:
      handleMove(request);
      break;

    case AQ::Resize:
      handleResize(request);
      break;

    case AQ::WindowStateChange:
      handleWindowState(request);
      break;
  }
}

void EventHandler::handleUpload(json_object *request, HttpResponse *httpResponse, HttpRequest *httpRequest) const
{
  json_object *chunkObj = json_object_object_get(request, (char *) "K");
  const int chunk = (chunkObj ? json_object_get_int(chunkObj) : 0);
  FileServer *fileServer = guiSession_->webSession_->fileServer();

  if (chunk == 0) {
    QString path(json_object_get_string(json_object_object_get(request, (char *) "P")));
    if (fileServer->writeBody(httpRequest, path))
      handleEvent(request, AQ::XUpload);
    return;
  }

  QString fid(json_object_get_string(json_object_object_get(request, (char *) "F")));

  if (chunk > 0) {
    fileServer->setBodyAsChunk(httpRequest, fid, chunk);
    return;
  }

  if (chunk < 0) {
    int lastChunk = -chunk;
    QString path(json_object_get_string(json_object_object_get(request, (char *) "P")));
    fileServer->setBodyAsChunk(httpRequest, fid, lastChunk);
    if (fileServer->writeBodyChunks(httpRequest, path, fid, lastChunk))
      handleEvent(request, AQ::XUpload);
  }
}

void EventHandler::handleEvent(json_object *request, AQ::EventType evType) const
{
  AQ_ID_TOTARGET;

  QString webEv("%1");
  webEv += AQ_MSG_SEP + id;

  switch (evType) {
    case AQ::Enter:
      guiSession_->guiWebProxy_->sendWebEvent(webEv.arg("en"));
      break;

    case AQ::Leave:
      guiSession_->guiWebProxy_->sendWebEvent(webEv.arg("lv"));
      break;

    case AQ::Close:
      guiSession_->guiWebProxy_->sendWebEvent(webEv.arg("cl"));
      break;

    case AQ::XUpload:
      guiSession_->guiWebProxy_->sendWebEvent(webEv.arg("up"));
      break;
  }
}

void EventHandler::handleImage(const QString &hash, HttpResponse *httpResponse) const
{
  QByteArray *image = imgCache_.object(hash.toULong(0, 36));
  if (image && !image->isEmpty()) {
    httpResponse->m_contentType = "image/png";
    httpResponse->m_body = *image;
  } else {
    httpResponse->m_contentType = "image/png";
    DEBUG << "EventHandler::handleImage !image" << hash;
  }
}

void EventHandler::handleImage(json_object *request, HttpResponse *httpResponse) const
{
  handleImage(json_object_get_string(json_object_object_get(request, (char *) "H")), httpResponse);
}

void EventHandler::handleMouse(json_object *request, AQ::EventType evType)
{
  AQ_CALC_DIFF_ID_TOTARGET;

  int p = lastMouseP_;
  jObj = json_object_object_get(request, (char *) "P");
  if (jObj) {
    lastMouseP_ += json_object_get_int(jObj);
    p = lastMouseP_;
  }

  int b = lastMouseB_;
  jObj = json_object_object_get(request, (char *) "B");
  if (jObj)
    lastMouseB_ = b = json_object_get_int(jObj);

  int s = lastMouseS_;
  jObj = json_object_object_get(request, (char *) "S");
  if (jObj)
    lastMouseS_ = s = json_object_get_int(jObj);

  QString webEv("%1");
  webEv += AQ_MSG_SEP + id;
  webEv += AQ_MSG_SEP + QString::number(AQ_POINT_X(p));
  webEv += AQ_MSG_SEP + QString::number(AQ_POINT_Y(p));
  webEv += AQ_MSG_SEP + QString::number(b | 0x80, 2);
  webEv += AQ_MSG_SEP + QString::number(s | 0x80, 2);

  switch (evType) {
    case AQ::MouseButtonPress:
      guiSession_->guiWebProxy_->sendWebEvent(webEv.arg("mp"));
      break;

    case AQ::MouseButtonRelease:
      guiSession_->guiWebProxy_->sendWebEvent(webEv.arg("mr"));
      break;

    case AQ::MouseButtonDblClick:
      guiSession_->guiWebProxy_->sendWebEvent(webEv.arg("md"));
      break;

    case AQ::MouseMove:
      guiSession_->guiWebProxy_->sendWebEvent(webEv.arg("mm"));
      break;
  }
}

void EventHandler::handleKey(json_object *request, AQ::EventType evType) const
{
  AQ_ID_TOTARGET;
  const int keyCode = json_object_get_int(json_object_object_get(request, (char *) "K"));
  const int state = json_object_get_int(json_object_object_get(request, (char *) "S"));

  QString webEv(evType == AQ::KeyPress ? "kp" : "kr");
  webEv += AQ_MSG_SEP + id;
  webEv += AQ_MSG_SEP + QString::number(keyCode);
  webEv += AQ_MSG_SEP + QString::number(state | 0x80, 2);

  guiSession_->guiWebProxy_->sendWebEvent(webEv);
}

void EventHandler::handleMove(json_object *request) const
{
  AQ_ID_TOTARGET;
  const int p = json_object_get_int(json_object_object_get(request, (char *) "P"));

  QString webEv("mv");
  webEv += AQ_MSG_SEP + id;
  webEv += AQ_MSG_SEP + QString::number(AQ_POINT_X(p));
  webEv += AQ_MSG_SEP + QString::number(AQ_POINT_Y(p));

  guiSession_->guiWebProxy_->sendWebEvent(webEv);
}

void EventHandler::handleResize(json_object *request) const
{
  AQ_ID_TOTARGET
  const int w = json_object_get_int(json_object_object_get(request, (char *) "W"));
  const int h = json_object_get_int(json_object_object_get(request, (char *) "H"));

  QString webEv("rs");
  webEv += AQ_MSG_SEP + id;
  webEv += AQ_MSG_SEP + QString::number(w);
  webEv += AQ_MSG_SEP + QString::number(h);

  guiSession_->guiWebProxy_->sendWebEvent(webEv);
}

void EventHandler::handleProgressDialog(json_object *request) const
{
  AQ_ID_TOTARGET;
  json_object *argsObj = json_object_object_get(request, (char *) "A");

  QString webEv("pd");
  webEv += AQ_MSG_SEP + id;
  if (argsObj) {
    QString args(json_object_get_string(argsObj));
    QString progress(json_object_get_string(json_object_object_get(request, (char *) "P")));
    webEv += AQ_MSG_SEP + args;
    webEv += AQ_MSG_SEP + progress;
  }

  guiSession_->guiWebProxy_->sendWebEvent(webEv);
}

void EventHandler::handleWindowState(json_object *request) const
{
  AQ_ID_TOTARGET
  const int s = json_object_get_int(json_object_object_get(request, (char *) "S"));

  QString webEv("ws");
  webEv += AQ_MSG_SEP + id;
  webEv += AQ_MSG_SEP + QString::number(s);

  guiSession_->guiWebProxy_->sendWebEvent(webEv);
}

void EventHandler::processEvents()
{
  if (guiSession_->webSession_) {
    while (eventsCount_) {
      AQEvent *pEvent = pendingEvents_.dequeue();
      --eventsCount_;
      if (pEvent->widgetId().isEmpty()) {
        delete pEvent;
        continue;
      }
      events_.addEvent(pEvent);
    }

    if (events_.eventsCount_)
      guiSession_->webSession_->contentAvailable();
  }
}

void EventHandler::postEvent(AQEvent *event)
{
  if (event->priority() == Qt::HighEventPriority) {
    events_.addEvent(event);
    processEvents();
  } else {
    if (!eventsCount_)
      timer_->start(0);
    ++eventsCount_;
    pendingEvents_.enqueue(event);
  }
}
