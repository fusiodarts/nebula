TEMPLATE	= subdirs
no-png {
    message("Tools not available without PNG support")
} else {
    #SUBDIRS		= assistant/lib \
    #		      designer \
    #		      linguist
    SUBDIRS = designer
}

CONFIG+=ordered
REQUIRES=full-config
