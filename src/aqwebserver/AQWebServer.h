/***************************************************************************
 AQWebServer.h
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

#ifndef AQWEBSERVER_H_
#define AQWEBSERVER_H_

#ifdef AQ_ENABLE_DEBUG
#define DEBUG qDebug()
#else
#define DEBUG if (0) qDebug()
#endif

// The coordinates of a point are encapsulated in an integer (32 bits).
// The first 16 bits for the X component and the 16 least significant bits
// for the Y component
#define AQ_TOPOINT(X,Y) ((X == 0 && Y == 0) ? 0 : (X << 17) | (Y & 0x7fff))
#define AQ_POINT_X(P) (P != 0 ? (P >> 17) + ((P & 0x10000) >> 16) : 0)
#define AQ_POINT_Y(P) (P != 0 ? (P << 17) >> 17 : 0)

#define AQ_MSG_SEP QLatin1String("¶")

#define AQ_MAX_CACHE 999

#endif /* AQWEBSERVER_H_ */
