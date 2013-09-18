#ifdef _MSC_VER
#define WIN32
#endif
#ifdef WIN32
	#include "config.h.win32"
#else
	#include "config.h.unix"
#endif
