// ==UserScript==
// @name         Neopets - Neoboards Tweaks
// @namespace    neopets-qol-patcher
// @version      1.0.0
// @description  Neopets Neoboards: remove formatting buttons, add a scrollable smiley grid, and a live preview under the message box.
// @match        *://*.neopets.com/neoboards*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  if (window.top !== window) return;
  if (!/^(www\.|ncmall\.)?neopets\.com$/i.test(location.hostname)) return;
  if (/popup/i.test(location.pathname)) return;
  if (!!window.opener && window.outerWidth < 900) return;

  const LSget = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ───────────────────────────── reply CSS ───────────────────────────── */
  const NB_CSS = `
.topicReplyIcons > table, .topicReplyIcons > br, .topicReplyIcons > .replySmilies-neoboards,
.topicCreateIcons > table, .topicCreateIcons > br, .topicCreateIcons > .topicCreateSmilies-neoboards { display: none !important; }
.npNbSmilies { display: flex; flex-wrap: wrap; align-content: flex-start; gap: 6px; max-height: 150px; overflow-y: auto; padding: 6px; margin: 6px 0; border: 1px solid #ccc; border-radius: 8px; background: #fff; box-sizing: border-box; width: 100%; }
.npNbSmilies button { flex: 0 0 auto; width: 36px; height: 36px; padding: 2px; border: 1px solid transparent; border-radius: 6px; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.npNbSmilies button:hover { border-color: #9900b3; background: #f3e6f7; }
.npNbSmilies img { max-width: 100%; max-height: 100%; display: block; }
.npNbPreview { margin: 6px 0 10px; padding: 6px 8px; border: 1px dashed #bbb; border-radius: 8px; background: #fafafa; color: #333; box-sizing: border-box; width: 100%; }
.npNbPreviewLabel { font: 700 10px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: #888; margin-bottom: 4px; }
.npNbPreviewTitle { font: 700 15px/1.3 'Outfit', system-ui, sans-serif; color: #222; margin-bottom: 4px; word-break: break-word; }
.npNbPreviewBody { min-height: 22px; font: 400 13px/1.5 'Outfit', system-ui, sans-serif; word-break: break-word; }
.npNbPreviewBody img { vertical-align: middle; height: auto; width: auto; max-height: 28px; display: inline-block; }
.npNbPreviewEmpty { color: #aaa; font-style: italic; }
`;

  const styleEl = document.createElement('style');
  styleEl.id = 'npp-nb-css';
  styleEl.textContent = NB_CSS;
  (document.head || document.documentElement).appendChild(styleEl);

  /* ───────────────────────────── smiley list ───────────────────────────── */
  const NB_SMILIES = [
    [':)', 'smiley'], [':(', 'sad'], [';)', 'winking'], [':*', 'kisskiss'], [':D', 'grin'],
    [':K', 'vampire'], [':O', 'oh'], [':P', 'tongue'], ['0:-)', 'angel'], ['B)', 'sunglasses'],
    ['*angry*', 'angry'], ['*clap*', 'clap'], ['*complain*', 'complain'], ['*cough*', 'cough'], ['*cry*', 'cry'],
    ['*facepalm*', 'facepalm'], ['*lol*', 'lol'], ['*unsure*', 'unsure'], ['*violin*', 'violin'], ['*yarr*', 'yarr'],
    ['*aaa*', 'aaa'], ['*abigail*', 'abigail'], ['*angrylawyerbot*', 'angrylawyerbot'], ['*awakened*', 'awakened'], ['*boatswain*', 'boatswain'],
    ['*bree*', 'bree'], ['*brutes*', 'brutes'], ['*brynn*', 'brynn'], ['*cabinboy*', 'cabinboy'], ['*capn3legs*', 'capn3legs'],
    ['*chadley*', 'chadley'], ['*coltzan*', 'coltzan'], ['*cook*', 'cook'], ['*fyora*', 'fyora'], ['*gunner*', 'gunner'],
    ['*hanso*', 'hanso'], ['*happiness*', 'happiness'], ['*illusen*', 'illusen'], ['*jazan*', 'jazan'], ['*jhudora*', 'jhudora'],
    ['*lawyerbot*', 'lawyerbot'], ['*lulu*', 'lulu'], ['*mate*', 'mate'], ['*mipsy*', 'mipsy'], ['*mrcoconut*', 'mrcoconut'],
    ['*nabile*', 'nabile'], ['*nox*', 'nox'], ['*order*', 'order'], ['*quartermaster*', 'quartermaster'], ['*rigger*', 'rigger'],
    ['*rohane*', 'rohane'], ['*rower*', 'rower'], ['*seekers*', 'seekers'], ['*shopwiz*', 'shopwiz'], ['*sloth*', 'sloth'],
    ['*snowager*', 'snowager'], ['*swabbie*', 'swabbie'], ['*sway*', 'sway'], ['*talinia*', 'talinia'], ['*techomaster*', 'techomaster'],
    ['*thieves*', 'thieves'], ['*turmaculus*', 'turmaculus'], ['*velm*', 'velm'], ['*wizard*', 'wizard'], ['*acara*', 'acara'],
    ['*aisha*', 'aisha'], ['*blumaroo*', 'blumaroo'], ['*bori*', 'bori'], ['*bruce*', 'bruce'], ['*buzz*', 'buzz'],
    ['*chia*', 'chia'], ['*chomby*', 'chomby'], ['*cybunny*', 'cybunny'], ['*draik*', 'draik'], ['*elephante*', 'elephante'],
    ['*eyrie*', 'eyrie'], ['*flotsam*', 'flotsam'], ['*gelert*', 'gelert'], ['*gnorbu*', 'gnorbu'], ['*grarrl*', 'grarrl'],
    ['*grundo*', 'grundo'], ['*hissi*', 'hissi'], ['*ixi*', 'ixi'], ['*jetsam*', 'jetsam'], ['*jubjub*', 'jubjub'],
    ['*kacheek*', 'kacheek'], ['*kau*', 'kau'], ['*kiko*', 'kiko'], ['*koi*', 'koi'], ['*korbat*', 'korbat'],
    ['*kougra*', 'kougra'], ['*krawk*', 'krawk'], ['*kyrii*', 'kyrii'], ['*lenny*', 'lenny'], ['*lupe*', 'lupe'],
    ['*lutari*', 'lutari'], ['*meerca*', 'meerca'], ['*moehog*', 'moehog'], ['*mynci*', 'mynci'], ['*nimmo*', 'nimmo'],
    ['*ogrin*', 'ogrin'], ['*peophin*', 'peophin'], ['*poogle*', 'poogle'], ['*pteri*', 'pteri'], ['*quiggle*', 'quiggle'],
    ['*ruki*', 'ruki'], ['*scorchio*', 'scorchio'], ['*shoyru*', 'shoyru'], ['*skeith*', 'skeith'], ['*techo*', 'techo'],
    ['*tonu*', 'tonu'], ['*tuskaninny*', 'tuskaninny'], ['*uni*', 'uni'], ['*usul*', 'usul'], ['*vandagyre*', 'vandagyre'],
    ['*wocky*', 'wocky'], ['*xweetok*', 'xweetok'], ['*yurble*', 'yurble'], ['*zafara*', 'zafara'], ['*angelpuss*', 'angelpuss'],
    ['*feepit*', 'feepit'], ['*jimmi*', 'jimmi'], ['*jinjah*', 'jinjah'], ['*kadoatery*', 'kadoatery'], ['*kadoatie*', 'kadoatie'],
    ['*larnikin*', 'larnikin'], ['*meepit*', 'meepit'], ['*meowclops*', 'meowclops'], ['*mootix*', 'mootix'], ['*niptor*', 'niptor'],
    ['*noil*', 'noil'], ['*pinchit*', 'pinchit'], ['*plumpy*', 'plumpy'], ['*purplebug*', 'purplebug'], ['*slorg*', 'slorg'],
    ['*snowbunny*', 'snowbunny'], ['*spyder*', 'spyder'], ['*swipe*', 'swipe'], ['*warf*', 'warf'], ['*weewoo*', 'weewoo'],
    ['*woogy*', 'woogy'], ['*yooyu*', 'yooyu'], ['*zomutt*', 'zomutt'], ['*babypb*', 'babypb'], ['*bacon*', 'bacon'],
    ['*baf*', 'baf'], ['*battleduck*', 'battleduck'], ['*bdf*', 'bdf'], ['*bef*', 'bef'], ['*bff*', 'bff'],
    ['*bgc*', 'bgc'], ['*blf*', 'blf'], ['*bluesand*', 'bluesand'], ['*blurf*', 'blurf'], ['*book*', 'book'],
    ['*bwf*', 'bwf'], ['*codestone*', 'codestone'], ['*cookie*', 'cookie'], ['*cupcake*', 'cupcake'], ['*dariganpb*', 'dariganpb'],
    ['*dbd*', 'dbd'], ['*dubloon*', 'dubloon'], ['*eventidepb*', 'eventidepb'], ['*eventidepppb*', 'eventidepppb'], ['*faeriepb*', 'faeriepb'],
    ['*greensand*', 'greensand'], ['*icecream*', 'icecream'], ['*islandpb*', 'islandpb'], ['*jelly*', 'jelly'], ['*maractitepb*', 'maractitepb'],
    ['*mspp*', 'mspp'], ['*omelette*', 'omelette'], ['*orangesand*', 'orangesand'], ['*pie*', 'pie'], ['*pinksand*', 'pinksand'],
    ['*piratepb*', 'piratepb'], ['*popcorn*', 'popcorn'], ['*scroll*', 'scroll'], ['*sock*', 'sock'], ['*starberry*', 'starberry'],
    ['*stonepie*', 'stonepie'], ['*suap*', 'suap'], ['*tigerfruit*', 'tigerfruit'], ['*twirlyfruit*', 'twirlyfruit'], ['*ummagine*', 'ummagine'],
    ['*woodlandpb*', 'woodlandpb'], ['*wraithpb*', 'wraithpb'], ['*altador*', 'altador'], ['*brightvale*', 'brightvale'], ['*dacardia*', 'dacardia'],
    ['*darigan*', 'darigan'], ['*faerieland*', 'faerieland'], ['*haunted*', 'haunted'], ['*kikolake*', 'kikolake'], ['*krawkisland*', 'krawkisland'],
    ['*kreludor*', 'kreludor'], ['*lostdesert*', 'lostdesert'], ['*maraqua*', 'maraqua'], ['*meridell*', 'meridell'], ['*mystery*', 'mystery'],
    ['*moltara*', 'moltara'], ['*rooisland*', 'rooisland'], ['*shenkuu*', 'shenkuu'], ['*terror*', 'terror'], ['*tyrannia*', 'tyrannia'],
    ['*virtupets*', 'virtupets'], ['*air*', 'air'], ['*dark*', 'dark'], ['*earth*', 'earth'], ['*fire*', 'fire'],
    ['*light*', 'light'], ['*physical*', 'physical'], ['*water*', 'water'], ['*aishadow*', 'aishadow'], ['*angrynegg*', 'angrynegg'],
    ['*bauble*', 'bauble'], ['*bballoon*', 'bballoon'], ['*brownleaf*', 'brownleaf'], ['*cake*', 'cake'], ['*candle*', 'candle'],
    ['*candycane*', 'candycane'], ['*creepyspyder*', 'creepyspyder'], ['*eekeek*', 'eekeek'], ['*fence*', 'fence'], ['*festivalnegg*', 'festivalnegg'],
    ['*fishnegg*', 'fishnegg'], ['*flower*', 'flower'], ['*gballoon*', 'gballoon'], ['*ghost*', 'ghost'], ['*happynegg*', 'happynegg'],
    ['*heart*', 'heart'], ['*holly*', 'holly'], ['*jackolantern*', 'jackolantern'], ['*jellykacheek*', 'jellykacheek'], ['*leafleft*', 'leafleft'],
    ['*leafright*', 'leafright'], ['*luckydraik*', 'luckydraik'], ['*mistletoe*', 'mistletoe'], ['*negg*', 'negg'], ['*paperlantern*', 'paperlantern'],
    ['*present*', 'present'], ['*pumpkin*', 'pumpkin'], ['*rainbow*', 'rainbow'], ['*rballoon*', 'rballoon'], ['*redleaf*', 'redleaf'],
    ['*rednose*', 'rednose'], ['*roses*', 'roses'], ['*santa*', 'santa'], ['*shamrock*', 'shamrock'], ['*snowflake*', 'snowflake'],
    ['*snowman*', 'snowman'], ['*tombstone*', 'tombstone'], ['*web*', 'web'], ['*witch*', 'witchhat'], ['*xmastree*', 'xmastree'],
    ['*yballoon*', 'yballoon'], ['*yellowleaf*', 'yellowleaf'], ['*0.o.0*', '0.o.0'], ['*carrot*', 'carrot'], ['*catfish*', 'catfish'],
    ['*cloud*', 'cloud'], ['*coffee*', 'coffee'], ['*dung*', 'dung'], ['*genie*', 'genie'], ['*indubitably*', 'indubitably'],
    ['*kqdoor*', 'kqdoor'], ['*kqkey*', 'kqkey'], ['*map*', 'map'], ['*moneybag*', 'moneybag'], ['*monocle*', 'monocle'],
    ['*moon*', 'moon'], ['*raincloud*', 'raincloud'], ['*star*', 'star'], ['*sun*', 'sun'], ['*tea*', 'tea'],
    ['*tophat*', 'tophat'], ['*yarn*', 'yarn'],
  ];

  /* ───────────────────────────── setup ───────────────────────────── */
  function setupNeoboardReply() {
    const ta = document.querySelector('.topicReplyContainer textarea[name="message"], .topicCreateContainer textarea[name="message"]');
    if (!ta || ta.dataset.nppNb) return;
    ta.dataset.nppNb = '1';
    const icons = document.querySelector('.topicReplyContainer .topicReplyIcons, .topicCreateContainer .topicCreateIcons');
    if (!icons) return;

    // Scrollable smiley grid.
    const grid = document.createElement('div');
    grid.className = 'npNbSmilies';
    grid.innerHTML = NB_SMILIES.map(([code, file]) =>
      `<button type="button" data-code="${esc(code)}" title="${esc(code)}"><img alt="${esc(code)}" src="https://images.neopets.com/neoboards/smilies/${esc(file)}.gif"></button>`).join('');
    grid.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-code]');
      if (!b) return;
      e.preventDefault();
      const code = b.dataset.code;
      try {
        if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.insertSmiley === 'function') { unsafeWindow.insertSmiley(code); return; }
      } catch {}
      const at = ta.selectionStart ?? ta.value.length;
      ta.value = ta.value.slice(0, at) + code + ta.value.slice(ta.selectionEnd ?? at);
      ta.focus();
      ta.dispatchEvent(new Event('keyup', { bubbles: true }));
    });
    icons.appendChild(grid);

    // Live preview — codes become the same images the board shows.
    const codeFile = new Map(NB_SMILIES);
    const codeRe = new RegExp(NB_SMILIES.map(([c]) => c).sort((a, b) => b.length - a.length)
      .map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
    const preview = document.createElement('div');
    preview.className = 'npNbPreview';
    const titleEl = ta.form && ta.form.querySelector('input[name="topic_title"]');
    preview.innerHTML = '<div class="npNbPreviewLabel">Preview</div>'
      + (titleEl ? '<div class="npNbPreviewTitle"></div>' : '')
      + '<div class="npNbPreviewBody"></div>';
    const titleOut = preview.querySelector('.npNbPreviewTitle');
    ta.parentElement.insertAdjacentElement('afterend', preview);
    const body = preview.querySelector('.npNbPreviewBody');
    let lastVal = null;
    const renderPreview = () => {
      const txt = ta.value, ttl = titleEl ? titleEl.value : '';
      const key = txt + '\u0000' + ttl;
      if (key === lastVal) return;
      lastVal = key;
      const toHtml = (str) => {
        let out = '', last = 0;
        str.replace(codeRe, (m, off) => {
          out += esc(str.slice(last, off));
          out += `<img alt="${esc(m)}" title="${esc(m)}" src="https://images.neopets.com/neoboards/smilies/${esc(codeFile.get(m))}.gif">`;
          last = off + m.length;
          return m;
        });
        return out + esc(str.slice(last));
      };
      if (titleOut) titleOut.innerHTML = ttl.trim() ? toHtml(ttl.trim()) : '<span class="npNbPreviewEmpty">(no title yet)</span>';
      body.innerHTML = toHtml(txt).replace(/\n/g, '<br>') || '<span class="npNbPreviewEmpty">Your message will appear here.</span>';
    };
    ta.addEventListener('input', renderPreview);
    ta.addEventListener('keyup', renderPreview);
    if (titleEl) { titleEl.addEventListener('input', renderPreview); titleEl.addEventListener('keyup', renderPreview); }
    setInterval(renderPreview, 400);
    renderPreview();
  }

  // The page's own script may build the reply form after DOMContentLoaded. Poll briefly (then fall back to a long-interval safety net).
  let tries = 0;
  const iv = setInterval(() => {
    setupNeoboardReply();
    const ta = document.querySelector('.topicReplyContainer textarea[name="message"], .topicCreateContainer textarea[name="message"]');
    if (ta && ta.dataset.nppNb === '1') { clearInterval(iv); return; }
    if (++tries > 100) clearInterval(iv);   // 100 × 100ms = 10s — after that, stop trying
  }, 100);
  document.addEventListener('DOMContentLoaded', () => { setupNeoboardReply(); }, { once: true });

  // If the page's own script re-renders the form, re-run on big DOM changes near the container.
  new MutationObserver(() => {
    const ta = document.querySelector('.topicReplyContainer textarea[name="message"], .topicCreateContainer textarea[name="message"]');
    if (ta && ta.dataset.nppNb !== '1') setupNeoboardReply();
  }).observe(document.documentElement, { childList: true, subtree: true });
})();