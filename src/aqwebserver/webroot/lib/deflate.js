/* Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
 * Version: 1.0.1
 * LastModified: Dec 25 1999
 */

/* Interface:
 * data = zip_deflate(src);
 */

/* constant parameters */
var zip_MAX_WBITS = 15;
var zip_MEM_LEVEL = 8;
var zip_WSIZE = 1 << zip_MAX_WBITS; // Sliding Window size
var zip_STORED_BLOCK = 0;
var zip_STATIC_TREES = 1;
var zip_DYN_TREES = 2;

/* for deflate */
var zip_DEFAULT_LEVEL = 6;
var zip_FULL_SEARCH = true;
var zip_MIN_MATCH = 3;
var zip_MAX_MATCH = 258;
var zip_BITS = 16;
var zip_window_size = 2 * zip_WSIZE;

var zip_LIT_BUFSIZE = 1 << (zip_MEM_LEVEL + 7);
var zip_DIST_BUFSIZE = zip_LIT_BUFSIZE;
//var zip_INBUFSIZ = 32768; // Input buffer size
//var zip_INBUF_EXTRA = 64; // Extra buffer
var zip_OUTBUFSIZ = zip_LIT_BUFSIZE * 2;

var zip_HASH_BITS = zip_MEM_LEVEL + 7;
var zip_HASH_SIZE = 1 << zip_HASH_BITS;
var zip_HASH_MASK = zip_HASH_SIZE - 1;
var zip_H_SHIFT = parseInt((zip_HASH_BITS + zip_MIN_MATCH - 1) / zip_MIN_MATCH);

var zip_WMASK = zip_WSIZE - 1;
var zip_NIL = 0; // Tail of hash chains
var zip_TOO_FAR = 4096;
var zip_MIN_LOOKAHEAD = zip_MAX_MATCH + zip_MIN_MATCH + 1;
var zip_MAX_DIST = zip_WSIZE - zip_MIN_LOOKAHEAD;
var zip_SMALLEST = 1;
var zip_MAX_BITS = 15;
var zip_MAX_BL_BITS = 7;
var zip_LENGTH_CODES = 29;
var zip_LITERALS = 256;
var zip_END_BLOCK = 256;
var zip_L_CODES = zip_LITERALS + 1 + zip_LENGTH_CODES;
var zip_D_CODES = 30;
var zip_BL_CODES = 19;
var zip_REP_3_6 = 16;
var zip_REPZ_3_10 = 17;
var zip_REPZ_11_138 = 18;
var zip_HEAP_SIZE = 2 * zip_L_CODES + 1;
var zip_CHUNK = parseInt(zip_LIT_BUFSIZE / 2);

/* variables */
var zip_free_queue;
var zip_qhead, zip_qtail;
var zip_initflag;
var zip_outbuf = null;
var zip_outcnt, zip_outoff;
var zip_complete;
var zip_window;
var zip_d_buf;
var zip_l_buf;
var zip_prev;
var zip_bi_buf;
var zip_bi_valid;
var zip_block_start;
var zip_ins_h;
var zip_hash_head;
var zip_prev_match;
var zip_match_available;
var zip_match_length;
var zip_prev_length;
var zip_strstart;
var zip_match_start;
var zip_eofile;
var zip_lookahead;
var zip_max_chain_length;
var zip_max_lazy_match;
var zip_compr_level;
var zip_good_match;
var zip_nice_match;
var zip_dyn_ltree;
var zip_dyn_dtree;
var zip_static_ltree;
var zip_static_dtree;
var zip_bl_tree;
var zip_l_desc;
var zip_d_desc;
var zip_bl_desc;
var zip_bl_count;
var zip_heap;
var zip_heap_len;
var zip_heap_max;
var zip_depth;
var zip_length_code;
var zip_dist_code;
var zip_base_length;
var zip_base_dist;
var zip_flag_buf;
var zip_last_lit;
var zip_last_dist;
var zip_last_flags;
var zip_flags;
var zip_flag_bit;
var zip_opt_len;
var zip_static_len;
var zip_deflate_data;
var zip_deflate_pos;
var zip_adler32;
var zip_endout;
var zip_endout_cnt;
var zip_deferred;
var zip_ert;

// ### AbanQ
var aq_unrolled_copy;
var aq_unrolled_copy_32;
var aq_unrolled_copy_codeat;
var aq_unrolled_bits;
var aq_unrolled_cnt;

/* objects (deflate) */

function zip_DeflateCT() {
  this.fc = 0; // frequency count or bit string
  this.dl = 0; // father node in Huffman tree or length of bit string
}

function zip_DeflateTreeDesc() {
  this.dyn_tree = null; // the dynamic tree
  this.static_tree = null; // corresponding static tree or NULL
  this.extra_bits = null; // extra bits for each code or NULL
  this.extra_base = 0; // base index for extra_bits
  this.elems = 0; // max number of elements in the tree
  this.max_length = 0; // max bit length for the codes
  this.max_code = 0; // largest code with non zero frequency
}

/* Values for max_lazy_match, good_match and max_chain_length, depending on
 * the desired pack level (0..9). The values given below have been tuned to
 * exclude worst case performance for pathological files. Better values may be
 * found for specific files.
 */
function zip_DeflateConfiguration(a, b, c, d) {
  this.good_length = a; // reduce lazy search above this match length
  this.max_lazy = b; // do not perform lazy search above this match length
  this.nice_length = c; // quit search above this match length
  this.max_chain = d;
}

function zip_DeflateBuffer() {
  this.next = null;
  this.len = 0;
  this.ptr = new Array(zip_OUTBUFSIZ);
  this.off = 0;
}

/* constant tables */
var zip_extra_lbits = new Array(0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2,
    3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0);
var zip_extra_dbits = new Array(0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6,
    7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13);
var zip_extra_blbits = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 2, 3, 7);
var zip_bl_order = new Array(16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3,
    13, 2, 14, 1, 15);

var zip_configuration_table = new Array(
    new zip_DeflateConfiguration(0, 0, 0, 0), 
    new zip_DeflateConfiguration(4, 4, 8, 4), 
    new zip_DeflateConfiguration(4, 5, 16, 8),
    new zip_DeflateConfiguration(4, 6, 32, 32), 
    new zip_DeflateConfiguration(4, 4, 16, 16), 
    //new zip_DeflateConfiguration(8, 16, 32, 32),
    new zip_DeflateConfiguration(8, 8, 16, 16),
    new zip_DeflateConfiguration(8, 16, 128, 128),
    new zip_DeflateConfiguration(8, 32, 128, 256),
    new zip_DeflateConfiguration(32, 128, 258, 1024),
    new zip_DeflateConfiguration(32, 258, 258, 4096));

function aqCompileUnrolledCopy(bits) {
  if (aq_unrolled_bits != bits) {
    aq_unrolled_bits = bits;
    aq_unrolled_cnt = Math.pow(2, bits);
    var cnt = aq_unrolled_cnt;
    var sb = new Array(cnt);
    var sbc = new Array(cnt);
    while (cnt--) {
      sb[cnt] = 'j++]=s[k++';
      sbc[cnt] = 'j++]=s.charCodeAt(k++';
    }
    aq_unrolled_copy = new Function('s', 'k', 'd', 'j',
        'd[' + sb.join('];d[') + '];');
    aq_unrolled_copy_codeat = new Function('s', 'k', 'd', 'j', 'd[' + sbc
        .join(')&0xff;d[') + ');');

    cnt = 32;
    var sb2 = new Array(cnt);
    while (cnt--) {
      sb2[cnt] = 'j++]=s[k++';
    }
    aq_unrolled_copy32 = new Function('s', 'k', 'd', 'j', 'd[' + sb2
        .join('];d[') + '];');
  }
}

function aqCopyArray32(src, srcOff, dst, dstOff, len) {
  var count = (len >> 5);
  while (count--) {
    aq_unrolled_copy32(src, srcOff, dst, dstOff);
    srcOff += 32;
    dstOff += 32;
  }
  count = (len % 32);
  while (count--)
    dst[dstOff++] = src[srcOff++];
}

function aqCopyArray(src, srcOff, dst, dstOff, len) {
  var count = (len >> aq_unrolled_bits);
  while (count--) {
    aq_unrolled_copy(src, srcOff, dst, dstOff);
    srcOff += aq_unrolled_cnt;
    dstOff += aq_unrolled_cnt;
  }
  aqCopyArray32(src, srcOff, dst, dstOff, len % aq_unrolled_cnt);
}

function aqCopyArrayCodeAt(src, srcOff, dst, dstOff, len) {
  var count = (len >> aq_unrolled_bits);
  while (count--) {
    aq_unrolled_copy_codeat(src, srcOff, dst, dstOff);
    srcOff += aq_unrolled_cnt;
    dstOff += aq_unrolled_cnt;
  }
  count = (len % aq_unrolled_cnt);
  while (count--)
    dst[dstOff++] = src.charCodeAt(srcOff++);
}

/* routines (deflate) */

function zip_deflate_start(level) {
  var i;

  if (!level)
    level = zip_DEFAULT_LEVEL;
  else if (level < 1)
    level = 1;
  else if (level > 9)
    level = 9;

  zip_compr_level = level;
  zip_initflag = false;
  zip_eofile = false;
  if (zip_outbuf != null)
    return;

  zip_free_queue = zip_qhead = zip_qtail = null;
  zip_outbuf = new Array(zip_OUTBUFSIZ);
  zip_window = new Array(zip_window_size);
  zip_d_buf = new Array(zip_DIST_BUFSIZE);
  zip_l_buf = new Array(zip_LIT_BUFSIZE + 64 /*zip_INBUFSIZ + zip_INBUF_EXTRA*/);
  zip_prev = new Array(1 << zip_BITS);
  zip_dyn_ltree = new Array(zip_HEAP_SIZE);
  for (i = 0; i < zip_HEAP_SIZE; i++)
    zip_dyn_ltree[i] = new zip_DeflateCT();
  zip_dyn_dtree = new Array(2 * zip_D_CODES + 1);
  for (i = 0; i < 2 * zip_D_CODES + 1; i++)
    zip_dyn_dtree[i] = new zip_DeflateCT();
  zip_static_ltree = new Array(zip_L_CODES + 2);
  for (i = 0; i < zip_L_CODES + 2; i++)
    zip_static_ltree[i] = new zip_DeflateCT();
  zip_static_dtree = new Array(zip_D_CODES);
  for (i = 0; i < zip_D_CODES; i++)
    zip_static_dtree[i] = new zip_DeflateCT();
  zip_bl_tree = new Array(2 * zip_BL_CODES + 1);
  for (i = 0; i < 2 * zip_BL_CODES + 1; i++)
    zip_bl_tree[i] = new zip_DeflateCT();
  zip_l_desc = new zip_DeflateTreeDesc();
  zip_d_desc = new zip_DeflateTreeDesc();
  zip_bl_desc = new zip_DeflateTreeDesc();
  zip_bl_count = new Array(zip_MAX_BITS + 1);
  zip_heap = new Array(2 * zip_L_CODES + 1);
  zip_depth = new Array(2 * zip_L_CODES + 1);
  zip_length_code = new Array(zip_MAX_MATCH - zip_MIN_MATCH + 1);
  zip_dist_code = new Array(512);
  zip_base_length = new Array(zip_LENGTH_CODES);
  zip_base_dist = new Array(zip_D_CODES);
  zip_flag_buf = new Array(parseInt(zip_LIT_BUFSIZE / 8));
}

function zip_deflate_end() {
  zip_free_queue = zip_qhead = zip_qtail = null;
  zip_outbuf = null;
  zip_window = null;
  zip_d_buf = null;
  zip_l_buf = null;
  zip_prev = null;
  zip_dyn_ltree = null;
  zip_dyn_dtree = null;
  zip_static_ltree = null;
  zip_static_dtree = null;
  zip_bl_tree = null;
  zip_l_desc = null;
  zip_d_desc = null;
  zip_bl_desc = null;
  zip_bl_count = null;
  zip_heap = null;
  zip_depth = null;
  zip_length_code = null;
  zip_dist_code = null;
  zip_base_length = null;
  zip_base_dist = null;
  zip_flag_buf = null;
  zip_deflate_data = null;
  zip_endout = null;
  zip_endout_cnt = 0;
  zip_deferred = null;
}

function zip_reuse_queue(p) {
  p.next = zip_free_queue;
  zip_free_queue = p;
}

function zip_new_queue() {
  var p;

  if (zip_free_queue != null) {
    p = zip_free_queue;
    zip_free_queue = zip_free_queue.next;
  } else
    p = new zip_DeflateBuffer();
  p.next = null;
  p.len = p.off = 0;

  return p;
}

function zip_head1(i) {
  return zip_prev[zip_WSIZE + i];
}

function zip_head2(i, val) {
  return zip_prev[zip_WSIZE + i] = val;
}

/* put_byte is used for the compressed output, put_ubyte for the
 * uncompressed output. However unlzw() uses window for its
 * suffix table instead of its output buffer, so it does not use put_ubyte
 * (to be cleaned up).
 */
function zip_put_byte(c) {
  zip_outbuf[zip_outoff + zip_outcnt++] = c;
  if (zip_outoff + zip_outcnt == zip_OUTBUFSIZ)
    zip_qoutbuf();
}

/* Output a 16 bit value, lsb first */
function zip_put_short(w) {
  w &= 0xffff;
  if (zip_outoff + zip_outcnt < zip_OUTBUFSIZ - 2) {
    zip_outbuf[zip_outoff + zip_outcnt++] = (w & 0xff);
    zip_outbuf[zip_outoff + zip_outcnt++] = (w >>> 8);
  } else {
    zip_put_byte(w & 0xff);
    zip_put_byte(w >>> 8);
  }
}

/* ===========================================================================
 * Update a hash value with the given input byte
 * IN  assertion: all calls to to UPDATE_HASH are made with consecutive
 *    input characters, so that a running hash key can be computed from the
 *    previous key instead of complete recalculation each time.
 */
//#define UPDATE_HASH(s,h,c) (h = (((h)<<s->hash_shift) ^ (c)) & s->hash_mask)
var zip_UPDATE_HASH = new Function(
    'ci',
    'zip_ins_h = (((zip_ins_h) << zip_H_SHIFT) ^ (zip_window[ci] & 0xff)) & zip_HASH_MASK;');

/* ==========================================================================
 * Insert string s in the dictionary and set match_head to the previous head
 * of the hash chain (the most recent string with same hash key). Return
 * the previous length of the hash chain.
 * IN  assertion: all calls to to INSERT_STRING are made with consecutive
 *    input characters and the first MIN_MATCH bytes of s are valid
 *    (except for the last MIN_MATCH-1 bytes of the input file).
 */
//function zip_INSERT_STRING() {
//  zip_UPDATE_HASH(zip_strstart + zip_MIN_MATCH - 1);
//  zip_hash_head = zip_head1(zip_ins_h);
//  zip_prev[zip_strstart & zip_WMASK] = zip_hash_head;
//  zip_head2(zip_ins_h, zip_strstart);
//}
var zip_INSERT_STRING = new Function(
    'zip_UPDATE_HASH(zip_strstart + zip_MIN_MATCH - 1);zip_hash_head = zip_head1(zip_ins_h);zip_prev[zip_strstart & zip_WMASK] = zip_hash_head;zip_head2(zip_ins_h, zip_strstart);');

/* Send a code of the given tree. c and tree must not have side effects */
//function zip_SEND_CODE(c, tree) {
//  zip_send_bits(tree[c].fc, tree[c].dl);
//}
var zip_SEND_CODE = new Function('c', 'tree',
    'zip_send_bits(tree[c].fc, tree[c].dl);');

/* Mapping from a distance to a distance code. dist is the distance - 1 and
 * must not have side effects. dist_code[256] and dist_code[257] are never
 * used.
 */
//function zip_D_CODE(dist) {
//  return (dist < 256 ? zip_dist_code[dist] : zip_dist_code[256 + (dist >> 7)]) & 0xff;
//}
var zip_D_CODE = new Function(
    'dist',
    'return ((dist < 256 ? zip_dist_code[dist] : zip_dist_code[256 + (dist >> 7)]) & 0xff);');

/* ==========================================================================
 * Compares to subtrees, using the tree depth as tie breaker when
 * the subtrees have equal frequency. This minimizes the worst case length.
 */
//function zip_SMALLER(tree, n, m) {
//  return tree[n].fc < tree[m].fc
//      || (tree[n].fc == tree[m].fc && zip_depth[n] <= zip_depth[m]);
//}
var zip_SMALLER = new Function(
    'tree',
    'n',
    'm',
    'return (tree[n].fc < tree[m].fc || (tree[n].fc == tree[m].fc && zip_depth[n] <= zip_depth[m]));');

/* ==========================================================================
 * read string data
 */
function zip_update_adler32(buf, off, cnt) {
  var s1 = (zip_adler32 & 0x0000ffff);
  var s2 = ((zip_adler32 >> 16) & 0x0000ffff);
  var n = off + cnt;
  for ( var i = off; i < n; ++i) {
    s1 = (s1 + (buf[i] & 0xff)) % 65521;
    s2 = (s2 + s1) % 65521;
  }
  zip_adler32 = (s2 << 16) + s1;
}
function zip_read_buff(buff, offset, n) {
  // ### AbanQ
  //  var i;
  //  for (i = 0; i < n && zip_deflate_pos < zip_deflate_data.length; i++)
  //    buff[offset + i] = zip_deflate_data.charCodeAt(zip_deflate_pos++) & 0xff;
  //  return i;
  //### AbanQ
  var cnt = ((zip_deflate_pos + n) > zip_deflate_data.length) ? (zip_deflate_data.length - zip_deflate_pos)
      : n;
  if (cnt > 0) {
    aqCopyArrayCodeAt(zip_deflate_data, zip_deflate_pos, buff, offset, cnt);
    zip_update_adler32(buff, offset, cnt);
    zip_deflate_pos += cnt;
  }
  return cnt;
}

/* ==========================================================================
 * Initialize the "longest match" routines for a new file
 */
function zip_lm_init() {
  var j;

  /* Initialize the hash table. */
  for (j = 0; j < zip_HASH_SIZE; j++)
    //	zip_head2(j, zip_NIL);
    zip_prev[zip_WSIZE + j] = 0;
  /* prev will be initialized on the fly */

  /* Set the default configuration parameters:
   */
  zip_max_lazy_match = zip_configuration_table[zip_compr_level].max_lazy;
  zip_good_match = zip_configuration_table[zip_compr_level].good_length;
  if (!zip_FULL_SEARCH)
    zip_nice_match = zip_configuration_table[zip_compr_level].nice_length;
  zip_max_chain_length = zip_configuration_table[zip_compr_level].max_chain;

  zip_strstart = 0;
  zip_block_start = 0;

  zip_lookahead = zip_read_buff(zip_window, 0, 2 * zip_WSIZE);
  if (zip_lookahead <= 0) {
    zip_eofile = true;
    zip_lookahead = 0;
    return;
  }
  zip_eofile = false;
  /* Make sure that we always have enough lookahead. This is important
   * if input comes from a device such as a tty.
   */
  while (zip_lookahead < zip_MIN_LOOKAHEAD && !zip_eofile)
    zip_fill_window();

  /* If lookahead < MIN_MATCH, ins_h is garbage, but this is
   * not important since only literal bytes will be emitted.
   */
  zip_ins_h = 0;
  for (j = 0; j < zip_MIN_MATCH - 1; j++) {
    //      UPDATE_HASH(ins_h, window[j]);
    zip_UPDATE_HASH(j);
  }
}

/* ==========================================================================
 * Set match_start to the longest match starting at the given string and
 * return its length. Matches shorter or equal to prev_length are discarded,
 * in which case the result is equal to prev_length and match_start is
 * garbage.
 * IN assertions: cur_match is the head of the hash chain for the current
 *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
 */
function zip_longest_match(cur_match) {
  var chain_length = zip_max_chain_length; // max hash chain length
  var scanp = zip_strstart; // current string
  var matchp; // matched string
  var len; // length of current match
  var best_len = zip_prev_length; // best match length so far

  /* Stop when cur_match becomes <= limit. To simplify the code,
   * we prevent matches with the string of window index 0.
   */
  var limit = (zip_strstart > zip_MAX_DIST ? zip_strstart - zip_MAX_DIST
      : zip_NIL);

  var strendp = zip_strstart + zip_MAX_MATCH;
  var scan_end1 = zip_window[scanp + best_len - 1];
  var scan_end = zip_window[scanp + best_len];

  /* Do not waste too much time if we already have a good match: */
  if (zip_prev_length >= zip_good_match)
    chain_length >>= 2;

  //  Assert(encoder->strstart <= window_size-MIN_LOOKAHEAD, "insufficient lookahead");

  do {
    //    Assert(cur_match < encoder->strstart, "no future");
    matchp = cur_match;

    /* Skip to next match if the match length cannot increase
        * or if the match length is less than 2:
    */
    if (zip_window[matchp + best_len] != scan_end
        || zip_window[matchp + best_len - 1] != scan_end1
        || zip_window[matchp] != zip_window[scanp]
        || zip_window[++matchp] != zip_window[scanp + 1]) {
      continue;
    }

    /* The check at best_len-1 can be removed because it will be made
           * again later. (This heuristic is not always a win.)
           * It is not necessary to compare scan[2] and match[2] since they
           * are always equal when the other bytes match, given that
           * the hash keys are equal and that HASH_BITS >= 8.
           */
    scanp += 2;
    matchp++;

    /* We check for insufficient lookahead only every 8th comparison;
           * the 256th check will be made at strstart+258.
           */
    do {
    } while (zip_window[++scanp] == zip_window[++matchp]
        && zip_window[++scanp] == zip_window[++matchp]
        && zip_window[++scanp] == zip_window[++matchp]
        && zip_window[++scanp] == zip_window[++matchp]
        && zip_window[++scanp] == zip_window[++matchp]
        && zip_window[++scanp] == zip_window[++matchp]
        && zip_window[++scanp] == zip_window[++matchp]
        && zip_window[++scanp] == zip_window[++matchp] && scanp < strendp);

    len = zip_MAX_MATCH - (strendp - scanp);
    scanp = strendp - zip_MAX_MATCH;

    if (len > best_len) {
      zip_match_start = cur_match;
      best_len = len;
      if (zip_FULL_SEARCH) {
        if (len >= zip_MAX_MATCH)
          break;
      } else {
        if (len >= zip_nice_match)
          break;
      }

      scan_end1 = zip_window[scanp + best_len - 1];
      scan_end = zip_window[scanp + best_len];
    }
  } while ((cur_match = zip_prev[cur_match & zip_WMASK]) > limit
      && --chain_length != 0);

  return best_len;
}

/* ==========================================================================
 * Fill the window when the lookahead becomes insufficient.
 * Updates strstart and lookahead, and sets eofile if end of input file.
 * IN assertion: lookahead < MIN_LOOKAHEAD && strstart + lookahead > 0
 * OUT assertions: at least one byte has been read, or eofile is set;
 *    file reads are performed for at least two bytes (required for the
 *    translate_eol option).
 */
function zip_fill_window() {
  var n, m;

  // Amount of free space at the end of the window.
  var more = zip_window_size - zip_lookahead - zip_strstart;

  /* If the window is almost full and there is insufficient lookahead,
   * move the upper half to the lower one to make room in the upper half.
   */
  if (more == -1) {
    /* Very unlikely, but possible on 16 bit machine if strstart == 0
           * and lookahead == 1 (input done one byte at time)
           */
    more--;
  } else if (zip_strstart >= zip_WSIZE + zip_MAX_DIST) {
    /* By the IN assertion, the window is not empty so we can't confuse
           * more == 0 with more == 64K on a 16 bit machine.
           */
    //	Assert(window_size == (ulg)2*WSIZE, "no sliding with BIG_MEM");
    //	System.arraycopy(window, WSIZE, window, 0, WSIZE);
    // ### AbanQ
    //    for (n = 0; n < zip_WSIZE; n++)
    //      zip_window[n] = zip_window[n + zip_WSIZE];
    // ### AbanQ
    aqCopyArray(zip_window, zip_WSIZE, zip_window, 0, zip_WSIZE);

    zip_match_start -= zip_WSIZE;
    zip_strstart -= zip_WSIZE; /* we now have strstart >= MAX_DIST: */
    zip_block_start -= zip_WSIZE;

    for (n = 0; n < zip_HASH_SIZE; n++) {
      m = zip_head1(n);
      zip_head2(n, m >= zip_WSIZE ? m - zip_WSIZE : zip_NIL);
    }
    for (n = 0; n < zip_WSIZE; n++) {
      /* If n is not on any hash chain, prev[n] is garbage but
       * its value will never be used.
       */
      m = zip_prev[n];
      zip_prev[n] = (m >= zip_WSIZE ? m - zip_WSIZE : zip_NIL);
    }
    more += zip_WSIZE;
  }
  // At this point, more >= 2
  if (!zip_eofile) {
    n = zip_read_buff(zip_window, zip_strstart + zip_lookahead, more);
    if (n <= 0)
      zip_eofile = true;
    else
      zip_lookahead += n;
  }
}

/* ==========================================================================
 * Processes a new input file and return its compressed length. This
 * function does not perform lazy evaluationof matches and inserts
 * new strings in the dictionary only for unmatched strings or for short
 * matches. It is used only for the fast compression options.
 */
function zip_deflate_fast() {
  while (zip_lookahead != 0 && zip_qhead == null) {
    var flush; // set if current block must be flushed

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    zip_INSERT_STRING();

    /* Find the longest match, discarding those <= prev_length.
     * At this point we have always match_length < MIN_MATCH
     */
    if (zip_hash_head != zip_NIL
        && zip_strstart - zip_hash_head <= zip_MAX_DIST) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      zip_match_length = zip_longest_match(zip_hash_head);
      /* longest_match() sets match_start */
      if (zip_match_length > zip_lookahead)
        zip_match_length = zip_lookahead;
    }
    if (zip_match_length >= zip_MIN_MATCH) {
      //	    check_match(strstart, match_start, match_length);

      flush = zip_ct_tally(zip_strstart - zip_match_start, zip_match_length
          - zip_MIN_MATCH);
      zip_lookahead -= zip_match_length;

      /* Insert new strings in the hash table only if the match length
       * is not too large. This saves time but degrades compression.
       */
      if (zip_match_length <= zip_max_lazy_match
          && zip_lookahead >= zip_MIN_MATCH) {
        zip_match_length--; // string at strstart already in hash table
        do {
          zip_strstart++;
          zip_INSERT_STRING();
          /* strstart never exceeds WSIZE-MAX_MATCH, so there are
           * always MIN_MATCH bytes ahead. If lookahead < MIN_MATCH
           * these bytes are garbage, but it does not matter since
           * the next lookahead bytes will be emitted as literals.
           */
        } while (--zip_match_length != 0);
        zip_strstart++;
      } else {
        zip_strstart += zip_match_length;
        zip_match_length = 0;
        zip_ins_h = zip_window[zip_strstart] & 0xff;
        // UPDATE_HASH(ins_h, window[strstart + 1]);
        zip_UPDATE_HASH(zip_strstart + 1);

        //#if MIN_MATCH != 3
        //		Call UPDATE_HASH() MIN_MATCH-3 more times
        //#endif
      }
    } else {
      /* No match, output a literal byte */
      flush = zip_ct_tally(0, zip_window[zip_strstart] & 0xff);
      zip_lookahead--;
      zip_strstart++;
    }
    if (flush) {
      zip_flush_block(0);
      zip_block_start = zip_strstart;
    }

    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    while (zip_lookahead < zip_MIN_LOOKAHEAD && !zip_eofile)
      zip_fill_window();
  }
}

function zip_deflate_better() {
  /* Process the input block. */
  while (zip_lookahead != 0 && zip_qhead == null) {
    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    zip_INSERT_STRING();

    /* Find the longest match, discarding those <= prev_length.
     */
    zip_prev_length = zip_match_length;
    zip_prev_match = zip_match_start;
    zip_match_length = zip_MIN_MATCH - 1;

    if (zip_hash_head != zip_NIL && zip_prev_length < zip_max_lazy_match
        && zip_strstart - zip_hash_head <= zip_MAX_DIST) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      zip_match_length = zip_longest_match(zip_hash_head);
      /* longest_match() sets match_start */
      if (zip_match_length > zip_lookahead)
        zip_match_length = zip_lookahead;

      /* Ignore a length 3 match if it is too distant: */
      if (zip_match_length == zip_MIN_MATCH
          && zip_strstart - zip_match_start > zip_TOO_FAR) {
        /* If prev_match is also MIN_MATCH, match_start is garbage
         * but we will ignore the current match anyway.
         */
        zip_match_length--;
      }
    }
    /* If there was a match at the previous step and the current
     * match is not better, output the previous match:
     */
    if (zip_prev_length >= zip_MIN_MATCH && zip_match_length <= zip_prev_length) {
      var flush; // set if current block must be flushed

      //	    check_match(strstart - 1, prev_match, prev_length);
      flush = zip_ct_tally(zip_strstart - 1 - zip_prev_match, zip_prev_length
          - zip_MIN_MATCH);

      /* Insert in hash table all strings up to the end of the match.
       * strstart-1 and strstart are already inserted.
       */
      zip_lookahead -= zip_prev_length - 1;
      zip_prev_length -= 2;
      do {
        zip_strstart++;
        zip_INSERT_STRING();
        /* strstart never exceeds WSIZE-MAX_MATCH, so there are
         * always MIN_MATCH bytes ahead. If lookahead < MIN_MATCH
         * these bytes are garbage, but it does not matter since the
         * next lookahead bytes will always be emitted as literals.
         */
      } while (--zip_prev_length != 0);
      zip_match_available = 0;
      zip_match_length = zip_MIN_MATCH - 1;
      zip_strstart++;
      if (flush) {
        zip_flush_block(0);
        zip_block_start = zip_strstart;
      }
    } else if (zip_match_available != 0) {
      /* If there was no match at the previous position, output a
       * single literal. If there was a match but the current match
       * is longer, truncate the previous match to a single literal.
       */
      if (zip_ct_tally(0, zip_window[zip_strstart - 1] & 0xff)) {
        zip_flush_block(0);
        zip_block_start = zip_strstart;
      }
      zip_strstart++;
      zip_lookahead--;
    } else {
      /* There is no previous match to compare with, wait for
       * the next step to decide.
       */
      zip_match_available = 1;
      zip_strstart++;
      zip_lookahead--;
    }

    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    while (zip_lookahead < zip_MIN_LOOKAHEAD && !zip_eofile)
      zip_fill_window();
  }
}

function zip_init_deflate() {
  if (zip_eofile)
    return;
  zip_bi_buf = 0;
  zip_bi_valid = 0;
  zip_ct_init();
  zip_lm_init();

  zip_qhead = null;
  zip_outcnt = 0;
  zip_outoff = 0;

  if (zip_compr_level <= 3) {
    zip_prev_length = zip_MIN_MATCH - 1;
    zip_match_length = 0;
  } else {
    zip_match_length = zip_MIN_MATCH - 1;
    zip_match_available = 0;
  }

  zip_complete = false;
}

/* ==========================================================================
 * Same as above, but achieves better compression. We use a lazy
 * evaluation for matches: a match is finally adopted only if there is
 * no better match at the next window position.
 */
function zip_deflate_internal(buff, off, buff_size) {
  var n;

  if (!zip_initflag) {
    zip_init_deflate();
    zip_initflag = true;
    if (zip_lookahead == 0) { // empty
      zip_complete = true;
      return 0;
    }
  }

  if ((n = zip_qcopy(buff, off, buff_size)) == buff_size)
    return buff_size;

  if (zip_complete)
    return n;

  if (zip_compr_level <= 3) // optimized for speed
    zip_deflate_fast();
  else
    zip_deflate_better();
  if (zip_lookahead == 0) {
    if (zip_match_available != 0)
      zip_ct_tally(0, zip_window[zip_strstart - 1] & 0xff);
    zip_flush_block(1);
    zip_complete = true;
  }
  return n + zip_qcopy(buff, n + off, buff_size - n);
}

function zip_qcopy(buff, off, buff_size) {
  var n = 0;
  var i;
  // ### AbanQ
  //var j;
  //n = 0;

  while (zip_qhead != null && n < buff_size) {
    i = buff_size - n;
    if (i > zip_qhead.len)
      i = zip_qhead.len;
    //      System.arraycopy(qhead.ptr, qhead.off, buff, off + n, i);
    // ### AbanQ
    //    for (j = 0; j < i; j++)
    //      buff[off + n + j] = zip_qhead.ptr[zip_qhead.off + j];
    // ### AbanQ
    aqCopyArray(zip_qhead.ptr, zip_qhead.off, buff, off + n, i);

    zip_qhead.off += i;
    zip_qhead.len -= i;
    n += i;
    if (zip_qhead.len == 0) {
      var p = zip_qhead;
      zip_qhead = zip_qhead.next;
      zip_reuse_queue(p);
    }
  }

  if (n == buff_size)
    return n;

  if (zip_outoff < zip_outcnt) {
    i = buff_size - n;
    if (i > zip_outcnt - zip_outoff)
      i = zip_outcnt - zip_outoff;
    // System.arraycopy(outbuf, outoff, buff, off + n, i);
    // ### AbanQ
    //    for (j = 0; j < i; j++)
    //      buff[off + n + j] = zip_outbuf[zip_outoff + j];
    // ### AbanQ
    aqCopyArray(zip_outbuf, zip_outoff, buff, off + n, i);

    zip_outoff += i;
    n += i;
    if (zip_outcnt == zip_outoff)
      zip_outcnt = zip_outoff = 0;
  }
  return n;
}

/* ==========================================================================
 * Allocate the match buffer, initialize the various tables and save the
 * location of the internal file attribute (ascii/binary) and method
 * (DEFLATE/STORE).
 */
function zip_ct_init() {
  var n; // iterates over tree elements
  var bits; // bit counter
  var length; // length value
  var code; // code value
  var dist; // distance index

  if (zip_static_dtree[0].dl != 0)
    return; // ct_init already called

  zip_l_desc.dyn_tree = zip_dyn_ltree;
  zip_l_desc.static_tree = zip_static_ltree;
  zip_l_desc.extra_bits = zip_extra_lbits;
  zip_l_desc.extra_base = zip_LITERALS + 1;
  zip_l_desc.elems = zip_L_CODES;
  zip_l_desc.max_length = zip_MAX_BITS;
  zip_l_desc.max_code = 0;

  zip_d_desc.dyn_tree = zip_dyn_dtree;
  zip_d_desc.static_tree = zip_static_dtree;
  zip_d_desc.extra_bits = zip_extra_dbits;
  zip_d_desc.extra_base = 0;
  zip_d_desc.elems = zip_D_CODES;
  zip_d_desc.max_length = zip_MAX_BITS;
  zip_d_desc.max_code = 0;

  zip_bl_desc.dyn_tree = zip_bl_tree;
  zip_bl_desc.static_tree = null;
  zip_bl_desc.extra_bits = zip_extra_blbits;
  zip_bl_desc.extra_base = 0;
  zip_bl_desc.elems = zip_BL_CODES;
  zip_bl_desc.max_length = zip_MAX_BL_BITS;
  zip_bl_desc.max_code = 0;

  // Initialize the mapping length (0..255) -> length code (0..28)
  length = 0;
  for (code = 0; code < zip_LENGTH_CODES - 1; code++) {
    zip_base_length[code] = length;
    for (n = 0; n < (1 << zip_extra_lbits[code]); n++)
      zip_length_code[length++] = code;
  }
  // Assert (length == 256, "ct_init: length != 256");

  /* Note that the length 255 (match length 258) can be represented
   * in two different ways: code 284 + 5 bits or code 285, so we
   * overwrite length_code[255] to use the best encoding:
   */
  zip_length_code[length - 1] = code;

  /* Initialize the mapping dist (0..32K) -> dist code (0..29) */
  dist = 0;
  for (code = 0; code < 16; code++) {
    zip_base_dist[code] = dist;
    for (n = 0; n < (1 << zip_extra_dbits[code]); n++) {
      zip_dist_code[dist++] = code;
    }
  }
  // Assert (dist == 256, "ct_init: dist != 256");
  dist >>= 7; // from now on, all distances are divided by 128
  for (; code < zip_D_CODES; code++) {
    zip_base_dist[code] = dist << 7;
    for (n = 0; n < (1 << (zip_extra_dbits[code] - 7)); n++)
      zip_dist_code[256 + dist++] = code;
  }
  // Assert (dist == 256, "ct_init: 256+dist != 512");

  // Construct the codes of the static literal tree
  for (bits = 0; bits <= zip_MAX_BITS; bits++)
    zip_bl_count[bits] = 0;
  n = 0;
  while (n <= 143) {
    zip_static_ltree[n++].dl = 8;
    zip_bl_count[8]++;
  }
  while (n <= 255) {
    zip_static_ltree[n++].dl = 9;
    zip_bl_count[9]++;
  }
  while (n <= 279) {
    zip_static_ltree[n++].dl = 7;
    zip_bl_count[7]++;
  }
  while (n <= 287) {
    zip_static_ltree[n++].dl = 8;
    zip_bl_count[8]++;
  }
  /* Codes 286 and 287 do not exist, but we must include them in the
   * tree construction to get a canonical Huffman tree (longest code
   * all ones)
   */
  zip_gen_codes(zip_static_ltree, zip_L_CODES + 1);

  /* The static distance tree is trivial: */
  for (n = 0; n < zip_D_CODES; n++) {
    zip_static_dtree[n].dl = 5;
    // ### AbanQ
    //zip_static_dtree[n].fc = zip_bi_reverse(n, 5);
    zip_static_dtree[n].fc = zip_bi_reverse5(n);
  }

  // Initialize the first block of the first file:
  zip_init_block();
}

/* ==========================================================================
 * Initialize a new block.
 */
function zip_init_block() {
  var n; // iterates over tree elements

  // Initialize the trees.
  for (n = 0; n < zip_L_CODES; n++)
    zip_dyn_ltree[n].fc = 0;
  for (n = 0; n < zip_D_CODES; n++)
    zip_dyn_dtree[n].fc = 0;
  for (n = 0; n < zip_BL_CODES; n++)
    zip_bl_tree[n].fc = 0;

  zip_dyn_ltree[zip_END_BLOCK].fc = 1;
  zip_opt_len = zip_static_len = 0;
  zip_last_lit = zip_last_dist = zip_last_flags = 0;
  zip_flags = 0;
  zip_flag_bit = 1;
}

/* ==========================================================================
 * Restore the heap property by moving down the tree starting at node k,
 * exchanging a node with the smallest of its two sons if necessary, stopping
 * when the heap property is re-established (each father smaller than its
 * two sons).
 */
function zip_pqdownheap(tree, // the tree to restore
    k) { // node to move down
  var v = zip_heap[k];
  var j = k << 1; // left son of k

  while (j <= zip_heap_len) {
    // Set j to the smallest of the two sons:
    if (j < zip_heap_len && zip_SMALLER(tree, zip_heap[j + 1], zip_heap[j]))
      j++;

    // Exit if v is smaller than both sons
    if (zip_SMALLER(tree, v, zip_heap[j]))
      break;

    // Exchange v with the smallest son
    zip_heap[k] = zip_heap[j];
    k = j;

    // And continue down the tree, setting j to the left son of k
    j <<= 1;
  }
  zip_heap[k] = v;
}

/* ==========================================================================
 * Compute the optimal bit lengths for a tree and update the total bit length
 * for the current block.
 * IN assertion: the fields freq and dad are set, heap[heap_max] and
 *    above are the tree nodes sorted by increasing frequency.
 * OUT assertions: the field len is set to the optimal bit length, the
 *     array bl_count contains the frequencies for each bit length.
 *     The length opt_len is updated; static_len is also updated if stree is
 *     not null.
 */
function zip_gen_bitlen(desc) { // the tree descriptor
  var tree = desc.dyn_tree;
  var extra = desc.extra_bits;
  var base = desc.extra_base;
  var max_code = desc.max_code;
  var max_length = desc.max_length;
  var stree = desc.static_tree;
  var h; // heap index
  var n, m; // iterate over the tree elements
  var bits; // bit length
  var xbits; // extra bits
  var f; // frequency
  var overflow = 0; // number of elements with bit length too large

  for (bits = 0; bits <= zip_MAX_BITS; bits++)
    zip_bl_count[bits] = 0;

  /* In a first pass, compute the optimal bit lengths (which may
   * overflow in the case of the bit length tree).
   */
  tree[zip_heap[zip_heap_max]].dl = 0; // root of the heap

  for (h = zip_heap_max + 1; h < zip_HEAP_SIZE; h++) {
    n = zip_heap[h];
    bits = tree[tree[n].dl].dl + 1;
    if (bits > max_length) {
      bits = max_length;
      overflow++;
    }
    tree[n].dl = bits;
    // We overwrite tree[n].dl which is no longer needed

    if (n > max_code)
      continue; // not a leaf node

    zip_bl_count[bits]++;
    xbits = 0;
    if (n >= base)
      xbits = extra[n - base];
    f = tree[n].fc;
    zip_opt_len += f * (bits + xbits);
    if (stree != null)
      zip_static_len += f * (stree[n].dl + xbits);
  }
  if (overflow == 0)
    return;

  // This happens for example on obj2 and pic of the Calgary corpus

  // Find the first bit length which could increase:
  do {
    bits = max_length - 1;
    while (zip_bl_count[bits] == 0)
      bits--;
    zip_bl_count[bits]--; // move one leaf down the tree
    zip_bl_count[bits + 1] += 2; // move one overflow item as its brother
    zip_bl_count[max_length]--;
    /* The brother of the overflow item also moves one step up,
     * but this does not affect bl_count[max_length]
     */
    overflow -= 2;
  } while (overflow > 0);

  /* Now recompute all bit lengths, scanning in increasing frequency.
   * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
   * lengths instead of fixing only the wrong ones. This idea is taken
   * from 'ar' written by Haruhiko Okumura.)
   */
  for (bits = max_length; bits != 0; bits--) {
    n = zip_bl_count[bits];
    while (n != 0) {
      m = zip_heap[--h];
      if (m > max_code)
        continue;
      if (tree[m].dl != bits) {
        zip_opt_len += (bits - tree[m].dl) * tree[m].fc;
        tree[m].fc = bits;
      }
      n--;
    }
  }
}

/* ==========================================================================
 * Generate the codes for a given tree and bit counts (which need not be
 * optimal).
 * IN assertion: the array bl_count contains the bit length statistics for
 * the given tree and the field len is set for all tree elements.
 * OUT assertion: the field code is set for all tree elements of non
 *     zero code length.
 */
function zip_gen_codes(tree, // the tree to decorate
    max_code) { // largest code with non zero frequency
  var next_code = new Array(zip_MAX_BITS + 1); // next code value for each bit length
  var code = 0; // running code value
  var bits; // bit index
  var n; // code index

  /* The distribution counts are first used to generate the code values
   * without bit reversal.
   */
  for (bits = 1; bits <= zip_MAX_BITS; ++bits) {
    code = ((code + zip_bl_count[bits - 1]) << 1);
    next_code[bits] = code;
  }

  /* Check that the bit counts in bl_count are consistent. The last code
   * must be all ones.
   */
  //    Assert (code + encoder->bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
  //	    "inconsistent bit counts");
  //    Tracev((stderr,"\ngen_codes: max_code %d ", max_code));
  for (n = 0; n <= max_code; ++n) {
    var len = tree[n].dl;
    if (len == 0)
      continue;
    // Now reverse the bits
    // ### AbanQ
    tree[n].fc = zip_bi_reverse(next_code[len]++, len);
    //tree[n].fc = zip_bi_reverse(next_code[len]++, len);

    //      Tracec(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
    //	  n, (isgraph(n) ? n : ' '), len, tree[n].fc, next_code[len]-1));
  }
}

/* ==========================================================================
 * Construct one Huffman tree and assigns the code bit strings and lengths.
 * Update the total bit length for the current block.
 * IN assertion: the field freq is set for all tree elements.
 * OUT assertions: the fields len and code are set to the optimal bit length
 *     and corresponding code. The length opt_len is updated; static_len is
 *     also updated if stree is not null. The field max_code is set.
 */
function zip_build_tree(desc) { // the tree descriptor
  var tree = desc.dyn_tree;
  var stree = desc.static_tree;
  var elems = desc.elems;
  var n, m; // iterate over heap elements
  var max_code = -1; // largest code with non zero frequency
  var node = elems; // next internal node of the tree

  /* Construct the initial heap, with least frequent element in
   * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
   * heap[0] is not used.
   */
  zip_heap_len = 0;
  zip_heap_max = zip_HEAP_SIZE;

  for (n = 0; n < elems; ++n) {
    if (tree[n].fc != 0) {
      zip_heap[++zip_heap_len] = max_code = n;
      zip_depth[n] = 0;
    } else
      tree[n].dl = 0;
  }

  /* The pkzip format requires that at least one distance code exists,
   * and that at least one bit should be sent even if there is only one
   * possible code. So to avoid special checks later on we force at least
   * two codes of non zero frequency.
   */
  while (zip_heap_len < 2) {
    var xnew = zip_heap[++zip_heap_len] = (max_code < 2 ? ++max_code : 0);
    tree[xnew].fc = 1;
    zip_depth[xnew] = 0;
    zip_opt_len--;
    if (stree != null)
      zip_static_len -= stree[xnew].dl;
    // new is 0 or 1 so it does not have extra bits
  }
  desc.max_code = max_code;

  /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
   * establish sub-heaps of increasing lengths:
   */
  for (n = zip_heap_len >> 1; n >= 1; n--)
    zip_pqdownheap(tree, n);

  /* Construct the Huffman tree by repeatedly combining the least two
   * frequent nodes.
   */
  do {
    n = zip_heap[zip_SMALLEST];
    zip_heap[zip_SMALLEST] = zip_heap[zip_heap_len--];
    zip_pqdownheap(tree, zip_SMALLEST);

    m = zip_heap[zip_SMALLEST]; // m = node of next least frequency

    // keep the nodes sorted by frequency
    zip_heap[--zip_heap_max] = n;
    zip_heap[--zip_heap_max] = m;

    // Create a new node father of n and m
    tree[node].fc = tree[n].fc + tree[m].fc;
    //	depth[node] = (char)(MAX(depth[n], depth[m]) + 1);
    if (zip_depth[n] > zip_depth[m] + 1)
      zip_depth[node] = zip_depth[n];
    else
      zip_depth[node] = zip_depth[m] + 1;
    tree[n].dl = tree[m].dl = node;

    // and insert the new node in the heap
    zip_heap[zip_SMALLEST] = node++;
    zip_pqdownheap(tree, zip_SMALLEST);

  } while (zip_heap_len >= 2);

  zip_heap[--zip_heap_max] = zip_heap[zip_SMALLEST];

  /* At this point, the fields freq and dad are set. We can now
   * generate the bit lengths.
   */
  zip_gen_bitlen(desc);

  // The field len is now set, we can generate the bit codes
  zip_gen_codes(tree, max_code);
}

/* ==========================================================================
 * Scan a literal or distance tree to determine the frequencies of the codes
 * in the bit length tree. Updates opt_len to take into account the repeat
 * counts. (The contribution of the bit length codes will be added later
 * during the construction of bl_tree.)
 */
function zip_scan_tree(tree,// the tree to be scanned
    max_code) { // and its largest code of non zero frequency
  var n; // iterates over all tree elements
  var prevlen = -1; // last emitted length
  var curlen; // length of current code
  var nextlen = tree[0].dl; // length of next code
  var count = 0; // repeat count of the current code
  var max_count = 7; // max repeat count
  var min_count = 4; // min repeat count

  if (nextlen == 0) {
    max_count = 138;
    min_count = 3;
  }
  tree[max_code + 1].dl = 0xffff; // guard

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[n + 1].dl;
    if (++count < max_count && curlen == nextlen)
      continue;
    else if (count < min_count)
      zip_bl_tree[curlen].fc += count;
    else if (curlen != 0) {
      if (curlen != prevlen)
        zip_bl_tree[curlen].fc++;
      zip_bl_tree[zip_REP_3_6].fc++;
    } else if (count <= 10)
      zip_bl_tree[zip_REPZ_3_10].fc++;
    else
      zip_bl_tree[zip_REPZ_11_138].fc++;
    count = 0;
    prevlen = curlen;
    if (nextlen == 0) {
      max_count = 138;
      min_count = 3;
    } else if (curlen == nextlen) {
      max_count = 6;
      min_count = 3;
    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}

/* ==========================================================================
 * Send a literal or distance tree in compressed form, using the codes in
 * bl_tree.
 */
function zip_send_tree(tree, // the tree to be scanned
    max_code) { // and its largest code of non zero frequency
  var n; // iterates over all tree elements
  var prevlen = -1; // last emitted length
  var curlen; // length of current code
  var nextlen = tree[0].dl; // length of next code
  var count = 0; // repeat count of the current code
  var max_count = 7; // max repeat count
  var min_count = 4; // min repeat count

  /* tree[max_code+1].dl = -1; *//* guard already set */
  if (nextlen == 0) {
    max_count = 138;
    min_count = 3;
  }

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[n + 1].dl;
    if (++count < max_count && curlen == nextlen) {
      continue;
    } else if (count < min_count) {
      do {
        zip_SEND_CODE(curlen, zip_bl_tree);
      } while (--count != 0);
    } else if (curlen != 0) {
      if (curlen != prevlen) {
        zip_SEND_CODE(curlen, zip_bl_tree);
        count--;
      }
      // Assert(count >= 3 && count <= 6, " 3_6?");
      zip_SEND_CODE(zip_REP_3_6, zip_bl_tree);
      zip_send_bits(count - 3, 2);
    } else if (count <= 10) {
      zip_SEND_CODE(zip_REPZ_3_10, zip_bl_tree);
      zip_send_bits(count - 3, 3);
    } else {
      zip_SEND_CODE(zip_REPZ_11_138, zip_bl_tree);
      zip_send_bits(count - 11, 7);
    }
    count = 0;
    prevlen = curlen;
    if (nextlen == 0) {
      max_count = 138;
      min_count = 3;
    } else if (curlen == nextlen) {
      max_count = 6;
      min_count = 3;
    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}

/* ==========================================================================
 * Construct the Huffman tree for the bit lengths and return the index in
 * bl_order of the last bit length code to send.
 */
function zip_build_bl_tree() {
  var max_blindex; // index of last bit length code of non zero freq

  // Determine the bit length frequencies for literal and distance trees
  zip_scan_tree(zip_dyn_ltree, zip_l_desc.max_code);
  zip_scan_tree(zip_dyn_dtree, zip_d_desc.max_code);

  // Build the bit length tree:
  zip_build_tree(zip_bl_desc);
  /* opt_len now includes the length of the tree representations, except
   * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
   */

  /* Determine the number of bit length codes to send. The pkzip format
   * requires that at least 4 bit length codes be sent. (appnote.txt says
   * 3 but the actual value used is 4.)
   */
  for (max_blindex = zip_BL_CODES - 1; max_blindex >= 3; max_blindex--) {
    if (zip_bl_tree[zip_bl_order[max_blindex]].dl != 0)
      break;
  }
  /* Update opt_len to include the bit length tree and counts */
  zip_opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
  //    Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
  //	    encoder->opt_len, encoder->static_len));

  return max_blindex;
}

/* ==========================================================================
 * Send the header for a block using dynamic Huffman trees: the counts, the
 * lengths of the bit length codes, the literal tree and the distance tree.
 * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
 */
function zip_send_all_trees(lcodes, dcodes, blcodes) { // number of codes for each tree
  var rank; // index in bl_order

  //    Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
  //    Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
  //	    "too many codes");
  //    Tracev((stderr, "\nbl counts: "));
  zip_send_bits(lcodes - 257, 5); // not +255 as stated in appnote.txt
  zip_send_bits(dcodes - 1, 5);
  zip_send_bits(blcodes - 4, 4); // not -3 as stated in appnote.txt
  for (rank = 0; rank < blcodes; rank++) {
    //      Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
    zip_send_bits(zip_bl_tree[zip_bl_order[rank]].dl, 3);
  }

  // send the literal tree
  zip_send_tree(zip_dyn_ltree, lcodes - 1);

  // send the distance tree
  zip_send_tree(zip_dyn_dtree, dcodes - 1);
}

/* ==========================================================================
 * Determine the best encoding for the current block: dynamic trees, static
 * trees or store, and output the encoded block to the zip file.
 */
function zip_flush_block(eof) { // true if this is the last block for a file
  var opt_lenb, static_lenb; // opt_len and static_len in bytes
  var max_blindex; // index of last bit length code of non zero freq
  var stored_len; // length of input block

  stored_len = zip_strstart - zip_block_start;
  zip_flag_buf[zip_last_flags] = zip_flags; // Save the flags for the last 8 items

  // Construct the literal and distance trees
  zip_build_tree(zip_l_desc);
  //    Tracev((stderr, "\nlit data: dyn %ld, stat %ld",
  //	    encoder->opt_len, encoder->static_len));

  zip_build_tree(zip_d_desc);
  //    Tracev((stderr, "\ndist data: dyn %ld, stat %ld",
  //	    encoder->opt_len, encoder->static_len));
  /* At this point, opt_len and static_len are the total bit lengths of
   * the compressed block data, excluding the tree representations.
   */

  /* Build the bit length tree for the above two trees, and get the index
   * in bl_order of the last bit length code to send.
   */
  max_blindex = zip_build_bl_tree();

  // Determine the best encoding. Compute first the block length in bytes
  opt_lenb = (zip_opt_len + 3 + 7) >> 3;
  static_lenb = (zip_static_len + 3 + 7) >> 3;

  //    Trace((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u dist %u ",
  //	   opt_lenb, encoder->opt_len,
  //	   static_lenb, encoder->static_len, stored_len,
  //	   encoder->last_lit, encoder->last_dist));

  if (static_lenb <= opt_lenb)
    opt_lenb = static_lenb;
  if (stored_len + 4 <= opt_lenb // 4: two words for the lengths
      && zip_block_start >= 0) {
    var i;

    /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
     * Otherwise we can't have processed more than WSIZE input bytes since
     * the last block flush, because compression would have been
     * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
     * transform a block into a stored block.
     */
    zip_send_bits((zip_STORED_BLOCK << 1) + eof, 3); /* send block type */
    zip_bi_windup(); /* align on byte boundary */
    zip_put_short(stored_len);
    zip_put_short(~stored_len);

    // copy block
    /*
          p = &window[block_start];
          for(i = 0; i < stored_len; i++)
    	put_byte(p[i]);
    */
    for (i = 0; i < stored_len; i++)
      zip_put_byte(zip_window[zip_block_start + i]);

  } else if (static_lenb == opt_lenb) {
    zip_send_bits((zip_STATIC_TREES << 1) + eof, 3);
    zip_compress_block(zip_static_ltree, zip_static_dtree);
  } else {
    zip_send_bits((zip_DYN_TREES << 1) + eof, 3);
    zip_send_all_trees(zip_l_desc.max_code + 1, zip_d_desc.max_code + 1,
        max_blindex + 1);
    zip_compress_block(zip_dyn_ltree, zip_dyn_dtree);
  }

  zip_init_block();

  if (eof != 0)
    zip_bi_windup();
}

/* ==========================================================================
 * Save the match info and tally the frequency counts. Return true if
 * the current block must be flushed.
 */
function zip_ct_tally(dist, // distance of matched string
    lc) { // match length-MIN_MATCH or unmatched char (if dist==0)
  zip_l_buf[zip_last_lit++] = lc;
  if (dist == 0) {
    // lc is the unmatched char
    zip_dyn_ltree[lc].fc++;
  } else {
    // Here, lc is the match length - MIN_MATCH
    dist--; // dist = match distance - 1
    //      Assert((ush)dist < (ush)MAX_DIST &&
    //	     (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
    //	     (ush)D_CODE(dist) < (ush)D_CODES,  "ct_tally: bad match");

    zip_dyn_ltree[zip_length_code[lc] + zip_LITERALS + 1].fc++;
    zip_dyn_dtree[zip_D_CODE(dist)].fc++;

    zip_d_buf[zip_last_dist++] = dist;
    zip_flags |= zip_flag_bit;
  }
  zip_flag_bit <<= 1;

  // Output the flags if they fill a byte
  if ((zip_last_lit & 7) == 0) {
    zip_flag_buf[zip_last_flags++] = zip_flags;
    zip_flags = 0;
    zip_flag_bit = 1;
  }
  // Try to guess if it is profitable to stop the current block here
  if (zip_compr_level > 2 && (zip_last_lit & 0xfff) == 0) {
    // Compute an upper bound for the compressed length
    var out_length = zip_last_lit * 8;
    var in_length = zip_strstart - zip_block_start;
    var dcode;

    for (dcode = 0; dcode < zip_D_CODES; dcode++) {
      out_length += zip_dyn_dtree[dcode].fc * (5 + zip_extra_dbits[dcode]);
    }
    out_length >>= 3;
    //      Trace((stderr,"\nlast_lit %u, last_dist %u, in %ld, out ~%ld(%ld%%) ",
    //	     encoder->last_lit, encoder->last_dist, in_length, out_length,
    //	     100L - out_length*100L/in_length));
    if (zip_last_dist < parseInt(zip_last_lit / 2)
        && out_length < parseInt(in_length / 2))
      return true;
  }
  return (zip_last_lit == zip_LIT_BUFSIZE - 1 || zip_last_dist == zip_DIST_BUFSIZE);
  /* We avoid equality with LIT_BUFSIZE because of wraparound at 64K
   * on 16 bit machines and because stored blocks are restricted to
   * 64K-1 bytes.
   */
}

/* ==========================================================================
 * Send the block data compressed using the given Huffman trees
 */
function zip_compress_block(ltree, // literal tree
    dtree) { // distance tree
  var dist; // distance of matched string
  var lc; // match length or unmatched char (if dist == 0)
  var lx = 0; // running index in l_buf
  var dx = 0; // running index in d_buf
  var fx = 0; // running index in flag_buf
  var flag = 0; // current flags
  var code; // the code to send
  var extra; // number of extra bits to send

  if (zip_last_lit != 0)
    do {
      if ((lx & 7) == 0)
        flag = zip_flag_buf[fx++];
      lc = zip_l_buf[lx++] & 0xff;
      if ((flag & 1) == 0) {
        zip_SEND_CODE(lc, ltree); /* send a literal byte */
        //	Tracecv(isgraph(lc), (stderr," '%c' ", lc));
      } else {
        // Here, lc is the match length - MIN_MATCH
        code = zip_length_code[lc];
        zip_SEND_CODE(code + zip_LITERALS + 1, ltree); // send the length code
        extra = zip_extra_lbits[code];
        if (extra != 0) {
          lc -= zip_base_length[code];
          zip_send_bits(lc, extra); // send the extra length bits
        }
        dist = zip_d_buf[dx++];
        // Here, dist is the match distance - 1
        code = zip_D_CODE(dist);
        //	Assert (code < D_CODES, "bad d_code");

        zip_SEND_CODE(code, dtree); // send the distance code
        extra = zip_extra_dbits[code];
        if (extra != 0) {
          dist -= zip_base_dist[code];
          zip_send_bits(dist, extra); // send the extra distance bits
        }
      } // literal or match pair ?
      flag >>= 1;
    } while (lx < zip_last_lit);

  zip_SEND_CODE(zip_END_BLOCK, ltree);
}

/* ==========================================================================
 * Send a value on a given number of bits.
 * IN assertion: length <= 16 and value fits in length bits.
 */
function zip_send_bits(value, // value to send
    length) { // number of bits
  /* If not enough room in bi_buf, use (valid) bits from bi_buf and
   * (16 - bi_valid) bits from value, leaving (width - (16-bi_valid))
   * unused bits in value.
   */
  var zip_Buf_size = 16; // bit size of bi_buf
  if (zip_bi_valid > zip_Buf_size - length) {
    zip_bi_buf |= (value << zip_bi_valid);
    zip_put_short(zip_bi_buf);
    zip_bi_buf = (value >> (zip_Buf_size - zip_bi_valid));
    zip_bi_valid += length - zip_Buf_size;
  } else {
    zip_bi_buf |= value << zip_bi_valid;
    zip_bi_valid += length;
  }
}

/* ==========================================================================
 * Reverse the first len bits of a code, using straightforward code (a faster
 * method would use a table)
 * IN assertion: 1 <= len <= 15
 */
// ### AbanQ
var BitReverseTable256 = [ 0x00, 0x80, 0x40, 0xC0, 0x20, 0xA0, 0x60, 0xE0,
    0x10, 0x90, 0x50, 0xD0, 0x30, 0xB0, 0x70, 0xF0, 0x08, 0x88, 0x48, 0xC8,
    0x28, 0xA8, 0x68, 0xE8, 0x18, 0x98, 0x58, 0xD8, 0x38, 0xB8, 0x78, 0xF8,
    0x04, 0x84, 0x44, 0xC4, 0x24, 0xA4, 0x64, 0xE4, 0x14, 0x94, 0x54, 0xD4,
    0x34, 0xB4, 0x74, 0xF4, 0x0C, 0x8C, 0x4C, 0xCC, 0x2C, 0xAC, 0x6C, 0xEC,
    0x1C, 0x9C, 0x5C, 0xDC, 0x3C, 0xBC, 0x7C, 0xFC, 0x02, 0x82, 0x42, 0xC2,
    0x22, 0xA2, 0x62, 0xE2, 0x12, 0x92, 0x52, 0xD2, 0x32, 0xB2, 0x72, 0xF2,
    0x0A, 0x8A, 0x4A, 0xCA, 0x2A, 0xAA, 0x6A, 0xEA, 0x1A, 0x9A, 0x5A, 0xDA,
    0x3A, 0xBA, 0x7A, 0xFA, 0x06, 0x86, 0x46, 0xC6, 0x26, 0xA6, 0x66, 0xE6,
    0x16, 0x96, 0x56, 0xD6, 0x36, 0xB6, 0x76, 0xF6, 0x0E, 0x8E, 0x4E, 0xCE,
    0x2E, 0xAE, 0x6E, 0xEE, 0x1E, 0x9E, 0x5E, 0xDE, 0x3E, 0xBE, 0x7E, 0xFE,
    0x01, 0x81, 0x41, 0xC1, 0x21, 0xA1, 0x61, 0xE1, 0x11, 0x91, 0x51, 0xD1,
    0x31, 0xB1, 0x71, 0xF1, 0x09, 0x89, 0x49, 0xC9, 0x29, 0xA9, 0x69, 0xE9,
    0x19, 0x99, 0x59, 0xD9, 0x39, 0xB9, 0x79, 0xF9, 0x05, 0x85, 0x45, 0xC5,
    0x25, 0xA5, 0x65, 0xE5, 0x15, 0x95, 0x55, 0xD5, 0x35, 0xB5, 0x75, 0xF5,
    0x0D, 0x8D, 0x4D, 0xCD, 0x2D, 0xAD, 0x6D, 0xED, 0x1D, 0x9D, 0x5D, 0xDD,
    0x3D, 0xBD, 0x7D, 0xFD, 0x03, 0x83, 0x43, 0xC3, 0x23, 0xA3, 0x63, 0xE3,
    0x13, 0x93, 0x53, 0xD3, 0x33, 0xB3, 0x73, 0xF3, 0x0B, 0x8B, 0x4B, 0xCB,
    0x2B, 0xAB, 0x6B, 0xEB, 0x1B, 0x9B, 0x5B, 0xDB, 0x3B, 0xBB, 0x7B, 0xFB,
    0x07, 0x87, 0x47, 0xC7, 0x27, 0xA7, 0x67, 0xE7, 0x17, 0x97, 0x57, 0xD7,
    0x37, 0xB7, 0x77, 0xF7, 0x0F, 0x8F, 0x4F, 0xCF, 0x2F, 0xAF, 0x6F, 0xEF,
    0x1F, 0x9F, 0x5F, 0xDF, 0x3F, 0xBF, 0x7F, 0xFF ];
function zip_bi_reverse5(x) {
  return (BitReverseTable256[x]) & 0x1f;
}
function zip_bi_reverse(x, len) {
  return (((BitReverseTable256[x & 0xff] << 8) | (BitReverseTable256[(x >> 8) & 0xff])) >> (16 - len));
}
//function zip_bi_reverse(code, // the value to invert
//    len) { // its bit length
//  var res = 0;
//  do {
//    res |= code & 1;
//    code >>= 1;
//    res <<= 1;
//  } while (--len > 0);
//  return res >> 1;
//}

/* ==========================================================================
 * Write out any remaining bits in an incomplete byte.
 */
function zip_bi_windup() {
  if (zip_bi_valid > 8) {
    zip_put_short(zip_bi_buf);
  } else if (zip_bi_valid > 0) {
    zip_put_byte(zip_bi_buf);
  }
  zip_bi_buf = 0;
  zip_bi_valid = 0;
}

function zip_qoutbuf() {
  if (zip_outcnt != 0) {
    var q, i;
    q = zip_new_queue();
    if (zip_qhead == null)
      zip_qhead = zip_qtail = q;
    else
      zip_qtail = zip_qtail.next = q;
    q.len = zip_outcnt - zip_outoff;
    //      System.arraycopy(zip_outbuf, zip_outoff, q.ptr, 0, q.len);
    // ### AbanQ
    //    for (i = 0; i < q.len; i++)
    //      q.ptr[i] = zip_outbuf[zip_outoff + i];
    // ### AbanQ
    aqCopyArray(zip_outbuf, zip_outoff, q.ptr, 0, q.len);

    zip_outcnt = zip_outoff = 0;
  }
}

function zip_deflate_Ini(str, ert, level) {
  zip_deflate_data = str;
  zip_deflate_pos = 0;
  zip_adler32 = 1;
  zip_deflate_start(level == null ? zip_DEFAULT_LEVEL : level);
  zip_endout = new Array(zip_deflate_data.length);
  zip_endout_cnt = 0;
  zip_deferred = new dojo.Deferred();
  zip_ert = ert;

  aqCompileUnrolledCopy(10);

  zip_endout[zip_endout_cnt++] = ((zip_deflate_data.length & 0xff000000) >> 24);
  zip_endout[zip_endout_cnt++] = ((zip_deflate_data.length & 0x00ff0000) >> 16);
  zip_endout[zip_endout_cnt++] = ((zip_deflate_data.length & 0x0000ff00) >> 8);
  zip_endout[zip_endout_cnt++] = (zip_deflate_data.length & 0x000000ff);
  zip_endout[zip_endout_cnt++] = (0x78);
  switch (zip_compr_level) {
  case 1:
    zip_endout[zip_endout_cnt++] = (0x01);
    break;
  case 2:
  case 3:
  case 4:
  case 5:
    zip_endout[zip_endout_cnt++] = (0x5e);
    break;
  case 6:
    zip_endout[zip_endout_cnt++] = (0x9c);
    break;
  case 7:
  case 8:
  case 9:
    zip_endout[zip_endout_cnt++] = (0xda);
    break;
  }
}

function zip_deflate_End() {
  zip_endout[zip_endout_cnt++] = ((zip_adler32 & 0xff000000) >> 24);
  zip_endout[zip_endout_cnt++] = ((zip_adler32 & 0x00ff0000) >> 16);
  zip_endout[zip_endout_cnt++] = ((zip_adler32 & 0x0000ff00) >> 8);
  zip_endout[zip_endout_cnt++] = (zip_adler32 & 0x000000ff);
  zip_endout.length = zip_endout_cnt;
}

function zip_deflate_Chunk() {
  var n;
  if ((n = zip_deflate_internal(zip_endout, zip_endout_cnt, zip_CHUNK)) == 0) {
    zip_deflate_End();
    zip_deferred.callback( {
      zout : zip_endout,
      zert : zip_ert
    });
    zip_deflate_end();
  } else {
    setTimeout(function() {
      zip_deflate_Chunk();
    }, 0);
    zip_endout_cnt += n;
  }
}

function zip_deflate_deferred(str, ert, level) {
  zip_deflate_Ini(str, ert, level);
  zip_deflate_Chunk();
  return zip_deferred;
}

//if (zip_LIT_BUFSIZE > zip_INBUFSIZ)
//  alert("error: zip_INBUFSIZ is too small");
//if ((zip_WSIZE << 1) > (1 << zip_BITS))
//  alert("error: zip_WSIZE is too large");
//if (zip_HASH_BITS > zip_BITS - 1)
//  alert("error: zip_HASH_BITS is too large");
//if (zip_HASH_BITS < 8 || zip_MAX_MATCH != 258)
//  alert("error: Code too clever");
