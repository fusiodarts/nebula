/***************************************************************************
 main.cpp
 -------------------
 begin                : 10/07/2010
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

#include <QtCore>

#include <WebApplication.h>

#include <errno.h>

static inline void printUsage()
{
  fprintf(stderr, "AbanQ Nebula v2. (c) 2003-2011 InfoSiAL S.L.\n"
          "Usage:\n"
          "    nebula_v2 gui_app_path tcp_port\n"
          "Example:\n"
          "    nebula_v2 /opt/AbanQ/bin/abanq 1818\n\n");
}

int main(int argc, char **argv)
{
  if (argc != 3) {
    printUsage();
    return 1;
  }

  QCoreApplication app(argc, argv);
  WebApplication webApp(argv[1], QString(argv[2]).toUInt());

  return app.exec();
}
