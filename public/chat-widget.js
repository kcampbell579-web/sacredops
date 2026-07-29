/* SacredOps floating contact widget — WhatsApp / Call / Text.
   Self-contained: injects its own styles + markup, no dependencies.
   Routes to 631-875-2958. Fires Google Ads "Contact" + Meta Pixel on tap. */
(function () {
  if (window.__sacredChat) return;
  window.__sacredChat = true;

  var PHONE = "+16318752958";       // tel / sms
  var WA = "16318752958";           // wa.me (no +)
  var MSG = "Hi SacredOps — I have a question about ";
  var AC = "#04A466";

  function track() {
    try { if (window.gtag) gtag("event", "conversion", { send_to: "AW-18341083534/xMm6COay4NUcEI7z2qlE", value: 1.0, currency: "USD" }); } catch (e) {}
    try { if (window.fbq) fbq("track", "Contact"); } catch (e) {}
    try { if (window.gtag) gtag("event", "contact_click"); } catch (e) {}
  }

  var css = ""
    + "#soc-wrap{position:fixed;right:18px;bottom:18px;z-index:2147483000;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}"
    + "#soc-menu{position:absolute;right:0;bottom:72px;width:236px;background:#0d130f;border:1px solid rgba(120,180,140,.22);border-radius:14px;padding:8px;box-shadow:0 18px 50px rgba(0,0,0,.5);opacity:0;transform:translateY(10px);pointer-events:none;transition:.18s}"
    + "#soc-wrap.open #soc-menu{opacity:1;transform:translateY(0);pointer-events:auto}"
    + "#soc-menu .soc-h{font-size:12px;color:#8ea394;padding:8px 10px 6px;font-weight:600}"
    + "#soc-menu a{display:flex;align-items:center;gap:11px;padding:11px 10px;border-radius:10px;text-decoration:none;color:#f2f5f0;font-size:14px;font-weight:600;transition:.15s}"
    + "#soc-menu a:hover{background:rgba(4,164,102,.12)}"
    + "#soc-menu a .ic{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex:none}"
    + "#soc-menu a small{display:block;font-weight:400;color:#8ea394;font-size:11.5px;margin-top:1px}"
    + "#soc-btn{width:56px;height:56px;border-radius:50%;background:" + AC + ";border:none;cursor:pointer;box-shadow:0 8px 26px rgba(4,164,102,.45);display:flex;align-items:center;justify-content:center;transition:transform .15s;margin-left:auto}"
    + "#soc-btn:hover{transform:scale(1.06)}"
    + "#soc-wrap.open #soc-btn{transform:rotate(90deg)}"
    + "#soc-btn svg{width:28px;height:28px}"
    + "@media(max-width:560px){#soc-wrap{right:14px;bottom:14px}}";

  var wa = "https://wa.me/" + WA + "?text=" + encodeURIComponent(MSG);
  var sms = "sms:" + PHONE + "?&body=" + encodeURIComponent(MSG);
  var tel = "tel:" + PHONE;

  var html = ""
    + '<div id="soc-menu" role="menu" aria-label="Contact SacredOps">'
    +   '<div class="soc-h">Chat with us — we\'ll get right back to you.</div>'
    +   '<a href="' + wa + '" target="_blank" rel="noopener" data-soc="whatsapp">'
    +     '<span class="ic" style="background:#25D366"><svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.15h-.01a8.2 8.2 0 01-4.19-1.15l-.3-.18-3.11.82.83-3.03-.2-.31a8.24 8.24 0 01-1.26-4.39c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 012.41 5.83c0 4.55-3.7 8.24-8.25 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.79.97-.14.16-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.16 1.75 2.67 4.25 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/></svg></span>'
    +     '<span>WhatsApp<small>Message us on WhatsApp</small></span></a>'
    +   '<a href="' + tel + '" data-soc="call">'
    +     '<span class="ic" style="background:rgba(4,164,102,.16)"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="' + AC + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/></svg></span>'
    +     '<span>Call us<small>' + "(631) 875-2958" + '</small></span></a>'
    +   '<a href="' + sms + '" data-soc="sms">'
    +     '<span class="ic" style="background:rgba(4,164,102,.16)"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="' + AC + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg></span>'
    +     '<span>Text us<small>Send a text message</small></span></a>'
    + '</div>'
    + '<button id="soc-btn" aria-label="Contact us" aria-expanded="false">'
    +   '<svg viewBox="0 0 24 24" fill="none" stroke="#04231a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>'
    + '</button>';

  function init() {
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    var wrap = document.createElement("div");
    wrap.id = "soc-wrap";
    wrap.innerHTML = html;
    document.body.appendChild(wrap);

    var btn = wrap.querySelector("#soc-btn");
    btn.addEventListener("click", function () {
      var open = wrap.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    wrap.querySelectorAll("#soc-menu a").forEach(function (a) {
      a.addEventListener("click", track);
    });
    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) { wrap.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
