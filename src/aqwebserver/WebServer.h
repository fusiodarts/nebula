/***************************************************************************
 WebServer.h
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

#ifndef WEBSERVER_H
#define WEBSERVER_H

#include <QtNetwork>

struct HttpRequest {
  inline HttpRequest() :
    m_sessionId(0), m_json(false), m_idle(true),
    m_content_length(0), m_body_file_id(0) {}

  HttpRequest(const QList<QByteArray> &text);

  QByteArray  m_path;
  QByteArray  m_body;
  int         m_sessionId;
  bool        m_json;
  bool        m_idle;
  qint64      m_content_length;
  quint64     m_body_file_id;

private:

  void parseText(const QList<QByteArray> &text);
};

struct HttpResponse {
  inline HttpResponse() : m_deflate(false) {}

  QByteArray toText();

  QByteArray  m_body;
  QByteArray  m_contentType;
  QByteArray  m_filename;
  bool        m_deflate;
};

struct HttpBodyInfo {
  inline HttpBodyInfo() :
    m_bytesToRead(0), m_bytesAvailable(0) {}

  HttpRequest   m_request;
  HttpResponse  m_response;
  qint64        m_bytesToRead;
  qint64        m_bytesAvailable;
};

class WebServer;
class FileServer;
class WebConnection;

//#define AQ_NETWORK_MONITOR

class WebSession : public QObject
{
  Q_OBJECT

public:

  bool contentAvailable();
  int sessionId() const {
    return m_sessionId;
  }
  FileServer *fileServer() const {
    return m_fileServer;
  }

signals:

  void sessionEnd();
  void requestContent(HttpRequest *, HttpResponse *);

public slots:

  void close();

private slots:

  void addConnection(WebConnection *connection);
  void removeConnection(WebConnection *connection);

#ifdef AQ_NETWORK_MONITOR
  void sendNetTraffic();
#endif

private:

  WebSession(WebServer *server, int sessionId, quint32 peerIPv4);
  ~WebSession();

  inline void emitRequestContent(HttpRequest *request, HttpResponse *response);
  inline bool setIdleConnection(WebConnection *connection);
  void        finalizeRequest(WebConnection *connection, HttpRequest *request, HttpResponse *response);

  int                   m_sessionId;
  WebServer             *m_server;
  FileServer            *m_fileServer;
  WebConnection         *m_idleConnection;
  QSet<WebConnection *> m_connections;
  QTimer                *m_timer;
  bool                  m_closed;
  quint32               m_peerIPv4;

#ifdef AQ_NETWORK_MONITOR
  int                   m_bytesRead;
  int                   m_bytesWritten;
  int                   m_lastBytesWritten;
  QTimer                *m_netMonitorTimer;
#endif

  friend class WebServer;
  friend class FileServer;
  friend class WebConnection;
};

class WebConnection : public QObject
{
  Q_OBJECT

public:

  WebConnection(WebServer *server, QTcpSocket *socket);

signals:

  void disconnected(WebConnection *);

private slots:

  void close();
  void socketDisconnect();
  void receiveData();
  void receiveBody(HttpRequest *request, HttpResponse *response);

private:

  void setResumeBody(HttpBodyInfo *body);

  WebServer     *server_;
  QTcpSocket    *socket_;
  WebSession    *session_;
  HttpBodyInfo  *body_;
  QTimer        *timer_;
  int           delay_;
  bool          resumeBody_;
  qint64        minChunkBytesToRead_;
  bool          waitingResponse_;

  friend class WebServer;
  friend class FileServer;
  friend class WebSession;
};

class WebServer : public QTcpServer
{
  Q_OBJECT

  Q_ENUMS(WebError)

public:

  enum WebError {
    NoWebError = 0,
    SessionLimitExceeded,
    SessionLimitPerIPExceeded,
    SessionIPMismatch
  };

  WebServer(quint16 port = 1818);
  ~WebServer();

  inline WebError lastWebError() const {
    return lastWebError_;
  }

signals:

  void sessionBegin(WebSession *);

private slots:

  void connectionAvailable();
  void receiveData(WebConnection *connection);
  void socketError(QAbstractSocket::SocketError socketError);
  void removeSession();

private:

  inline void writeResponse(WebConnection *connection, HttpResponse *response);
  void        execScript(WebSession *session, const QByteArray &code);
  QByteArray  lastWebErrorHtml() const;

  QHash<int, WebSession *>  activeSessions_;
  int                       activeSessionLimit_;
  int                       activeSessionLimitPerIP_;
  int                       nextCookieId_;
  int                       totalSessions_;
  QHash<quint32, int>       totalSessionsPerIP_;
  WebError                  lastWebError_;

  friend class WebSession;
  friend class WebConnection;
};

#ifdef AQ_ENABLE_DEBUG
inline void showDebugInfo(HttpRequest *r)
{
  qDebug() << "*** HttpRequest ***" << r;
  qDebug() << "m_path" << r->m_path;
  qDebug() << "m_body" << r->m_body.left(120);
  qDebug() << "m_sessionId" << r->m_sessionId;
  qDebug() << "m_json" << r->m_json;
  qDebug() << "m_idle" << r->m_idle;
  qDebug() << "m_content_length" << r->m_content_length;
  qDebug() << "m_body_file_id" << r->m_body_file_id;
  qDebug() << "### HttpRequest ###" << r;
}

inline void showDebugInfo(HttpResponse *r)
{
  qDebug() << "*** HttpResponse ***" << r;
  qDebug() << "m_body" << r->m_body.left(120);
  qDebug() << "m_contentType" << r->m_contentType;
  qDebug() << "m_filename" << r->m_filename;
  qDebug() << "m_deflate" << r->m_deflate;
  qDebug() << "### HttpResponse ###" << r;
}
#else
inline void showDebugInfo(HttpRequest *) {}
inline void showDebugInfo(HttpResponse *) {}
#endif

#endif
