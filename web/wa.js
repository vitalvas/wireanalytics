(function() {
  'use strict';

  const STORAGE_KEY = 'wa_vid';
  const SESSION_KEY = 'wa_sid';
  const USER_ID_KEY = 'wa_uid';
  const AB_TEST_KEY = 'wa_ab';
  const SESSION_TIMEOUT = 30 * 60 * 1000;

  const config = {
    endpoint: null,
    siteId: null,
    privacyMode: false,
    crossSite: false,
    crossSiteDomain: null,
    userId: null,
    abTests: {}
  };

  function generateId() {
    return crypto.randomUUID();
  }

  function getCrossSiteCookie(name) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + '=')) {
        return cookie.substring(name.length + 1);
      }
    }
    return null;
  }

  function setCrossSiteCookie(name, value) {
    let cookieStr = name + '=' + value + ';path=/;max-age=31536000';

    if (config.crossSite && config.crossSiteDomain) {
      cookieStr += ';domain=' + config.crossSiteDomain + ';SameSite=None;Secure';
    } else {
      cookieStr += ';SameSite=Lax';
    }

    document.cookie = cookieStr;
  }

  function getVisitorId() {
    if (config.privacyMode) {
      return null;
    }

    let vid = null;

    if (config.crossSite) {
      vid = getCrossSiteCookie(STORAGE_KEY);
    } else {
      vid = localStorage.getItem(STORAGE_KEY);
    }

    if (!vid) {
      vid = generateId();
      if (!config.crossSite) {
        localStorage.setItem(STORAGE_KEY, vid);
      }
    }

    setCrossSiteCookie(STORAGE_KEY, vid);
    return vid;
  }

  function getSessionId() {
    if (config.privacyMode) {
      return null;
    }

    let session = sessionStorage.getItem(SESSION_KEY);
    let sid, lastActivity;

    if (session) {
      const parsed = JSON.parse(session);
      sid = parsed.sid;
      lastActivity = parsed.ts;

      if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        sid = generateId();
      }
    } else {
      sid = generateId();
    }

    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ sid: sid, ts: Date.now() }));
    return sid;
  }

  function getPerformanceData() {
    const perf = {};

    if (window.performance) {
      const timing = performance.getEntriesByType('navigation')[0];
      if (timing) {
        perf.dns = Math.round(timing.domainLookupEnd - timing.domainLookupStart);
        perf.tcp = Math.round(timing.connectEnd - timing.connectStart);
        perf.ttfb = Math.round(timing.responseStart - timing.requestStart);
        perf.download = Math.round(timing.responseEnd - timing.responseStart);
        perf.dom_interactive = Math.round(timing.domInteractive - timing.startTime);
        perf.dom_complete = Math.round(timing.domComplete - timing.startTime);
        perf.load = Math.round(timing.loadEventEnd - timing.startTime);
      }
    }

    return perf;
  }

  function getScreenData() {
    return {
      width: window.screen.width,
      height: window.screen.height,
      pixel_ratio: window.devicePixelRatio || 1,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      color_depth: window.screen.colorDepth
    };
  }

  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  function getConnectionInfo() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      return {
        type: conn.effectiveType || conn.type,
        downlink: conn.downlink,
        rtt: conn.rtt
      };
    }
    return null;
  }

  function getUtmParams() {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'];

    utmKeys.forEach(function(key) {
      const value = params.get(key);
      if (value) {
        utm[key.replace('utm_', '')] = value;
      }
    });

    if (Object.keys(utm).length > 0) {
      return utm;
    }
    return null;
  }

  function getScrollDepth() {
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    const viewportHeight = window.innerHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrolled = scrollTop + viewportHeight;

    return Math.min(100, Math.round((scrolled / docHeight) * 100));
  }

  const webVitals = {
    lcp: null,
    fid: null,
    cls: null,
    inp: null,
    ttfb: null,
    fcp: null
  };

  let clsValue = 0;
  let clsEntries = [];
  let inpValue = 0;
  let webVitalsSent = false;

  function observeWebVitals() {
    if (!window.PerformanceObserver) {
      return;
    }

    try {
      new PerformanceObserver(function(list) {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          webVitals.lcp = Math.round(lastEntry.startTime);
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {}

    try {
      new PerformanceObserver(function(list) {
        const entries = list.getEntries();
        entries.forEach(function(entry) {
          if (entry.processingStart > 0) {
            const delay = entry.processingStart - entry.startTime;
            if (webVitals.fid === null) {
              webVitals.fid = Math.round(delay);
            }
          }
        });
      }).observe({ type: 'first-input', buffered: true });
    } catch (e) {}

    try {
      new PerformanceObserver(function(list) {
        const entries = list.getEntries();
        entries.forEach(function(entry) {
          if (!entry.hadRecentInput) {
            const firstEntry = clsEntries[0];
            const lastEntry = clsEntries[clsEntries.length - 1];

            if (firstEntry && entry.startTime - lastEntry.startTime < 1000 && entry.startTime - firstEntry.startTime < 5000) {
              clsEntries.push(entry);
              clsValue += entry.value;
            } else {
              clsEntries = [entry];
              clsValue = entry.value;
            }

            if (webVitals.cls === null || clsValue > webVitals.cls) {
              webVitals.cls = Math.round(clsValue * 1000) / 1000;
            }
          }
        });
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (e) {}

    try {
      new PerformanceObserver(function(list) {
        const entries = list.getEntries();
        entries.forEach(function(entry) {
          if (entry.interactionId) {
            const duration = entry.duration;
            if (duration > inpValue) {
              inpValue = duration;
              webVitals.inp = Math.round(duration);
            }
          }
        });
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
    } catch (e) {}

    try {
      new PerformanceObserver(function(list) {
        const entries = list.getEntries();
        entries.forEach(function(entry) {
          if (entry.name === 'first-contentful-paint') {
            webVitals.fcp = Math.round(entry.startTime);
          }
        });
      }).observe({ type: 'paint', buffered: true });
    } catch (e) {}

    const navEntry = performance.getEntriesByType('navigation')[0];
    if (navEntry) {
      webVitals.ttfb = Math.round(navEntry.responseStart);
    }
  }

  function sendWebVitals() {
    if (webVitalsSent) {
      return;
    }

    const hasData = webVitals.lcp !== null || webVitals.fid !== null ||
                    webVitals.cls !== null || webVitals.inp !== null;
    if (!hasData) {
      return;
    }

    webVitalsSent = true;

    const data = collectBaseData('webvitals');
    data.web_vitals = {};

    if (webVitals.lcp !== null) data.web_vitals.lcp = webVitals.lcp;
    if (webVitals.fid !== null) data.web_vitals.fid = webVitals.fid;
    if (webVitals.cls !== null) data.web_vitals.cls = webVitals.cls;
    if (webVitals.inp !== null) data.web_vitals.inp = webVitals.inp;
    if (webVitals.ttfb !== null) data.web_vitals.ttfb = webVitals.ttfb;
    if (webVitals.fcp !== null) data.web_vitals.fcp = webVitals.fcp;

    send(data);
  }

  function getUserId() {
    if (config.privacyMode) {
      return null;
    }
    return config.userId || localStorage.getItem(USER_ID_KEY) || null;
  }

  function loadAbTests() {
    if (config.privacyMode) {
      return {};
    }
    try {
      const stored = localStorage.getItem(AB_TEST_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }

  function saveAbTests() {
    if (config.privacyMode) {
      return;
    }
    try {
      localStorage.setItem(AB_TEST_KEY, JSON.stringify(config.abTests));
    } catch (e) {}
  }

  function getAbTestVariant(testName, variants, weights) {
    if (config.abTests[testName]) {
      return config.abTests[testName];
    }

    let totalWeight = 0;
    const normalizedWeights = [];

    if (weights && weights.length === variants.length) {
      totalWeight = weights.reduce(function(sum, w) { return sum + w; }, 0);
      normalizedWeights.push.apply(normalizedWeights, weights);
    } else {
      totalWeight = variants.length;
      for (let i = 0; i < variants.length; i++) {
        normalizedWeights.push(1);
      }
    }

    const random = Math.random() * totalWeight;
    let cumulative = 0;
    let selectedVariant = variants[0];

    for (let i = 0; i < variants.length; i++) {
      cumulative += normalizedWeights[i];
      if (random < cumulative) {
        selectedVariant = variants[i];
        break;
      }
    }

    config.abTests[testName] = selectedVariant;
    saveAbTests();

    return selectedVariant;
  }

  function getActiveAbTests() {
    return Object.keys(config.abTests).length > 0 ? config.abTests : null;
  }

  function collectBaseData(eventType) {
    const data = {
      site_id: config.siteId,
      event: eventType,
      timestamp: new Date().toISOString(),
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      user_id: getUserId(),
      page: {
        url: window.location.href,
        path: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        title: document.title,
        referrer: document.referrer
      },
      browser: {
        user_agent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages ? Array.from(navigator.languages) : [navigator.language],
        cookies_enabled: navigator.cookieEnabled,
        do_not_track: navigator.doNotTrack === '1'
      },
      screen: getScreenData(),
      device: {
        type: getDeviceType(),
        touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        memory: navigator.deviceMemory,
        cores: navigator.hardwareConcurrency
      },
      timezone: {
        name: Intl.DateTimeFormat().resolvedOptions().timeZone,
        offset: new Date().getTimezoneOffset()
      }
    };

    const conn = getConnectionInfo();
    if (conn) {
      data.connection = conn;
    }

    const utm = getUtmParams();
    if (utm) {
      data.utm = utm;
    }

    const abTests = getActiveAbTests();
    if (abTests) {
      data.ab_tests = abTests;
    }

    return data;
  }

  function send(data) {
    if (!config.endpoint || !config.siteId) {
      return;
    }

    const payload = JSON.stringify(data);

    if (navigator.sendBeacon) {
      navigator.sendBeacon(config.endpoint, payload);
    } else {
      fetch(config.endpoint, {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      }).catch(function() {});
    }
  }

  function trackPageView() {
    const data = collectBaseData('pageview');

    if (document.readyState === 'complete') {
      data.performance = getPerformanceData();
      send(data);
    } else {
      window.addEventListener('load', function() {
        setTimeout(function() {
          data.performance = getPerformanceData();
          send(data);
        }, 0);
      });
    }
  }

  function isExternalLink(href) {
    if (!href) {
      return false;
    }
    try {
      const url = new URL(href, window.location.origin);
      return url.hostname !== window.location.hostname;
    } catch (e) {
      return false;
    }
  }

  function trackClick(event) {
    const target = event.target.closest('a, button, [data-wa-track]');
    if (!target) {
      return;
    }

    const isLink = target.tagName.toLowerCase() === 'a';
    const href = target.href || null;
    const isExternal = isLink && isExternalLink(href);

    const data = collectBaseData(isExternal ? 'outbound' : 'click');
    data.click = {
      tag: target.tagName.toLowerCase(),
      id: target.id || null,
      classes: target.className || null,
      text: (target.textContent || '').trim().substring(0, 100),
      href: href,
      x: event.clientX,
      y: event.clientY
    };

    if (isExternal) {
      try {
        const url = new URL(href);
        data.click.external_hostname = url.hostname;
        data.click.external_pathname = url.pathname;
      } catch (e) {}
    }

    const trackAttr = target.getAttribute('data-wa-track');
    if (trackAttr) {
      data.click.track = trackAttr;
    }

    send(data);
  }

  let maxScrollDepth = 0;
  let scrollTimeout = null;
  const scrollMilestones = [25, 50, 75, 100];
  const reachedMilestones = new Set();

  function trackScroll() {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    scrollTimeout = setTimeout(function() {
      const depth = getScrollDepth();
      if (depth > maxScrollDepth) {
        maxScrollDepth = depth;
      }

      scrollMilestones.forEach(function(milestone) {
        if (depth >= milestone && !reachedMilestones.has(milestone)) {
          reachedMilestones.add(milestone);
          trackScrollMilestone(milestone);
        }
      });
    }, 100);
  }

  function trackScrollMilestone(milestone) {
    const data = collectBaseData('scroll_milestone');
    data.scroll_milestone = {
      milestone: milestone,
      current_depth: getScrollDepth()
    };
    send(data);
  }

  function sendScrollDepth() {
    if (maxScrollDepth > 0) {
      const data = collectBaseData('scroll');
      data.scroll = {
        max_depth: maxScrollDepth,
        milestones_reached: Array.from(reachedMilestones).sort(function(a, b) { return a - b; })
      };
      send(data);
    }
  }

  function resetScrollMilestones() {
    reachedMilestones.clear();
    maxScrollDepth = 0;
  }

  let lastUrl = window.location.href;

  function trackSpaNavigation() {
    const currentUrl = window.location.href;
    if (currentUrl === lastUrl) {
      return;
    }

    const previousUrl = lastUrl;
    lastUrl = currentUrl;

    resetScrollMilestones();

    const data = collectBaseData('pageview');
    data.spa = {
      navigation: true,
      previous_url: previousUrl
    };
    send(data);
  }

  function setupSpaTracking() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
      originalPushState.apply(this, arguments);
      trackSpaNavigation();
    };

    history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      trackSpaNavigation();
    };

    window.addEventListener('popstate', trackSpaNavigation);
  }

  function parseStackTrace(stack) {
    if (!stack) {
      return [];
    }

    const lines = stack.split('\n').slice(0, 10);
    const frames = [];

    lines.forEach(function(line) {
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) ||
                    line.match(/at\s+(.+?):(\d+):(\d+)/) ||
                    line.match(/(.+?)@(.+?):(\d+):(\d+)/);

      if (match) {
        if (match.length === 5) {
          frames.push({
            func: match[1],
            file: match[2],
            line: parseInt(match[3], 10),
            col: parseInt(match[4], 10)
          });
        } else if (match.length === 4) {
          frames.push({
            func: '(anonymous)',
            file: match[1],
            line: parseInt(match[2], 10),
            col: parseInt(match[3], 10)
          });
        }
      }
    });

    return frames;
  }

  function trackError(message, source, lineno, colno, error) {
    const data = collectBaseData('error');
    data.error = {
      message: String(message).substring(0, 1000),
      type: error ? error.name : 'Error',
      source: source || null,
      line: lineno || null,
      column: colno || null
    };

    if (error && error.stack) {
      data.error.stack = parseStackTrace(error.stack);
    }

    send(data);
  }

  function trackUnhandledRejection(event) {
    const reason = event.reason;
    const data = collectBaseData('error');

    let message = 'Unhandled Promise Rejection';
    let stack = null;

    if (reason instanceof Error) {
      message = reason.message;
      stack = reason.stack;
    } else if (typeof reason === 'string') {
      message = reason;
    } else if (reason && typeof reason === 'object') {
      message = reason.message || JSON.stringify(reason).substring(0, 500);
    }

    data.error = {
      message: String(message).substring(0, 1000),
      type: reason instanceof Error ? reason.name : 'UnhandledRejection',
      source: null,
      line: null,
      column: null
    };

    if (stack) {
      data.error.stack = parseStackTrace(stack);
    }

    send(data);
  }

  function setupErrorTracking() {
    window.addEventListener('error', function(event) {
      if (event.target && (event.target.tagName === 'IMG' || event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
        trackResourceError(event);
      } else {
        trackError(event.message, event.filename, event.lineno, event.colno, event.error);
      }
    }, true);

    window.addEventListener('unhandledrejection', trackUnhandledRejection);
  }

  function trackResourceError(event) {
    const target = event.target;
    const tagName = target.tagName.toLowerCase();

    let resourceType = 'unknown';
    let resourceUrl = null;

    if (tagName === 'img') {
      resourceType = 'image';
      resourceUrl = target.src;
    } else if (tagName === 'script') {
      resourceType = 'script';
      resourceUrl = target.src;
    } else if (tagName === 'link') {
      resourceType = target.rel === 'stylesheet' ? 'stylesheet' : 'link';
      resourceUrl = target.href;
    }

    const data = collectBaseData('resource_error');
    data.resource = {
      type: resourceType,
      url: resourceUrl,
      tag: tagName
    };

    send(data);
  }

  function trackPrint() {
    const data = collectBaseData('print');
    send(data);
  }

  function setupPrintTracking() {
    if (window.matchMedia) {
      const mediaQueryList = window.matchMedia('print');
      mediaQueryList.addEventListener('change', function(event) {
        if (event.matches) {
          trackPrint();
        }
      });
    }

    window.addEventListener('beforeprint', trackPrint);
  }

  function trackCopy(event) {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString() : '';

    if (!selectedText) {
      return;
    }

    const data = collectBaseData('copy');
    data.copy = {
      text_length: selectedText.length,
      text_preview: selectedText.substring(0, 100)
    };

    send(data);
  }

  function setupCopyTracking() {
    document.addEventListener('copy', trackCopy);
  }

  const RAGE_CLICK_THRESHOLD = 3;
  const RAGE_CLICK_TIMEOUT = 1000;
  const RAGE_CLICK_RADIUS = 100;

  let rageClickCount = 0;
  let rageClickTimer = null;
  let lastClickX = 0;
  let lastClickY = 0;

  function detectRageClick(event) {
    const x = event.clientX;
    const y = event.clientY;

    const distance = Math.sqrt(Math.pow(x - lastClickX, 2) + Math.pow(y - lastClickY, 2));

    if (distance < RAGE_CLICK_RADIUS) {
      rageClickCount++;

      if (rageClickCount >= RAGE_CLICK_THRESHOLD) {
        trackRageClick(x, y, rageClickCount);
        rageClickCount = 0;
      }
    } else {
      rageClickCount = 1;
    }

    lastClickX = x;
    lastClickY = y;

    if (rageClickTimer) {
      clearTimeout(rageClickTimer);
    }

    rageClickTimer = setTimeout(function() {
      rageClickCount = 0;
    }, RAGE_CLICK_TIMEOUT);
  }

  function trackRageClick(x, y, count) {
    const element = document.elementFromPoint(x, y);

    const data = collectBaseData('rage_click');
    data.rage_click = {
      x: x,
      y: y,
      count: count,
      element: element ? {
        tag: element.tagName.toLowerCase(),
        id: element.id || null,
        classes: element.className || null
      } : null
    };

    send(data);
  }

  function setupRageClickTracking() {
    document.addEventListener('click', detectRageClick, true);
  }

  let pageLoadTime = Date.now();
  let activeTime = 0;
  let lastActiveTime = Date.now();
  let isPageActive = true;
  let timeOnPageSent = false;

  function updateActiveTime() {
    if (isPageActive) {
      const now = Date.now();
      activeTime += now - lastActiveTime;
      lastActiveTime = now;
    }
  }

  function handleVisibilityForTime() {
    updateActiveTime();
    isPageActive = document.visibilityState === 'visible';
    lastActiveTime = Date.now();
  }

  function handleUserActivity() {
    if (!isPageActive) {
      isPageActive = true;
      lastActiveTime = Date.now();
    }
  }

  function sendTimeOnPage() {
    if (timeOnPageSent) {
      return;
    }

    updateActiveTime();
    timeOnPageSent = true;

    const totalTime = Date.now() - pageLoadTime;

    const data = collectBaseData('time_on_page');
    data.time_on_page = {
      total_ms: totalTime,
      active_ms: activeTime,
      inactive_ms: totalTime - activeTime
    };

    send(data);
  }

  function setupTimeOnPageTracking() {
    document.addEventListener('visibilitychange', handleVisibilityForTime);

    ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(function(eventType) {
      document.addEventListener(eventType, handleUserActivity, { passive: true });
    });
  }

  let currentOrientation = window.screen.orientation ? window.screen.orientation.type : null;

  function trackOrientationChange() {
    const newOrientation = window.screen.orientation ? window.screen.orientation.type : null;
    if (newOrientation === currentOrientation) {
      return;
    }

    const previousOrientation = currentOrientation;
    currentOrientation = newOrientation;

    const data = collectBaseData('orientation_change');
    data.orientation = {
      previous: previousOrientation,
      current: newOrientation,
      angle: window.screen.orientation ? window.screen.orientation.angle : null
    };

    send(data);
  }

  function setupOrientationTracking() {
    if (window.screen.orientation) {
      window.screen.orientation.addEventListener('change', trackOrientationChange);
    } else {
      window.addEventListener('orientationchange', trackOrientationChange);
    }
  }

  let resizeTimeout = null;
  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;

  function trackResize() {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }

    resizeTimeout = setTimeout(function() {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      if (newWidth === lastWidth && newHeight === lastHeight) {
        return;
      }

      const data = collectBaseData('resize');
      data.resize = {
        previous_width: lastWidth,
        previous_height: lastHeight,
        current_width: newWidth,
        current_height: newHeight
      };

      lastWidth = newWidth;
      lastHeight = newHeight;

      send(data);
    }, 500);
  }

  function setupResizeTracking() {
    window.addEventListener('resize', trackResize, { passive: true });
  }

  function trackCspViolation(event) {
    const data = collectBaseData('csp_violation');
    data.csp = {
      blocked_uri: event.blockedURI,
      violated_directive: event.violatedDirective,
      effective_directive: event.effectiveDirective,
      original_policy: event.originalPolicy ? event.originalPolicy.substring(0, 500) : null,
      source_file: event.sourceFile,
      line_number: event.lineNumber,
      column_number: event.columnNumber
    };

    send(data);
  }

  function setupCspTracking() {
    document.addEventListener('securitypolicyviolation', trackCspViolation);
  }

  function setupLongTaskTracking() {
    if (!window.PerformanceObserver) {
      return;
    }

    try {
      new PerformanceObserver(function(list) {
        list.getEntries().forEach(function(entry) {
          if (entry.duration > 50) {
            const data = collectBaseData('long_task');
            data.long_task = {
              duration: Math.round(entry.duration),
              start_time: Math.round(entry.startTime),
              name: entry.name
            };

            if (entry.attribution && entry.attribution.length > 0) {
              data.long_task.attribution = {
                name: entry.attribution[0].name,
                container_type: entry.attribution[0].containerType,
                container_src: entry.attribution[0].containerSrc,
                container_id: entry.attribution[0].containerId,
                container_name: entry.attribution[0].containerName
              };
            }

            send(data);
          }
        });
      }).observe({ type: 'longtask', buffered: true });
    } catch (e) {}
  }

  const trackedImages = new WeakSet();

  function trackImageVisibility(entries, observer) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting && !trackedImages.has(entry.target)) {
        trackedImages.add(entry.target);

        const img = entry.target;
        const data = collectBaseData('image_visible');
        data.image = {
          src: img.src,
          alt: img.alt || null,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height
        };

        send(data);
        observer.unobserve(img);
      }
    });
  }

  function setupImageVisibilityTracking() {
    if (!window.IntersectionObserver) {
      return;
    }

    const observer = new IntersectionObserver(trackImageVisibility, {
      threshold: 0.5
    });

    function observeImages() {
      document.querySelectorAll('img[data-wa-track-visibility]').forEach(function(img) {
        if (!trackedImages.has(img)) {
          observer.observe(img);
        }
      });
    }

    observeImages();

    const mutationObserver = new MutationObserver(observeImages);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  const elementVisibilityData = new WeakMap();
  const trackedVisibilityElements = new WeakSet();

  function setupElementVisibilityDuration() {
    if (!window.IntersectionObserver) {
      return;
    }

    const observer = new IntersectionObserver(function(entries) {
      const now = Date.now();
      entries.forEach(function(entry) {
        const element = entry.target;
        let data = elementVisibilityData.get(element);

        if (!data) {
          data = {
            visibleTime: 0,
            lastVisible: null,
            firstSeen: null,
            selector: getVisibilityElementSelector(element)
          };
          elementVisibilityData.set(element, data);
        }

        if (entry.isIntersecting) {
          data.lastVisible = now;
          if (!data.firstSeen) {
            data.firstSeen = now;
          }
        } else if (data.lastVisible) {
          data.visibleTime += now - data.lastVisible;
          data.lastVisible = null;
        }
      });
    }, {
      threshold: [0, 0.25, 0.5, 0.75, 1.0]
    });

    function getVisibilityElementSelector(element) {
      let selector = element.tagName.toLowerCase();
      if (element.id) {
        selector += '#' + element.id;
      } else if (element.className && typeof element.className === 'string') {
        selector += '.' + element.className.split(' ').filter(Boolean).slice(0, 2).join('.');
      }
      const trackId = element.getAttribute('data-wa-track-duration');
      if (trackId) {
        selector = trackId;
      }
      return selector;
    }

    function observeElements() {
      document.querySelectorAll('[data-wa-track-duration]').forEach(function(element) {
        if (!trackedVisibilityElements.has(element)) {
          trackedVisibilityElements.add(element);
          observer.observe(element);
        }
      });
    }

    observeElements();

    const mutationObserver = new MutationObserver(observeElements);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    function sendVisibilityData() {
      const now = Date.now();
      document.querySelectorAll('[data-wa-track-duration]').forEach(function(element) {
        const data = elementVisibilityData.get(element);
        if (data && (data.visibleTime > 0 || data.lastVisible)) {
          let totalVisible = data.visibleTime;
          if (data.lastVisible) {
            totalVisible += now - data.lastVisible;
          }

          if (totalVisible > 100) {
            const eventData = collectBaseData('element_visibility');
            eventData.element_visibility = {
              selector: data.selector,
              visible_time_ms: Math.round(totalVisible),
              first_seen: data.firstSeen ? new Date(data.firstSeen).toISOString() : null
            };
            send(eventData);
          }
        }
      });
    }

    window.addEventListener('beforeunload', sendVisibilityData);
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') {
        sendVisibilityData();
      }
    });
  }

  function trackRightClick(event) {
    const target = event.target;

    const data = collectBaseData('right_click');
    data.right_click = {
      x: event.clientX,
      y: event.clientY,
      element: {
        tag: target.tagName.toLowerCase(),
        id: target.id || null,
        classes: target.className || null
      }
    };

    if (target.tagName === 'IMG') {
      data.right_click.image_src = target.src;
    } else if (target.tagName === 'A') {
      data.right_click.href = target.href;
    }

    send(data);
  }

  function setupRightClickTracking() {
    document.addEventListener('contextmenu', trackRightClick);
  }

  const replayBuffer = [];
  const REPLAY_BUFFER_SIZE = 50;
  const REPLAY_FLUSH_INTERVAL = 5000;
  let replayEnabled = false;
  let replayFlushTimer = null;
  let replaySessionId = null;

  function generateReplayId() {
    return crypto.randomUUID();
  }

  function getReplayTimestamp() {
    return Date.now();
  }

  function addReplayEvent(type, data) {
    if (!replayEnabled) {
      return;
    }

    replayBuffer.push({
      t: getReplayTimestamp(),
      type: type,
      data: data
    });

    if (replayBuffer.length >= REPLAY_BUFFER_SIZE) {
      flushReplayBuffer();
    }
  }

  function flushReplayBuffer() {
    if (replayBuffer.length === 0) {
      return;
    }

    const events = replayBuffer.splice(0, replayBuffer.length);
    const data = collectBaseData('replay');
    data.replay = {
      session_id: replaySessionId,
      events: events
    };

    send(data);
  }

  function trackReplayMouseMove(event) {
    addReplayEvent('mouse', {
      x: event.clientX,
      y: event.clientY
    });
  }

  function trackReplayClick(event) {
    addReplayEvent('click', {
      x: event.clientX,
      y: event.clientY,
      target: getElementSelector(event.target)
    });
  }

  function trackReplayScroll() {
    addReplayEvent('scroll', {
      x: window.scrollX,
      y: window.scrollY
    });
  }

  function trackReplayInput(event) {
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      const isPassword = target.type === 'password';
      addReplayEvent('input', {
        target: getElementSelector(target),
        value: isPassword ? '***' : (target.value || '').substring(0, 100)
      });
    }
  }

  function trackReplayResize() {
    addReplayEvent('resize', {
      w: window.innerWidth,
      h: window.innerHeight
    });
  }

  function getElementSelector(element) {
    if (!element || element === document.body) {
      return 'body';
    }

    let selector = element.tagName.toLowerCase();
    if (element.id) {
      selector += '#' + element.id;
    } else if (element.className && typeof element.className === 'string') {
      selector += '.' + element.className.split(' ').filter(Boolean).slice(0, 2).join('.');
    }

    return selector;
  }

  function captureInitialDOM() {
    addReplayEvent('snapshot', {
      url: window.location.href,
      title: document.title,
      viewport: {
        w: window.innerWidth,
        h: window.innerHeight
      },
      scroll: {
        x: window.scrollX,
        y: window.scrollY
      }
    });
  }

  function setupReplayMutationObserver() {
    if (!window.MutationObserver) {
      return;
    }

    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) {
              addReplayEvent('dom_add', {
                target: getElementSelector(mutation.target),
                node: node.tagName ? node.tagName.toLowerCase() : 'text'
              });
            }
          });
          mutation.removedNodes.forEach(function(node) {
            if (node.nodeType === 1) {
              addReplayEvent('dom_remove', {
                target: getElementSelector(mutation.target),
                node: node.tagName ? node.tagName.toLowerCase() : 'text'
              });
            }
          });
        } else if (mutation.type === 'attributes') {
          addReplayEvent('dom_attr', {
            target: getElementSelector(mutation.target),
            attr: mutation.attributeName
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'src', 'href', 'value', 'checked', 'disabled', 'hidden']
    });
  }

  function setupSessionReplay() {
    replayEnabled = true;
    replaySessionId = generateReplayId();

    captureInitialDOM();
    setupReplayMutationObserver();

    let mouseMoveThrottle = null;
    document.addEventListener('mousemove', function(event) {
      if (mouseMoveThrottle) return;
      mouseMoveThrottle = setTimeout(function() {
        mouseMoveThrottle = null;
        trackReplayMouseMove(event);
      }, 50);
    }, { passive: true });

    document.addEventListener('click', trackReplayClick, true);

    let scrollThrottle = null;
    window.addEventListener('scroll', function() {
      if (scrollThrottle) return;
      scrollThrottle = setTimeout(function() {
        scrollThrottle = null;
        trackReplayScroll();
      }, 100);
    }, { passive: true });

    document.addEventListener('input', trackReplayInput, true);
    window.addEventListener('resize', trackReplayResize, { passive: true });

    replayFlushTimer = setInterval(flushReplayBuffer, REPLAY_FLUSH_INTERVAL);

    window.addEventListener('beforeunload', flushReplayBuffer);
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') {
        flushReplayBuffer();
      }
    });
  }

  const DOWNLOAD_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', '7z', 'tar', 'gz', 'dmg', 'exe', 'msi', 'apk', 'ipa', 'csv', 'txt', 'rtf', 'mp3', 'mp4', 'avi', 'mov', 'wmv', 'svg', 'eps', 'ai', 'psd'];

  function isDownloadLink(href) {
    if (!href) {
      return false;
    }
    try {
      const url = new URL(href, window.location.origin);
      const ext = url.pathname.split('.').pop().toLowerCase();
      return DOWNLOAD_EXTENSIONS.includes(ext);
    } catch (e) {
      return false;
    }
  }

  function getFileInfo(href) {
    try {
      const url = new URL(href, window.location.origin);
      const pathname = url.pathname;
      const filename = pathname.split('/').pop();
      const ext = filename.split('.').pop().toLowerCase();
      return {
        url: href,
        filename: filename,
        extension: ext
      };
    } catch (e) {
      return { url: href, filename: null, extension: null };
    }
  }

  function trackDownloadClick(event) {
    const link = event.target.closest('a');
    if (!link || !link.href) {
      return;
    }

    if (!isDownloadLink(link.href)) {
      return;
    }

    const fileInfo = getFileInfo(link.href);
    const data = collectBaseData('download');
    data.download = fileInfo;

    send(data);
  }

  function setupDownloadTracking() {
    document.addEventListener('click', trackDownloadClick, true);
  }

  const trackedForms = new WeakSet();
  const formStartTimes = new WeakMap();
  const formFieldInteractions = new WeakMap();

  function getFormInfo(form) {
    return {
      id: form.id || null,
      name: form.name || null,
      action: form.action || null,
      method: form.method || 'get'
    };
  }

  function trackFormStart(form) {
    if (formStartTimes.has(form)) {
      return;
    }

    formStartTimes.set(form, Date.now());
    formFieldInteractions.set(form, new Set());

    const data = collectBaseData('form_start');
    data.form = getFormInfo(form);
    send(data);
  }

  function trackFormFieldInteraction(event) {
    const field = event.target;
    const form = field.form;
    if (!form) {
      return;
    }

    trackFormStart(form);

    const interactions = formFieldInteractions.get(form);
    if (interactions) {
      const fieldId = field.name || field.id || field.type;
      interactions.add(fieldId);
    }
  }

  function trackFormSubmit(event) {
    const form = event.target;
    if (!form || form.tagName !== 'FORM') {
      return;
    }

    const startTime = formStartTimes.get(form) || Date.now();
    const interactions = formFieldInteractions.get(form) || new Set();

    const data = collectBaseData('form_submit');
    data.form = getFormInfo(form);
    data.form.time_spent_ms = Date.now() - startTime;
    data.form.fields_interacted = interactions.size;

    send(data);

    formStartTimes.delete(form);
    formFieldInteractions.delete(form);
  }

  function trackFormAbandonment() {
    formStartTimes.forEach(function(startTime, form) {
      if (document.contains(form)) {
        const interactions = formFieldInteractions.get(form) || new Set();

        const data = collectBaseData('form_abandon');
        data.form = getFormInfo(form);
        data.form.time_spent_ms = Date.now() - startTime;
        data.form.fields_interacted = interactions.size;

        send(data);
      }
    });
  }

  function setupFormTracking() {
    document.addEventListener('focus', trackFormFieldInteraction, true);
    document.addEventListener('submit', trackFormSubmit, true);
    window.addEventListener('beforeunload', trackFormAbandonment);
  }

  let isOnline = navigator.onLine;
  let offlineStartTime = null;
  let totalOfflineTime = 0;

  function trackNetworkStatus(online) {
    const previousStatus = isOnline;
    isOnline = online;

    if (!online) {
      offlineStartTime = Date.now();
    } else if (offlineStartTime) {
      const offlineDuration = Date.now() - offlineStartTime;
      totalOfflineTime += offlineDuration;

      const data = collectBaseData('network_restored');
      data.network = {
        offline_duration_ms: offlineDuration,
        total_offline_time_ms: totalOfflineTime
      };
      send(data);

      offlineStartTime = null;
    }

    const data = collectBaseData(online ? 'online' : 'offline');
    data.network = {
      status: online ? 'online' : 'offline',
      connection: getConnectionInfo()
    };
    send(data);
  }

  function setupNetworkStatusTracking() {
    window.addEventListener('online', function() {
      trackNetworkStatus(true);
    });

    window.addEventListener('offline', function() {
      trackNetworkStatus(false);
    });

    if (!navigator.onLine) {
      offlineStartTime = Date.now();
    }
  }

  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };
  let consoleTrackingEnabled = false;

  function formatConsoleArgs(args) {
    return Array.from(args).map(function(arg) {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg).substring(0, 500);
        } catch (e) {
          return '[Object]';
        }
      }
      return String(arg).substring(0, 500);
    }).join(' ');
  }

  function trackConsoleMessage(level, args) {
    if (!consoleTrackingEnabled) return;

    const data = collectBaseData('console');
    data.console = {
      level: level,
      message: formatConsoleArgs(args),
      timestamp: Date.now()
    };

    send(data);
  }

  function setupConsoleTracking() {
    consoleTrackingEnabled = true;

    console.log = function() {
      trackConsoleMessage('log', arguments);
      originalConsole.log.apply(console, arguments);
    };

    console.info = function() {
      trackConsoleMessage('info', arguments);
      originalConsole.info.apply(console, arguments);
    };

    console.warn = function() {
      trackConsoleMessage('warn', arguments);
      originalConsole.warn.apply(console, arguments);
    };

    console.error = function() {
      trackConsoleMessage('error', arguments);
      originalConsole.error.apply(console, arguments);
    };

    console.debug = function() {
      trackConsoleMessage('debug', arguments);
      originalConsole.debug.apply(console, arguments);
    };
  }

  function stopConsoleTracking() {
    consoleTrackingEnabled = false;
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
  }

  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  let networkTrackingEnabled = false;

  function shouldTrackRequest(url) {
    if (!url) return false;
    try {
      const urlObj = new URL(url, window.location.origin);
      if (config.endpoint && urlObj.href.startsWith(config.endpoint)) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function trackNetworkRequest(method, url, status, duration, requestSize, responseSize, error) {
    if (!networkTrackingEnabled) return;

    const data = collectBaseData('network_request');
    data.network_request = {
      method: method,
      url: url ? url.substring(0, 500) : null,
      status: status,
      duration_ms: duration,
      request_size: requestSize,
      response_size: responseSize,
      error: error || null,
      timestamp: Date.now()
    };

    send(data);
  }

  function setupNetworkTracking() {
    networkTrackingEnabled = true;

    window.fetch = function(input, init) {
      const startTime = Date.now();
      const method = (init && init.method) ? init.method.toUpperCase() : 'GET';
      const url = typeof input === 'string' ? input : (input.url || String(input));

      if (!shouldTrackRequest(url)) {
        return originalFetch.apply(this, arguments);
      }

      const requestSize = (init && init.body) ? (init.body.length || 0) : 0;

      return originalFetch.apply(this, arguments).then(function(response) {
        const duration = Date.now() - startTime;
        const responseSize = parseInt(response.headers.get('content-length') || '0', 10);
        trackNetworkRequest(method, url, response.status, duration, requestSize, responseSize, null);
        return response;
      }).catch(function(error) {
        const duration = Date.now() - startTime;
        trackNetworkRequest(method, url, 0, duration, requestSize, 0, error.message);
        throw error;
      });
    };

    XMLHttpRequest.prototype.open = function(method, url) {
      this._waMethod = method ? method.toUpperCase() : 'GET';
      this._waUrl = url;
      this._waStartTime = null;
      return originalXHROpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
      const xhr = this;

      if (!shouldTrackRequest(xhr._waUrl)) {
        return originalXHRSend.apply(this, arguments);
      }

      xhr._waStartTime = Date.now();
      xhr._waRequestSize = body ? (body.length || 0) : 0;

      xhr.addEventListener('loadend', function() {
        if (xhr._waStartTime) {
          const duration = Date.now() - xhr._waStartTime;
          const responseSize = parseInt(xhr.getResponseHeader('content-length') || '0', 10);
          const error = xhr.status === 0 ? 'Network Error' : null;
          trackNetworkRequest(xhr._waMethod, xhr._waUrl, xhr.status, duration, xhr._waRequestSize, responseSize, error);
        }
      });

      return originalXHRSend.apply(this, arguments);
    };
  }

  function stopNetworkTracking() {
    networkTrackingEnabled = false;
    window.fetch = originalFetch;
    XMLHttpRequest.prototype.open = originalXHROpen;
    XMLHttpRequest.prototype.send = originalXHRSend;
  }

  function trackVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      sendScrollDepth();
      sendWebVitals();
      sendTimeOnPage();
    }
  }

  function getScriptOrigin(script) {
    if (script.src) {
      const url = new URL(script.src);
      return url.origin;
    }
    return window.location.origin;
  }

  function init() {
    const script = document.currentScript || document.querySelector('script[data-wa-site]');
    if (!script) {
      return;
    }

    const origin = getScriptOrigin(script);
    config.endpoint = script.getAttribute('data-wa-endpoint') || origin + '/api/v1/collect';
    config.siteId = script.getAttribute('data-wa-site') || window.location.hostname;
    config.privacyMode = script.hasAttribute('data-wa-privacy');
    config.crossSiteDomain = script.getAttribute('data-wa-cross-site') || ('.' + window.location.hostname.split('.').slice(-2).join('.'));
    config.crossSite = !script.hasAttribute('data-wa-no-cross-site');
    config.abTests = loadAbTests();

    observeWebVitals();
    setupSpaTracking();
    setupErrorTracking();
    setupPrintTracking();
    setupCopyTracking();
    setupRageClickTracking();
    setupTimeOnPageTracking();
    setupOrientationTracking();
    setupResizeTracking();
    setupCspTracking();
    setupLongTaskTracking();
    setupImageVisibilityTracking();
    setupElementVisibilityDuration();
    setupRightClickTracking();
    setupDownloadTracking();
    setupFormTracking();
    setupNetworkStatusTracking();
    trackPageView();

    document.addEventListener('click', trackClick, true);
    window.addEventListener('scroll', trackScroll, { passive: true });
    document.addEventListener('visibilitychange', trackVisibilityChange);
    window.addEventListener('beforeunload', function() {
      sendScrollDepth();
      sendWebVitals();
      sendTimeOnPage();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  window.wa = {
    track: function(eventName, eventData) {
      if (!eventName || typeof eventName !== 'string') {
        return;
      }

      const data = collectBaseData('custom');
      data.custom = {
        name: eventName,
        data: eventData || {}
      };

      send(data);
    },

    identify: function(userId) {
      if (config.privacyMode) {
        return;
      }

      config.userId = userId;
      if (userId) {
        localStorage.setItem(USER_ID_KEY, userId);
      } else {
        localStorage.removeItem(USER_ID_KEY);
      }

      const data = collectBaseData('identify');
      data.identify = {
        user_id: userId
      };
      send(data);
    },

    ab: {
      getVariant: function(testName, variants, weights) {
        if (!testName || !variants || !Array.isArray(variants) || variants.length < 2) {
          return null;
        }

        const variant = getAbTestVariant(testName, variants, weights);

        const data = collectBaseData('ab_test');
        data.ab_test = {
          test_name: testName,
          variant: variant,
          variants: variants
        };
        send(data);

        return variant;
      },

      setVariant: function(testName, variant) {
        if (!testName || !variant) {
          return;
        }

        config.abTests[testName] = variant;
        saveAbTests();

        const data = collectBaseData('ab_test');
        data.ab_test = {
          test_name: testName,
          variant: variant,
          forced: true
        };
        send(data);
      },

      getAll: function() {
        return Object.assign({}, config.abTests);
      },

      clear: function(testName) {
        if (testName) {
          delete config.abTests[testName];
        } else {
          config.abTests = {};
        }
        saveAbTests();
      }
    },

    ecommerce: {
      viewProduct: function(product) {
        const data = collectBaseData('ecommerce');
        data.ecommerce = {
          action: 'view_product',
          product: {
            id: product.id,
            name: product.name,
            category: product.category || null,
            price: product.price || null,
            currency: product.currency || null,
            brand: product.brand || null,
            variant: product.variant || null
          }
        };
        send(data);
      },

      addToCart: function(product, quantity) {
        const data = collectBaseData('ecommerce');
        data.ecommerce = {
          action: 'add_to_cart',
          product: {
            id: product.id,
            name: product.name,
            category: product.category || null,
            price: product.price || null,
            currency: product.currency || null,
            brand: product.brand || null,
            variant: product.variant || null
          },
          quantity: quantity || 1
        };
        send(data);
      },

      removeFromCart: function(product, quantity) {
        const data = collectBaseData('ecommerce');
        data.ecommerce = {
          action: 'remove_from_cart',
          product: {
            id: product.id,
            name: product.name,
            category: product.category || null,
            price: product.price || null,
            currency: product.currency || null
          },
          quantity: quantity || 1
        };
        send(data);
      },

      viewCart: function(products, total) {
        const data = collectBaseData('ecommerce');
        data.ecommerce = {
          action: 'view_cart',
          products: products.map(function(p) {
            return {
              id: p.id,
              name: p.name,
              price: p.price || null,
              quantity: p.quantity || 1
            };
          }),
          total: total || null
        };
        send(data);
      },

      beginCheckout: function(products, total) {
        const data = collectBaseData('ecommerce');
        data.ecommerce = {
          action: 'begin_checkout',
          products: products.map(function(p) {
            return {
              id: p.id,
              name: p.name,
              price: p.price || null,
              quantity: p.quantity || 1
            };
          }),
          total: total || null
        };
        send(data);
      },

      purchase: function(order) {
        const data = collectBaseData('ecommerce');
        data.ecommerce = {
          action: 'purchase',
          order: {
            id: order.id,
            total: order.total,
            currency: order.currency || null,
            tax: order.tax || null,
            shipping: order.shipping || null,
            discount: order.discount || null,
            coupon: order.coupon || null
          },
          products: (order.products || []).map(function(p) {
            return {
              id: p.id,
              name: p.name,
              price: p.price || null,
              quantity: p.quantity || 1
            };
          })
        };
        send(data);
      },

      refund: function(order) {
        const data = collectBaseData('ecommerce');
        data.ecommerce = {
          action: 'refund',
          order: {
            id: order.id,
            total: order.total || null
          },
          products: (order.products || []).map(function(p) {
            return {
              id: p.id,
              quantity: p.quantity || 1
            };
          })
        };
        send(data);
      }
    },

    replay: {
      start: function() {
        if (!replayEnabled) {
          setupSessionReplay();
        }
      },

      stop: function() {
        if (replayEnabled) {
          flushReplayBuffer();
          replayEnabled = false;
          if (replayFlushTimer) {
            clearInterval(replayFlushTimer);
            replayFlushTimer = null;
          }
        }
      },

      isActive: function() {
        return replayEnabled;
      }
    },

    console: {
      start: function() {
        if (!consoleTrackingEnabled) {
          setupConsoleTracking();
        }
      },

      stop: function() {
        stopConsoleTracking();
      },

      isActive: function() {
        return consoleTrackingEnabled;
      }
    },

    network: {
      start: function() {
        if (!networkTrackingEnabled) {
          setupNetworkTracking();
        }
      },

      stop: function() {
        stopNetworkTracking();
      },

      isActive: function() {
        return networkTrackingEnabled;
      }
    }
  };
})();
