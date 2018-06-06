if (typeof Influence === 'undefined') {
    /**
     * Constructs a new Influence  Analytics tracker.
     *
     * @constructor Influence
     *
     * @param options.tracker   The tracker to use for tracking events.
     *                          Must be: function(collection, event).
     *
     */
    var Influence = function(options) {
      if (!(this instanceof Influence)) return new Influence(config);
      /**
       * New InfluenceTracker()
       * @type {{tracker}|{}}
       */
      checkCampaignActive(options.trackingId, (err, res) => {

        if(err)
          return;
        if(res.isActive) {

          tracker = new InfluenceTracker(options.trackingId);

          /**
           * New InfluenceNotification()
           * @type {{Notifications}}
           */
          var notificationTimmer = setInterval( function () {
            if ( document.readyState !== 'complete' ) return;
            notifications = new Notifications(options.trackingId);
            this.notificationsInstance = notifications;
            clearInterval( notificationTimmer );
          }, 100 );

          options = options || {};

          this.options    = options;

          this.trackerInstance    = tracker;

          this.initialize();
        }
      });
    };

    (function(Influence) {
        Influence.prototype.options = function() {
            return this.options;
        };

        // Browser Detection
        var BrowserDetect = (function() {
            var BrowserDetect = {
                init: function () {
                    this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
                    this.version = this.searchVersion(navigator.userAgent) ||
                        this.searchVersion(navigator.appVersion) ||
                        "an unknown version";
                    this.OS = this.searchString(this.dataOS) || "an unknown OS";
                },
                searchString: function (data) {
                    for (var i=0;i<data.length;i++) {
                        var dataString = data[i].string;
                        var dataProp = data[i].prop;
                        this.versionSearchString = data[i].versionSearch || data[i].identity;
                        if (dataString) {
                            if (dataString.indexOf(data[i].subString) != -1)
                                return data[i].identity;
                        }
                        else if (dataProp)
                            return data[i].identity;
                    }
                },
                searchVersion: function (dataString) {
                    var index = dataString.indexOf(this.versionSearchString);
                    if (index == -1) return;
                    return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
                },
                dataBrowser: [
                    {
                        string: navigator.userAgent,
                        subString: "Chrome",
                        identity: "Chrome"
                    },
                    {   string: navigator.userAgent,
                        subString: "OmniWeb",
                        versionSearch: "OmniWeb/",
                        identity: "OmniWeb"
                    },
                    {
                        string: navigator.vendor,
                        subString: "Apple",
                        identity: "Safari",
                        versionSearch: "Version"
                    },
                    {
                        prop: window.opera,
                        identity: "Opera",
                        versionSearch: "Version"
                    },
                    {
                        string: navigator.vendor,
                        subString: "iCab",
                        identity: "iCab"
                    },
                    {
                        string: navigator.vendor,
                        subString: "KDE",
                        identity: "Konqueror"
                    },
                    {
                        string: navigator.userAgent,
                        subString: "Firefox",
                        identity: "Firefox"
                    },
                    {
                        string: navigator.vendor,
                        subString: "Camino",
                        identity: "Camino"
                    },
                    {   // for newer Netscapes (6+)
                        string: navigator.userAgent,
                        subString: "Netscape",
                        identity: "Netscape"
                    },
                    {
                        string: navigator.userAgent,
                        subString: "MSIE",
                        identity: "Explorer",
                        versionSearch: "MSIE"
                    },
                    {
                        string: navigator.userAgent,
                        subString: "Gecko",
                        identity: "Mozilla",
                        versionSearch: "rv"
                    },
                    {     // for older Netscapes (4-)
                        string: navigator.userAgent,
                        subString: "Mozilla",
                        identity: "Netscape",
                        versionSearch: "Mozilla"
                    }
                ],
                dataOS : [
                    {
                        string: navigator.platform,
                        subString: "Win",
                        identity: "Windows"
                    },
                    {
                        string: navigator.platform,
                        subString: "Mac",
                        identity: "Mac"
                    },
                    {
                        string: navigator.userAgent,
                        subString: "iPod",
                        identity: "iPod"
                    },
                    {
                        string: navigator.userAgent,
                        subString: "iPad",
                        identity: "iPad"
                    },
                    {
                        string: navigator.userAgent,
                        subString: "iPhone",
                        identity: "iPhone"
                    },
                    {
                        string: navigator.platform,
                        subString: "Linux",
                        identity: "Linux"
                    }
                ]

            };
            BrowserDetect.init();
            return BrowserDetect;})();

        var Geo = {};

        Geo.geoip = function(success, failure) {
          httpGetAsync('https://geoip.nekudo.com/api', (res) => {
            response = JSON.parse(res);
            if(response)
              success({
                  latitude:   response.location.latitude,
                  longitude:  response.location.longitude,
                  city: response.city,
                  country: response.country.name,
                  ip: response.ip
              });
            else
              failure;
          });
        };

        var Util = {};

        Util.copyFields = function(source, target) {
            var createDelegate = function(source, value) {
                return function() {
                    return value.apply(source, arguments);
                };
            };

            target = target || {};

            var key, value;

            for (key in source) {
                if (! /layerX|Y/.test(key)) {
                    value = source[key];

                    if (typeof value === 'function') {
                        // Bind functions to object being copied (???):
                        target[key] = createDelegate(source, value);
                    } else {
                        target[key] = value;
                    }
                }
            }

            return target;
        };

        Util.merge = function(o1, o2) {
            var r, key, index;
            if (o1 === undefined) return o1;
            else if (o2 === undefined) return o1;
            else if (o1 instanceof Array && o2 instanceof Array) {
                r = [];
                // Copy
                for (index = 0; index < o1.length; index++) {
                    r.push(o1[index]);
                }
                // Merge
                for (index = 0; index < o2.length; index++) {
                    if (r.length > index) {
                        r[index] = Util.merge(r[index], o2[index]);
                    } else {
                        r.push(o2[index]);
                    }
                }
                return r;
            } else if (o1 instanceof Object && o2 instanceof Object) {
                r = {};
                // Copy:
                for (key in o1) {
                    r[key] = o1[key];
                }
                // Merge:
                for (key in o2) {
                    if (r[key] !== undefined) {
                        r[key] = Util.merge(r[key], o2[key]);
                    } else {
                        r[key] = o2[key];
                    }
                }
                return r;
            } else {
                return o2;
            }
        };

        Util.toObject = function(olike) {
            var o = {}, key;

            for (key in olike) {
                o[key] = olike[key];
            }

            return o;
        };

        Util.genGuid = function() {
            var s4 = function() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            };

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        };

        Util.parseQueryString = function(qs) {
            var pairs = {};

            if (qs.length > 0) {
                var query = qs.charAt(0) === '?' ? qs.substring(1) : qs;

                if (query.length > 0) {
                    var vars = query.split('&');
                    for (var i = 0; i < vars.length; i++) {
                        if (vars[i].length > 0) {
                            var pair = vars[i].split('=');

                            try {
                                var name = decodeURIComponent(pair[0]);
                                var value = (pair.length > 1) ? decodeURIComponent(pair[1]) : 'true';

                                pairs[name] = value;
                            } catch (e) { }
                        }
                    }
                }
            }
            return pairs;
        };

        Util.unparseQueryString = function(qs) {
            var kvs = [], k, v;
            for (k in qs) {
                if (!qs.hasOwnProperty || qs.hasOwnProperty(k)) {
                    v = qs[k];

                    kvs.push(
                        encodeURIComponent(k) + '=' + encodeURIComponent(v)
                    );
                }
            }
            var string = kvs.join('&');

            if (string.length > 0) return '?' + string;
            else return '';
        };

        Util.size = function(v) {
            if (v === undefined) return 0;
            else if (v instanceof Array) return v.length;
            else if (v instanceof Object) {
                var size = 0;
                for (var key in v) {
                    if (!v.hasOwnProperty || v.hasOwnProperty(key)) ++size;
                }
                return size;
            } else return 1;
        };

        Util.mapJson = function(v, f) {
            var vp, vv;
            if (v instanceof Array) {
                vp = [];
                for (var i = 0; i < v.length; i++) {
                    vv = Util.mapJson(v[i], f);

                    if (Util.size(vv) > 0) vp.push(vv);
                }
                return vp;
            } else if (v instanceof Object) {
                vp = {};
                for (var k in v) {
                    vv = Util.mapJson(v[k], f);

                    if (Util.size(vv) > 0) vp[k] = vv;
                }
                return vp;
            } else return f(v);
        };

        Util.jsonify = function(v) {
            return Util.mapJson(v, function(v) {
                if (v === '') return undefined;
                else {
                    var r;
                    try {
                        r = JSON.parse(v);
                    } catch (e) {
                        r = v;
                    }

                    return r;
                }
            });
        };

        Util.undup = function(f, cutoff) {
            cutoff = cutoff || 250;

            var lastInvoked = 0;
            return function() {
                var curTime = (new Date()).getTime();
                var delta = curTime - lastInvoked;

                if (delta > cutoff) {
                    lastInvoked = curTime;

                    return f.apply(this, arguments);
                } else {
                    return undefined;
                }
            };
        };

        Util.parseUrl = function(url) {
            var l = document.createElement("a");
            l.href = url;
            if (l.host === '') {
                l.href = l.href;
            }
            return {
                hash:     l.hash,
                host:     l.host,
                hostname: l.hostname,
                pathname: l.pathname,
                protocol: l.protocol,
                query:    Util.parseQueryString(l.search)
            };
        };

        Util.unparseUrl = function(url) {
            return (url.protocol || '') +
                '//' +
                (url.host || '') +
                (url.pathname || '') +
                Util.unparseQueryString(url.query) +
                (url.hash || '');
        };

        Util.equals = function(v1, v2) {
            var leftEqualsObject = function(o1, o2) {
                for (var k in o1) {
                    if (!o1.hasOwnProperty || o1.hasOwnProperty(k)) {
                        if (!Util.equals(o1[k], o2[k])) return false;
                    }
                }
                return true;
            };

            if (v1 instanceof Array) {
                if (v2 instanceof Array) {
                    if (v1.length !== v2.length) return false;

                    for (var i = 0; i < v1.length; i++) {
                        if (!Util.equals(v1[i], v2[i])) {
                            return false;
                        }
                    }

                    return true;
                } else {
                    return false;
                }
            } else if (v1 instanceof Object) {
                if (v2 instanceof Object) {
                    return leftEqualsObject(v1, v2) && leftEqualsObject(v2, v1);
                } else {
                    return false;
                }
            } else {
                return v1 === v2;
            }
        };

        Util.isSamePage = function(url1, url2) {
            url1 = url1 instanceof String ? Util.parseUrl(url1) : url1;
            url2 = url2 instanceof String ? Util.parseUrl(url2) : url2;

            // Ignore the hash when comparing to see if two pages represent the same resource:
            return url1.protocol === url2.protocol &&
                url1.host     === url2.host &&
                url1.pathname === url2.pathname &&
                Util.equals(url1.query, url2.query);
        };

        Util.qualifyUrl = function(url) {
            var escapeHTML = function(s) {
                return s.split('&').join('&amp;').split('<').join('&lt;').split('"').join('&quot;');
            };

            var el= document.createElement('div');
            el.innerHTML= '<a href="'+escapeHTML(url)+'">x</a>';
            return el.firstChild.href;
        };

        Util.padLeft = function(n, p, c) {
            var pad_char = typeof c !== 'undefined' ? c : '0';
            var pad = new Array(1 + p).join(pad_char);
            return (pad + n).slice(-pad.length);
        };

        var DomUtil = {};

        DomUtil.getFormData = function(node) {
            var acc = {};

            var setField = function(name, value) {
                if (name === '') name = 'anonymous';

                var oldValue = acc[name];

                if (oldValue != null) {
                    if (oldValue instanceof Array) {
                        acc[name].push(value);
                    } else {
                        acc[name] = [oldValue, value];
                    }
                } else {
                    acc[name] = value;
                }
            };

            for (var i = 0; i < node.elements.length; i++) {
                var child = node.elements[i];
                var nodeType = child.tagName.toLowerCase();

                if (nodeType == 'input' || nodeType == 'textfield') {
                    // INPUT or TEXTFIELD element.
                    // Make sure auto-complete is not turned off for the field:
                    if ((child.getAttribute('autocomplete') || '').toLowerCase() !== 'off') {
                        // Make sure it's not a password:
                        if (child.type !== 'password') {
                            // Make sure it's not a radio or it's a checked radio:
                            if (child.type !== 'radio' || child.checked) {
                                setField(child.name, child.value);
                            }
                        }
                    }
                } else if (nodeType == 'select') {
                    // SELECT element:
                    var option = child.options[child.selectedIndex];

                    setField(child.name, option.value);
                }
            }

            return acc;
        };

        DomUtil.monitorElements = function(tagName, onnew, refresh) {
            refresh = refresh || 50;

            var checker = function() {
                var curElements = document.getElementsByTagName(tagName);

                for (var i = 0; i < curElements.length; i++) {
                    var el = curElements[i];

                    var scanned = el.getAttribute('influence_scanned');

                    if (!scanned) {
                        el.setAttribute('influence_scanned', true);
                        try {
                            onnew(el);
                        } catch (e) {
                            window.onerror(e);
                        }
                    }
                }

                setTimeout(checker, refresh);
            };

            setTimeout(checker, 0);
        };

        DomUtil.getDataset = function(node) {
            if (typeof node.dataset !== 'undefined') {
                return Util.toObject(node.dataset);
            } else if (node.attributes) {
                var dataset = {};

                var attrs = node.attributes;

                for (var i = 0; i < attrs.length; i++) {
                    var name = attrs[i].name;
                    var value = attrs[i].value;

                    if (name.indexOf('data-') === 0) {
                        name = name.substr('data-'.length);

                        dataset[name] = value;
                    }
                }

                return dataset;
            } else return {};
        };


        DomUtil.genCssSelector = function(node) {
            var sel = '';

            while (node != document.body) {
                var id = node.id;
                var classes = typeof node.className === 'string' ?
                    node.className.trim().split(/\s+/).join(".") : '';
                var tagName = node.nodeName.toLowerCase();

                if (id && id !== "") id = '#' + id;
                if (classes !== "") classes = '.' + classes;

                var prefix = tagName + id + classes;

                var parent = node.parentNode;

                var nthchild = 1;

                for (var i = 0; i < parent.childNodes.length; i++) {
                    if (parent.childNodes[i] === node) break;
                    else {
                        var childTagName = parent.childNodes[i].tagName;
                        if (childTagName !== undefined) {
                            nthchild = nthchild + 1;
                        }
                    }
                }

                if (sel !== '') sel = '>' + sel;

                sel = prefix + ':nth-child(' + nthchild + ')' + sel;

                node = parent;
            }

            return sel;
        };

        DomUtil.getNodeDescriptor = function(node) {
            return {
                id:         node.id,
                selector:   DomUtil.genCssSelector(node),
                title:      node.title === '' ? undefined : node.title,
                data:       DomUtil.getDataset(node)
            };
        };

        DomUtil.getAncestors = function(node) {
            var cur = node;
            var result = [];

            while (cur && cur !== document.body) {
                result.push(cur);
                cur = cur.parentNode;
            }

            return result;
        };

        DomUtil.simulateMouseEvent = function(element, eventName, options) {
            var eventMatchers = {
                'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
                'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
            };

            options = Util.merge({
                pointerX: 0,
                pointerY: 0,
                button: 0,
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                metaKey: false,
                bubbles: true,
                cancelable: true
            }, options || {});

            var oEvent, eventType = null;

            for (var name in eventMatchers) {
                if (eventMatchers[name].test(eventName)) { eventType = name; break; }
            }

            if (!eventType) throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');

            if (document.createEvent) {
                oEvent = document.createEvent(eventType);
                if (eventType === 'HTMLEvents') {
                    oEvent.initEvent(eventName, options.bubbles, options.cancelable);
                } else {
                    oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
                        options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
                        options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element
                    );
                }
                element.dispatchEvent(oEvent);
            } else {
                options.clientX = options.pointerX;
                options.clientY = options.pointerY;
                var evt = document.createEventObject();
                oEvent = Util.merge(evt, options);
                try {
                    element.fireEvent('on' + eventName, oEvent);
                } catch (error) {
                    // IE nonsense:
                    element.fireEvent('on' + eventName);
                }
            }
            return element;
        };

        var ArrayUtil = {};

        ArrayUtil.removeElement = function(array, from, to) {
            var tail = array.slice((to || from) + 1 || array.length);
            array.length = from < 0 ? array.length + from : from;
            return array.push.apply(array, tail);
        };

        ArrayUtil.toArray = function(alike) {
            var arr = [], i, len = alike.length;

            arr.length = alike.length;

            for (i = 0; i < len; i++) {
                arr[i] = alike[i];
            }

            return arr;
        };

        ArrayUtil.contains = function(array, el) {
            return ArrayUtil.exists(array, function(e){return e === el;});
        };

        ArrayUtil.diff = function(arr1, arr2) {
            var i, el, diff = [];
            for (i = 0; i < arr1.length; i++) {
                el = arr1[i];

                if (!ArrayUtil.contains(arr2, el)) diff.push(el);
            }
            return diff;
        };

        ArrayUtil.exists = function(array, f) {
            for (var i = 0; i < array.length; i++) {
                if (f(array[i])) return true;
            }
            return false;
        };

        ArrayUtil.map = function(array, f) {
            var r = [], i;
            for (i = 0; i < array.length; i++) {
                r.push(f(array[i]));
            }
            return r;
        };

        var Env = {};

        Env.getFingerprint = function() {
            var data = [
                JSON.stringify(Env.getPluginsData()),
                JSON.stringify(Env.getLocaleData()),
                navigator.userAgent.toString()
            ];

            return MD5.hash(data.join(""));
        };

        Env.getBrowserData = function() {
            var fingerprint = Env.getFingerprint();

            return ({
                ua:           navigator.userAgent,
                name:         BrowserDetect.browser,
                version:      BrowserDetect.version,
                platform:     BrowserDetect.OS,
                language:     navigator.language || navigator.userLanguage || navigator.systemLanguage,
                plugins:      Env.getPluginsData()
            });
        };

        Env.getUrlData = function() {
            var l = document.location;
            return ({
                hash:     l.hash,
                host:     l.host,
                hostname: l.hostname,
                pathname: l.pathname,
                protocol: l.protocol,
                query:    Util.parseQueryString(l.search)
            });
        };

        Env.getDocumentData = function() {
            return ({
                title:    document.title,
                referrer: document.referrer && Util.parseUrl(document.referrer) || undefined,
                url:      Env.getUrlData()
            });
        };

        Env.getScreenData = function() {
            return ({
                height: screen.height,
                width: screen.width,
                colorDepth: screen.colorDepth
            });
        };

        Env.getLocaleData = function() {
            // "Mon Apr 15 2013 12:21:35 GMT-0600 (MDT)"
            //
            var results = new RegExp('([A-Z]+-[0-9]+) \\(([A-Z]+)\\)').exec((new Date()).toString());

            var gmtOffset, timezone;

            if (results && results.length >= 3) {
                gmtOffset = results[1];
                timezone  = results[2];
            }

            return ({
                language: navigator.systemLanguage || navigator.userLanguage || navigator.language,
                timezoneOffset: (new Date()).getTimezoneOffset(),
                gmtOffset: gmtOffset,
                timezone:  timezone
            });
        };

        Env.getPageloadData = function() {
            var l = document.location;
            return {
                browser:  Env.getBrowserData(),
                document: Env.getDocumentData(),
                screen:   Env.getScreenData(),
                locale:   Env.getLocaleData()
            };
        };

        Env.getPluginsData = function() {
            var plugins = [];
            var p = navigator.plugins;
            for (var i = 0; i < p.length; i++) {
                var pi = p[i];
                plugins.push({
                    name:         pi.name,
                    description:  pi.description,
                    filename:     pi.filename,
                    version:      pi.version,
                    mimeType: (pi.length > 0) ? ({
                        type:         pi[0].type,
                        description:  pi[0].description,
                        suffixes:     pi[0].suffixes
                    }) : undefined
                });
            }
            return plugins;
        };

        var Handler = function() {
            this.handlers = [];
            this.onerror = (console && console.log) || window.onerror || (function(e) {});
        };

        Handler.prototype.push = function(f) {
            this.handlers.push(f);
        };

        Handler.prototype.dispatch = function() {
            var args = Array.prototype.slice.call(arguments, 0), i;

            for (i = 0; i < this.handlers.length; i++) {
                try {
                    this.handlers[i].apply(null, args);
                }
                catch (e) {
                    onerror(e);
                }
            }
        };

        var Events = {};

        Events.onready = function(f) {
            if (document.body != null) f();
            else setTimeout(function(){Events.onready(f);}, 10);
        };

        Events.onevent = function(el, type, capture, f_) {
            var fixup = function(f) {
                return function(e) {
                    if (!e) e = window.event;

                    // Perform a shallow clone (Firefox bugs):
                    e = Util.copyFields(e);

                    e.target    = e.target || e.srcElement;
                    e.keyCode   = e.keyCode || e.which || e.charCode;
                    e.which     = e.which || e.keyCode;
                    e.charCode  = (typeof e.which === "number") ? e.which : e.keyCode;
                    e.timeStamp = e.timeStamp || (new Date()).getTime();

                    if (e.target && e.target.nodeType == 3) e.target = e.target.parentNode;

                    var retVal;

                    if (!e.preventDefault) {
                        e.preventDefault = function() {
                            retVal = false;
                        };
                    }

                    return f(e) || retVal;
                };
            };

            var f = fixup(f_);

            if (el.addEventListener) {
                el.addEventListener(type, f, capture);
            } else if (el.attachEvent)  {
                el.attachEvent('on' + type, f);
            }
        };

        Events.onexit = (function() {
            var unloaded = false;

            var handler = new Handler();

            var handleUnload = function(e) {
                if (!unloaded) {
                    handler.dispatch(e);
                    unloaded = true;
                }
            };

            Events.onevent(window, 'unload', undefined, handleUnload);

            var replaceUnloader = function(obj) {
                var oldUnloader = obj.onunload || (function(e) {});

                obj.onunload = function(e) {
                    handleUnload();

                    oldUnloader(e);
                };
            };

            replaceUnloader(window);

            Events.onready(function() {
                replaceUnloader(document.body);
            });

            return function(f) {
                handler.push(f);
            };
        })();

        Events.onengage = (function() {
            var handler = new Handler();
            var events = [];

            Events.onready(function() {
                Events.onevent(document.body, 'mouseover', true, function(e) {
                    events.push(e);
                });

                Events.onevent(document.body, 'mouseout', true, function(end) {
                    var i, start;

                    for (i = events.length - 1; i >= 0; i--) {
                        if (events[i].target === end.target) {
                            start = events[i];
                            ArrayUtil.removeElement(events, i);
                            break;
                        }
                    }

                    if (start !== undefined) {
                        var delta = (end.timeStamp - start.timeStamp);

                        if (delta >= 1000 && delta <= 20000) {
                            handler.dispatch(start, end);
                        }
                    }
                });
            });

            return function(f) {
                handler.push(f);
            };
        })();

        Events.onhashchange = (function() {
            var handler = new Handler();
            var lastHash = document.location.hash;

            var dispatch = function(e) {
                var newHash = document.location.hash;

                if (lastHash != newHash) {
                    lastHash = newHash;

                    e.hash = newHash;

                    handler.dispatch(e);
                }
            };

            if (window.onhashchange) {
                Events.onevent(window, 'hashchange', false, dispatch);
            } else {
                setInterval(function() { dispatch({}); }, 25);
            }

            return function(f) {
                handler.push(f);
            };
        })();

        Events.onerror = (function() {
            var handler = new Handler();

            if (typeof window.onerror === 'function') handler.push(window.onerror);

            window.onerror = function(err, url, line) { handler.dispatch(err, url, line); };

            return function(f) {
                handler.push(f);
            };
        })();

        Events.onsubmit = (function() {
            var handler = new Handler();

            var handle = Util.undup(function(e) {
                handler.dispatch(e);
            });

            Events.onready(function() {
                Events.onevent(document.body, 'submit', true, function(e) {
                    handle(e);
                });

                // Intercept enter keypresses which will submit the form in most browsers.
                Events.onevent(document.body, 'keypress', false, function(e) {
                    if (e.keyCode == 13) {
                        var target = e.target;
                        var form = target.form;

                        if (form) {
                            e.form = form;
                            handle(e);
                        }
                    }
                });

                // Intercept clicks on any buttons:
                Events.onevent(document.body, 'click', false, function(e) {
                    var target = e.target;
                    var targetType = (target.type || '').toLowerCase();

                    if (target.form && (targetType === 'submit' || targetType === 'button')) {
                        e.form = target.form;
                        handle(e);
                    }
                });
            });

            return function(f) {
                handler.push(f);
            };
        })();

        /**
         * Initializes Influence. This is called internally by the constructor and does
         * not need to be called manually.
         */
        Influence.prototype.initialize = function() {
            var self = this;
            var notificationPath = [];
            this.options = Util.merge({
                bucket:           'none',
                breakoutUsers:    false,
                breakoutVisitors: false,
                waitOnTracker:    false,
                resolveGeo:       true,
                trackPageViews:   true,
                trackClicks:      true,
                trackHashChanges: true,
                trackEngagement:  true ,
                trackLinkClicks:  true,
                trackRedirects:   true,
                trackSubmissions: true
            }, this.options);

            var rulesUrl = 'https://strapi.useinfluence.co/rules/configuration/path/' + this.options.trackingId;
            httpGetAsync(rulesUrl, (res) => {
              response = JSON.parse(res);
              notificationPath = response.notificationPath;
              notificationPath = notificationPath.filter(notifPath => notifPath.type == 'lead');
              notificationPath = notificationPath.map(notifPath => notifPath.url);
            })

            // Always assume that Javascript is the culprit of leaving the page
            // (we'll detect and intercept clicks on links and buttons as best
            // as possible and override this assumption in these cases):
            this.javascriptRedirect = true;

            this.context = {};

            this.context.fingerprint = Env.getFingerprint();

            this.context.sessionId = (function() {
                var sessionId = sessionStorage.getItem('influence_sid') || Util.genGuid();

                sessionStorage.setItem('influence_sid', sessionId);

                return sessionId;
            })();

            this.context.visitorId = (function() {
                var visitorId = localStorage.getItem('influence_vid') || Util.genGuid();

                localStorage.setItem('influence_vid', visitorId);

                return visitorId;
            })();

            this.context.trackingId = this.options.trackingId;

            this.context.userId      = JSON.parse(localStorage.getItem('influence_uid')      || 'null');
            this.context.userProfile = JSON.parse(localStorage.getItem('influence_uprofile') || 'null');

            self.oldHash = document.location.hash;

            var trackJump = function(hash) {
                if (self.oldHash !== hash) { // Guard against tracking more than once
                    var id = hash.substring(1);

                    // If it's a real node, get it so we can capture node data:
                    var targetNode = document.getElementById(id);

                    var data = Util.merge({
                        url: Util.parseUrl(document.location)
                    }, targetNode ? DomUtil.getNodeDescriptor(targetNode) : {id: id});

                    self.track('jump', {
                        target: data,
                        source: {
                            url: Util.merge(Util.parseUrl(document.location), {
                                hash: self.oldHash // Override the hash
                            })
                        }
                    });

                    self.oldHash = hash;
                }
            };

            // Try to obtain geo location if possible:
            if(this.options.resolveGeo) {
                Geo.geoip(function(position) {
                    self.context.geo = position;
                });
            }

            // Track page view
            if(this.options.trackPageViews) {
                Events.onready(function() {
                    // Track page view, but only after the DOM has loaded:
                    self.pageview();
                });
            }

            // Track clicks
            if(this.options.trackClicks) {
                Events.onready(function() {
                    // Track all clicks to the document:
                    Events.onevent(document.body, 'click', true, function(e) {
                        var ancestors = DomUtil.getAncestors(e.target);

                        // Do not track clicks on links, these are tracked separately!
                        if (!ArrayUtil.exists(ancestors, function(e) { return e.tagName === 'A';})) {
                            self.track('click', {
                                target: DomUtil.getNodeDescriptor(e.target)
                            });
                        }
                    });
                });
            }

            // Track hash changes:
            if(this.options.trackHashChanges) {
                Events.onhashchange(function(e) {
                    trackJump(e.hash);
                });
            }

            //Set Tracking Id




            // Track all engagement:
            if(this.options.trackEngagement) {
                Events.onengage(function(start, end) {
                    self.track('engage', {
                        target:   DomUtil.getNodeDescriptor(start.target),
                        duration: end.timeStamp - start.timeStamp
                    });
                });
            }

            // Track all clicks on links:
            if(this.options.trackLinkClicks) {
                var that = this;
                DomUtil.monitorElements('a', function(el) {
                    Events.onevent(el, 'click', true, function(e) {
                        //return if this click it created with createEvent and not by a real click
                        if(!e.isTrusted) return;

                        var target = e.target;

                        // TODO: Make sure the link is actually to a page.
                        // It's a click, not a Javascript redirect:
                        self.javascriptRedirect = false;
                        setTimeout(function(){self.javascriptRedirect = true;}, 500);

                        var parsedUrl = Util.parseUrl(el.href);
                        var value = {target: Util.merge({url: parsedUrl}, DomUtil.getNodeDescriptor(target))};

                        if (Util.isSamePage(parsedUrl, document.location.href)) {
                            // User is jumping around the same page. Track here in case the
                            // client prevents the default action and the hash doesn't change
                            // (otherwise it would be tracked by onhashchange):
                            self.oldHash = undefined;

                            trackJump(document.location.hash);
                        } else if (parsedUrl.hostname === document.location.hostname) {
                            // We are linking to a page on the same site. There's no need to send
                            // the event now, we can safely send it later:
                            self.trackLater('click', value);
                        } else {
                            if(that.options.waitOnTracker) e.preventDefault();

                            // We are linking to a page that is not on this site. So we first
                            // wait to send the event before simulating a different click
                            // on the link. This ensures we don't lose the event if the user
                            // does not return to this site ever again.
                            self.track('click',
                                value,
                                function() {
                                    // It's a click, not a Javascript redirect:
                                    self.javascriptRedirect = false;

                                    // Simulate a click to the original element if we were waiting on the tracker:
                                    if(that.options.waitOnTracker) DomUtil.simulateMouseEvent(target, 'click');
                                }
                            );
                        }
                    });
                });
            }

            // Track JavaScript-based redirects, which can occur without warning:
            if(this.options.trackRedirects) {
                Events.onexit(function(e) {
                    if (self.javascriptRedirect) {
                        self.trackLater('redirect');
                    }
                });
            }

            // Track form submissions:
            if(this.options.trackSubmissions) {
              Events.onsubmit((e) => {
                if (e.form) {
                    if (!e.form.formId) {
                        e.form.formId = Util.genGuid();
                    }
                    self.trackLater('formsubmit', {
                        form: Util.merge({formId: e.form.formId}, DomUtil.getFormData(e.form))
                    });
                }
              });
            }


            // Track form abandonments:


            // Load and send any pending events:
            this._loadOutbox();
            this._sendOutbox();
        };

        /**
         * Retrieves the path where a certain category of data is stored.
         *
         * @memberof Influence
         *
         * @param type  A simple String describing the category of data, such as
         *              'profile' or 'events'.
         */
        Influence.prototype.getPath = function(type) {
            var now = new Date();
            var rootNode =  this.context.userId ? (this.options.breakoutUsers ? '/users/' + this.context.userId + '/' : '/users/') :
                (this.options.breakoutVisitors ? '/visitors/' + this.context.visitorId + '/' : '/visitors/');
            var dateNode;

            if (/daily|day/.test(this.options.bucket)) {
                dateNode = now.getUTCFullYear() + '-' + Util.padLeft(now.getUTCMonth(), 2) + '-' + Util.padLeft(now.getUTCDate(), 2) + '/';
            } else if (/month/.test(this.options.bucket)) {
                dateNode = now.getUTCFullYear() + '-' + Util.padLeft(now.getUTCMonth(), 2) + '/';
            } else if (/year/.test(this.options.bucket)) {
                dateNode = now.getUTCFullYear() + '/';
            } else {
                dateNode = '';
            }

            var targetNode = type + '/';

            return rootNode + dateNode + targetNode;
        };

        Influence.prototype._saveOutbox = function() {
            localStorage.setItem('influence_outbox', JSON.stringify(this.outbox));
        };

        Influence.prototype._loadOutbox = function() {
            this.outbox = JSON.parse(localStorage.getItem('influence_outbox') || '[]');
        };

        Influence.prototype._sendOutbox = function() {
            for (var i = 0; i < this.outbox.length; i++) {
                var message = this.outbox[i];

                var event = message.value.event;

                // Specially modify redirect, formSubmit events to save the new URL,
                // because the URL is not known at the time of the event:
                if (ArrayUtil.contains(['redirect', 'formSubmit'], event)) {
                    message.value.target = Util.jsonify(Util.merge(message.value.target || {}, {url: Util.parseUrl(document.location)}));
                }

                // If source and target urls are the same, change redirect events
                // to reload events:
                if (event === 'redirect') {
                    try {
                        // See if it's a redirect (= different url) or reload (= same url):
                        var sourceUrl = Util.unparseUrl(message.value.source.url);
                        var targetUrl = Util.unparseUrl(message.value.target.url);

                        if (sourceUrl === targetUrl) {
                            // It's a reload:
                            message.value.event = 'reload';
                        }
                    } catch (e) {
                        window.onerror && window.onerror(e);
                    }
                }

                try {
                    this.trackerInstance.tracker(message);
                } catch (e) {
                    // Don't let one bad apple spoil the batch.
                    window.onerror && window.onerror(e);
                }
            }
            this.outbox = [];
            this._saveOutbox();
        };

        /**
         * Identifies a user.
         *
         * @memberof Influence
         *
         * @param userId  The unique user id.
         * @param props   An arbitrary JSON object describing properties of the user.
         *
         */
        Influence.prototype.identify = function(userId, props, context, success, failure) {
            this.context.userId       = this.options.trackingId;
            this.context.userProfile  = props;

            localStorage.setItem('influence_uid',      JSON.stringify(userId));
            localStorage.setItem('influence_uprofile', JSON.stringify(props || {}));

            this.context = Util.merge(context || {}, this.context);

            this.trackerInstance.tracker({
                path:     this.getPath('profile'),
                value:    this._createEvent(undefined, props),
                op:       'replace',
                success:  success,
                failure:  failure
            });
        };

        /**
         * A utility function to create an event. Adds timestamp, stores the name
         * of the event and contextual data, and generates an idiomatic, trimmed
         * JSON objects that contains all event details.
         */
        Influence.prototype._createEvent = function(name, props) {
            props = props || {};

            props.timestamp = props.timestamp || (new Date()).toISOString();
            props.event     = name;
            props.source    = Util.merge({url: Util.parseUrl(document.location)}, props.source || {});

            return Util.jsonify(Util.merge(this.context, props));
        };

        /**
         * Tracks an event now.
         *
         * @memberof Influence
         *
         * @param name        The name of the event, such as 'downloaded trial'.
         * @param props       An arbitrary JSON object describing properties of the event.
         * @param callback    A function to call when the tracking is complete.
         *
         */
        Influence.prototype.track = function(name, props, success, failure) {
            this.trackerInstance.tracker({
                path:    this.getPath('events'),
                value:   this._createEvent(name, props),
                op:      'append',
                success: success,
                failure: failure
            });
        };

        /**
         * Tracks an event later. The event will only be tracked if the user visits
         * some page on the same domain that has Influence Analytics installed.
         *
         * This function is mainly useful when the user is leaving the page and
         * there is not enough time to capture some user behavior.
         *
         * @memberof Influence
         *
         * @param name        The name of the event, such as 'downloaded trial'.
         * @param props       An arbitrary JSON object describing properties of the event.
         *
         */
        Influence.prototype.trackLater = function(name, props) {
            this.outbox.push({
                path:    this.getPath('events'),
                value:   this._createEvent(name, props),
                op:      'append'
            });

            this._saveOutbox();
        };

        /**
         * Identifies the user as a member of some group.
         *
         * @memberof Influence
         *
         * @param groupId
         * @param props
         *
         */
        Influence.prototype.group = function(groupId, props, success, failure) {
            this.context.userGroupId      = groupId;
            this.context.userGroupProfile = props;

            this.context = Util.merge(context || {}, this.context);

            this.trackerInstance.tracker({
                path:     this.getPath('groups'),
                value:    this._createEvent(undefined, props),
                op:       'replace',
                success:  success,
                failure:  failure
            });
        };

        /**
         * Tracks a page view.
         *
         */
        Influence.prototype.pageview = function(url, success, failure) {
            url = url || document.location;

            this.track('pageview', Util.merge(Env.getPageloadData(), {url: Util.parseUrl(url + '')}), success, failure);
        };


        /**
         * MD5 Function
         */


        var MD5 = (typeof MD5 === 'undefined') ? {} : MD5;

        (function(MD5) {
            function md5cycle(x, k) {
                var a = x[0],
                    b = x[1],
                    c = x[2],
                    d = x[3];

                a = ff(a, b, c, d, k[0], 7, -680876936);
                d = ff(d, a, b, c, k[1], 12, -389564586);
                c = ff(c, d, a, b, k[2], 17, 606105819);
                b = ff(b, c, d, a, k[3], 22, -1044525330);
                a = ff(a, b, c, d, k[4], 7, -176418897);
                d = ff(d, a, b, c, k[5], 12, 1200080426);
                c = ff(c, d, a, b, k[6], 17, -1473231341);
                b = ff(b, c, d, a, k[7], 22, -45705983);
                a = ff(a, b, c, d, k[8], 7, 1770035416);
                d = ff(d, a, b, c, k[9], 12, -1958414417);
                c = ff(c, d, a, b, k[10], 17, -42063);
                b = ff(b, c, d, a, k[11], 22, -1990404162);
                a = ff(a, b, c, d, k[12], 7, 1804603682);
                d = ff(d, a, b, c, k[13], 12, -40341101);
                c = ff(c, d, a, b, k[14], 17, -1502002290);
                b = ff(b, c, d, a, k[15], 22, 1236535329);

                a = gg(a, b, c, d, k[1], 5, -165796510);
                d = gg(d, a, b, c, k[6], 9, -1069501632);
                c = gg(c, d, a, b, k[11], 14, 643717713);
                b = gg(b, c, d, a, k[0], 20, -373897302);
                a = gg(a, b, c, d, k[5], 5, -701558691);
                d = gg(d, a, b, c, k[10], 9, 38016083);
                c = gg(c, d, a, b, k[15], 14, -660478335);
                b = gg(b, c, d, a, k[4], 20, -405537848);
                a = gg(a, b, c, d, k[9], 5, 568446438);
                d = gg(d, a, b, c, k[14], 9, -1019803690);
                c = gg(c, d, a, b, k[3], 14, -187363961);
                b = gg(b, c, d, a, k[8], 20, 1163531501);
                a = gg(a, b, c, d, k[13], 5, -1444681467);
                d = gg(d, a, b, c, k[2], 9, -51403784);
                c = gg(c, d, a, b, k[7], 14, 1735328473);
                b = gg(b, c, d, a, k[12], 20, -1926607734);

                a = hh(a, b, c, d, k[5], 4, -378558);
                d = hh(d, a, b, c, k[8], 11, -2022574463);
                c = hh(c, d, a, b, k[11], 16, 1839030562);
                b = hh(b, c, d, a, k[14], 23, -35309556);
                a = hh(a, b, c, d, k[1], 4, -1530992060);
                d = hh(d, a, b, c, k[4], 11, 1272893353);
                c = hh(c, d, a, b, k[7], 16, -155497632);
                b = hh(b, c, d, a, k[10], 23, -1094730640);
                a = hh(a, b, c, d, k[13], 4, 681279174);
                d = hh(d, a, b, c, k[0], 11, -358537222);
                c = hh(c, d, a, b, k[3], 16, -722521979);
                b = hh(b, c, d, a, k[6], 23, 76029189);
                a = hh(a, b, c, d, k[9], 4, -640364487);
                d = hh(d, a, b, c, k[12], 11, -421815835);
                c = hh(c, d, a, b, k[15], 16, 530742520);
                b = hh(b, c, d, a, k[2], 23, -995338651);

                a = ii(a, b, c, d, k[0], 6, -198630844);
                d = ii(d, a, b, c, k[7], 10, 1126891415);
                c = ii(c, d, a, b, k[14], 15, -1416354905);
                b = ii(b, c, d, a, k[5], 21, -57434055);
                a = ii(a, b, c, d, k[12], 6, 1700485571);
                d = ii(d, a, b, c, k[3], 10, -1894986606);
                c = ii(c, d, a, b, k[10], 15, -1051523);
                b = ii(b, c, d, a, k[1], 21, -2054922799);
                a = ii(a, b, c, d, k[8], 6, 1873313359);
                d = ii(d, a, b, c, k[15], 10, -30611744);
                c = ii(c, d, a, b, k[6], 15, -1560198380);
                b = ii(b, c, d, a, k[13], 21, 1309151649);
                a = ii(a, b, c, d, k[4], 6, -145523070);
                d = ii(d, a, b, c, k[11], 10, -1120210379);
                c = ii(c, d, a, b, k[2], 15, 718787259);
                b = ii(b, c, d, a, k[9], 21, -343485551);

                x[0] = add32(a, x[0]);
                x[1] = add32(b, x[1]);
                x[2] = add32(c, x[2]);
                x[3] = add32(d, x[3]);

            }

            function cmn(q, a, b, x, s, t) {
                a = add32(add32(a, q), add32(x, t));
                return add32((a << s) | (a >>> (32 - s)), b);
            }

            function ff(a, b, c, d, x, s, t) {
                return cmn((b & c) | ((~b) & d), a, b, x, s, t);
            }

            function gg(a, b, c, d, x, s, t) {
                return cmn((b & d) | (c & (~d)), a, b, x, s, t);
            }

            function hh(a, b, c, d, x, s, t) {
                return cmn(b ^ c ^ d, a, b, x, s, t);
            }

            function ii(a, b, c, d, x, s, t) {
                return cmn(c ^ (b | (~d)), a, b, x, s, t);
            }

            function md51(s) {
                txt = '';
                var n = s.length,
                    state = [1732584193, -271733879, -1732584194, 271733878],
                    i;
                for (i = 64; i <= s.length; i += 64) {
                    md5cycle(state, md5blk(s.substring(i - 64, i)));
                }
                s = s.substring(i - 64);
                var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                for (i = 0; i < s.length; i++)
                    tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
                tail[i >> 2] |= 0x80 << ((i % 4) << 3);
                if (i > 55) {
                    md5cycle(state, tail);
                    for (i = 0; i < 16; i++) tail[i] = 0;
                }
                tail[14] = n * 8;
                md5cycle(state, tail);
                return state;
            }

            /* there needs to be support for Unicode here,
             * unless we pretend that we can redefine the MD-5
             * algorithm for multi-byte characters (perhaps
             * by adding every four 16-bit characters and
             * shortening the sum to 32 bits). Otherwise
             * I suggest performing MD-5 as if every character
             * was two bytes--e.g., 0040 0025 = @%--but then
             * how will an ordinary MD-5 sum be matched?
             * There is no way to standardize text to something
             * like UTF-8 before transformation; speed cost is
             * utterly prohibitive. The JavaScript standard
             * itself needs to look at this: it should start
             * providing access to strings as preformed UTF-8
             * 8-bit unsigned value arrays.
             */

            function md5blk(s) { /* I figured global was faster.   */
                var md5blks = [],
                    i; /* Andy King said do it this way. */
                for (i = 0; i < 64; i += 4) {
                    md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
                }
                return md5blks;
            }

            var hex_chr = '0123456789abcdef'.split('');

            function rhex(n) {
                var s = '',
                    j = 0;
                for (; j < 4; j++)
                    s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
                return s;
            }

            function hex(x) {
                for (var i = 0; i < x.length; i++)
                    x[i] = rhex(x[i]);
                return x.join('');
            }

            function md5(s) {
                return hex(md51(s));
            }

            /* this function is much faster,
            so if possible we use it. Some IEs
            are the only ones I know of that
            need the idiotic second function,
            generated by an if clause.  */

            function add32(a, b) {
                return (a + b) & 0xFFFFFFFF;
            }

            if (md5('hello') != '5d41402abc4b2a76b9719d911017c592') {
                function add32(x, y) {
                    var lsw = (x & 0xFFFF) + (y & 0xFFFF),
                        msw = (x >> 16) + (y >> 16) + (lsw >> 16);
                    return (msw << 16) | (lsw & 0xFFFF);
                }
            }

            MD5.hash = md5;
        })(MD5);


        /**
         *
         * Date Function
         */

        // Date shim:
        if (!Date.prototype.toISOString ) {
            (function() {
                function pad(number) {
                    var r = String(number);
                    if ( r.length === 1 ) {
                        r = '0' + r;
                    }
                    return r;
                }

                Date.prototype.toISOString = function() {
                    return this.getUTCFullYear() +
                        '-' + pad( this.getUTCMonth() + 1 ) +
                        '-' + pad( this.getUTCDate() ) +
                        'T' + pad( this.getUTCHours() ) +
                        ':' + pad( this.getUTCMinutes() ) +
                        ':' + pad( this.getUTCSeconds() ) +
                        '.' + String( (this.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 ) +
                        'Z';
                };
            }());
        }

        /**
         * /** HTML5 sessionStorage
         * @build       2009-08-20 23:35:12
         * @author      Andrea Giammarchi
         * @license     Mit Style License
         * @project     http://code.google.com/p/sessionstorage/
         */if(typeof sessionStorage==="undefined"){(function(j){var k=j;try{while(k!==k.top){k=k.top}}catch(i){}var f=(function(e,n){return{decode:function(o,p){return this.encode(o,p)},encode:function(y,u){for(var p=y.length,w=u.length,o=[],x=[],v=0,s=0,r=0,q=0,t;v<256;++v){x[v]=v}for(v=0;v<256;++v){s=(s+(t=x[v])+y.charCodeAt(v%p))%256;x[v]=x[s];x[s]=t}for(s=0;r<w;++r){v=r%256;s=(s+(t=x[v]))%256;p=x[v]=x[s];x[s]=t;o[q++]=e(u.charCodeAt(r)^x[(p+t)%256])}return o.join("")},key:function(q){for(var p=0,o=[];p<q;++p){o[p]=e(1+((n()*255)<<0))}return o.join("")}}})(j.String.fromCharCode,j.Math.random);var a=(function(n){function o(r,q,p){this._i=(this._data=p||"").length;if(this._key=q){this._storage=r}else{this._storage={_key:r||""};this._key="_key"}}o.prototype.c=String.fromCharCode(1);o.prototype._c=".";o.prototype.clear=function(){this._storage[this._key]=this._data};o.prototype.del=function(p){var q=this.get(p);if(q!==null){this._storage[this._key]=this._storage[this._key].replace(e.call(this,p,q),"")}};o.prototype.escape=n.escape;o.prototype.get=function(q){var s=this._storage[this._key],t=this.c,p=s.indexOf(q=t.concat(this._c,this.escape(q),t,t),this._i),r=null;if(-1<p){p=s.indexOf(t,p+q.length-1)+1;r=s.substring(p,p=s.indexOf(t,p));r=this.unescape(s.substr(++p,r))}return r};o.prototype.key=function(){var u=this._storage[this._key],v=this.c,q=v+this._c,r=this._i,t=[],s=0,p=0;while(-1<(r=u.indexOf(q,r))){t[p++]=this.unescape(u.substring(r+=2,s=u.indexOf(v,r)));r=u.indexOf(v,s)+2;s=u.indexOf(v,r);r=1+s+1*u.substring(r,s)}return t};o.prototype.set=function(p,q){this.del(p);this._storage[this._key]+=e.call(this,p,q)};o.prototype.unescape=n.unescape;function e(p,q){var r=this.c;return r.concat(this._c,this.escape(p),r,r,(q=this.escape(q)).length,r,q)}return o})(j);if(Object.prototype.toString.call(j.opera)==="[object Opera]"){history.navigationMode="compatible";a.prototype.escape=j.encodeURIComponent;a.prototype.unescape=j.decodeURIComponent}function l(){function r(){s.cookie=["sessionStorage="+j.encodeURIComponent(h=f.key(128))].join(";");g=f.encode(h,g);a=new a(k,"name",k.name)}var e=k.name,s=k.document,n=/\bsessionStorage\b=([^;]+)(;|$)/,p=n.exec(s.cookie),q;if(p){h=j.decodeURIComponent(p[1]);g=f.encode(h,g);a=new a(k,"name");for(var t=a.key(),q=0,o=t.length,u={};q<o;++q){if((p=t[q]).indexOf(g)===0){b.push(p);u[p]=a.get(p);a.del(p)}}a=new a.constructor(k,"name",k.name);if(0<(this.length=b.length)){for(q=0,o=b.length,c=a.c,p=[];q<o;++q){p[q]=c.concat(a._c,a.escape(t=b[q]),c,c,(t=a.escape(u[t])).length,c,t)}k.name+=p.join("")}}else{r();if(!n.exec(s.cookie)){b=null}}}l.prototype={length:0,key:function(e){if(typeof e!=="number"||e<0||b.length<=e){throw"Invalid argument"}return b[e]},getItem:function(e){e=g+e;if(d.call(m,e)){return m[e]}var n=a.get(e);if(n!==null){n=m[e]=f.decode(h,n)}return n},setItem:function(e,n){this.removeItem(e);e=g+e;a.set(e,f.encode(h,m[e]=""+n));this.length=b.push(e)},removeItem:function(e){var n=a.get(e=g+e);if(n!==null){delete m[e];a.del(e);this.length=b.remove(e)}},clear:function(){a.clear();m={};b.length=0}};var g=k.document.domain,b=[],m={},d=m.hasOwnProperty,h;b.remove=function(n){var e=this.indexOf(n);if(-1<e){this.splice(e,1)}return this.length};if(!b.indexOf){b.indexOf=function(o){for(var e=0,n=this.length;e<n;++e){if(this[e]===o){return e}}return -1}}if(k.sessionStorage){l=function(){};l.prototype=k.sessionStorage}l=new l;if(b!==null){j.sessionStorage=l}})(window)};


        /*!
* Nodeunit
* https://github.com/caolan/nodeunit
* Copyright (c) 2010 Caolan McMahon
* MIT Licensed
*
* json2.js
* http://www.JSON.org/json2.js
* Public Domain.
* NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
*/
        nodeunit = (function(){
            /*
                http://www.JSON.org/json2.js
                2010-11-17

                Public Domain.

                NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

                See http://www.JSON.org/js.html


                This code should be minified before deployment.
                See http://javascript.crockford.com/jsmin.html

                USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
                NOT CONTROL.


                This file creates a global JSON object containing two methods: stringify
                and parse.

                    JSON.stringify(value, replacer, space)
                        value       any JavaScript value, usually an object or array.

                        replacer    an optional parameter that determines how object
                                    values are stringified for objects. It can be a
                                    function or an array of strings.

                        space       an optional parameter that specifies the indentation
                                    of nested structures. If it is omitted, the text will
                                    be packed without extra whitespace. If it is a number,
                                    it will specify the number of spaces to indent at each
                                    level. If it is a string (such as '\t' or '&nbsp;'),
                                    it contains the characters used to indent at each level.

                        This method produces a JSON text from a JavaScript value.

                        When an object value is found, if the object contains a toJSON
                        method, its toJSON method will be called and the result will be
                        stringified. A toJSON method does not serialize: it returns the
                        value represented by the name/value pair that should be serialized,
                        or undefined if nothing should be serialized. The toJSON method
                        will be passed the key associated with the value, and this will be
                        bound to the value

                        For example, this would serialize Dates as ISO strings.

                            Date.prototype.toJSON = function (key) {
                                function f(n) {
                                    // Format integers to have at least two digits.
                                    return n < 10 ? '0' + n : n;
                                }

                                return this.getUTCFullYear()   + '-' +
                                     f(this.getUTCMonth() + 1) + '-' +
                                     f(this.getUTCDate())      + 'T' +
                                     f(this.getUTCHours())     + ':' +
                                     f(this.getUTCMinutes())   + ':' +
                                     f(this.getUTCSeconds())   + 'Z';
                            };

                        You can provide an optional replacer method. It will be passed the
                        key and value of each member, with this bound to the containing
                        object. The value that is returned from your method will be
                        serialized. If your method returns undefined, then the member will
                        be excluded from the serialization.

                        If the replacer parameter is an array of strings, then it will be
                        used to select the members to be serialized. It filters the results
                        such that only members with keys listed in the replacer array are
                        stringified.

                        Values that do not have JSON representations, such as undefined or
                        functions, will not be serialized. Such values in objects will be
                        dropped; in arrays they will be replaced with null. You can use
                        a replacer function to replace those with JSON values.
                        JSON.stringify(undefined) returns undefined.

                        The optional space parameter produces a stringification of the
                        value that is filled with line breaks and indentation to make it
                        easier to read.

                        If the space parameter is a non-empty string, then that string will
                        be used for indentation. If the space parameter is a number, then
                        the indentation will be that many spaces.

                        Example:

                        text = JSON.stringify(['e', {pluribus: 'unum'}]);
                        // text is '["e",{"pluribus":"unum"}]'


                        text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
                        // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

                        text = JSON.stringify([new Date()], function (key, value) {
                            return this[key] instanceof Date ?
                                'Date(' + this[key] + ')' : value;
                        });
                        // text is '["Date(---current time---)"]'


                    JSON.parse(text, reviver)
                        This method parses a JSON text to produce an object or array.
                        It can throw a SyntaxError exception.

                        The optional reviver parameter is a function that can filter and
                        transform the results. It receives each of the keys and values,
                        and its return value is used instead of the original value.
                        If it returns what it received, then the structure is not modified.
                        If it returns undefined then the member is deleted.

                        Example:

                        // Parse the text. Values that look like ISO date strings will
                        // be converted to Date objects.

                        myData = JSON.parse(text, function (key, value) {
                            var a;
                            if (typeof value === 'string') {
                                a =
            /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                                if (a) {
                                    return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                                        +a[5], +a[6]));
                                }
                            }
                            return value;
                        });

                        myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                            var d;
                            if (typeof value === 'string' &&
                                    value.slice(0, 5) === 'Date(' &&
                                    value.slice(-1) === ')') {
                                d = new Date(value.slice(5, -1));
                                if (d) {
                                    return d;
                                }
                            }
                            return value;
                        });


                This is a reference implementation. You are free to copy, modify, or
                redistribute.
            */

            /*jslint evil: true, strict: false, regexp: false */

            /*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
                call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
                getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
                lastIndex, length, parse, prototype, push, replace, slice, stringify,
                test, toJSON, toString, valueOf
            */


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

            var JSON = {};

            (function () {
                "use strict";

                function f(n) {
                    // Format integers to have at least two digits.
                    return n < 10 ? '0' + n : n;
                }

                if (typeof Date.prototype.toJSON !== 'function') {

                    Date.prototype.toJSON = function (key) {

                        return isFinite(this.valueOf()) ?
                            this.getUTCFullYear()   + '-' +
                            f(this.getUTCMonth() + 1) + '-' +
                            f(this.getUTCDate())      + 'T' +
                            f(this.getUTCHours())     + ':' +
                            f(this.getUTCMinutes())   + ':' +
                            f(this.getUTCSeconds())   + 'Z' : null;
                    };

                    String.prototype.toJSON =
                        Number.prototype.toJSON =
                            Boolean.prototype.toJSON = function (key) {
                                return this.valueOf();
                            };
                }

                var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
                    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
                    gap,
                    indent,
                    meta = {    // table of character substitutions
                        '\b': '\\b',
                        '\t': '\\t',
                        '\n': '\\n',
                        '\f': '\\f',
                        '\r': '\\r',
                        '"' : '\\"',
                        '\\': '\\\\'
                    },
                    rep;


                function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

                    escapable.lastIndex = 0;
                    return escapable.test(string) ?
                        '"' + string.replace(escapable, function (a) {
                            var c = meta[a];
                            return typeof c === 'string' ? c :
                                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                        }) + '"' :
                        '"' + string + '"';
                }


                function str(key, holder) {

// Produce a string from holder[key].

                    var i,          // The loop counter.
                        k,          // The member key.
                        v,          // The member value.
                        length,
                        mind = gap,
                        partial,
                        value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

                    if (value && typeof value === 'object' &&
                        typeof value.toJSON === 'function') {
                        value = value.toJSON(key);
                    }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

                    if (typeof rep === 'function') {
                        value = rep.call(holder, key, value);
                    }

// What happens next depends on the value's type.

                    switch (typeof value) {
                        case 'string':
                            return quote(value);

                        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

                            return isFinite(value) ? String(value) : 'null';

                        case 'boolean':
                        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

                            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

                        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

                            if (!value) {
                                return 'null';
                            }

// Make an array to hold the partial results of stringifying this object value.

                            gap += indent;
                            partial = [];

// Is the value an array?

                            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                                length = value.length;
                                for (i = 0; i < length; i += 1) {
                                    partial[i] = str(i, value) || 'null';
                                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                                v = partial.length === 0 ? '[]' :
                                    gap ? '[\n' + gap +
                                        partial.join(',\n' + gap) + '\n' +
                                        mind + ']' :
                                        '[' + partial.join(',') + ']';
                                gap = mind;
                                return v;
                            }

// If the replacer is an array, use it to select the members to be stringified.

                            if (rep && typeof rep === 'object') {
                                length = rep.length;
                                for (i = 0; i < length; i += 1) {
                                    k = rep[i];
                                    if (typeof k === 'string') {
                                        v = str(k, value);
                                        if (v) {
                                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                        }
                                    }
                                }
                            } else {

// Otherwise, iterate through all of the keys in the object.

                                for (k in value) {
                                    if (Object.hasOwnProperty.call(value, k)) {
                                        v = str(k, value);
                                        if (v) {
                                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                        }
                                    }
                                }
                            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

                            v = partial.length === 0 ? '{}' :
                                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                                    mind + '}' : '{' + partial.join(',') + '}';
                            gap = mind;
                            return v;
                    }
                }

// If the JSON object does not yet have a stringify method, give it one.

                if (typeof JSON.stringify !== 'function') {
                    JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

                        var i;
                        gap = '';
                        indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

                        if (typeof space === 'number') {
                            for (i = 0; i < space; i += 1) {
                                indent += ' ';
                            }

// If the space parameter is a string, it will be used as the indent string.

                        } else if (typeof space === 'string') {
                            indent = space;
                        }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

                        rep = replacer;
                        if (replacer && typeof replacer !== 'function' &&
                            (typeof replacer !== 'object' ||
                                typeof replacer.length !== 'number')) {
                            throw new Error('JSON.stringify');
                        }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

                        return str('', {'': value});
                    };
                }


// If the JSON object does not yet have a parse method, give it one.

                if (typeof JSON.parse !== 'function') {
                    JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

                        var j;

                        function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                            var k, v, value = holder[key];
                            if (value && typeof value === 'object') {
                                for (k in value) {
                                    if (Object.hasOwnProperty.call(value, k)) {
                                        v = walk(value, k);
                                        if (v !== undefined) {
                                            value[k] = v;
                                        } else {
                                            delete value[k];
                                        }
                                    }
                                }
                            }
                            return reviver.call(holder, key, value);
                        }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

                        text = String(text);
                        cx.lastIndex = 0;
                        if (cx.test(text)) {
                            text = text.replace(cx, function (a) {
                                return '\\u' +
                                    ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                            });
                        }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

                        if (/^[\],:{}\s]*$/
                                .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                                    .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                                    .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                            j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                            return typeof reviver === 'function' ?
                                walk({'': j}, '') : j;
                        }

// If the text is not JSON parseable, then a SyntaxError is thrown.

                        throw new SyntaxError('JSON.parse');
                    };
                }
            }());
            var assert = this.assert = {};
            var types = {};
            var core = {};
            var nodeunit = {};
            var reporter = {};
            /*global setTimeout: false, console: false */
            (function () {

                var async = {};

                // global on the server, window in the browser
                var root = this,
                    previous_async = root.async;

                if (typeof module !== 'undefined' && module.exports) {
                    module.exports = async;
                }
                else {
                    root.async = async;
                }

                async.noConflict = function () {
                    root.async = previous_async;
                    return async;
                };

                //// cross-browser compatiblity functions ////

                var _forEach = function (arr, iterator) {
                    if (arr.forEach) {
                        return arr.forEach(iterator);
                    }
                    for (var i = 0; i < arr.length; i += 1) {
                        iterator(arr[i], i, arr);
                    }
                };

                var _map = function (arr, iterator) {
                    if (arr.map) {
                        return arr.map(iterator);
                    }
                    var results = [];
                    _forEach(arr, function (x, i, a) {
                        results.push(iterator(x, i, a));
                    });
                    return results;
                };

                var _reduce = function (arr, iterator, memo) {
                    if (arr.reduce) {
                        return arr.reduce(iterator, memo);
                    }
                    _forEach(arr, function (x, i, a) {
                        memo = iterator(memo, x, i, a);
                    });
                    return memo;
                };

                var _keys = function (obj) {
                    if (Object.keys) {
                        return Object.keys(obj);
                    }
                    var keys = [];
                    for (var k in obj) {
                        if (obj.hasOwnProperty(k)) {
                            keys.push(k);
                        }
                    }
                    return keys;
                };

                var _indexOf = function (arr, item) {
                    if (arr.indexOf) {
                        return arr.indexOf(item);
                    }
                    for (var i = 0; i < arr.length; i += 1) {
                        if (arr[i] === item) {
                            return i;
                        }
                    }
                    return -1;
                };

                //// exported async module functions ////

                //// nextTick implementation with browser-compatible fallback ////
                if (typeof setImmediate === 'function') {
                    async.nextTick = function (fn) {
                        setImmediate(fn);
                    };
                }
                else if (typeof process !== 'undefined' && process.nextTick) {
                    async.nextTick = process.nextTick;
                }
                else {
                    async.nextTick = function (fn) {
                        setTimeout(fn, 0);
                    };
                }

                async.forEach = function (arr, iterator, callback) {
                    if (!arr.length) {
                        return callback();
                    }
                    var completed = 0;
                    _forEach(arr, function (x) {
                        iterator(x, function (err) {
                            if (err) {
                                callback(err);
                                callback = function () {};
                            }
                            else {
                                completed += 1;
                                if (completed === arr.length) {
                                    callback();
                                }
                            }
                        });
                    });
                };

                async.forEachSeries = function (arr, iterator, callback) {
                    if (!arr.length) {
                        return callback();
                    }
                    var completed = 0;
                    var iterate = function () {
                        iterator(arr[completed], function (err) {
                            if (err) {
                                callback(err);
                                callback = function () {};
                            }
                            else {
                                completed += 1;
                                if (completed === arr.length) {
                                    callback();
                                }
                                else {
                                    iterate();
                                }
                            }
                        });
                    };
                    iterate();
                };


                var doParallel = function (fn) {
                    return function () {
                        var args = Array.prototype.slice.call(arguments);
                        return fn.apply(null, [async.forEach].concat(args));
                    };
                };
                var doSeries = function (fn) {
                    return function () {
                        var args = Array.prototype.slice.call(arguments);
                        return fn.apply(null, [async.forEachSeries].concat(args));
                    };
                };


                var _asyncMap = function (eachfn, arr, iterator, callback) {
                    var results = [];
                    arr = _map(arr, function (x, i) {
                        return {index: i, value: x};
                    });
                    eachfn(arr, function (x, callback) {
                        iterator(x.value, function (err, v) {
                            results[x.index] = v;
                            callback(err);
                        });
                    }, function (err) {
                        callback(err, results);
                    });
                };
                async.map = doParallel(_asyncMap);
                async.mapSeries = doSeries(_asyncMap);


                // reduce only has a series version, as doing reduce in parallel won't
                // work in many situations.
                async.reduce = function (arr, memo, iterator, callback) {
                    async.forEachSeries(arr, function (x, callback) {
                        iterator(memo, x, function (err, v) {
                            memo = v;
                            callback(err);
                        });
                    }, function (err) {
                        callback(err, memo);
                    });
                };
                // inject alias
                async.inject = async.reduce;
                // foldl alias
                async.foldl = async.reduce;

                async.reduceRight = function (arr, memo, iterator, callback) {
                    var reversed = _map(arr, function (x) {
                        return x;
                    }).reverse();
                    async.reduce(reversed, memo, iterator, callback);
                };
                // foldr alias
                async.foldr = async.reduceRight;

                var _filter = function (eachfn, arr, iterator, callback) {
                    var results = [];
                    arr = _map(arr, function (x, i) {
                        return {index: i, value: x};
                    });
                    eachfn(arr, function (x, callback) {
                        iterator(x.value, function (v) {
                            if (v) {
                                results.push(x);
                            }
                            callback();
                        });
                    }, function (err) {
                        callback(_map(results.sort(function (a, b) {
                            return a.index - b.index;
                        }), function (x) {
                            return x.value;
                        }));
                    });
                };
                async.filter = doParallel(_filter);
                async.filterSeries = doSeries(_filter);
                // select alias
                async.select = async.filter;
                async.selectSeries = async.filterSeries;

                var _reject = function (eachfn, arr, iterator, callback) {
                    var results = [];
                    arr = _map(arr, function (x, i) {
                        return {index: i, value: x};
                    });
                    eachfn(arr, function (x, callback) {
                        iterator(x.value, function (v) {
                            if (!v) {
                                results.push(x);
                            }
                            callback();
                        });
                    }, function (err) {
                        callback(_map(results.sort(function (a, b) {
                            return a.index - b.index;
                        }), function (x) {
                            return x.value;
                        }));
                    });
                };
                async.reject = doParallel(_reject);
                async.rejectSeries = doSeries(_reject);

                var _detect = function (eachfn, arr, iterator, main_callback) {
                    eachfn(arr, function (x, callback) {
                        iterator(x, function (result) {
                            if (result) {
                                main_callback(x);
                            }
                            else {
                                callback();
                            }
                        });
                    }, function (err) {
                        main_callback();
                    });
                };
                async.detect = doParallel(_detect);
                async.detectSeries = doSeries(_detect);

                async.some = function (arr, iterator, main_callback) {
                    async.forEach(arr, function (x, callback) {
                        iterator(x, function (v) {
                            if (v) {
                                main_callback(true);
                                main_callback = function () {};
                            }
                            callback();
                        });
                    }, function (err) {
                        main_callback(false);
                    });
                };
                // any alias
                async.any = async.some;

                async.every = function (arr, iterator, main_callback) {
                    async.forEach(arr, function (x, callback) {
                        iterator(x, function (v) {
                            if (!v) {
                                main_callback(false);
                                main_callback = function () {};
                            }
                            callback();
                        });
                    }, function (err) {
                        main_callback(true);
                    });
                };
                // all alias
                async.all = async.every;

                async.sortBy = function (arr, iterator, callback) {
                    async.map(arr, function (x, callback) {
                        iterator(x, function (err, criteria) {
                            if (err) {
                                callback(err);
                            }
                            else {
                                callback(null, {value: x, criteria: criteria});
                            }
                        });
                    }, function (err, results) {
                        if (err) {
                            return callback(err);
                        }
                        else {
                            var fn = function (left, right) {
                                var a = left.criteria, b = right.criteria;
                                return a < b ? -1 : a > b ? 1 : 0;
                            };
                            callback(null, _map(results.sort(fn), function (x) {
                                return x.value;
                            }));
                        }
                    });
                };

                async.auto = function (tasks, callback) {
                    callback = callback || function () {};
                    var keys = _keys(tasks);
                    if (!keys.length) {
                        return callback(null);
                    }

                    var completed = [];

                    var listeners = [];
                    var addListener = function (fn) {
                        listeners.unshift(fn);
                    };
                    var removeListener = function (fn) {
                        for (var i = 0; i < listeners.length; i += 1) {
                            if (listeners[i] === fn) {
                                listeners.splice(i, 1);
                                return;
                            }
                        }
                    };
                    var taskComplete = function () {
                        _forEach(listeners, function (fn) {
                            fn();
                        });
                    };

                    addListener(function () {
                        if (completed.length === keys.length) {
                            callback(null);
                        }
                    });

                    _forEach(keys, function (k) {
                        var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
                        var taskCallback = function (err) {
                            if (err) {
                                callback(err);
                                // stop subsequent errors hitting callback multiple times
                                callback = function () {};
                            }
                            else {
                                completed.push(k);
                                taskComplete();
                            }
                        };
                        var requires = task.slice(0, Math.abs(task.length - 1)) || [];
                        var ready = function () {
                            return _reduce(requires, function (a, x) {
                                return (a && _indexOf(completed, x) !== -1);
                            }, true);
                        };
                        if (ready()) {
                            task[task.length - 1](taskCallback);
                        }
                        else {
                            var listener = function () {
                                if (ready()) {
                                    removeListener(listener);
                                    task[task.length - 1](taskCallback);
                                }
                            };
                            addListener(listener);
                        }
                    });
                };

                async.waterfall = function (tasks, callback) {
                    if (!tasks.length) {
                        return callback();
                    }
                    callback = callback || function () {};
                    var wrapIterator = function (iterator) {
                        return function (err) {
                            if (err) {
                                callback(err);
                                callback = function () {};
                            }
                            else {
                                var args = Array.prototype.slice.call(arguments, 1);
                                var next = iterator.next();
                                if (next) {
                                    args.push(wrapIterator(next));
                                }
                                else {
                                    args.push(callback);
                                }
                                async.nextTick(function () {
                                    iterator.apply(null, args);
                                });
                            }
                        };
                    };
                    wrapIterator(async.iterator(tasks))();
                };

                async.parallel = function (tasks, callback) {
                    callback = callback || function () {};
                    if (tasks.constructor === Array) {
                        async.map(tasks, function (fn, callback) {
                            if (fn) {
                                fn(function (err) {
                                    var args = Array.prototype.slice.call(arguments, 1);
                                    if (args.length <= 1) {
                                        args = args[0];
                                    }
                                    callback.call(null, err, args || null);
                                });
                            }
                        }, callback);
                    }
                    else {
                        var results = {};
                        async.forEach(_keys(tasks), function (k, callback) {
                            tasks[k](function (err) {
                                var args = Array.prototype.slice.call(arguments, 1);
                                if (args.length <= 1) {
                                    args = args[0];
                                }
                                results[k] = args;
                                callback(err);
                            });
                        }, function (err) {
                            callback(err, results);
                        });
                    }
                };

                async.series = function (tasks, callback) {
                    callback = callback || function () {};
                    if (tasks.constructor === Array) {
                        async.mapSeries(tasks, function (fn, callback) {
                            if (fn) {
                                fn(function (err) {
                                    var args = Array.prototype.slice.call(arguments, 1);
                                    if (args.length <= 1) {
                                        args = args[0];
                                    }
                                    callback.call(null, err, args || null);
                                });
                            }
                        }, callback);
                    }
                    else {
                        var results = {};
                        async.forEachSeries(_keys(tasks), function (k, callback) {
                            tasks[k](function (err) {
                                var args = Array.prototype.slice.call(arguments, 1);
                                if (args.length <= 1) {
                                    args = args[0];
                                }
                                results[k] = args;
                                callback(err);
                            });
                        }, function (err) {
                            callback(err, results);
                        });
                    }
                };

                async.iterator = function (tasks) {
                    var makeCallback = function (index) {
                        var fn = function () {
                            if (tasks.length) {
                                tasks[index].apply(null, arguments);
                            }
                            return fn.next();
                        };
                        fn.next = function () {
                            return (index < tasks.length - 1) ? makeCallback(index + 1): null;
                        };
                        return fn;
                    };
                    return makeCallback(0);
                };

                async.apply = function (fn) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    return function () {
                        return fn.apply(
                            null, args.concat(Array.prototype.slice.call(arguments))
                        );
                    };
                };

                var _concat = function (eachfn, arr, fn, callback) {
                    var r = [];
                    eachfn(arr, function (x, cb) {
                        fn(x, function (err, y) {
                            r = r.concat(y || []);
                            cb(err);
                        });
                    }, function (err) {
                        callback(err, r);
                    });
                };
                async.concat = doParallel(_concat);
                async.concatSeries = doSeries(_concat);

                async.whilst = function (test, iterator, callback) {
                    if (test()) {
                        iterator(function (err) {
                            if (err) {
                                return callback(err);
                            }
                            async.whilst(test, iterator, callback);
                        });
                    }
                    else {
                        callback();
                    }
                };

                async.until = function (test, iterator, callback) {
                    if (!test()) {
                        iterator(function (err) {
                            if (err) {
                                return callback(err);
                            }
                            async.until(test, iterator, callback);
                        });
                    }
                    else {
                        callback();
                    }
                };

                async.queue = function (worker, concurrency) {
                    var workers = 0;
                    var tasks = [];
                    var q = {
                        concurrency: concurrency,
                        push: function (data, callback) {
                            tasks.push({data: data, callback: callback});
                            async.nextTick(q.process);
                        },
                        process: function () {
                            if (workers < q.concurrency && tasks.length) {
                                var task = tasks.splice(0, 1)[0];
                                workers += 1;
                                worker(task.data, function () {
                                    workers -= 1;
                                    if (task.callback) {
                                        task.callback.apply(task, arguments);
                                    }
                                    q.process();
                                });
                            }
                        },
                        length: function () {
                            return tasks.length;
                        }
                    };
                    return q;
                };

                var _console_fn = function (name) {
                    return function (fn) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        fn.apply(null, args.concat([function (err) {
                            var args = Array.prototype.slice.call(arguments, 1);
                            if (typeof console !== 'undefined') {
                                if (err) {
                                    if (console.error) {
                                        console.error(err);
                                    }
                                }
                                else if (console[name]) {
                                    _forEach(args, function (x) {
                                        console[name](x);
                                    });
                                }
                            }
                        }]));
                    };
                };
                async.log = _console_fn('log');
                async.dir = _console_fn('dir');
                /*async.info = _console_fn('info');
                async.warn = _console_fn('warn');
                async.error = _console_fn('error');*/

                async.memoize = function (fn, hasher) {
                    var memo = {};
                    hasher = hasher || function (x) {
                        return x;
                    };
                    return function () {
                        var args = Array.prototype.slice.call(arguments);
                        var callback = args.pop();
                        var key = hasher.apply(null, args);
                        if (key in memo) {
                            callback.apply(null, memo[key]);
                        }
                        else {
                            fn.apply(null, args.concat([function () {
                                memo[key] = arguments;
                                callback.apply(null, arguments);
                            }]));
                        }
                    };
                };

            }());
            (function(exports){
                /**
                 * This file is based on the node.js assert module, but with some small
                 * changes for browser-compatibility
                 * THIS FILE SHOULD BE BROWSER-COMPATIBLE JS!
                 */


                /**
                 * Added for browser compatibility
                 */

                var _keys = function(obj){
                    if(Object.keys) return Object.keys(obj);
                    if (typeof obj != 'object' && typeof obj != 'function') {
                        throw new TypeError('-');
                    }
                    var keys = [];
                    for(var k in obj){
                        if(obj.hasOwnProperty(k)) keys.push(k);
                    }
                    return keys;
                };



// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


                var pSlice = Array.prototype.slice;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

                var assert = exports;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({message: message, actual: actual, expected: expected})

                assert.AssertionError = function AssertionError (options) {
                    this.name = "AssertionError";
                    this.message = options.message;
                    this.actual = options.actual;
                    this.expected = options.expected;
                    this.operator = options.operator;
                    var stackStartFunction = options.stackStartFunction || fail;

                    if (Error.captureStackTrace) {
                        Error.captureStackTrace(this, stackStartFunction);
                    }
                };
// code from util.inherits in node
                assert.AssertionError.super_ = Error;


// EDITED FOR BROWSER COMPATIBILITY: replaced Object.create call
// TODO: test what effect this may have
                var ctor = function () { this.constructor = assert.AssertionError; };
                ctor.prototype = Error.prototype;
                assert.AssertionError.prototype = new ctor();


                assert.AssertionError.prototype.toString = function() {
                    if (this.message) {
                        return [this.name+":", this.message].join(' ');
                    } else {
                        return [ this.name+":"
                            , JSON.stringify(this.expected )
                            , this.operator
                            , JSON.stringify(this.actual)
                        ].join(" ");
                    }
                };

// assert.AssertionError instanceof Error

                assert.AssertionError.__proto__ = Error.prototype;

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

                function fail(actual, expected, message, operator, stackStartFunction) {
                    throw new assert.AssertionError({
                        message: message,
                        actual: actual,
                        expected: expected,
                        operator: operator,
                        stackStartFunction: stackStartFunction
                    });
                }

// EXTENSION! allows for well behaved errors defined elsewhere.
                assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

                assert.ok = function ok(value, message) {
                    if (!!!value) fail(value, true, message, "==", assert.ok);
                };

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

                assert.equal = function equal(actual, expected, message) {
                    if (actual != expected) fail(actual, expected, message, "==", assert.equal);
                };

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

                assert.notEqual = function notEqual(actual, expected, message) {
                    if (actual == expected) {
                        fail(actual, expected, message, "!=", assert.notEqual);
                    }
                };

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

                assert.deepEqual = function deepEqual(actual, expected, message) {
                    if (!_deepEqual(actual, expected)) {
                        fail(actual, expected, message, "deepEqual", assert.deepEqual);
                    }
                };

                var Buffer = null;
                if (typeof require !== 'undefined' && typeof process !== 'undefined') {
                    try {
                        Buffer = require('buffer').Buffer;
                    }
                    catch (e) {
                        // May be a CommonJS environment other than Node.js
                        Buffer = null;
                    }
                }

                function _deepEqual(actual, expected) {
                    // 7.1. All identical values are equivalent, as determined by ===.
                    if (actual === expected) {
                        return true;
                        // 7.2. If the expected value is a Date object, the actual value is
                        // equivalent if it is also a Date object that refers to the same time.
                    } else if (actual instanceof Date && expected instanceof Date) {
                        return actual.getTime() === expected.getTime();

                        // 7.2.1 If the expcted value is a RegExp object, the actual value is
                        // equivalent if it is also a RegExp object that refers to the same source and options
                    } else if (actual instanceof RegExp && expected instanceof RegExp) {
                        return actual.source === expected.source &&
                            actual.global === expected.global &&
                            actual.ignoreCase === expected.ignoreCase &&
                            actual.multiline === expected.multiline;

                    } else if (Buffer && actual instanceof Buffer && expected instanceof Buffer) {
                        return (function() {
                            var i, len;

                            for (i = 0, len = expected.length; i < len; i++) {
                                if (actual[i] !== expected[i]) {
                                    return false;
                                }
                            }
                            return actual.length === expected.length;
                        })();
                        // 7.3. Other pairs that do not both pass typeof value == "object",
                        // equivalence is determined by ==.
                    } else if (typeof actual != 'object' && typeof expected != 'object') {
                        return actual == expected;

                        // 7.4. For all other Object pairs, including Array objects, equivalence is
                        // determined by having the same number of owned properties (as verified
                        // with Object.prototype.hasOwnProperty.call), the same set of keys
                        // (although not necessarily the same order), equivalent values for every
                        // corresponding key, and an identical "prototype" property. Note: this
                        // accounts for both named and indexed properties on Arrays.
                    } else {
                        return objEquiv(actual, expected);
                    }
                }

                function isUndefinedOrNull (value) {
                    return value === null || value === undefined;
                }

                function isArguments (object) {
                    return Object.prototype.toString.call(object) == '[object Arguments]';
                }

                function objEquiv (a, b) {
                    if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
                        return false;
                    // an identical "prototype" property.
                    if (a.prototype !== b.prototype) return false;
                    //~~~I've managed to break Object.keys through screwy arguments passing.
                    //   Converting to array solves the problem.
                    if (isArguments(a)) {
                        if (!isArguments(b)) {
                            return false;
                        }
                        a = pSlice.call(a);
                        b = pSlice.call(b);
                        return _deepEqual(a, b);
                    }
                    try{
                        var ka = _keys(a),
                            kb = _keys(b),
                            key, i;
                    } catch (e) {//happens when one is a string literal and the other isn't
                        return false;
                    }
                    // having the same number of owned properties (keys incorporates hasOwnProperty)
                    if (ka.length != kb.length)
                        return false;
                    //the same set of keys (although not necessarily the same order),
                    ka.sort();
                    kb.sort();
                    //~~~cheap key test
                    for (i = ka.length - 1; i >= 0; i--) {
                        if (ka[i] != kb[i])
                            return false;
                    }
                    //equivalent values for every corresponding key, and
                    //~~~possibly expensive deep test
                    for (i = ka.length - 1; i >= 0; i--) {
                        key = ka[i];
                        if (!_deepEqual(a[key], b[key] ))
                            return false;
                    }
                    return true;
                }

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

                assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
                    if (_deepEqual(actual, expected)) {
                        fail(actual, expected, message, "notDeepEqual", assert.notDeepEqual);
                    }
                };

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

                assert.strictEqual = function strictEqual(actual, expected, message) {
                    if (actual !== expected) {
                        fail(actual, expected, message, "===", assert.strictEqual);
                    }
                };

// 10. The strict non-equality assertion tests for strict inequality, as determined by !==.
// assert.notStrictEqual(actual, expected, message_opt);

                assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
                    if (actual === expected) {
                        fail(actual, expected, message, "!==", assert.notStrictEqual);
                    }
                };

                function expectedException(actual, expected) {
                    if (!actual || !expected) {
                        return false;
                    }

                    if (expected instanceof RegExp) {
                        return expected.test(actual.message || actual);
                    } else if (actual instanceof expected) {
                        return true;
                    } else if (expected.call({}, actual) === true) {
                        return true;
                    }

                    return false;
                }

                function _throws(shouldThrow, block, expected, message) {
                    var actual;

                    if (typeof expected === 'string') {
                        message = expected;
                        expected = null;
                    }

                    try {
                        block();
                    } catch (e) {
                        actual = e;
                    }

                    message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
                        (message ? ' ' + message : '.');

                    if (shouldThrow && !actual) {
                        fail('Missing expected exception' + message);
                    }

                    if (!shouldThrow && expectedException(actual, expected)) {
                        fail('Got unwanted exception' + message);
                    }

                    if ((shouldThrow && actual && expected &&
                            !expectedException(actual, expected)) || (!shouldThrow && actual)) {
                        throw actual;
                    }
                }

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

                assert.throws = function(block, /*optional*/error, /*optional*/message) {
                    _throws.apply(this, [true].concat(pSlice.call(arguments)));
                };

// EXTENSION! This is annoying to write outside this module.
                assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
                    _throws.apply(this, [false].concat(pSlice.call(arguments)));
                };

                assert.ifError = function (err) { if (err) {throw err;}};
            })(assert);
            (function(exports){
                /*!
                 * Nodeunit
                 * Copyright (c) 2010 Caolan McMahon
                 * MIT Licensed
                 *
                 * THIS FILE SHOULD BE BROWSER-COMPATIBLE JS!
                 * Only code on that line will be removed, it's mostly to avoid requiring code
                 * that is node specific
                 */

                /**
                 * Module dependencies
                 */



                /**
                 * Creates assertion objects representing the result of an assert call.
                 * Accepts an object or AssertionError as its argument.
                 *
                 * @param {object} obj
                 * @api public
                 */

                exports.assertion = function (obj) {
                    return {
                        method: obj.method || '',
                        message: obj.message || (obj.error && obj.error.message) || '',
                        error: obj.error,
                        passed: function () {
                            return !this.error;
                        },
                        failed: function () {
                            return Boolean(this.error);
                        }
                    };
                };

                /**
                 * Creates an assertion list object representing a group of assertions.
                 * Accepts an array of assertion objects.
                 *
                 * @param {Array} arr
                 * @param {Number} duration
                 * @api public
                 */

                exports.assertionList = function (arr, duration) {
                    var that = arr || [];
                    that.failures = function () {
                        var failures = 0;
                        for (var i = 0; i < this.length; i += 1) {
                            if (this[i].failed()) {
                                failures += 1;
                            }
                        }
                        return failures;
                    };
                    that.passes = function () {
                        return that.length - that.failures();
                    };
                    that.duration = duration || 0;
                    return that;
                };

                /**
                 * Create a wrapper function for assert module methods. Executes a callback
                 * after it's complete with an assertion object representing the result.
                 *
                 * @param {Function} callback
                 * @api private
                 */

                var assertWrapper = function (callback) {
                    return function (new_method, assert_method, arity) {
                        return function () {
                            var message = arguments[arity - 1];
                            var a = exports.assertion({method: new_method, message: message});
                            try {
                                assert[assert_method].apply(null, arguments);
                            }
                            catch (e) {
                                a.error = e;
                            }
                            callback(a);
                        };
                    };
                };

                /**
                 * Creates the 'test' object that gets passed to every test function.
                 * Accepts the name of the test function as its first argument, followed by
                 * the start time in ms, the options object and a callback function.
                 *
                 * @param {String} name
                 * @param {Number} start
                 * @param {Object} options
                 * @param {Function} callback
                 * @api public
                 */

                exports.test = function (name, start, options, callback) {
                    var expecting;
                    var a_list = [];

                    var wrapAssert = assertWrapper(function (a) {
                        a_list.push(a);
                        if (options.log) {
                            async.nextTick(function () {
                                options.log(a);
                            });
                        }
                    });

                    var test = {
                        done: function (err) {
                            if (expecting !== undefined && expecting !== a_list.length) {
                                var e = new Error(
                                    'Expected ' + expecting + ' assertions, ' +
                                    a_list.length + ' ran'
                                );
                                var a1 = exports.assertion({method: 'expect', error: e});
                                a_list.push(a1);
                                if (options.log) {
                                    async.nextTick(function () {
                                        options.log(a1);
                                    });
                                }
                            }
                            if (err) {
                                var a2 = exports.assertion({error: err});
                                a_list.push(a2);
                                if (options.log) {
                                    async.nextTick(function () {
                                        options.log(a2);
                                    });
                                }
                            }
                            var end = new Date().getTime();
                            async.nextTick(function () {
                                var assertion_list = exports.assertionList(a_list, end - start);
                                options.testDone(name, assertion_list);
                                callback(null, a_list);
                            });
                        },
                        ok: wrapAssert('ok', 'ok', 2),
                        same: wrapAssert('same', 'deepEqual', 3),
                        equals: wrapAssert('equals', 'equal', 3),
                        expect: function (num) {
                            expecting = num;
                        },
                        _assertion_list: a_list
                    };
                    // add all functions from the assert module
                    for (var k in assert) {
                        if (assert.hasOwnProperty(k)) {
                            test[k] = wrapAssert(k, k, assert[k].length);
                        }
                    }
                    return test;
                };

                /**
                 * Ensures an options object has all callbacks, adding empty callback functions
                 * if any are missing.
                 *
                 * @param {Object} opt
                 * @return {Object}
                 * @api public
                 */

                exports.options = function (opt) {
                    var optionalCallback = function (name) {
                        opt[name] = opt[name] || function () {};
                    };

                    optionalCallback('moduleStart');
                    optionalCallback('moduleDone');
                    optionalCallback('testStart');
                    optionalCallback('testDone');
                    //optionalCallback('log');

                    // 'done' callback is not optional.

                    return opt;
                };
            })(types);
            (function(exports){
                /*!
                 * Nodeunit
                 * Copyright (c) 2010 Caolan McMahon
                 * MIT Licensed
                 *
                 * THIS FILE SHOULD BE BROWSER-COMPATIBLE JS!
                 * Only code on that line will be removed, it's mostly to avoid requiring code
                 * that is node specific
                 */

                /**
                 * Module dependencies
                 */



                /**
                 * Added for browser compatibility
                 */

                var _keys = function (obj) {
                    if (Object.keys) {
                        return Object.keys(obj);
                    }
                    var keys = [];
                    for (var k in obj) {
                        if (obj.hasOwnProperty(k)) {
                            keys.push(k);
                        }
                    }
                    return keys;
                };


                var _copy = function (obj) {
                    var nobj = {};
                    var keys = _keys(obj);
                    for (var i = 0; i <  keys.length; i += 1) {
                        nobj[keys[i]] = obj[keys[i]];
                    }
                    return nobj;
                };


                /**
                 * Runs a test function (fn) from a loaded module. After the test function
                 * calls test.done(), the callback is executed with an assertionList as its
                 * second argument.
                 *
                 * @param {String} name
                 * @param {Function} fn
                 * @param {Object} opt
                 * @param {Function} callback
                 * @api public
                 */

                exports.runTest = function (name, fn, opt, callback) {
                    var options = types.options(opt);

                    options.testStart(name);
                    var start = new Date().getTime();
                    var test = types.test(name, start, options, callback);

                    try {
                        fn(test);
                    }
                    catch (e) {
                        test.done(e);
                    }
                };

                /**
                 * Takes an object containing test functions or other test suites as properties
                 * and runs each in series. After all tests have completed, the callback is
                 * called with a list of all assertions as the second argument.
                 *
                 * If a name is passed to this function it is prepended to all test and suite
                 * names that run within it.
                 *
                 * @param {String} name
                 * @param {Object} suite
                 * @param {Object} opt
                 * @param {Function} callback
                 * @api public
                 */

                exports.runSuite = function (name, suite, opt, callback) {
                    suite = wrapGroup(suite);
                    var keys = _keys(suite);

                    async.concatSeries(keys, function (k, cb) {
                        var prop = suite[k], _name;

                        _name = name ? [].concat(name, k) : [k];
                        _name.toString = function () {
                            // fallback for old one
                            return this.join(' - ');
                        };

                        if (typeof prop === 'function') {
                            var in_name = false,
                                in_specific_test = (_name.toString() === opt.testFullSpec) ? true : false;
                            for (var i = 0; i < _name.length; i += 1) {
                                if (_name[i] === opt.testspec) {
                                    in_name = true;
                                }
                            }

                            if ((!opt.testFullSpec || in_specific_test) && (!opt.testspec || in_name)) {
                                if (opt.moduleStart) {
                                    opt.moduleStart();
                                }
                                exports.runTest(_name, suite[k], opt, cb);
                            }
                            else {
                                return cb();
                            }
                        }
                        else {
                            exports.runSuite(_name, suite[k], opt, cb);
                        }
                    }, callback);
                };

                /**
                 * Run each exported test function or test suite from a loaded module.
                 *
                 * @param {String} name
                 * @param {Object} mod
                 * @param {Object} opt
                 * @param {Function} callback
                 * @api public
                 */

                exports.runModule = function (name, mod, opt, callback) {
                    var options = _copy(types.options(opt));

                    var _run = false;
                    var _moduleStart = options.moduleStart;

                    mod = wrapGroup(mod);

                    function run_once() {
                        if (!_run) {
                            _run = true;
                            _moduleStart(name);
                        }
                    }
                    options.moduleStart = run_once;

                    var start = new Date().getTime();

                    exports.runSuite(null, mod, options, function (err, a_list) {
                        var end = new Date().getTime();
                        var assertion_list = types.assertionList(a_list, end - start);
                        options.moduleDone(name, assertion_list);
                        if (nodeunit.complete) {
                            nodeunit.complete(name, assertion_list);
                        }
                        callback(null, a_list);
                    });
                };

                /**
                 * Treats an object literal as a list of modules keyed by name. Runs each
                 * module and finished with calling 'done'. You can think of this as a browser
                 * safe alternative to runFiles in the nodeunit module.
                 *
                 * @param {Object} modules
                 * @param {Object} opt
                 * @api public
                 */

// TODO: add proper unit tests for this function
                exports.runModules = function (modules, opt) {
                    var all_assertions = [];
                    var options = types.options(opt);
                    var start = new Date().getTime();

                    async.concatSeries(_keys(modules), function (k, cb) {
                            exports.runModule(k, modules[k], options, cb);
                        },
                        function (err, all_assertions) {
                            var end = new Date().getTime();
                            options.done(types.assertionList(all_assertions, end - start));
                        });
                };


                /**
                 * Wraps a test function with setUp and tearDown functions.
                 * Used by testCase.
                 *
                 * @param {Function} setUp
                 * @param {Function} tearDown
                 * @param {Function} fn
                 * @api private
                 */

                var wrapTest = function (setUp, tearDown, fn) {
                    return function (test) {
                        var context = {};
                        if (tearDown) {
                            var done = test.done;
                            test.done = function (err) {
                                try {
                                    tearDown.call(context, function (err2) {
                                        if (err && err2) {
                                            test._assertion_list.push(
                                                types.assertion({error: err})
                                            );
                                            return done(err2);
                                        }
                                        done(err || err2);
                                    });
                                }
                                catch (e) {
                                    done(e);
                                }
                            };
                        }
                        if (setUp) {
                            setUp.call(context, function (err) {
                                if (err) {
                                    return test.done(err);
                                }
                                fn.call(context, test);
                            });
                        }
                        else {
                            fn.call(context, test);
                        }
                    };
                };


                /**
                 * Returns a serial callback from two functions.
                 *
                 * @param {Function} funcFirst
                 * @param {Function} funcSecond
                 * @api private
                 */

                var getSerialCallback = function (fns) {
                    if (!fns.length) {
                        return null;
                    }
                    return function (callback) {
                        var that = this;
                        var bound_fns = [];
                        for (var i = 0, len = fns.length; i < len; i++) {
                            (function (j) {
                                bound_fns.push(function () {
                                    return fns[j].apply(that, arguments);
                                });
                            })(i);
                        }
                        return async.series(bound_fns, callback);
                    };
                };


                /**
                 * Wraps a group of tests with setUp and tearDown functions.
                 * Used by testCase.
                 *
                 * @param {Object} group
                 * @param {Array} setUps - parent setUp functions
                 * @param {Array} tearDowns - parent tearDown functions
                 * @api private
                 */

                var wrapGroup = function (group, setUps, tearDowns) {
                    var tests = {};

                    var setUps = setUps ? setUps.slice(): [];
                    var tearDowns = tearDowns ? tearDowns.slice(): [];

                    if (group.setUp) {
                        setUps.push(group.setUp);
                        delete group.setUp;
                    }
                    if (group.tearDown) {
                        tearDowns.unshift(group.tearDown);
                        delete group.tearDown;
                    }

                    var keys = _keys(group);

                    for (var i = 0; i < keys.length; i += 1) {
                        var k = keys[i];
                        if (typeof group[k] === 'function') {
                            tests[k] = wrapTest(
                                getSerialCallback(setUps),
                                getSerialCallback(tearDowns),
                                group[k]
                            );
                        }
                        else if (typeof group[k] === 'object') {
                            tests[k] = wrapGroup(group[k], setUps, tearDowns);
                        }
                    }
                    return tests;
                };


                /**
                 * Backwards compatibility for test suites using old testCase API
                 */

                exports.testCase = function (suite) {
                    return suite;
                };
            })(core);
            (function(exports){
                /*!
                 * Nodeunit
                 * Copyright (c) 2010 Caolan McMahon
                 * MIT Licensed
                 *
                 * THIS FILE SHOULD BE BROWSER-COMPATIBLE JS!
                 * Only code on that line will be removed, its mostly to avoid requiring code
                 * that is node specific
                 */


                /**
                 * NOTE: this test runner is not listed in index.js because it cannot be
                 * used with the command-line tool, only inside the browser.
                 */


                /**
                 * Reporter info string
                 */

                exports.info = "Browser-based test reporter";


                /**
                 * Run all tests within each module, reporting the results
                 *
                 * @param {Array} files
                 * @api public
                 */

                exports.run = function (modules, options) {
                    var start = new Date().getTime(), div;
                    options = options || {};
                    div = options.div || document.body;

                    function setText(el, txt) {
                        if ('innerText' in el) {
                            el.innerText = txt;
                        }
                        else if ('textContent' in el){
                            el.textContent = txt;
                        }
                    }

                    function getOrCreate(tag, id) {
                        var el = document.getElementById(id);
                        if (!el) {
                            el = document.createElement(tag);
                            el.id = id;
                            div.appendChild(el);
                        }
                        return el;
                    };

                    var header = getOrCreate('h1', 'nodeunit-header');
                    var banner = getOrCreate('h2', 'nodeunit-banner');
                    var userAgent = getOrCreate('h2', 'nodeunit-userAgent');
                    var tests = getOrCreate('ol', 'nodeunit-tests');
                    var result = getOrCreate('p', 'nodeunit-testresult');

                    setText(userAgent, navigator.userAgent);

                    nodeunit.runModules(modules, {
                        moduleStart: function (name) {
                            /*var mheading = document.createElement('h2');
                            mheading.innerText = name;
                            results.appendChild(mheading);
                            module = document.createElement('ol');
                            results.appendChild(module);*/
                        },
                        testDone: function (name, assertions) {
                            var test = document.createElement('li');
                            var strong = document.createElement('strong');
                            strong.innerHTML = name + ' <b style="color: black;">(' +
                                '<b class="fail">' + assertions.failures() + '</b>, ' +
                                '<b class="pass">' + assertions.passes() + '</b>, ' +
                                assertions.length +
                                ')</b>';
                            test.className = assertions.failures() ? 'fail': 'pass';
                            test.appendChild(strong);

                            var aList = document.createElement('ol');
                            aList.style.display = 'none';
                            test.onclick = function () {
                                var d = aList.style.display;
                                aList.style.display = (d == 'none') ? 'block': 'none';
                            };
                            for (var i=0; i<assertions.length; i++) {
                                var li = document.createElement('li');
                                var a = assertions[i];
                                if (a.failed()) {
                                    li.innerHTML = (a.message || a.method || 'no message') +
                                        '<pre>' + (a.error.stack || a.error) + '</pre>';
                                    li.className = 'fail';
                                }
                                else {
                                    li.innerHTML = a.message || a.method || 'no message';
                                    li.className = 'pass';
                                }
                                aList.appendChild(li);
                            }
                            test.appendChild(aList);
                            tests.appendChild(test);
                        },
                        done: function (assertions) {
                            var end = new Date().getTime();
                            var duration = end - start;

                            var failures = assertions.failures();
                            banner.className = failures ? 'fail': 'pass';

                            result.innerHTML = 'Tests completed in ' + duration +
                                ' milliseconds.<br/><span class="passed">' +
                                assertions.passes() + '</span> assertions of ' +
                                '<span class="all">' + assertions.length + '<span> passed, ' +
                                assertions.failures() + ' failed.';
                        }
                    });
                };
            })(reporter);
            nodeunit = core;
            nodeunit.assert = assert;
            nodeunit.reporter = reporter;
            nodeunit.run = reporter.run;
            return nodeunit; })();




        return Influence;
    })(Influence);
}


var checkCampaignActive = function(config, cb) {
  var url = 'https://strapi.useinfluence.co/campaign/track/' + config;
  httpGetAsync(url, function(res) {
    response = JSON.parse(res);
    if(response)
      cb(null, response);
    else
      cb(true);
  });
}

var InfluenceTracker = function(config) {
  if (!(this instanceof InfluenceTracker)) return new InfluenceTracker(config);

  this.config = config;

  console.log(config);
};

var Notifications = function(config) {
  if (!(this instanceof Notifications)) return new Notifications(config);
  this.config = config;
  var rule, notificationPath;
  var rulesUrl = 'https://strapi.useinfluence.co/rules/configuration/path/' + config;
  httpGetAsync(rulesUrl, function(res) {
    response = JSON.parse(res);
    rule = response.rule;
    notificationPath = response.notificationPath;
    var splittedUrls = ["live", "identification", "journey"];
    notificationPath = notificationPath.filter(notifPath => notifPath.type == 'display');
    notificationPath = notificationPath.map(notifPath => notifPath.url);
    var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if(rule && notificationPath.indexOf(window.location.pathname) != -1 && !(isMobile && rule.hideNotification)) {
      loopThroughSplittedNotifications(splittedUrls, rule, notificationPath, config);
    }
  });
};

function loopThroughSplittedNotifications(splittedUrls, rule, notificationPath, config) {
  var link = document.createElement("link");
  link.href = "https://cdninfluence.nyc3.digitaloceanspaces.com/note.css";
  link.type = "text/css";
  link.rel = "stylesheet";
  link.id = "stylesheetID";
  document.getElementsByTagName("head")[0].appendChild(link);

  var MomentCDN = document.createElement('script');
  MomentCDN.setAttribute('src','https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.1/moment.min.js');
  document.head.appendChild(MomentCDN);

  var j = 1;
  var loopCheckValue = rule.loopNotification?150:3;
  for (var i = 0; i < splittedUrls.length; i++) {
    if(j >  loopCheckValue) {
      i = 4;
      return;
    }

    (function (i, j) {
      var url = 'https://strapi.useinfluence.co/elasticsearch/search/' + config + '?type='+splittedUrls[i];
        httpGetAsync(url, function(res) {
          response = JSON.parse(res);
          if (!response.message.error) {
            const info = response.message;
            var randomDelayTime, tempRandomDelayTime = 0 ;
            if((splittedUrls[i] == 'journey' && !info.userDetails) ||
                (splittedUrls[i] == 'identification' && !info.response.aggregations.users.buckets.length ||
                  (splittedUrls[i] == 'live' && Number(info.configuration.panelStyle.liveVisitorCount) >= info.response.aggregations.users.buckets.length)
              )) {
              return;
            }
            if(rule.delayNotification) {
              randomDelayTime = (Math.floor(Math.random() * 10) + 3);
            }
            if(info.configuration && info.configuration.activity) {
              if(j == 1)
                setTimeout(function(){
                  return notificationTimeout(i, info, rule, splittedUrls, notificationPath);
                }, (rule.initialDelay)*1000);
              else
                setTimeout(function(){
                  return notificationTimeout(i, info, rule, splittedUrls, notificationPath);
                }, (rule.delayNotification?(randomDelayTime + tempRandomDelayTime):((rule.displayTime+rule.delayBetween)*(j))*1000));
              tempRandomDelayTime = randomDelayTime;
            }
          } else {
            console.log('Send data to us using websocket ')
          }
        });
    })(i, j);

    j++;

    if(i == splittedUrls.length-1) {
      i = -2;
    }

  }
}

function notificationTimeout(i, info, rule, splittedUrls, notificationPath) {
    if(notificationPath.indexOf(window.location.pathname) === -1)
      return;
    var note = new Note({});
    const configuration = info.configuration;
    const displayPosition = info.rule.displayPosition;
    let containerStyle, iconStyle, alignment, left, bottom, top, fadein, fadeout;
    switch(displayPosition) {
      case 'Bottom Right':
        alignment = "z-index: 10000; position: fixed; right: 10px; bottom: 0px;";
        fadein = 'fadeinBottom';
        fadeout = 'fadeoutBottom';
        break;
      case 'Bottom Left':
        alignment = "z-index: 10000; position: fixed; left: 0px; bottom: 0px;";
        fadein = 'fadeinBottom';
        fadeout = 'fadeoutBottom';
        break;
      case 'Bottom Center':
        alignment = "z-index: 10000; position: fixed; left: 50%; transform: translate(-50%, 0); bottom: 0px;";
        fadein = 'fadeinBottom';
        fadeout = 'fadeoutBottom';
        break;
      case 'Top Left':
        alignment = "z-index: 10000; position: fixed; left: 0px; top: 10px;";
        fadein = 'fadeinTop';
        fadeout = 'fadeoutTop';
        break;
      case 'Top Right':
        alignment = "z-index: 10000; position: fixed; right: 10px; top: 10px;";
        fadein = 'fadeinTop';
        fadeout = 'fadeoutTop';
        break;
      case 'Top Center':
        alignment = "z-index: 10000; position: fixed; left: 50%; transform: translate(-50%, 0); top: 10px;";
        fadein = 'fadeinTop';
        fadeout = 'fadeoutTop';
        break;
      default:
        alignment = "z-index: 10000; position: fixed; left: 0px; bottom: 0px;";
        fadein = 'fadeinBottom';
        fadeout = 'fadeoutBottom';
    }

    if(configuration) {
      const panelStyle = configuration.panelStyle;
      const backgroundColor = panelStyle.backgroundColor;
      const borderColor = panelStyle.borderColor;
      const color = panelStyle.color;

      containerStyle = `
        border-radius: ${panelStyle.radius}px !important;
        background-color: rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, ${backgroundColor.a});
        border-color: rgb(${borderColor.r}, ${borderColor.g}, ${borderColor.b}, ${borderColor.a});
        box-shadow: rgb(0, 0, 0) ${panelStyle.shadow}px ${panelStyle.shadow}px ${panelStyle.blur}px;
        color: rgb(${color.r}, ${color.g}, ${color.b});
        border-width: ${panelStyle.borderWidth}px;
        height: ${72+panelStyle.borderWidth*2}px;
        font-family: ${panelStyle.fontFamily};
        font-Weight: ${panelStyle.fontWeight};
        -webkit-animation: ${fadein} 0.5s, ${fadeout} 0.5s ${info.rule.displayTime*1000}s;
        animation: ${fadein} 0.5s, ${fadeout} 0.5s ${info.rule.displayTime*1000}s;
      `;
      iconStyle = `border-radius: ${panelStyle.radius}px;`;
    } else {
      containerStyle = `
        -webkit-animation: ${fadein} 0.5s, ${fadeout} 0.5s ${info.rule.displayTime*1000}s;
        animation: ${fadein} 0.5s, ${fadeout} 0.5s ${info.rule.displayTime*1000}s;
      `;
    }
    note.notificationdisplay(splittedUrls[i], info, containerStyle, iconStyle, alignment);
  // }
}

function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}


InfluenceTracker.prototype.tracker = function(info) {
    console.log(info);
    var path = info.path;
    var value = info.value;

    if (typeof console !== 'undefined') {
        console.log(path);
        console.log(value);

        // Send data to the backend
        var data = {}


        data.path = path;
        data.value = value;



        //Send the proper header information along with the request

          if ("WebSocket" in window)
            {
               console.log("WebSocket is supported by your Browser!");

               // Let us open a web socket
               var ws = new WebSocket("wss://strapi.useinfluence.co/web");

               ws.onopen = function()
               {
                  // Web Socket is connected, send data using send()
                  ws.send(JSON.stringify(data));
                  console.log("Message is sent...",data);
               };

               ws.onmessage = function (evt)
               {
                  var received_msg = evt.data;
                  console.log("Message is received...");
               };

               ws.onclose = function()
               {
                  // websocket is closed.
                  console.log("Connection is closed...");
               };

               window.onbeforeunload = function(event) {
                  socket.close();
               };
            }

            else
            {
               // The browser doesn't support WebSocket
               console.log("WebSocket NOT supported by your Browser!");
            }


        info.success && setTimeout(info.success, 0);
    } else {
        info.failure && setTimeout(info.failure, 0);
    }
};

let k = 0;
var Note = function Note(config, containerStyle, iconStyle) {

    function displayNotification(container, config) {
      setTimeout(function() {
        // container.parentNode.removeChild(container)
        fadeOut(container);

    }, (config.rule.displayTime*1000));
      setTimeout(function() {
        container.parentNode.removeChild(container)
      }, (config.rule.displayTime*1000+2000));
      document.body.appendChild(container);
    };

    function fadeOut(element) {
      var op = 1;  // initial opacity
      var timer = setInterval(function () {
        if (op <= 0.1){
            clearInterval(timer);
            element.style.display = 'none';
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op -= op * 0.1;
      }, 50);
    }

    function notificationDisplay(type, config, containerStyle, iconStyle, alignment) {
      var container = document.createElement('div');
      container.setAttribute("id", "FPqR2DbIqJeA2DbI7MM9_0");
      container.style = alignment;
        var innerContainer = document.createElement('div');
        innerContainer.setAttribute("id", "FPqR3tRBqJeA3tRB7MM9_0");
          var innerDiv = document.createElement('div');
            var mainContainer = document.createElement('div');

              var notificationRecentContainer = document.createElement('div');
              notificationRecentContainer.style = type=='journey'?"display:block":"display:none";
                var innerNotifRecentContainer = document.createElement('div');
                innerNotifRecentContainer.setAttribute("id", "FPqR2fZIqJeA2fZI7MM9_0");
                  var innerInnerNotifRecentContainer = document.createElement('div');
                  innerInnerNotifRecentContainer.className = "FPqR3zjZqJeA3zjZ7MM9_0 FPqR2riIqJeA2riI7MM9_0";
                  innerInnerNotifRecentContainer.style = containerStyle;

                    var notifRecentImgContainer = document.createElement('div');
                    notifRecentImgContainer.className = "FPqR1JYFqJeA1JYF7MM9_0";
                      var notifRecentImg = document.createElement('img');
                      var res_img = config.userDetails && config.userDetails[k]?config.userDetails[k].profile_pic:null;
                      notifRecentImg.setAttribute('src', res_img?res_img:"https://www.totaldenturecare.com.au/wp-content/uploads/2017/06/default-user-image-female.png");
                      notifRecentImg.style = iconStyle;
                    notifRecentImgContainer.appendChild(notifRecentImg);
                    var notifRecentContentContainer = document.createElement('div');
                    notifRecentContentContainer.className = "FPqR2EbCqJeA2EbC7MM9_0";
                      var notifRecentContentI = document.createElement('div');
                      notifRecentContentI.className = "FPqR2AUlqJeA2AUl7MM9_0";
                      var res_name = config.userDetails && config.userDetails[k]?config.userDetails[k].username?config.userDetails[k].username:config.userDetails[k].response.json.value.form.firstname:null;
                      var user_details = config.userDetails && config.userDetails[k]?
                        config.userDetails[k].city && config.userDetails[k].country && res_name ?
                          `${res_name} from ${config.userDetails[k].city}, ${config.userDetails[k].country}`
                        :
                          config.userDetails[k].city && res_name?
                            `${res_name} from ${config.userDetails[k].city}`
                          :
                            config.userDetails[k].country && res_name?
                              `${res_name} from ${config.userDetails[k].country}`
                            :
                              res_name?
                                `${res_name}`
                              :
                                "Anonymous"
                        : "Anonymous";
                      notifRecentContentI.innerHTML = user_details;
                      var notifRecentContentII = document.createElement('div');
                      notifRecentContentII.className = "FPqR13BWqJeA13BW7MM9_0";
                      notifRecentContentII.innerHTML = config.configuration.contentText;
                      var notifRecentContentIII = document.createElement('div');
                      notifRecentContentIII.className = "FPqR2PlWqJeA2PlW7MM9_0";
                      var timeStamp = config.userDetails && config.userDetails[k]?config.userDetails[k].timestamp:null;
                      notifRecentContentIII.innerHTML = timeStamp?moment(timeStamp).fromNow():"Not available ";
                      var notifRecentContentIV = document.createElement('div');
                      notifRecentContentIV.className = "FPqR3eNuqJeA3eNu7MM9_0";
                        var notifRecentContentIVInnerI = document.createElement('i');
                          var notifRecentContentSvg = document.createElement('img');
                          notifRecentContentSvg.setAttribute('src', 'https://useinfluence.co/images/usericon.png');
                        notifRecentContentIVInnerI.appendChild(notifRecentContentSvg);
                        var notifRecentContentIVSpan1 = document.createElement('span');
                        notifRecentContentIVSpan1.innerHTML = "by ";
                        var notifRecentContentIVSpan2 = document.createElement('span');
                        notifRecentContentIVSpan2.className = "FPqR12wMqJeA12wM7MM9_0";
                        notifRecentContentIVSpan2.innerHTML = "Influence";
                      notifRecentContentIV.appendChild(notifRecentContentIVSpan1);
                      notifRecentContentIV.appendChild(notifRecentContentIVInnerI);
                      notifRecentContentIV.appendChild(notifRecentContentIVSpan2);
                    notifRecentContentContainer.appendChild(notifRecentContentI);
                    notifRecentContentContainer.appendChild(notifRecentContentII);
                    notifRecentContentContainer.appendChild(notifRecentContentIII);
                    notifRecentContentContainer.appendChild(notifRecentContentIV);
                  innerInnerNotifRecentContainer.appendChild(notifRecentImgContainer);
                  innerInnerNotifRecentContainer.appendChild(notifRecentContentContainer);
                innerNotifRecentContainer.appendChild(innerInnerNotifRecentContainer);
              notificationRecentContainer.appendChild(innerNotifRecentContainer);

              var notificationLiveContainer = document.createElement('div');
              notificationLiveContainer.style = type=='live'?"display:block":"display:none";
                var innerNotifLiveContainer = document.createElement('div');
                innerNotifLiveContainer.setAttribute("id", "FPqR3dGiqJeA3dGi7MM9_0");
                  var innerInnerNotifLiveContainer = document.createElement('div');
                  innerInnerNotifLiveContainer.className = "FPqR2B_4qJeA2B_47MM9_0 rounded FPqRD2zVqJeAD2zV7MM9_0";
                  innerInnerNotifLiveContainer.style = containerStyle;
                    var innerMainNotifLiveContainer = document.createElement('div');
                    innerMainNotifLiveContainer.setAttribute('id', "FPqR3acHqJeA3acH7MM9_0");

                      var notifLiveImgContainer = document.createElement('div');
                      notifLiveImgContainer.className = "FPqRH0WDqJeAH0WD7MM9_0";
                        var notifLiveImg = document.createElement('div');
                        notifLiveImg.className =  "FPqRh0ePqJeAh0eP7MM9_0";
                      notifLiveImgContainer.appendChild(notifLiveImg);

                      var notifLiveContentContainerI = document.createElement('div');
                      notifLiveContentContainerI.className = "FPqR15RvqJeA15Rv7MM9_0";
                        var notifLiveContentInnerContainer = document.createElement('div');
                        notifLiveContentInnerContainer.className = "FPqR2fwXqJeA2fwX7MM9_0";
                          var notifLiveContentSpan = document.createElement('span');
                          notifLiveContentSpan.className = "FPqR1Jr6qJeA1Jr67MM9_0";
                            var notifLiveContentInnerSpan = document.createElement('span');
                            notifLiveContentInnerSpan.innerHTML = config.response?config.response.aggregations.users.buckets.length:0;
                            var text_span = document.createTextNode(` ${config.configuration.visitorText}`);
                          notifLiveContentSpan.appendChild(notifLiveContentInnerSpan);
                          notifLiveContentSpan.appendChild(text_span);
                          var text_div = document.createTextNode(" are viewing this site");
                        notifLiveContentInnerContainer.appendChild(notifLiveContentSpan);
                      notifLiveContentContainerI.appendChild(notifLiveContentInnerContainer);
                      notifLiveContentContainerI.appendChild(text_div);

                      var notifLiveContentContainerII = document.createElement('div');
                      notifLiveContentContainerII.className = "FPqR14UVqJeA14UV7MM9_0";
                        var text_ContainerII = document.createTextNode('Verified by ');
                        var notifLiveContentContainerII_I = document.createElement('i');
                          var notifLiveContentImg = document.createElement('img');
                          notifLiveContentImg.setAttribute('src', 'https://useinfluence.co/images/verifiedicon.png');
                        notifLiveContentContainerII_I.appendChild(notifLiveContentImg);
                        var notifLiveContentA = document.createElement('a');
                        notifLiveContentA.setAttribute('href', 'https://useinfluence.co');
                        notifLiveContentA.setAttribute('rel', 'nofollow');
                        notifLiveContentA.setAttribute('target', '_blank');
                        var createAText = document.createTextNode('Influence');
                        notifLiveContentA.appendChild(createAText);
                      notifLiveContentContainerII.appendChild(text_ContainerII);
                      notifLiveContentContainerII.appendChild(notifLiveContentContainerII_I);
                      notifLiveContentContainerII.appendChild(notifLiveContentA);

                    innerMainNotifLiveContainer.appendChild(notifLiveImgContainer);
                    innerMainNotifLiveContainer.appendChild(notifLiveContentContainerI);
                    innerMainNotifLiveContainer.appendChild(notifLiveContentContainerII);

                  innerInnerNotifLiveContainer.appendChild(innerMainNotifLiveContainer);
                innerNotifLiveContainer.appendChild(innerInnerNotifLiveContainer);
              notificationLiveContainer.appendChild(innerNotifLiveContainer);

              var notificationBulkContainer = document.createElement('div');
              notificationBulkContainer.style = type=='identification'?"display:block":"display:none";
                var innerNotifBulkContainer = document.createElement('div');
                innerNotifBulkContainer.setAttribute("id", "FPqR2lriqJeA2lri7MM9_0");
                  var innerInnerNotifBulkContainer = document.createElement('div');
                  innerInnerNotifBulkContainer.className = "FPqR1XogqJeA1Xog7MM9_0 FPqR27wVqJeA27wV7MM9_0";
                  innerInnerNotifBulkContainer.style = containerStyle;
                    var notifBulkImgContainer = document.createElement('div');
                    notifBulkImgContainer.className = "FPqR37xpqJeA37xp7MM9_0";
                      var notifBulkImg = document.createElement('img');
                      notifBulkImg.setAttribute('src', 'https://useinfluence.co/images/fire.png')
                    notifBulkImgContainer.appendChild(notifBulkImg);

                    var notifBulkContentContainer = document.createElement('div');
                    notifBulkContentContainer.className = "FPqRqu5HqJeAqu5H7MM9_0";
                      var notifBulkContentInnerContainer = document.createElement('div');
                        var notifBulkContentSpan = document.createElement('span');
                        notifBulkContentSpan.className = "FPqRtoc3qJeAtoc37MM9_0";
                          var notifBulkContentInnerSpan = document.createElement('span');
                          notifBulkContentInnerSpan.innerHTML = config.response?config.response.aggregations.users.buckets.length:0;
                          var notifBulkContentInnerText = document.createTextNode(` ${config.configuration.visitorText}`);
                        notifBulkContentSpan.appendChild(notifBulkContentInnerSpan);
                        notifBulkContentSpan.appendChild(notifBulkContentInnerText);
                        var notifBulkContentText = document.createTextNode(`signed up for ${config.configuration.contentText} in the last ${config.configuration.panelStyle.bulkData} ${config.configuration.panelStyle.selectDurationData}`);
                      notifBulkContentInnerContainer.appendChild(notifBulkContentSpan);
                      notifBulkContentInnerContainer.appendChild(notifBulkContentText);
                    notifBulkContentContainer.appendChild(notifBulkContentInnerContainer);

                  innerInnerNotifBulkContainer.appendChild(notifBulkImgContainer);
                  innerInnerNotifBulkContainer.appendChild(notifBulkContentContainer);

                innerNotifBulkContainer.appendChild(innerInnerNotifBulkContainer);
              notificationBulkContainer.appendChild(innerNotifBulkContainer);

            mainContainer.appendChild(notificationRecentContainer);
            mainContainer.appendChild(notificationLiveContainer);
            mainContainer.appendChild(notificationBulkContainer);
          innerDiv.appendChild(mainContainer);
        innerContainer.appendChild(innerDiv);
      container.appendChild(innerContainer);

      if(type == 'journey' && config.userDetails && config.userDetails.length>k) {
        k++;
        k = k==config.userDetails.length?0:k;
      } else if(type == 'journey' && config.userDetails && config.userDetails.length<=k) {
        k = 0;
      }

      displayNotification(container, config);
    }

    return {
        notificationdisplay: function notificationdisplay(type, config, containerStyle, iconStyle, alignment) {
          notificationDisplay(type, config, containerStyle, iconStyle, alignment);
        }
    };
};





if (typeof module !== "undefined" && module.exports) module.exports = Note;
nodeunit = typeof nodeunit === 'undefined' ? require('nodeunit') : nodeunit;
Influence = typeof Influence === 'undefined' ? require('..') : Influence;
