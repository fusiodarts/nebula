/***************************************************************************
 inflate_base64.c
 -------------------
 begin                : 08/10/2010
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

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include "zlib.h"

static const char cd64[] = "|$$$}rstuvwxyz{$$$$$$$>?@ABCDEFGHIJKLMNOPQRSTUVW$$$$$$XYZ[\\]^_`abcdefghijklmnopq";

static inline void decodeBlockBase64(unsigned char in[4], unsigned char out[3])
{
  out[0] = (unsigned char)(in[0] << 2 | in[1] >> 4);
  out[1] = (unsigned char)(in[1] << 4 | in[2] >> 2);
  out[2] = (unsigned char)(((in[2] << 6) & 0xc0) | in[3]);
}

static inline void decodeBase64(FILE *infile, FILE *outfile)
{
  unsigned char in[4], out[3], v;
  int i, len;

  while (!feof(infile)) {
    for (len = 0, i = 0; i < 4 && !feof(infile); i++) {
      v = 0;
      while (!feof(infile) && v == 0) {
        v = (unsigned char) getc(infile);
        v = (unsigned char)((v < 43 || v > 122) ? 0 : cd64[v - 43]);
        if (v) {
          v = (unsigned char)((v == '$') ? 0 : v - 61);
        }
      }
      if (!feof(infile)) {
        len++;
        if (v) {
          in[i] = (unsigned char)(v - 1);
        }
      } else {
        in[i] = 0;
      }
    }
    if (len) {
      decodeBlockBase64(in, out);
      for (i = 0; i < len - 1; i++) {
        putc(out[i], outfile);
      }
    }
  }
}

#define CHUNK 16384

static inline int inflatePipe(FILE *source, FILE *dest)
{
  int ret, offset = 4;
  unsigned have;
  z_stream strm;
  unsigned char in[CHUNK];
  unsigned char out[CHUNK];

  strm.zalloc = Z_NULL;
  strm.zfree = Z_NULL;
  strm.opaque = Z_NULL;
  strm.avail_in = 0;
  strm.next_in = Z_NULL;
  ret = inflateInit(&strm);
  if (ret != Z_OK)
    return ret;

  do {
    strm.avail_in = fread(in, 1, CHUNK, source) - offset;
    if (ferror(source)) {
      (void) inflateEnd(&strm);
      return Z_ERRNO;
    }
    if (strm.avail_in == 0)
      break;
    strm.next_in = in + offset;
    offset = 0;

    do {
      strm.avail_out = CHUNK;
      strm.next_out = out;
      ret = inflate(&strm, Z_NO_FLUSH);
      assert(ret != Z_STREAM_ERROR);
      switch (ret) {
        case Z_NEED_DICT:
          ret = Z_DATA_ERROR;
        case Z_DATA_ERROR:
        case Z_MEM_ERROR:
          (void) inflateEnd(&strm);
          return ret;
      }
      have = CHUNK - strm.avail_out;
      if (fwrite(out, 1, have, dest) != have || ferror(dest)) {
        (void) inflateEnd(&strm);
        return Z_ERRNO;
      }
    } while (strm.avail_out == 0);

  } while (ret != Z_STREAM_END);

  (void) inflateEnd(&strm);
  return ret == Z_STREAM_END ? Z_OK : Z_DATA_ERROR;
}

static inline void zerr(int ret)
{
  fputs("AbanQ: ", stderr);
  switch (ret) {
    case Z_ERRNO:
      fputs("error reading/writing files\n", stderr);
      break;
    case Z_STREAM_ERROR:
      fputs("invalid compression level\n", stderr);
      break;
    case Z_DATA_ERROR:
      fputs("invalid or incomplete deflate data\n", stderr);
      break;
    case Z_MEM_ERROR:
      fputs("out of memory\n", stderr);
      break;
    case Z_VERSION_ERROR:
      fputs("zlib version mismatch!\n", stderr);
  }
}

int inflateBase64(char *infilename, char *outfilename)
{
  char outfilename_b64[strlen(outfilename)+3];
  strcpy(outfilename_b64, outfilename);
  strcat(outfilename_b64, ".b64");
  FILE *infile = fopen(infilename, "rb");
  if (!infile) {
    perror(infilename);
    return 1;
  }
  FILE *outfile = fopen(outfilename_b64, "wb");
  if (!outfile) {
    perror(outfilename_b64);
    return 1;
  }
  decodeBase64(infile, outfile);
  fclose(outfile);
  fclose(infile);

  infile = fopen(outfilename_b64, "rb");
  if (!infile) {
    perror(outfilename_b64);
    return 1;
  }
  outfile = fopen(outfilename, "wb");
  if (!outfile) {
    perror(outfilename);
    return 1;
  }
  int ret = inflatePipe(infile, outfile);
  fclose(outfile);
  fclose(infile);

  if (ret != Z_OK) {
    zerr(ret);
    return ret;
  } else
    remove(outfilename_b64);

  return 0;
}

int decodeFileBase64(char *infilename, char *outfilename)
{
  FILE *infile = fopen(infilename, "rb");
  if (!infile) {
    perror(infilename);
    return 1;
  }
  FILE *outfile = fopen(outfilename, "wb");
  if (!outfile) {
    perror(outfilename);
    return 1;
  }

  decodeBase64(infile, outfile);

  fclose(outfile);
  fclose(infile);
  return 0;
}
