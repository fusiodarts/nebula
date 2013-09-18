/***************************************************************************
 EventQueue.cpp
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
#include "GuiWebProxy.h"
#include "WebServer.h"
#include "FileServer.h"
#include "EventQueue.h"

#define AQ_RGBA_STR(C) (QString("rgba(%1,%2,%3,%4)").arg(C.red()). \
                        arg(C.green()).arg(C.blue()).arg(1))

#define AQ_ADD_STR(AN,VA) \
  json_object_object_add(obj,(char*)AN,json_object_new_string((char*)VA))

#define AQ_ADD_INT(AN,VA) \
  json_object_object_add(obj,(char*)AN,json_object_new_int(VA))

#define AQ_CACHED_COLOR(O) \
  QString colorName(O); \
  QHash<QString, uint>::const_iterator it(colorsNamesCache_.find(colorName)); \
  if (it != colorsNamesCache_.end()) { \
    colorName = QString::number(*it); \
  } else { \
    colorsNamesCache_.insert(colorName, nColorsNamesCache_); \
    QString idx(QString::number(nColorsNamesCache_)); \
    AQ_ADD_STR("CL",QString(colorName + ":" + idx).toStdString().c_str()); \
    colorName = idx; \
    ++nColorsNamesCache_; \
  }

#define AQ_CACHED_FONT(O) \
  QString fontName(O); \
  QHash<QString, uint>::const_iterator it(fontsNamesCache_.find(fontName)); \
  if (it != fontsNamesCache_.end()) { \
    fontName = QString::number(*it); \
  } else { \
    fontsNamesCache_.insert(fontName, nFontsNamesCache_); \
    QString idx(QString::number(nFontsNamesCache_)); \
    AQ_ADD_STR("FN",QString(fontName + ":" + idx).toStdString().c_str()); \
    fontName = idx; \
    ++nFontsNamesCache_; \
  }

#define AQ_CACHED_SCHE(O) \
  QString schePath(O); \
  QHash<QString, uint>::const_iterator it(schePathsCache_.find(schePath)); \
  if (it != schePathsCache_.end()) { \
    schePath = QString::number(*it); \
  } else { \
    schePathsCache_.insert(schePath, nSchePathsCache_); \
    QString idx(QString::number(nSchePathsCache_)); \
    AQ_ADD_STR("SC",QString(schePath + ":" + idx).toStdString().c_str()); \
    schePath = idx; \
    ++nSchePathsCache_; \
  }

#define AQ_DIF_LONG_ATTR(AN,VA) { \
    qlonglong val = VA.toLongLong(0,36); \
    if (lastLongAttrs_.contains(AN)) { \
      qlonglong difVV = val - lastLongAttrs_[AN]; \
      if (difVV != 0) { \
        if (difVV == -lastLongDifs_[AN]) \
          AQ_ADD_STR(AN,"_"); \
        else if (difVV < 0 ) \
          AQ_ADD_STR(AN,QString::number(-difVV,36).prepend('_').toStdString().c_str()); \
        else \
          AQ_ADD_STR(AN,QString::number(difVV,36).toStdString().c_str()); \
        lastLongAttrs_[AN] = val; \
        lastLongDifs_[AN] = difVV; \
      } \
    } else { \
      AQ_ADD_STR(AN,QString::number(val,36).toStdString().c_str()); \
      lastLongAttrs_[AN] = val; \
      lastLongDifs_[AN] = val; \
    } }

#define AQ_DIF_INT_ATTR(AN,VA) { \
    int va = VA; \
    if (lastIntAttrs_.contains(AN)) { \
      int difVV = va - lastIntAttrs_[AN]; \
      if (difVV != 0) { \
        AQ_ADD_INT(AN,difVV); \
        lastIntAttrs_[AN] = va; \
      } \
    } else { \
      AQ_ADD_INT(AN,va); \
      lastIntAttrs_[AN] = va; \
    } }

#define AQ_DIF_INT_ATTR_NOT_NULL(AN,VA) { \
    if (lastIntAttrs_.contains(AN)) \
      AQ_ADD_INT(AN,VA-lastIntAttrs_[AN]); \
    else \
      AQ_ADD_INT(AN,VA); \
    lastIntAttrs_[AN] = VA; }

#define AQ_STR_ATTR(AN,VA) { \
    QString va(VA); \
    if (lastStrAttrs_.contains(AN)) { \
      if (va != lastStrAttrs_[AN]) { \
        AQ_ADD_STR(AN,va.toStdString().c_str()); \
        lastStrAttrs_[AN] = va; \
      } \
    } else { \
      AQ_ADD_STR(AN,va.toStdString().c_str()); \
      lastStrAttrs_[AN] = va; \
    } }

#define AQ_STR_ATTR_NOT_NULL(AN,VA) { \
    QString va(VA); \
    if (lastStrAttrs_.contains(AN)) { \
      if (va != lastStrAttrs_[AN]) { \
        AQ_ADD_STR(AN,va.toStdString().c_str()); \
        lastStrAttrs_[AN] = va; \
      }  else \
        AQ_ADD_STR(AN,""); \
    } else { \
      AQ_ADD_STR(AN,va.toStdString().c_str()); \
      lastStrAttrs_[AN] = va; \
    } }

#define AQ_INT_ATTR(AN,VA) { \
    int va = VA; \
    if (lastIntAttrs_.contains(AN)) { \
      if (va != lastIntAttrs_[AN]) { \
        AQ_ADD_INT(AN,va); \
        lastIntAttrs_[AN] = va; \
      } \
    } else { \
      AQ_ADD_INT(AN,va); \
      lastIntAttrs_[AN] = va; \
    } }

#define AQ_DIF_LIST_KEY_ATTR(AN,VA,KA) { \
    QString va(VA); QString ka(KA); \
    if (lastStrAttrs_.contains(ka)) { \
      QString difLL(difLists(va,lastStrAttrs_[ka])); \
      if (!difLL.isEmpty()) { \
        AQ_ADD_STR(AN,difLL.toStdString().c_str()); \
        lastStrAttrs_[ka] = va; \
      } \
    } else { \
      AQ_ADD_STR(AN,va.toStdString().c_str()); \
      lastStrAttrs_[ka] = va; \
    } }

#define AQ_DIF_LIST_ATTR(AN,VA) AQ_DIF_LIST_KEY_ATTR(AN,VA,AN)

#define AQ_DIF_PATH_ATTR(SC,AN,VA) { \
    QString va(VA); \
    AQ_CACHED_SCHE(SC); \
    AQ_INT_ATTR("S",schePath.toInt()); \
    if (lastStrAttrs_.contains(SC)) { \
      QString difLL(difLists(va,lastStrAttrs_[SC])); \
      if (!difLL.isEmpty()) { \
        AQ_ADD_STR(AN,difLL.toStdString().c_str()); \
        lastStrAttrs_[SC] = va; \
      } \
    } else { \
      AQ_ADD_STR(AN,va.toStdString().c_str()); \
      lastStrAttrs_[SC] = va; \
    } }

#define AQ_ID_TOJSON \
  QString jsId(widgetIdToJsonId_.value(event->widgetId())); \
  if (jsId.isEmpty()) { \
    jsId = QString::number(++jsonIdsCount_,36); \
    widgetIdToJsonId_.insert(event->widgetId(),jsId); \
    jsonIdToWidgetId_.insert(jsId,event->widgetId()); \
  } \
  obj = json_object_new_object(); \
  AQ_DIF_INT_ATTR("I",jsId.toInt(0,36));

#define AQ_INT_TYPE(VA) \
  AQ_INT_ATTR("T",VA);

#define AQ_BEGIN_UP_PENBRUSH bool upPen = false; bool upBrush = false;
#define AQ_UPDATE_PEN(PEN)                \
  QString cpen(event->args()[PEN]);       \
  if (!cpen.isEmpty()) {                  \
    QStringList list(cpen.split(';'));    \
    QString cln = list.takeLast();        \
    AQ_CACHED_COLOR(cln);                 \
    list.append(colorName);               \
    cpen = list.join(";");                \
    AQ_STR_ATTR("P", cpen);               \
    upPen = true;                         \
  }
#define AQ_UPDATE_BRUSH(BRU)              \
  QString cbru;                           \
  if (event->args().size() > BRU) {       \
    cbru = event->args()[BRU];            \
    if (!cbru.isEmpty()) {                \
      QStringList list(cbru.split(';'));  \
      QString cln = list.takeLast();      \
      AQ_CACHED_COLOR(cln);               \
      list.append(colorName);             \
      cbru = list.join(";");              \
      AQ_STR_ATTR("B", cbru);             \
      upBrush = true;                     \
    }                                     \
  }
#define AQ_END_UP_PENBRUSH                \
  int uflag = -1;                         \
  if (upPen && upBrush) uflag = 3;        \
  else if (upBrush) uflag = 2;            \
  else if (upPen) uflag = 1;              \
  AQ_INT_ATTR("U",uflag);

static inline QByteArray pathToJson(const QPainterPath &path)
{
  int count = path.elementCount();
  QByteArray ee;
  for (int i = 0; i < count; ++i) {
    const QPainterPath::Element &e = path.elementAt(i);
    if (i)
      ee += ";";
    switch (e.type) {
      case QPainterPath::MoveToElement: {
        ee += "m;";
        ee += QByteArray::number(e.x) + ";";
        ee += QByteArray::number(e.y);
      }
      break;
      case QPainterPath::LineToElement: {
        ee += QByteArray::number(e.x) + ";";
        ee += QByteArray::number(e.y);
      }
      break;
      case QPainterPath::CurveToElement: {
        const QPainterPath::Element &cp2 = path.elementAt(++i);
        const QPainterPath::Element &ep = path.elementAt(++i);
        ee += "c;";
        ee += QByteArray::number(e.x) + ";";
        ee += QByteArray::number(e.y) + ";";
        ee += QByteArray::number(cp2.x) + ";";
        ee += QByteArray::number(cp2.y) + ";";
        ee += QByteArray::number(ep.x) + ";";
        ee += QByteArray::number(ep.y);
      }
      break;
    }
  }
  return ee;
}

static inline QString toStrCoal(qreal nn)
{
  return (nn == 0 ? QString() : QString::number(nn));
}

static inline qreal toFloatCoal(const QString &ss)
{
  return (ss.isEmpty() ? 0.0 : ss.toFloat());
}

static inline QString simetricPath(const QStringList &path)
{
  int pSize = path.size();
  if (pSize < 5 || (pSize % 2) != 0)
    return path.join(";");

  int midSize = pSize / 2;
  int i;
  QString pa, pb;
  QString ret;

  for (i = 0; i < midSize; ++i) {
    pa = path[i];
    pb = path[i + midSize];
    if (pa.isEmpty() && pb.isEmpty())
      continue;
    pa.prepend("-");
    if (pa != pb)
      break;
  }

  if (i == midSize) {
    for (int j = 0; j < midSize; ++j) {
      if (j)
        ret += ";";
      ret += path[j];
    }
    ret += ";@";
  } else
    return path.join(";");

  return ret;
}

static inline QString simplifyPath(const QString &path)
{
  QStringList list(path.split(';'));
  QStringList parPath;
  QString ret;
  qreal mx = 0, my = 0;
  qreal lx = 0, ly = 0;

  for (int i = 0; i < list.size(); ++i) {
    if (list[i] == "m") {
      if (!parPath.isEmpty()) {
        ret += ";" + simetricPath(parPath) + ";";
        parPath.clear();
      } else if (i)
        ret += ";";
      ret += "m;" + list[i + 1] + ";" + list[i + 2];
      mx = toFloatCoal(list[++i]);
      my = toFloatCoal(list[++i]);
      continue;
    }
    if (list[i] == "c") {
      if (!parPath.isEmpty()) {
        ret += ";" + simetricPath(parPath) + ";";
        parPath.clear();
      } else if (i)
        ret += ";";
      ret += "c;";
      ret += list[++i] + ";";
      ret += list[++i] + ";";
      ret += list[++i] + ";";
      ret += list[++i] + ";";
      ret += list[++i] + ";";
      ret += list[++i];
      continue;
    }
    lx = toFloatCoal(list[i]);
    ly = toFloatCoal(list[++i]);
    parPath.append(toStrCoal(lx - mx));
    parPath.append(toStrCoal(ly - my));
    mx = lx;
    my = ly;
  }

  if (!parPath.isEmpty())
    ret += ";" + simetricPath(parPath);

  return ret;
}

static inline QString difLists(const QString &minu, const QString &sust)
{
  QStringList minuList(minu.split(';'));
  QStringList sustList(sust.split(';'));
  QString ret;
  bool difs = false;

  for (int i = 0; i < minuList.size(); ++i) {
    if (i)
      ret += ";";
    if (minuList[i] != sustList[i]) {
      ret += QString::number(minuList[i].toFloat() - sustList[i].toFloat());
      difs = true;
    }
  }

  if (!difs)
    return QString();

  return ret;
}

static inline QString schemaPath(const QString &path)
{
  QString ret;
  QStringList list(path.split(';'));
  QString it;
  int cs = 0;
  for (int i = 0; i < list.size(); ++i) {
    it = list[i];
    if (it == "m" || it == "c" || it == "@") {
      if (cs) {
        ret += QString::number(cs);
        cs = 0;
      }
      if (it != "m")
        ret += it;
    } else
      ++cs;
  }
  if (cs)
    ret += QString::number(cs);
  return ret;
}

static inline QByteArray toJsonArray(const QList<QByteArray> &list,
                                     const QByteArray &type, bool *grouped = 0)
{
  int sz = list.size();
  if (sz == 1) {
    if (grouped)
      *grouped = false;
    return list.at(0);
  } else if (grouped)
    *grouped = true;

  QByteArray grp("{\"G\":\"" + type + "\",\"D\":[");
  QByteArray it;
  int idx;

  for (int i = 0; i < sz; ++i) {
    it = list.at(i);
    if (i > 0)
      grp += ',';
    if (it != "{}") {
      idx = it.indexOf(':') + 1;
      grp += it.mid(idx, it.size() - idx - 1);
    } else
      grp += "null";
  }

  return grp + "]}";
}

static inline QByteArray groupEventName(const QByteArray &obj)
{
  QByteArray ret;
  int idx = obj.indexOf("\":");
  if (idx == obj.lastIndexOf("\":"))
    ret = obj.mid(idx - 1, 1);
  return ret;
}

EventQueue::EventQueue() :
  guiSession_(0), eventsCount_(0),
  nColorsNamesCache_(1), nFontsNamesCache_(1),
  nSchePathsCache_(1), jsonIdsCount_(1)
{
}

void EventQueue::addEvent(AQEvent *event)
{
  ++eventsCount_;
  switch (event->priority()) {
    case Qt::HighEventPriority:
      eventsHighPriority_.enqueue(event);
      break;
    case Qt::NormalEventPriority:
      eventsNormalLevelsPriority_[event->levelPriority()].enqueue(event);
      break;
    case Qt::LowEventPriority:
      eventsLowPriority_.enqueue(event);
      break;
  }
}

QByteArray EventQueue::toJson()
{
#define AQ_APPEND_OBJ \
  { \
    --eventsCount_; \
    obj = jsonEvent(event); \
    for (int i = 0; i < obj.size(); ++i)  { \
      it = obj.at(i); \
      gn = ((!eventsGroup_.isEmpty() && it == "{}") ? lastEventGroup_ : groupEventName(it)); \
      if (gn != lastEventGroup_) { \
        if (!eventsGroup_.isEmpty()) { \
          gp = toJsonArray(eventsGroup_,lastEventGroup_,&grouped); \
          if (grouped) \
            array += sep + cacheGrpEvent(gp); \
          else \
            array += sep + gp; \
          eventsGroup_.clear(); \
        } \
        lastEventGroup_ = gn; \
      } \
      if (gn.isEmpty()) \
        array += sep + it; \
      else \
        eventsGroup_.append(it); \
    } \
    delete event; \
  }

  QByteArray array;
  QByteArray it;
  QByteArray gn;
  QByteArray gp;
  bool grouped = false;
  QList<QByteArray> obj;
#ifdef AQ_VERBOSE
  QByteArray sep(",\n\r");
#else
  QByteArray sep(",");
#endif

  while (!eventsHighPriority_.isEmpty()) {
    AQEvent *event = eventsHighPriority_.dequeue();
    AQ_APPEND_OBJ;
  }

  if (!eventsNormalLevelsPriority_.isEmpty()) {
    QList<QQueue<AQEvent *> > list(eventsNormalLevelsPriority_.values());
    while (!list.isEmpty()) {
      QQueue<AQEvent *> queue(list.takeFirst());
      while (!queue.isEmpty()) {
        AQEvent *event = queue.dequeue();
        AQ_APPEND_OBJ;
      }
    }
    eventsNormalLevelsPriority_.clear();
  }

  while (eventsCount_) {
    AQEvent *event = eventsLowPriority_.dequeue();
    AQ_APPEND_OBJ;
  }

  if (!eventsGroup_.isEmpty()) {
    gp = toJsonArray(eventsGroup_, lastEventGroup_, &grouped);
    if (grouped)
      array += sep + cacheGrpEvent(gp);
    else
      array += sep + gp;
    eventsGroup_.clear();
  }

  if (!array.isEmpty())
    array.remove(0, 1);
  array.prepend('[');
  array.append(']');

#ifdef AQ_VERBOSE
  DEBUG << " ";
  DEBUG << "***************";
  DEBUG << array;
  DEBUG << "***************";
#endif

  return array;
}

QByteArray EventQueue::cacheEvent(const QByteArray &evObj)
{
  if (evObj != "{}") {
    QByteArray gn(groupEventName(evObj));
    if (gn.isEmpty() || gn != lastRawEventGroup_) {
      lastRawEventGroup_ = gn;
      QHash<QByteArray, uint>::iterator it(eventsCache_.find(evObj));
      if (it != eventsCache_.end()) {
        json_object *obj = json_object_new_object();
        uint nq = it.value();
        recentEventsCache_.move(recentEventsCache_.lastIndexOf(nq), recentEventsCache_.size() - 1);
        AQ_ADD_INT("Q", nq);
        QByteArray retObj(json_object_to_json_string(obj));
        json_object_put(obj);
        return retObj;
      }
    }
  }

  uint ne = recentEventsCache_.size();
  if (ne == AQ_MAX_CACHE) {
    ne = recentEventsCache_.at(0);
    if (usedEventsCache_.contains(ne))
      eventsCache_.remove(usedEventsCache_.value(ne));
    recentEventsCache_.move(0, AQ_MAX_CACHE - 1);
  } else
    recentEventsCache_.append(ne);

  eventsCache_.insert(evObj, ne);
  usedEventsCache_.insert(ne, evObj);
  return evObj;
}

QByteArray EventQueue::cacheGrpEvent(const QByteArray &evObj)
{
  QHash<QByteArray, uint>::iterator it(eventsGrpCache_.find(evObj));
  if (it != eventsGrpCache_.end()) {
    json_object *obj = json_object_new_object();
    uint nq = it.value();
    recentEventsGrpCache_.move(recentEventsGrpCache_.lastIndexOf(nq), recentEventsGrpCache_.size() - 1);
    AQ_ADD_INT("q", nq);
    QByteArray retObj(json_object_to_json_string(obj));
    json_object_put(obj);
    return retObj;
  }

  uint ne = recentEventsGrpCache_.size();
  if (ne == AQ_MAX_CACHE) {
    ne = recentEventsGrpCache_.at(0);
    if (usedEventsGrpCache_.contains(ne))
      eventsGrpCache_.remove(usedEventsGrpCache_[ne]);
    recentEventsGrpCache_.move(0, AQ_MAX_CACHE - 1);
  } else
    recentEventsGrpCache_.append(ne);

  eventsGrpCache_.insert(evObj, ne);
  usedEventsGrpCache_.insert(ne, evObj);
  return evObj;
}

QList<QByteArray> EventQueue::jsonEvent(AQEvent *event)
{
  QList<QByteArray> ret;
  AQ::EventType evType = event->type();
  if (evType > AQ::XUpdateFrame && event->widgetId() == rootWidget_)
    return ret;

  json_object *obj = 0;

  switch (evType) {
    case AQ::Create: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);
      AQ_DIF_LONG_ATTR("W", event->args()[3]);
      AQ_DIF_INT_ATTR("A", widgetIdToJsonId_.value(event->args()[5]).toInt(0, 36));

      if (event->args()[2] == "1") {
        rootWidget_ = event->widgetId();
        json_object_object_add(obj, (char *) "R", json_object_new_boolean(true));
      }

      // ### provisional
      QString clName(event->args()[4]);
      if (clName == "QTitleBar" || clName == "QDockWindowTitleBar" || clName == "QSplitterHandle")
        AQ_STR_ATTR_NOT_NULL("K", clName);
    }
    break;

    case AQ::Destroy: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);

      widgetIdToJsonId_.remove(event->widgetId());
      jsonIdToWidgetId_.remove(jsId);
    }
    break;

    case AQ::Show: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);
      AQ_DIF_LONG_ATTR("W", event->args()[2]);
    }
    break;

    case AQ::Move: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);

      quint32 p = AQ_TOPOINT(event->args()[2].toInt(), event->args()[3].toInt());
      AQ_ADD_STR("O", QString::number(p, 36).toStdString().c_str());
    }
    break;

    case AQ::Resize: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);

      quint32 wh = AQ_TOPOINT(event->args()[2].toInt(), event->args()[3].toInt());
      AQ_ADD_STR("S", QString::number(wh, 36).toStdString().c_str());
    }
    break;

    case AQ::ParentChange: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);
      AQ_DIF_INT_ATTR("A", widgetIdToJsonId_.value(event->args()[2]).toInt(0, 36));

      quint32 p = AQ_TOPOINT(event->args()[3].toInt(), event->args()[4].toInt());
      AQ_ADD_STR("P", QString::number(p, 36).toStdString().c_str());
    }
    break;

    case AQ::ZOrderChange: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);
      AQ_DIF_INT_ATTR("Z", event->args()[2].toInt());
    }
    break;

    case AQ::XUpdateFrame: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);
      AQ_ADD_INT("L", event->args()[2].toInt());
      AQ_ADD_INT("R", event->args()[3].toInt());
      AQ_ADD_INT("O", event->args()[4].toInt());
      AQ_ADD_INT("B", event->args()[5].toInt());
    }
    break;

    case AQ::XBegin: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);

      QString ee(event->args()[2]);
      if (!ee.isEmpty()) {
        ee = simplifyPath(ee);
        AQ_ADD_STR("E", ee.toStdString().c_str());
      }
    }
    break;

    case AQ::XSetWindowBackground: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);
      AQ_CACHED_COLOR(event->args()[2]);
      AQ_INT_ATTR("C", colorName.toInt());
    }
    break;

    case AQ::XClearArea: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);

      QString rr;
      rr += event->args()[2] + ";";
      rr += event->args()[3] + ";";
      rr += event->args()[4] + ";";
      rr += event->args()[5];
      AQ_DIF_LIST_ATTR("R", rr);
    }
    break;

    case AQ::XDrawPoint: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);
      AQ_BEGIN_UP_PENBRUSH;
      AQ_UPDATE_PEN(4);
      AQ_END_UP_PENBRUSH;

      QString nn;
      nn += event->args()[2] + ";";
      nn += event->args()[3];
      AQ_DIF_LIST_ATTR("N", nn);
    }
    break;

    case AQ::XDrawLine: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);
      AQ_BEGIN_UP_PENBRUSH;
      AQ_UPDATE_PEN(6);
      AQ_END_UP_PENBRUSH;

      QString ll;
      ll += event->args()[2] + ";";
      ll += event->args()[3] + ";";
      ll += event->args()[4] + ";";
      ll += event->args()[5];
      AQ_DIF_LIST_ATTR("L", ll);
    }
    break;

    case AQ::XDrawRect: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);
      AQ_BEGIN_UP_PENBRUSH;
      AQ_UPDATE_PEN(6);
      AQ_UPDATE_BRUSH(7);
      AQ_END_UP_PENBRUSH;

      QString rr;
      rr += event->args()[2] + ";";
      rr += event->args()[3] + ";";
      rr += event->args()[4] + ";";
      rr += event->args()[5];
      AQ_DIF_LIST_ATTR("R", rr);
    }
    break;

    case AQ::XDrawArc: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);
      AQ_BEGIN_UP_PENBRUSH;
      AQ_UPDATE_PEN(8);
      AQ_UPDATE_BRUSH(9);
      AQ_END_UP_PENBRUSH;

      QRectF r(event->args()[2].toInt(), event->args()[3].toInt(), event->args()[4].toInt(), event->args()[5].toInt());
      QPainterPath arcPath;
      arcPath.moveTo(r.center());
      arcPath.arcTo(r, event->args()[6].toInt() / 16, event->args()[7].toInt() / 16);
      QString ee(simplifyPath(pathToJson(arcPath)));
      AQ_ADD_STR("E", ee.toStdString().c_str());
    }
    break;

    case AQ::XDrawPoints: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);

      // ### TODO
    }
    break;

    case AQ::XDrawPath: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);
      AQ_BEGIN_UP_PENBRUSH;
      AQ_UPDATE_PEN(3);
      AQ_UPDATE_BRUSH(4);
      AQ_END_UP_PENBRUSH;

      QString ee(simplifyPath(event->args()[2]));
      QString sche(schemaPath(ee) + cpen + cbru);
      AQ_DIF_PATH_ATTR(sche, "E", ee);
    }
    break;

    case AQ::XDrawText: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);
      AQ_BEGIN_UP_PENBRUSH;
      AQ_UPDATE_PEN(7);
      AQ_UPDATE_BRUSH(8);
      AQ_END_UP_PENBRUSH;
      AQ_CACHED_FONT(event->args()[6]);
      AQ_INT_ATTR("F", fontName.toInt());

      QString mm;
      mm += event->args()[2] + ";";
      mm += event->args()[3];// + ";";
      //mm += event->args()[5];
      AQ_STR_ATTR("M", mm);

      AQ_ADD_STR("X", event->args()[4].toUtf8().data());
    }
    break;

    case AQ::XDrawImage: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);

      QString rr;
      rr += event->args()[2] + ";"; //dx
      rr += event->args()[3] + ";"; //dy
      rr += event->args()[4] + ";"; //sx
      rr += event->args()[5] + ";"; //sy
      rr += event->args()[6] + ";"; //sw
      rr += event->args()[7];       //sh
      AQ_DIF_LIST_ATTR("D", rr);

      quint64 hash = event->args()[8].toULong();
      AQ_ADD_STR("H", QString::number(hash, 36).toStdString().c_str());
    }
    break;

    case AQ::XDrawCanvas: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);

      QString rr;
      rr += event->args()[2] + ";"; //dx
      rr += event->args()[3] + ";"; //dy
      rr += event->args()[4] + ";"; //sx
      rr += event->args()[5] + ";"; //sy
      rr += event->args()[6] + ";"; //sw
      rr += event->args()[7];       //sh
      AQ_DIF_LIST_ATTR("D", rr);

      if (event->args().size() == 9)
        AQ_ADD_STR("H", event->args()[8].toStdString().c_str());
    }
    break;

    case AQ::XScroll: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);

      quint32 sp = AQ_TOPOINT(event->args()[2].toInt(), event->args()[3].toInt());
      AQ_ADD_STR("V", QString::number(sp, 36).toStdString().c_str());
    }
    break;

    case AQ::XSetClip: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);

      QString ee(simplifyPath(event->args()[2]));
      QString sche(schemaPath(ee));
      AQ_DIF_PATH_ATTR(sche, "E", ee);
    }
    break;

    case AQ::XSetMouseTracking: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);
      AQ_DIF_INT_ATTR("M", event->args()[2].toInt());
    }
    break;

    case AQ::XSetEnterLeave: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);
      AQ_DIF_INT_ATTR("M", event->args()[2].toInt());
    }
    break;

    case AQ::XDownload: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);

      quint64 fi = guiSession_->webSession_->fileServer()->prepareDownload(event->args()[2]);
      AQ_ADD_STR("F", QString::number(fi, 36).toStdString().c_str());
    }
    break;

    case AQ::XUpload: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);
      AQ_ADD_INT("X", event->args()[2].toInt());
      AQ_ADD_INT("Y", event->args()[3].toInt());
      AQ_ADD_STR("P", event->args()[4].toUtf8().data());
    }
    break;

    case AQ::XCursor: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);

      if (event->args().size() > 2)
        AQ_ADD_INT("O", event->args()[2].toInt());
    }
    break;

    case AQ::XGeneric: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);
      AQ_ADD_STR("X", event->args()[2].toUtf8().data());
    }
    break;

    case AQ::None: {
      obj = json_object_new_object();
      AQ_ADD_STR("CODE", event->msgEvent().toStdString().c_str());
    }
    break;

    default: {
      AQ_ID_TOJSON;
      AQ_INT_TYPE(evType);
    }
  }

  if (!obj)
    return ret;

  QByteArray retObj(json_object_to_json_string(obj));
  json_object_put(obj);

  if (evType != AQ::None) {
    switch (evType) {
      case AQ::XDrawPath: {
        int idx = retObj.lastIndexOf(",\"E\"");
        if (idx == -1) {
          if (retObj.startsWith("{\"E")) {
            ret.append(cacheEvent("{}"));
            ret.append(cacheEvent(retObj));
          } else {
            ret.append(cacheEvent(retObj));
            ret.append(cacheEvent("{}"));
          }
        } else {
          ret.append(cacheEvent(retObj.left(idx) + '}'));
          ret.append(cacheEvent('{' + retObj.mid(idx + 1)));
        }
      }
      break;

      case AQ::XDrawText: {
        QByteArray pre;
        QByteArray suf;
        int idx = retObj.lastIndexOf(",\"X\"");
        if (idx == -1) {
          pre = retObj;
          suf = "{}";
        } else {
          pre = retObj.left(idx) + '}';
          suf = '{' + retObj.mid(idx + 1);
        }
        idx = pre.lastIndexOf(",\"M\"", idx);
        if (idx == -1) {
          ret.append(cacheEvent(pre));
          ret.append(cacheEvent("{}"));
          ret.append(cacheEvent(suf));
        } else {
          ret.append(cacheEvent(pre.left(idx) + '}'));
          ret.append(cacheEvent('{' + pre.mid(idx + 1)));
          ret.append(cacheEvent(suf));
        }
      }
      break;

      default:
        ret.append(cacheEvent(retObj));
    }
  } else
    ret.append(retObj);

#ifdef AQ_VERBOSE
  //  DEBUG << "**" << ret;
  //  DEBUG << retObj;
  //  DEBUG << event->msgEvent().left(100);
  //  DEBUG << "      ";
#endif

  return ret;
}
