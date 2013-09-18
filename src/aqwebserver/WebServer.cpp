/***************************************************************************
 WebServer.cpp
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
#include "WebServer.h"
#include "FileServer.h"

HttpRequest::HttpRequest(const QList<QByteArray> &text) :
  m_sessionId(0), m_json(false), m_idle(false),
  m_content_length(0), m_body_file_id(0)
{
  parseText(text);
}

void HttpRequest::parseText(const QList<QByteArray> &text)
{
  const QByteArray &line(text.at(0));

  //DEBUG << line;

  if (line.left(4).toLower() == "post") {
    m_path = QUrl::fromPercentEncoding(line.mid(5).split(' ').at(0)).toAscii();
    m_sessionId = m_path.mid(1, 10).toInt();
    m_path = m_path.mid(11);
    m_json = m_path.startsWith("/j");
    m_idle = (m_path == "/i");
  } else if (line.left(3).toLower() == "get") {
    m_path = QUrl::fromPercentEncoding(line.mid(4).split(' ').at(0)).toAscii();
    if (m_path != "/" && m_path != "/favicon.ico") {
      m_sessionId = m_path.mid(1, 10).toInt();
      m_path = m_path.mid(11);
    } else
      m_sessionId = -1;
    m_json = m_path.startsWith("/j");
    m_idle = (m_path == "/i");
  }

  for (int i = 1; i < text.size(); ++i) {
    const QByteArray &line(text.at(i));

    //DEBUG << line;

    if (!m_content_length && line.left(14).toLower() == "content-length") {
      m_content_length = line.mid(line.indexOf(':', 13) + 1).trimmed().toInt();
      break;
    }
  }

  //DEBUG << "*************************" << m_path << m_sessionId;
}

QByteArray HttpResponse::toText()
{
  if (m_body.isEmpty())
    return "HTTP/1.1 204\r\nContent-Type:text/plain\r\n\r\n";

  QByteArray text("HTTP/1.1 200\r\n");
  int nbytes = m_body.size();

  //DEBUG << "RESPONSE" << m_body;

  if (m_deflate) {
    text += "Content-Encoding:deflate\r\n";
    m_body = qCompress(m_body, 8);
    m_body = m_body.mid(6, m_body.length() - 8);
  }

  if (!m_contentType.isEmpty())
    text += "Content-Type:" + m_contentType + "\r\n";

  text += "Content-Length:" + QByteArray::number(m_body.size()) + "\r\n";

  if (!m_filename.isEmpty())
    text += "Content-Disposition: attachment; filename=" + m_filename + "\r\n";

  if (m_deflate)
    text += "Cache-control:no-cache \r\n";
  else
    text += "Cache-control:max-age=600 \r\n";

  //DEBUG << text;

  return text + "\r\n" + m_body;
}

inline void WebServer::writeResponse(WebConnection *connection, HttpResponse *response)
{
  connection->waitingResponse_ = false;
#ifdef AQ_NETWORK_MONITOR
  QByteArray responseText(response->toText());
  if (connection->session_ && !responseText.contains("CODE"))
    connection->session_->m_bytesWritten += responseText.size();
  connection->socket_->write(responseText);
#else
  connection->socket_->write(response->toText());
#endif
}

WebSession::WebSession(WebServer *server, int sessionId, quint32 peerIPv4) :
  QObject(server), m_sessionId(sessionId), m_server(server),
  m_idleConnection(0), m_closed(false), m_peerIPv4(peerIPv4)
{
  DEBUG << "WebSession begin IP:" << QHostAddress(m_peerIPv4).toString() << m_sessionId << this;

  m_fileServer = new FileServer(this);

  m_timer = new QTimer(this);
  m_timer->setInterval(10 * 60 * 1000); // Inactive timeout
  connect(m_timer, SIGNAL(timeout()), this, SLOT(close()));

#ifdef AQ_NETWORK_MONITOR
  m_bytesRead = 0;
  m_bytesWritten = 0;
  m_lastBytesWritten = 0;
  m_netMonitorTimer = new QTimer(this);
  m_netMonitorTimer->setInterval(1000);
  connect(m_netMonitorTimer, SIGNAL(timeout()), this, SLOT(sendNetTraffic()));
  m_netMonitorTimer->start();
#endif
}

WebSession::~WebSession()
{
  delete m_fileServer;
  emit sessionEnd();

  DEBUG << "WebSession end IP:" << QHostAddress(m_peerIPv4).toString() << m_sessionId << this;
}

void WebSession::close()
{
#ifdef AQ_NETWORK_MONITOR
  m_netMonitorTimer->stop();
#endif
  m_timer->stop();

  if (!m_closed && !m_connections.isEmpty()) {
    QByteArray code = "wl=location.href;location.assign('http://www.infosial.com');";
    code += "if(confirm('El servidor ha cerrado la sesión. ¿Volver a conectar?')==true)";
    code += "location=wl;";
    m_server->execScript(this, code);

    m_closed = true;
    QList<WebConnection *> list(m_connections.toList());
    for (int i = 0; i < list.size(); ++i)
      list.at(i)->close();

    m_timer->setInterval(1000);
    m_timer->setSingleShot(true);
    m_timer->start();
  } else
    deleteLater();
}

inline void WebSession::emitRequestContent(HttpRequest *request, HttpResponse *response)
{
  emit requestContent(request, response);
}

inline bool WebSession::setIdleConnection(WebConnection *connection)
{
  if (m_idleConnection)
    return false;
  m_idleConnection = connection;
  contentAvailable();
  return true;
}

bool WebSession::contentAvailable()
{
  if (!m_idleConnection)
    return false;
  HttpRequest request;
  HttpResponse response;
  emitRequestContent(&request, &response);
  if (!response.m_body.isEmpty()) {
    m_server->writeResponse(m_idleConnection, &response);
    m_idleConnection = 0;
    return true;
  }
  return false;
}

void WebSession::addConnection(WebConnection *connection)
{
  m_timer->start();
  if (connection->session_ == this)
    return;
  if (connection->session_)
    connection->session_->removeConnection(connection);
  connection->session_ = this;
  connection->waitingResponse_ = true;
  m_connections.insert(connection);
  connect(connection, SIGNAL(disconnected(WebConnection *)), this, SLOT(removeConnection(WebConnection *)));

  //DEBUG << "addConnection" << connection << this;
}

void WebSession::removeConnection(WebConnection *connection)
{
  disconnect(connection, SIGNAL(disconnected(WebConnection *)), this, SLOT(removeConnection(WebConnection *)));
  if (connection == m_idleConnection)
    m_idleConnection = 0;
  m_connections.remove(connection);

  //DEBUG << "removeConnection" << connection << this;
}

void WebSession::finalizeRequest(WebConnection *connection, HttpRequest *request, HttpResponse *response)
{
  emitRequestContent(request, response);
  m_server->writeResponse(connection, response);
}

#ifdef AQ_NETWORK_MONITOR
void WebSession::sendNetTraffic()
{
  if ((m_bytesWritten - m_lastBytesWritten) < 192)
    return;
  m_lastBytesWritten = m_bytesWritten;
  m_netMonitorTimer->stop();
  QByteArray code = "this.netServerTraffic(";
  code += QByteArray::number(m_bytesWritten) + ",";
  code += QByteArray::number(m_bytesRead) + ");";
  m_server->execScript(this, code);
  m_netMonitorTimer->start();
}
#endif

WebConnection::WebConnection(WebServer *server, QTcpSocket *socket)
  : QObject(socket), server_(server), socket_(socket),
    session_(0), body_(0), resumeBody_(false),
    minChunkBytesToRead_(0), waitingResponse_(false)
{
  //DEBUG << "Open " << this << socket_;

  socket_->setSocketOption(QAbstractSocket::LowDelayOption, 1);
  socket_->setSocketOption(QAbstractSocket::KeepAliveOption, 1);

  connect(socket_, SIGNAL(readyRead()),    this, SLOT(receiveData()));
  connect(socket_, SIGNAL(disconnected()), this, SLOT(socketDisconnect()));
  connect(socket_, SIGNAL(error(QAbstractSocket::SocketError)),
          server_, SLOT(socketError(QAbstractSocket::SocketError)));

  delay_ = 50;
  timer_ = new QTimer(this);
  timer_->setInterval(delay_);
  timer_->setSingleShot(true);
  connect(timer_, SIGNAL(timeout()), this, SLOT(receiveData()));
}

void WebConnection::close()
{
  if (waitingResponse_) {
    HttpResponse response;
    server_->writeResponse(this, &response);
  }
  socket_->disconnectFromHost();
}

void WebConnection::socketDisconnect()
{
  //DEBUG << "Close" << this << socket_;

  disconnect(socket_, SIGNAL(error(QAbstractSocket::SocketError)),
             server_, SLOT(socketError(QAbstractSocket::SocketError)));
  emit disconnected(this);
  deleteLater();
}

void WebConnection::receiveData()
{
  if (resumeBody_) {
    if (timer_->isActive())
      return;
    if (session_->m_idleConnection)
      session_->fileServer()->resumeStoreBody(this);
    else
      timer_->start();
  } else
    server_->receiveData(this);
}

void WebConnection::receiveBody(HttpRequest *request, HttpResponse *response)
{
  session_->fileServer()->storeBody(this, request, response);
}

void WebConnection::setResumeBody(HttpBodyInfo *body)
{
  if (body) {
    body_ = body;
    resumeBody_ = true;
    minChunkBytesToRead_ = qMin((int) body->m_request.m_content_length / 100, 1024 * 256);
    delay_ = minChunkBytesToRead_ / 2048.0;
    timer_->setInterval(delay_);
    socket_->setReadBufferSize(minChunkBytesToRead_);
  } else {
    body_ = 0;
    resumeBody_ = false;
    minChunkBytesToRead_ = 0;
    delay_ = 50;
    timer_->setInterval(delay_);
    socket_->setReadBufferSize(0);
  }
}

WebServer::WebServer(quint16 port) :
  lastWebError_(NoWebError)
{
  qsrand(QDateTime::currentDateTime().toTime_t());
  nextCookieId_ = qrand(); // ###
  totalSessions_ = 0;
  activeSessionLimit_ = 25;
  activeSessionLimitPerIP_ = 5;

  connect(this, SIGNAL(newConnection()), this, SLOT(connectionAvailable()));
  listen(QHostAddress::Any, port);

  DEBUG << QString("WebServer running on: http://" + QHostInfo::localHostName() + ":" + QString::number(port) + "/");
}

WebServer::~WebServer()
{
  DEBUG << QString("WebServer stopped.");
}

void WebServer::connectionAvailable()
{
  (void) new WebConnection(this, nextPendingConnection());
}

void WebServer::receiveData(WebConnection *connection)
{
  QTcpSocket *socket = connection->socket_;
  QList<QByteArray> lines;
#ifdef AQ_NETWORK_MONITOR
  int bytesRead = 0;
#endif

  while (socket->canReadLine()) {
    QByteArray line(socket->readLine().trimmed());
    if (line.isEmpty())
      break;
    lines.append(line);
#ifdef AQ_NETWORK_MONITOR
    bytesRead += line.size();
#endif
  }

  HttpRequest request(lines);
  HttpResponse response;
  WebSession *session = 0;
  quint32 ipAddress = socket->peerAddress().toIPv4Address();

  if (request.m_sessionId == -1) {
    // ### TODO authentication here.

    if (request.m_path == "/favicon.ico") {
      QHash<int, WebSession *>::const_iterator it(activeSessions_.constBegin());
      if (it != activeSessions_.constEnd()) {
        (*it)->m_fileServer->handleWebRoot(&request, &response);
        writeResponse(connection, &response);
      }
      return;
    } else if (totalSessions_ >= activeSessionLimit_) {
      lastWebError_ = SessionLimitExceeded;
      socket->write(lastWebErrorHtml());
      connection->close();
      return;
    } else if (totalSessionsPerIP_[ipAddress] >= activeSessionLimitPerIP_) {
      lastWebError_ = SessionLimitPerIPExceeded;
      socket->write(lastWebErrorHtml());
      connection->close();
      return;
    }

    request.m_sessionId = nextCookieId_;
    nextCookieId_ = qrand(); // ###
    session = new WebSession(this, request.m_sessionId, ipAddress);

    ++totalSessions_;
    ++totalSessionsPerIP_[ipAddress];
    activeSessions_.insert(request.m_sessionId, session);
    connect(session, SIGNAL(sessionEnd()), this, SLOT(removeSession()));

    emit sessionBegin(session);
  } else {
    session = activeSessions_.value(request.m_sessionId);
    if (!session || session->m_closed) {
      writeResponse(connection, &response);
      connection->close();
      return;
    }
    if (session->m_peerIPv4 != ipAddress) {
      lastWebError_ = SessionIPMismatch;
      socket->write(lastWebErrorHtml());
      connection->close();
      return;
    }
  }

#ifdef AQ_NETWORK_MONITOR
  session->m_bytesRead += bytesRead;
#endif
  session->addConnection(connection);

  if (request.m_content_length > 0) {
    connection->receiveBody(&request, &response);
    return;
  }

  //DEBUG << "REQUEST" << request.m_path << lines  << request.m_body.left(120);

  session->emitRequestContent(&request, &response);

  if (response.m_body.isEmpty()) {
    if (!request.m_json && !request.m_idle)
      session->m_fileServer->handleWebRoot(&request, &response);
    else if (request.m_idle && session->setIdleConnection(connection))
      return;
  }

  writeResponse(connection, &response);
}

void WebServer::removeSession()
{
  WebSession *webSession = qobject_cast<WebSession *>(sender());
  activeSessions_.remove(webSession->m_sessionId);
  --totalSessions_;
  --totalSessionsPerIP_[webSession->m_peerIPv4];
}

void WebServer::socketError(QAbstractSocket::SocketError socketError)
{
  switch (socketError) {
    case QAbstractSocket::RemoteHostClosedError:
      break;
    case QAbstractSocket::HostNotFoundError:
      qWarning() << tr("The host was not found. Please check the host name and port settings.");
      break;
    case QAbstractSocket::ConnectionRefusedError:
      qWarning() << tr("The connection was refused by the peer.");
      break;
    default: {
      QTcpSocket *socket = qobject_cast<QTcpSocket *>(sender());
      qWarning() << tr("The following error occurred:") << socket->errorString() << errorString();
    }
  }
}

void WebServer::execScript(WebSession *session, const QByteArray &code)
{
  if (!session->m_idleConnection) {
    QTime tim;
    tim.start();
    while (!session->m_idleConnection) {
      if (tim.elapsed() > 5000)
        break;
      QCoreApplication::processEvents();
    }
    if (!session->m_idleConnection) {
      DEBUG << "WebServer::execScript No Idle Connection";
      return;
    }
  }
  HttpResponse response;
  response.m_deflate = true;
  response.m_body = "[{\"CODE\":\"" + code + "\"}]";
  response.m_contentType = "text/plain";
  writeResponse(session->m_idleConnection, &response);
  session->m_idleConnection = 0;
}

QByteArray WebServer::lastWebErrorHtml() const
{
  QByteArray html;

  switch (lastWebError_) {
    case SessionLimitExceeded:
      html = "<html><body>AbanQ Nebula.<br/>Active session limit exceeded.";
      html += "<br/>Max concurrent connections allowed: " + QByteArray::number(activeSessionLimit_);
      html += "</body></html>";
      break;

    case SessionLimitPerIPExceeded:
      html = "<html><body>AbanQ Nebula.<br/>Active session limit per IP address exceeded.";
      html += "</body></html>";
      break;

    case SessionIPMismatch:
      html = "<html><body>AbanQ Nebula.<br/>IP address mismatch for active session.";
      html += "</body></html>";
      break;
  }

  return html;
}
