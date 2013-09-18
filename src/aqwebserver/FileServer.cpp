/***************************************************************************
 FileServer.cpp
 -------------------
 begin                : 13/10/2010
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

#define AQ_FILESERVER_DIR               \
  QDir::homePath() +                    \
  QLatin1String("/.aqwebfileserver/") + \
  QString::number(webSession_->sessionId())

#define AQ_HTTP_BODY_LIMIT 1048576

#define AQ_BODY_FILE_NAME(ID)             \
  QString(AQ_FILESERVER_DIR +             \
          QLatin1String("/aq_body_%1")  +  \
          QLatin1String(".tmp")).arg(ID)

#define AQ_CHUNK_FILE_NAME(ID,CK)               \
  QString(AQ_FILESERVER_DIR +                   \
          QLatin1String("/aq_chunk_%1_%2")  +    \
          QLatin1String(".chk")).arg(ID).arg(CK)

FileServer::FileServer(WebSession *webSession) :
  QObject(webSession), webSession_(webSession), fileIdSeq_(0)
{
  QString path(QDir::cleanPath(AQ_FILESERVER_DIR));
  QDir d(path);
  if (!d.exists())
    d.mkpath(path);

  webRootFiles_ = QSet<QString>()
                  << ":favicon.ico"
                  << ":index.html"
                  << ":webclient.css"
                  << ":dojo.js"
                  << ":nebula_lib.js"
                  << ":nebula.js"
                  << ":images/indicator.gif"
                  << ":images/main-bg.gif"
                  << ":images/dock-bg.gif"
                  << ":images/default.png"
                  << ":images/restore.png"
                  << ":images/miniature.png";
}

FileServer::~FileServer()
{
  QDir().rmdir(QDir::cleanPath(AQ_FILESERVER_DIR));
}

bool FileServer::handleWebRoot(HttpRequest *request, HttpResponse *response) const
{
  QByteArray fileName(request->m_path.right(request->m_path.size() - 1));

  if (fileName == "" || fileName == "index.html")
    fileName = ":index.html";
  else if (fileName == "favicon.ico")
    fileName = ":favicon.ico";

  if (!webRootFiles_.contains(fileName))
    return false;

  QFile file(fileName);
  if (!file.exists() || !file.open(QIODevice::ReadOnly))
    return false;

  response->m_deflate = true;
  response->m_body = file.readAll();
  response->m_body.replace("_SESSION_", QByteArray::number(request->m_sessionId).rightJustified(10, '0', true));

  if (fileName.endsWith(".css"))
    response->m_contentType = "text/css";
  else if (fileName.endsWith(".js"))
    response->m_contentType = "text/javascript";
  else if (fileName.endsWith(".gif"))
    response->m_contentType = "image/gif";
  else if (fileName.endsWith(".png"))
    response->m_contentType = "image/png";
  else if (fileName.endsWith(".html"))
    response->m_contentType = "text/html";

  return true;
}

quint64 FileServer::prepareDownload(const QString &fileName)
{
  downloadFiles_.insert(++fileIdSeq_, fileName);
  return fileIdSeq_;
}

bool FileServer::handleDownload(quint64 fileId, HttpResponse *response)
{
  if (!downloadFiles_.contains(fileId))
    return false;

  QFile file(downloadFiles_.take(fileId));
  if (!file.exists() || !file.open(QIODevice::ReadOnly))
    return false;

  response->m_deflate = true;
  response->m_filename = QFileInfo(file).fileName().toUtf8();
  response->m_body = file.readAll();
  return true;
}

inline bool FileServer::internalWriteBody(HttpRequest *httpRequest, const QString &path)
{
  if (httpRequest->m_body_file_id == 0) {
    if (httpRequest->m_body.isEmpty())
      return false;
    QFile file(path);
    return (file.open(QIODevice::WriteOnly) && file.write(httpRequest->m_body) != -1);
  } else
    return QFile::rename(AQ_BODY_FILE_NAME(httpRequest->m_body_file_id), path);
}

inline bool FileServer::internalWriteBody(HttpRequest *httpRequest)
{
  if (httpRequest->m_body_file_id != 0) {
    QFile file(AQ_BODY_FILE_NAME(httpRequest->m_body_file_id));
    if (file.open(QIODevice::ReadOnly))
      httpRequest->m_body = file.readAll();
    file.remove();
  }

  return !httpRequest->m_body.isEmpty();
}

void FileServer::storeBody(WebConnection *connection, HttpRequest *request, HttpResponse *response)
{
  QTcpSocket *socket = connection->socket_;
  qint64 bytesToRead = request->m_content_length;
  qint64 chunkBytesToRead = socket->bytesAvailable();

  int bytesReaded = 0;
  int bufferSize = qMin(1024, (int) chunkBytesToRead);
  char readBuffer[bufferSize];
  QFile fi;
  QDataStream ds;

  if (bytesToRead > AQ_HTTP_BODY_LIMIT) {
    request->m_body_file_id = ++fileIdSeq_;
    fi.setFileName(AQ_BODY_FILE_NAME(fileIdSeq_));
    if (!fi.open(QIODevice::WriteOnly))
      request->m_body_file_id = 0;
    else
      ds.setDevice(&fi);
  }

  do {
    if (!chunkBytesToRead) {
      HttpBodyInfo *bodyInfo = new HttpBodyInfo;
      bodyInfo->m_request = *request;
      bodyInfo->m_response = *response;
      bodyInfo->m_bytesToRead = bytesToRead;
      connection->setResumeBody(bodyInfo);
      return;
    }

    bytesReaded = socket->read(readBuffer, qMin(bufferSize, (int) chunkBytesToRead));
    if (bytesReaded == 0 || bytesReaded == -1)
      break;

#ifdef AQ_NETWORK_MONITOR
    webSession_->m_bytesRead += bytesReaded;
#endif

    if (request->m_body_file_id)
      ds.writeRawData(readBuffer, bytesReaded);
    else
      request->m_body.append(readBuffer, bytesReaded);

    bytesToRead -= bytesReaded;
    chunkBytesToRead -= bytesReaded;
  } while (bytesToRead);

  webSession_->finalizeRequest(connection, request, response);
}

void FileServer::resumeStoreBody()
{
  AQChunkInfo chunkInfo = pendChunks_.dequeue();
  QTcpSocket *socket = chunkInfo.connection_->socket_;
  HttpBodyInfo *bodyInfo = chunkInfo.connection_->body_;
  HttpRequest *request = &bodyInfo->m_request;
  HttpResponse *response = &bodyInfo->m_response;
  qint64 bytesToRead = bodyInfo->m_bytesToRead;
  qint64 bytesAvailable = bodyInfo->m_bytesAvailable;
  qint64 chunkBytesToRead = chunkInfo.bytesToRead_;

  int bytesReaded = 0;
  int bufferSize = qMin(1024, (int) chunkBytesToRead);
  char readBuffer[bufferSize];
  QFile fi;
  QDataStream ds;

  if (request->m_body_file_id) {
    fi.setFileName(AQ_BODY_FILE_NAME(request->m_body_file_id));
    fi.open(QIODevice::Append);
    ds.setDevice(&fi);
  }

  do {
    if (!chunkBytesToRead) {
      bodyInfo->m_bytesToRead = bytesToRead;
      bodyInfo->m_bytesAvailable = bytesAvailable;
      return;
    }

    bytesReaded = socket->read(readBuffer, qMin(bufferSize, (int) chunkBytesToRead));
    if (bytesReaded == 0 || bytesReaded == -1)
      break;

#ifdef AQ_NETWORK_MONITOR
    webSession_->m_bytesRead += bytesReaded;
#endif

    if (request->m_body_file_id)
      ds.writeRawData(readBuffer, bytesReaded);
    else
      request->m_body.append(readBuffer, bytesReaded);

    chunkBytesToRead -= bytesReaded;
    bytesToRead -= bytesReaded;
    bytesAvailable -= bytesReaded;
  } while (bytesToRead);

  webSession_->finalizeRequest(chunkInfo.connection_, request, response);
  delete bodyInfo;
  chunkInfo.connection_->setResumeBody(0);
}

void FileServer::resumeStoreBody(WebConnection *connection)
{
  QTcpSocket *socket = connection->socket_;
  HttpBodyInfo *bodyInfo = connection->body_;
  qint64 bytesAvailable = socket->bytesAvailable();
  qint64 chunkBytesToRead = bytesAvailable - bodyInfo->m_bytesAvailable;

  if (bodyInfo->m_bytesToRead <= bytesAvailable)
    connection->resumeBody_ = false;
  else if (chunkBytesToRead < connection->minChunkBytesToRead_)
    return;

  pendChunks_.enqueue(AQChunkInfo(connection, chunkBytesToRead));
  bodyInfo->m_bytesAvailable = bytesAvailable;
  QTimer::singleShot(connection->delay_, this, SLOT(resumeStoreBody()));
}

bool FileServer::writeBody(HttpRequest *request, const QString &path)
{
  QString pathBack;
  if (QFile::exists(path)) {
    pathBack = path + "_" + QDateTime::currentDateTime().toString(Qt::ISODate);
    QFile::rename(path, pathBack);
  }
  bool writeOk = internalWriteBody(request, path);
  if (!writeOk && !pathBack.isEmpty())
    QFile::rename(pathBack, path);
  return writeOk;
}

bool FileServer::writeBody(HttpRequest *request)
{
  return internalWriteBody(request);
}

bool FileServer::writeBodyChunks(HttpRequest *request, const QString &path, const QString &fileId, int lastChunk)
{
  QString pathBack;
  if (QFile::exists(path)) {
    pathBack = path + "_" + QDateTime::currentDateTime().toString(Qt::ISODate);
    QFile::rename(path, pathBack);
  }

  QFile file(path);
  if (!file.open(QIODevice::Append)) {
    if (!pathBack.isEmpty())
      QFile::rename(pathBack, path);
    return false;
  }

  for (int i = 1; i <= lastChunk; ++i) {
    QFile chunkFile(AQ_CHUNK_FILE_NAME(fileId, i));
    if (!chunkFile.open(QIODevice::ReadOnly))
      continue;
    file.write(chunkFile.readAll());
    chunkFile.remove();
  }

  return true;
}

bool FileServer::setBodyAsChunk(HttpRequest *request, const QString &fileId, int chunk)
{
  return internalWriteBody(request, AQ_CHUNK_FILE_NAME(fileId, chunk));
}
