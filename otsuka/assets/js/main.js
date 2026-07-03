/* ============================================================
   NEIGHBORS HOTEL TOKYO OTSUKA — main.js
   FVカルーセル: PC=タイマー自動送り / SP=タッチスワイプ横移動
   フェードイン: IntersectionObserver
   ============================================================ */

(function () {
  'use strict';

  /* ── サイドバー：FVロゴが見切れたら表示 / 客室ページは常時表示 ── */
  var fvLogoEl = document.querySelector('.fv__logo');
  var sideEl   = document.querySelector('.side');
  if (sideEl) {
    if (fvLogoEl) {
      var sideObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            sideEl.classList.remove('side--visible');
          } else {
            sideEl.classList.add('side--visible');
          }
        });
      });
      sideObs.observe(fvLogoEl);
    } else {
      /* FVロゴなし（客室詳細ページ等）→ 即時表示 */
      sideEl.classList.add('side--visible');
    }
  }

  /* ── SP: FVロゴが消えたらSPヘッダーロゴを表示 ── */
  var spHeaderLogoEl = document.querySelector('.sp-header__logo');
  if (spHeaderLogoEl) {
    if (fvLogoEl) {
      new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting) {
          spHeaderLogoEl.classList.remove('logo--visible');
        } else {
          spHeaderLogoEl.classList.add('logo--visible');
        }
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
      new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting) {
          document.querySelectorAll('.aimg img').forEach(function(img) {
            img.classList.add('color-in');
          });
        }
      }, { threshold: 0.7 }).observe(aboutImagesEl);
    }
  }

  /* ── FV カルーセル ──────────────────────────────────────── */
  var slides     = document.querySelectorAll('.fv__slide');
  var dots       = document.querySelectorAll('.slide-dot');
  var counter    = document.getElementById('slideCounter');
  var slidesWrap = document.getElementById('fvSlides');
  if (!slides.length || !slidesWrap) return;
  /* touchリスナーは「動かない親要素」に付ける（iOS対策）
     slidesWrapはtranslateXで移動するため、overflow:hiddenの外に出ると
     iOSがイベントバブリングを止める。clipElは常に静止している。 */
  var clipEl     = slidesWrap.parentElement || slidesWrap;

  var total     = slides.length;
  var current   = 0;
  var autoTimer = null;
  var INTERVAL  = 5000;
  var THRESHOLD = 40;

  function isSP() { return window.innerWidth <= 768; }

  /* ── スライド切替（SP/PC共通） ──────────────────────── */
  function goTo(index) {
    var prevImg = slides[current].querySelector('img');
    if (prevImg) prevImg.style.animationPlayState = '';
    slides[current].classList.remove('active');
    if (dots[current]) dots[current].classList.remove('active');

    current = ((index % total) + total) % total;

    slidesWrap.style.transition = isSP()
      ? 'transform .5s ease'
      : 'transform .8s cubic-bezier(.4,0,.2,1)';
    slidesWrap.style.transform = 'translateX(-' + current * 100 + '%)';

    if (dots[current]) dots[current].classList.add('active');
    if (counter) counter.querySelector('span').textContent = String(current + 1).padStart(2, '0');

    /* RAFでactiveを付与 → animation が確実にリスタートする */
    var next = slides[current];
    requestAnimationFrame(function () { next.classList.add('active'); });
  }

  /* ── ドラッグ中の追従（transition なし） ─────────── */
  function setTranslate(offsetX) {
    var w   = clipEl.offsetWidth || slidesWrap.offsetWidth || 1;
    var pct = -current * 100 + offsetX / w * 100;
    slidesWrap.style.transition = 'none';
    slidesWrap.style.transform  = 'translateX(' + pct + '%)';
  }

  /* ── ドット ─────────────────────────────────────── */
  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () { stopAuto(); goTo(i); startAuto(); });
  });

  /* ── 自動スライド ─────────────────────────────────── */
  function startAuto() {
    stopAuto();
    autoTimer = setInterval(function () { goTo(current + 1); }, INTERVAL);
  }
  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  /* ── SP タッチスワイプ ──────────────────────────────────────────
     touch-action: pan-y（CSS）でブラウザが縦/横を振り分けるため、
     JS側では方向判定・e.preventDefault() が不要。
     縦スクロール時はブラウザがtouchcancelを発行してくれる。
  ────────────────────────────────────────────────────────────── */
  var touchStartX = 0;
  var touchDiffX  = 0;
  var isTouching  = false;

  clipEl.addEventListener('touchstart', function (e) {
    if (!isSP()) return;
    touchStartX = e.touches[0].clientX;
    touchDiffX  = 0;
    isTouching  = true;
    /* カラーアップを一時停止してスワイプを優先 */
    var img = slides[current] && slides[current].querySelector('img');
    if (img) img.style.animationPlayState = 'paused';
    stopAuto();
  }, { passive: true });

  clipEl.addEventListener('touchmove', function (e) {
    if (!isSP() || !isTouching) return;
    touchDiffX = e.touches[0].clientX - touchStartX;
    setTranslate(touchDiffX);
  }, { passive: true });

  /* 縦スクロール等でブラウザがジェスチャーをキャンセルした場合 */
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
      /* スワイプキャンセル: 元位置に戻してアニメーション再開 */
      slidesWrap.style.transition = 'transform .3s ease';
      slidesWrap.style.transform  = 'translateX(-' + current * 100 + '%)';
      var img = slides[current] && slides[current].querySelector('img');
      if (img) img.style.animationPlayState = '';
    }
    startAuto();
  });

  /* ── PC マウスドラッグ ─────────────────────────── */
  var mouseStartX = 0;
  var mouseDiffX  = 0;
  var isDragging  = false;

  slidesWrap.addEventListener('mousedown', function (e) {
    if (isSP()) return;
    mouseStartX = e.clientX;
    mouseDiffX  = 0;
    isDragging  = true;
    stopAuto();
    slidesWrap.classList.add('is-dragging');
  });
  window.addEventListener('mousemove', function (e) {
    if (!isDragging || isSP()) return;
    mouseDiffX = e.clientX - mouseStartX;
  });
  window.addEventListener('mouseup', function () {
    if (!isDragging) return;
    isDragging = false;
    slidesWrap.classList.remove('is-dragging');
    if (Math.abs(mouseDiffX) > THRESHOLD) {
      goTo(mouseDiffX < 0 ? current + 1 : current - 1);
    }
    startAuto();
  });

  /* ── リサイズ対応 ────────────────────────────────── */
  window.addEventListener('resize', function () {
    slidesWrap.style.transition = 'none';
    slidesWrap.style.transform  = 'translateX(-' + current * 100 + '%)';
  });

  /* ── 初期化 ──────────────────────────────────────── */
  slidesWrap.style.transform = 'translateX(0%)';
  slides[0].classList.add('active');
  if (dots[0]) dots[0].classList.add('active');
  startAuto();

}());

/* ── AREAスポット フェードイン ───────────────────────────── */
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
