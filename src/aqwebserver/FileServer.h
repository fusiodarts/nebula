/***************************************************************************
 FileServer.h
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

#ifndef FILESERVER_H_
#define FILESERVER_H_

#include <QtNetwork>

class WebSession;
class WebConnection;
class HttpRequest;
class HttpResponse;
class HttpBodyInfo;

struct AQChunkInfo {
  inline AQChunkInfo() :
    connection_(0), bytesToRead_(0) {}

  inline AQChunkInfo(WebConnection *connection, qint64 bytesToRead) :
    connection_(connection), bytesToRead_(bytesToRead) {}

  WebConnection *connection_;
  qint64 bytesToRead_;
};

class FileServer : public QObject
{
  Q_OBJECT

public:

  bool handleWebRoot(HttpRequest *request, HttpResponse *response) const;

  quint64 prepareDownload(const QString &fileName);
  bool    handleDownload(quint64 fileId, HttpResponse *response);

  void storeBody(WebConnection *connection, HttpRequest *request, HttpResponse *response);
  void resumeStoreBody(WebConnection *connection);
  bool writeBody(HttpRequest *request, const QString &path);
  bool writeBody(HttpRequest *request);
  bool writeBodyChunks(HttpRequest *request, const QString &path, const QString &fileId, int lastChunk);
  bool setBodyAsChunk(HttpRequest *request, const QString &fileId, int chunk);

  WebSession *webSession() const {
    return webSession_;
  }

private slots:

  void resumeStoreBody();

private:

  FileServer(WebSession *webSession);
  ~FileServer();

  inline bool internalWriteBody(HttpRequest *httpRequest, const QString &path);
  inline bool internalWriteBody(HttpRequest *httpRequest);

  WebSession              *webSession_;
  QSet<QString>           webRootFiles_;
  quint64                 fileIdSeq_;
  QHash<quint64, QString> downloadFiles_;
  QQueue<AQChunkInfo>     pendChunks_;

  friend class WebSession;
};

#endif /* FILESERVER_H_ */
