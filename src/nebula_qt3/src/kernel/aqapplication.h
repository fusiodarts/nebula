#include <AQWebApplication.h>

#define AQ_DECL_APP             AQWebApplication
#define AQ_IMPL_APP(AC,AV)      AQWebApplication(AC,AV)
#define AQ_DECL_MAIN            void aq_web_main(int argc, char **argv)
#define AQ_IMPL_MAIN(AC,AV)
#define AQ_CONN_DIAG_FLAGS      WType_Dialog|WStyle_Customize|WStyle_NoBorder
#define AQ_RGB_LOGO             247,244,247

