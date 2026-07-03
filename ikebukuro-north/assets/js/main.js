/* ============================================================
   NEIGHBORS HOTEL KAMI-IKEBUKURO — main.js
   FVカルーセル: PC=opacity切り替え / SP=touchスワイプ横移動
   サイドバー: FVロゴ消えたら表示（OS仕様に統一）
   ============================================================ */

(function () {
  'use strict';

  /* ── サイドバー：FVロゴが見切れたら表示 / 客室ページは常時表示 ── */
  var fvLogoEl = document.querySelector('.fv__logo');
  var sideEl   = document.querySelector('.side');
  if (sideEl) {
    if (fvLogoEl) {
      var sideObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { sideEl.classList.remove('visible'); }
          else                      { sideEl.classList.add('visible'); }
        });
      });
      sideObs.observe(fvLogoEl);
    } else {
      sideEl.classList.add('visible');
    }
  }

  /* ── SP: FVロゴが消えたらSPヘッダーロゴを表示 ── */
  var spHeaderLogoEl = document.querySelector('.sp-header__logo');
  if (spHeaderLogoEl) {
    if (fvLogoEl) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { spHeaderLogoEl.classList.remove('logo--visible'); }
        else                           { spHeaderLogoEl.classList.add('logo--visible'); }
      }).observe(fvLogoEl);
    } else {
      spHeaderLogoEl.classList.add('logo--visible');
    }
  }

  /* ── フェードイン (IntersectionObserver) ── */
  var fadeEls = document.querySelectorAll('.fade-up');
  if (fadeEls.length && 'IntersectionObserver' in window) {
    var fadeObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    fadeEls.forEach(function (el) { fadeObs.observe(el); });
  } else {
    fadeEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ── SP: About画像が70%表示されたらカラーアップ ── */
  if (window.matchMedia('(max-width: 768px)').matches) {
    var aboutImagesEl = document.querySelector('.about__images');
    if (aboutImagesEl && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          document.querySelectorAll('.aimg img').forEach(function (img) {
            img.classList.add('color-in');
          });
        }
      }, { threshold: 0.7 }).observe(aboutImagesEl);
    }
  }

  /* ── FV カルーセル ──────────────────────────────────────── */
  var slides     = document.querySelectorAll('.slide');
  var dots       = document.querySelectorAll('.slide-dot');
  var counter    = document.getElementById('slideCounter');
  var slidesWrap = document.querySelector('.slideshow');
  if (!slides.length || !slidesWrap) return;

  /* touchリスナーは「動かない親要素」に付ける（iOS対策）
     slidesWrapはSP時translateXで移動するため、overflow:hiddenの外に出ると
     iOSがイベントバブリングを止める。clipElは常に静止している。 */
  var clipEl = slidesWrap.parentElement || slidesWrap; /* .fv__right */

  var total     = slides.length;
  var current   = 0;
  var autoTimer = null;
  var INTERVAL  = 5000;
  var THRESHOLD = 40;

  function isSP() { return window.innerWidth <= 768; }

  /* ── スライド切替 ─────────────────────────────────────── */
  function goTo(index) {
    var prevImg = slides[current].querySelector('img');
    if (prevImg) prevImg.style.animationPlayState = '';
    slides[current].classList.remove('active');
    if (dots[current]) dots[current].classList.remove('active');

    current = ((index % total) + total) % total;

    if (isSP()) {
      /* SP: translateXでスライド移動 */
      slidesWrap.style.transition = 'transform .5s ease';
      slidesWrap.style.transform  = 'translateX(-' + current * 100 + '%)';
    }
    /* PC: opacity/activeクラスで切り替え（translateXは使わない）*/

    if (dots[current]) dots[current].classList.add('active');
    if (counter) counter.querySelector('span').textContent = String(current + 1).padStart(2, '0');

    /* RAFでactiveを付与 → SP colorInアニメーションが確実にリスタート */
    var next = slides[current];
    requestAnimationFrame(function () { next.classList.add('active'); });
  }

  /* ── スワイプ追従（transition なし） ─────────────────── */
  function setTranslate(offsetX) {
    var w   = clipEl.offsetWidth || slidesWrap.offsetWidth || 1;
    var pct = -current * 100 + offsetX / w * 100;
    slidesWrap.style.transition = 'none';
    slidesWrap.style.transform  = 'translateX(' + pct + '%)';
  }

  /* ── ドット ──────────────────────────────────────────── */
  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () { stopAuto(); goTo(i); startAuto(); });
  });

  /* ── 自動スライド ─────────────────────────────────────── */
  function startAuto() {
    stopAuto();
    autoTimer = setInterval(function () { goTo(current + 1); }, INTERVAL);
  }
  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  /* ── SP タッチスワイプ ────────────────────────────────────────────
     touch-action: pan-y（CSS）でブラウザが縦横を振り分けるため、
     JS側で方向判定・e.preventDefault() は不要。
  ─────────────────────────────────────────────────────────────── */
  var touchStartX = 0;
  var touchDiffX  = 0;
  var isTouching  = false;

  clipEl.addEventListener('touchstart', function (e) {
    if (!isSP()) return;
    touchStartX = e.touches[0].clientX;
    touchDiffX  = 0;
    isTouching  = true;
    var img = slides[current] && slides[current].querySelector('img');
    if (img) img.style.animationPlayState = 'paused';
    stopAuto();
  }, { passive: true });

  clipEl.addEventListener('touchmove', function (e) {
    if (!isSP() || !isTouching) return;
    touchDiffX = e.touches[0].clientX - touchStartX;
    setTranslate(touchDiffX);
  }, { passive: true });

  clipEl.addEventListener('touchcancel', function () {
    if (!isSP() || !isTouching) return;
    isTouching = false;
    slidesWrap.style.transition = 'transform .3s ease';
    slidesWrap.style.transform  = 'translateX(-' + current * 100 + '%)';
    var img = slides[current] && slides[current].querySelector('img');
    if (img) img.style.animationPlayState = '';
    startAuto();
  });

  clipEl.addEventListener('touchend', function () {
    if (!isSP() || !isTouching) return;
    isTouching = false;
    if (Math.abs(touchDiffX) > THRESHOLD) {
      goTo(touchDiffX < 0 ? current + 1 : current - 1);
    } else {
      slidesWrap.style.transition = 'transform .3s ease';
      slidesWrap.style.transform  = 'translateX(-' + current * 100 + '%)';
      var img = slides[current] && slides[current].querySelector('img');
      if (img) img.style.animationPlayState = '';
    }
    startAuto();
  });

  /* ── リサイズ対応 ────────────────────────────────────── */
  window.addEventListener('resize', function () {
    if (isSP()) {
      slidesWrap.style.transition = 'none';
      slidesWrap.style.transform  = 'translateX(-' + current * 100 + '%)';
    } else {
      slidesWrap.style.transition = 'none';
      slidesWrap.style.transform  = '';
    }
  });

  /* ── 初期化 ──────────────────────────────────────────── */
  if (isSP()) { slidesWrap.style.transform = 'translateX(0%)'; }
  slides[0].classList.add('active');
  if (dots[0]) dots[0].classList.add('active');
  startAuto();

}());

/* ── ハンバーガーメニュー ──────────────────────────────────── */
(function () {
  var burger = document.getElementById('spBurger');
  var drawer = document.getElementById('spDrawer');
  if (!burger || !drawer) return;

  burger.addEventListener('click', function () {
    burger.classList.toggle('open');
    drawer.classList.toggle('open');
    document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
  });

  drawer.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      burger.classList.remove('open');
      drawer.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}());

/* ── サイドナビ アクティブ切り替え ────────────────────────── */
(function () {
  var links = document.querySelectorAll('.side-nav a');
  ['about', 'rooms', 'area', 'amenities', 'access'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        links.forEach(function (l) { l.classList.remove('active'); });
        var link = document.querySelector('.side-nav a[href="#' + id + '"]');
        if (link) link.classList.add('active');
      }
    }, { threshold: 0.4 }).observe(el);
  });
}());

/* ── AREAスポット フェードイン ─────────────────────────────── */
(function () {
  var spots = document.querySelectorAll('.area__spot');
  if (!spots.length) return;

  var spotObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        spotObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  var areaSection = document.getElementById('area');
  if (!areaSection) return;

  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) {
      spots.forEach(function (spot) { spotObs.observe(spot); });
    }
  }, { threshold: 0.2 }).observe(areaSection);
}());

/* ── 言語リンク アクティブ表示 ────────────────────────────── */
(function () {
  var path = window.location.pathname;
  document.querySelectorAll('.side-lang__list a').forEach(function (link) {
    var href = link.getAttribute('href');
    if (path.indexOf(href.replace(/^\//, '').replace(/\/$/, '')) !== -1) {
      link.classList.add('active');
    }
  });
}());

/* ── LANGUAGEアコーディオン ───────────────────────────────── */
(function () {
  var langBlock = document.querySelector('.side-lang');
  var langLabel = document.querySelector('.side-lang__label');
  if (!langBlock || !langLabel) return;

  langLabel.addEventListener('click', function () {
    langBlock.classList.toggle('open');
  });

  document.querySelectorAll('.side-lang__list a').forEach(function (link) {
    link.addEventListener('click', function () {
      langBlock.classList.remove('open');
    });
  });
}());
