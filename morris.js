/* @license
morris.js v0.6
Copyright 2018 Olly Smith All rights reserved.
Licensed under the BSD-2-Clause License.
*/


(function() {
  var Morris, compStyle, minutesSpecHelper, secondsSpecHelper,
    __slice = [].slice,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Morris = window.Morris = {};

  compStyle = function(el) {
    if (getComputedStyle) {
      return getComputedStyle(el, null);
    } else if (el.currentStyle) {
      return el.currentStyle;
    } else {
      return el.style;
    }
  };

  Morris.EventEmitter = (function() {
    function EventEmitter() {}

    EventEmitter.prototype.on = function(name, handler) {
      if (this.handlers == null) {
        this.handlers = {};
      }
      if (this.handlers[name] == null) {
        this.handlers[name] = [];
      }
      this.handlers[name].push(handler);
      return this;
    };

    EventEmitter.prototype.fire = function() {
      var args, handler, name, _i, _len, _ref, _results;
      name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if ((this.handlers != null) && (this.handlers[name] != null)) {
        _ref = this.handlers[name];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          handler = _ref[_i];
          _results.push(handler.apply(null, args));
        }
        return _results;
      }
    };

    return EventEmitter;

  })();

  Morris.commas = function(num) {
    var absnum, intnum, ret, strabsnum;
    if (num != null) {
      ret = num < 0 ? "-" : "";
      absnum = Math.abs(num);
      intnum = Math.floor(absnum).toFixed(0);
      ret += intnum.replace(/(?=(?:\d{3})+$)(?!^)/g, ',');
      strabsnum = absnum.toString();
      if (strabsnum.length > intnum.length) {
        ret += strabsnum.slice(intnum.length);
      }
      return ret;
    } else {
      return '-';
    }
  };

  Morris.pad2 = function(number) {
    return (number < 10 ? '0' : '') + number;
  };

  Morris.extend = function() {
    var key, object, objects, properties, val, _i, _len;
    object = arguments[0], objects = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (object == null) {
      object = {};
    }
    for (_i = 0, _len = objects.length; _i < _len; _i++) {
      properties = objects[_i];
      if (properties != null) {
        for (key in properties) {
          val = properties[key];
          if (properties.hasOwnProperty(key)) {
            object[key] = val;
          }
        }
      }
    }
    return object;
  };

  Morris.offset = function(el) {
    var rect;
    rect = el.getBoundingClientRect();
    return {
      top: rect.top + document.body.scrollTop,
      left: rect.left + document.body.scrollLeft
    };
  };

  Morris.css = function(el, prop) {
    return compStyle(el);
  };

  Morris.on = function(el, eventName, fn) {
    if (el.addEventListener) {
      return el.addEventListener(eventName, fn);
    } else {
      return el.attachEvent('on' + eventName, fn);
    }
  };

  Morris.dimensions = function(el) {
    var style;
    style = compStyle(el);
    return {
      width: parseInt(style.width),
      height: parseInt(style.height)
    };
  };

  Morris.innerDimensions = function(el) {
    var style;
    style = compStyle(el);
    return {
      width: parseInt(style.width) + parseInt(style.paddingLeft) + parseInt(style.paddingRight),
      height: parseInt(style.height) + parseInt(style.paddingTop) + parseInt(style.paddingBottom)
    };
  };

  Morris.Grid = (function(_super) {
    __extends(Grid, _super);

    function Grid(options) {
      this.hasToShow = __bind(this.hasToShow, this);
      this.resizeHandler = __bind(this.resizeHandler, this);
      var _this = this;
      if (typeof options.element === 'string') {
        this.el = document.getElementById(options.element);
      } else {
        this.el = options.element[0] || options.element;
      }
      if (this.el == null) {
        throw new Error("Graph container element not found");
      }
      if (Morris.css(this.el, 'position') === 'static') {
        this.el.style.position = 'relative';
      }
      this.options = Morris.extend({}, this.gridDefaults, this.defaults || {}, options);
      if (typeof this.options.units === 'string') {
        this.options.postUnits = options.units;
      }
      this.raphael = new Raphael(this.el);
      this.elementWidth = null;
      this.elementHeight = null;
      this.dirty = false;
      this.selectFrom = null;
      if (this.init) {
        this.init();
      }
      this.setData(this.options.data);
      Morris.on(this.el, 'mousemove', function(evt) {
        var left, offset, right, width, x;
        offset = Morris.offset(_this.el);
        x = evt.pageX - offset.left;
        if (_this.selectFrom) {
          left = _this.data[_this.hitTest(Math.min(x, _this.selectFrom))]._x;
          right = _this.data[_this.hitTest(Math.max(x, _this.selectFrom))]._x;
          width = right - left;
          return _this.selectionRect.attr({
            x: left,
            width: width
          });
        } else {
          return _this.fire('hovermove', x, evt.pageY - offset.top);
        }
      });
      Morris.on(this.el, 'mouseleave', function(evt) {
        if (_this.selectFrom) {
          _this.selectionRect.hide();
          _this.selectFrom = null;
        }
        return _this.fire('hoverout');
      });
      Morris.on(this.el, 'touchstart touchmove touchend', function(evt) {
        var offset, touch;
        touch = evt.originalEvent.touches[0] || evt.originalEvent.changedTouches[0];
        offset = Morris.offset(_this.el);
        return _this.fire('hovermove', touch.pageX - offset.left, touch.pageY - offset.top);
      });
      Morris.on(this.el, 'click', function(evt) {
        var offset;
        offset = Morris.offset(_this.el);
        return _this.fire('gridclick', evt.pageX - offset.left, evt.pageY - offset.top);
      });
      if (this.options.rangeSelect) {
        this.selectionRect = this.raphael.rect(0, 0, 0, Morris.innerDimensions(this.el).height).attr({
          fill: this.options.rangeSelectColor,
          stroke: false
        }).toBack().hide();
        Morris.on(this.el, 'mousedown', function(evt) {
          var offset;
          offset = Morris.offset(_this.el);
          return _this.startRange(evt.pageX - offset.left);
        });
        Morris.on(this.el, 'mouseup', function(evt) {
          var offset;
          offset = Morris.offset(_this.el);
          _this.endRange(evt.pageX - offset.left);
          return _this.fire('hovermove', evt.pageX - offset.left, evt.pageY - offset.top);
        });
      }
      if (this.options.resize) {
        Morris.on(window, 'resize', function(evt) {
          if (_this.timeoutId != null) {
            window.clearTimeout(_this.timeoutId);
          }
          return _this.timeoutId = window.setTimeout(_this.resizeHandler, 100);
        });
      }
      this.el.style.webkitTapHighlightColor = 'rgba(0,0,0,0)';
      if (this.postInit) {
        this.postInit();
      }
    }

    Grid.prototype.gridDefaults = {
      dateFormat: null,
      axes: true,
      freePosition: false,
      grid: true,
      gridLineColor: '#aaa',
      gridStrokeWidth: 0.5,
      gridTextColor: '#888',
      gridTextSize: 12,
      gridTextFamily: 'sans-serif',
      gridTextWeight: 'normal',
      hideHover: false,
      yLabelFormat: null,
      yLabelAlign: 'right',
      xLabelAngle: 0,
      numLines: 5,
      padding: 25,
      parseTime: true,
      postUnits: '',
      postUnits2: '',
      preUnits: '',
      preUnits2: '',
      ymax: 'auto',
      ymin: 'auto 0',
      y2max: 'auto',
      y2min: 'auto 0',
      goals: [],
      goalStrokeWidth: 1.0,
      goalLineColors: ['#666633', '#999966', '#cc6666', '#663333'],
      events: [],
      eventStrokeWidth: 1.0,
      eventLineColors: ['#005a04', '#ccffbb', '#3a5f0b', '#005502'],
      rangeSelect: null,
      rangeSelectColor: '#eef',
      resize: false,
      dataLabels: true,
      dataLabelsPosition: 'outside',
      dataLabelsFamily: 'sans-serif',
      dataLabelsSize: 12,
      dataLabelsWeight: 'normal',
      dataLabelsColor: '#000',
      animate: true,
      nbYkeys2: 0,
      smooth: true
    };

    Grid.prototype.setData = function(data, redraw) {
      var e, flatEvents, from, idx, index, maxGoal, minGoal, ret, row, step, to, total, y, ykey, ymax, ymax2, ymin, ymin2, yval, _i, _len, _ref, _ref1;
      if (redraw == null) {
        redraw = true;
      }
      this.options.data = data;
      if ((data == null) || data.length === 0) {
        this.data = [];
        this.raphael.clear();
        if (this.hover != null) {
          this.hover.hide();
        }
        return;
      }
      ymax = this.cumulative ? 0 : null;
      ymin = this.cumulative ? 0 : null;
      ymax2 = this.cumulative ? 0 : null;
      ymin2 = this.cumulative ? 0 : null;
      if (this.options.goals.length > 0) {
        minGoal = Math.min.apply(Math, this.options.goals);
        maxGoal = Math.max.apply(Math, this.options.goals);
        ymin = ymin != null ? Math.min(ymin, minGoal) : minGoal;
        ymax = ymax != null ? Math.max(ymax, maxGoal) : maxGoal;
      }
      if (this.options.nbYkeys2 > this.options.ykeys.length) {
        this.options.nbYkeys2 = this.options.ykeys.length;
      }
      this.data = (function() {
        var _i, _len, _results;
        _results = [];
        for (index = _i = 0, _len = data.length; _i < _len; index = ++_i) {
          row = data[index];
          ret = {
            src: row
          };
          ret.label = row[this.options.xkey];
          if (this.options.parseTime) {
            ret.x = Morris.parseDate(ret.label);
            if (this.options.dateFormat) {
              ret.label = this.options.dateFormat(ret.x);
            } else if (typeof ret.label === 'number') {
              ret.label = new Date(ret.label).toString();
            }
          } else if (this.options.freePosition) {
            ret.x = parseFloat(row[this.options.xkey]);
            if (this.options.xLabelFormat) {
              ret.label = this.options.xLabelFormat(ret);
            }
          } else {
            ret.x = index;
            if (this.options.xLabelFormat) {
              ret.label = this.options.xLabelFormat(ret);
            }
          }
          total = 0;
          ret.y = (function() {
            var _j, _len1, _ref, _results1;
            _ref = this.options.ykeys;
            _results1 = [];
            for (idx = _j = 0, _len1 = _ref.length; _j < _len1; idx = ++_j) {
              ykey = _ref[idx];
              yval = row[ykey];
              if (typeof yval === 'string') {
                yval = parseFloat(yval);
              }
              if ((yval != null) && typeof yval !== 'number') {
                yval = null;
              }
              if (idx < this.options.ykeys.length - this.options.nbYkeys2) {
                if ((yval != null) && this.hasToShow(idx)) {
                  if (this.cumulative) {
                    total += yval;
                  } else {
                    if (ymax != null) {
                      ymax = Math.max(yval, ymax);
                      ymin = Math.min(yval, ymin);
                    } else {
                      ymax = ymin = yval;
                    }
                  }
                }
                if (this.cumulative && (total != null)) {
                  ymax = Math.max(total, ymax);
                  ymin = Math.min(total, ymin);
                }
              } else {
                if ((yval != null) && this.hasToShow(idx)) {
                  if (this.cumulative) {
                    total += yval;
                  } else {
                    if (ymax2 != null) {
                      ymax2 = Math.max(yval, ymax2);
                      ymin2 = Math.min(yval, ymin2);
                    } else {
                      ymax2 = ymin2 = yval;
                    }
                  }
                }
                if (this.cumulative && (total != null)) {
                  ymax2 = Math.max(total, ymax2);
                  ymin2 = Math.min(total, ymin2);
                }
              }
              _results1.push(yval);
            }
            return _results1;
          }).call(this);
          _results.push(ret);
        }
        return _results;
      }).call(this);
      if (this.options.parseTime || this.options.freePosition) {
        this.data = this.data.sort(function(a, b) {
          return (a.x > b.x) - (b.x > a.x);
        });
      }
      this.xmin = this.data[0].x;
      this.xmax = this.data[this.data.length - 1].x;
      this.events = [];
      if (this.options.events.length > 0) {
        if (this.options.parseTime) {
          _ref = this.options.events;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            e = _ref[_i];
            if (e instanceof Array) {
              from = e[0], to = e[1];
              this.events.push([Morris.parseDate(from), Morris.parseDate(to)]);
            } else {
              this.events.push(Morris.parseDate(e));
            }
          }
        } else {
          this.events = this.options.events;
        }
        flatEvents = this.events.map(function(e) {
          return e;
        });
        this.xmax = Math.max(this.xmax, Math.max.apply(Math, flatEvents));
        this.xmin = Math.min(this.xmin, Math.min.apply(Math, flatEvents));
      }
      if (this.xmin === this.xmax) {
        this.xmin -= 1;
        this.xmax += 1;
      }
      this.ymin = this.yboundary('min', ymin);
      this.ymax = this.yboundary('max', ymax);
      this.ymin2 = this.yboundary('min', ymin2);
      this.ymax2 = this.yboundary('max', ymax2);
      if (this.ymin === this.ymax) {
        if (ymin) {
          this.ymin -= 1;
        }
        this.ymax += 1;
      }
      if (this.ymin2 === this.ymax2) {
        if (ymin2) {
          this.ymin2 -= 1;
        }
        this.ymax2 += 1;
      }
      if (((_ref1 = this.options.axes) === true || _ref1 === 'both' || _ref1 === 'y') || this.options.grid === true) {
        if (this.options.ymax === this.gridDefaults.ymax && this.options.ymin === this.gridDefaults.ymin) {
          this.grid = this.autoGridLines(this.ymin, this.ymax, this.options.numLines);
          if (this.options.nbYkeys2 > 0) {
            this.grid2 = this.autoGridLines(this.ymin2, this.ymax2, this.options.numLines);
          }
          this.ymin = Math.min(this.ymin, this.grid[0]);
          this.ymax = Math.max(this.ymax, this.grid[this.grid.length - 1]);
        } else {
          step = (this.ymax - this.ymin) / (this.options.numLines - 1);
          this.grid = (function() {
            var _j, _ref2, _ref3, _results;
            _results = [];
            for (y = _j = _ref2 = this.ymin, _ref3 = this.ymax; step > 0 ? _j <= _ref3 : _j >= _ref3; y = _j += step) {
              _results.push(y);
            }
            return _results;
          }).call(this);
        }
      }
      this.dirty = true;
      if (redraw) {
        return this.redraw();
      }
    };

    Grid.prototype.yboundary = function(boundaryType, currentValue) {
      var boundaryOption, suggestedValue;
      boundaryOption = this.options["y" + boundaryType];
      if (typeof boundaryOption === 'string') {
        if (boundaryOption.slice(0, 4) === 'auto') {
          if (boundaryOption.length > 5) {
            suggestedValue = parseInt(boundaryOption.slice(5), 10);
            if (currentValue == null) {
              return suggestedValue;
            }
            return Math[boundaryType](currentValue, suggestedValue);
          } else {
            if (currentValue != null) {
              return currentValue;
            } else {
              return 0;
            }
          }
        } else {
          return parseInt(boundaryOption, 10);
        }
      } else {
        return boundaryOption;
      }
    };

    Grid.prototype.autoGridLines = function(ymin, ymax, nlines) {
      var gmax, gmin, grid, smag, span, step, unit, y, ymag;
      span = ymax - ymin;
      ymag = Math.floor(Math.log(span) / Math.log(10));
      unit = Math.pow(10, ymag);
      gmin = Math.floor(ymin / unit) * unit;
      gmax = Math.ceil(ymax / unit) * unit;
      step = (gmax - gmin) / (nlines - 1);
      if (unit === 1 && step > 1 && Math.ceil(step) !== step) {
        step = Math.ceil(step);
        gmax = gmin + step * (nlines - 1);
      }
      if (gmin < 0 && gmax > 0) {
        gmin = Math.floor(ymin / step) * step;
        gmax = Math.ceil(ymax / step) * step;
      }
      if (step < 1) {
        smag = Math.floor(Math.log(step) / Math.log(10));
        grid = (function() {
          var _i, _results;
          _results = [];
          for (y = _i = gmin; step > 0 ? _i <= gmax : _i >= gmax; y = _i += step) {
            _results.push(parseFloat(y.toFixed(1 - smag)));
          }
          return _results;
        })();
      } else {
        grid = (function() {
          var _i, _results;
          _results = [];
          for (y = _i = gmin; step > 0 ? _i <= gmax : _i >= gmax; y = _i += step) {
            _results.push(y);
          }
          return _results;
        })();
      }
      return grid;
    };

    Grid.prototype._calc = function() {
      var angle, bottomOffsets, gridLine, h, i, w, yLabelWidths, yLabelWidths2, _ref, _ref1, _ref2;
      _ref = Morris.dimensions(this.el), w = _ref.width, h = _ref.height;
      if (this.elementWidth !== w || this.elementHeight !== h || this.dirty) {
        this.elementWidth = w;
        this.elementHeight = h;
        this.dirty = false;
        this.left = this.options.padding;
        this.right = this.elementWidth - this.options.padding;
        this.top = this.options.padding;
        this.bottom = this.elementHeight - this.options.padding;
        if ((_ref1 = this.options.axes) === true || _ref1 === 'both' || _ref1 === 'y') {
          yLabelWidths = (function() {
            var _i, _len, _ref2, _results;
            _ref2 = this.grid;
            _results = [];
            for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
              gridLine = _ref2[_i];
              _results.push(this.measureText(this.yAxisFormat(gridLine)).width);
            }
            return _results;
          }).call(this);
          if (this.options.nbYkeys2 > 0) {
            yLabelWidths2 = (function() {
              var _i, _len, _ref2, _results;
              _ref2 = this.grid2;
              _results = [];
              for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                gridLine = _ref2[_i];
                _results.push(this.measureText(this.yAxisFormat2(gridLine)).width);
              }
              return _results;
            }).call(this);
          }
          if (!this.options.horizontal) {
            this.left += Math.max.apply(Math, yLabelWidths);
            if (this.options.nbYkeys2 > 0) {
              this.right -= Math.max.apply(Math, yLabelWidths2);
            }
          } else {
            this.bottom -= Math.max.apply(Math, yLabelWidths);
          }
        }
        if ((_ref2 = this.options.axes) === true || _ref2 === 'both' || _ref2 === 'x') {
          if (!this.options.horizontal) {
            angle = -this.options.xLabelAngle;
          } else {
            angle = -90;
          }
          bottomOffsets = (function() {
            var _i, _ref3, _results;
            _results = [];
            for (i = _i = 0, _ref3 = this.data.length; 0 <= _ref3 ? _i < _ref3 : _i > _ref3; i = 0 <= _ref3 ? ++_i : --_i) {
              _results.push(this.measureText(this.data[i].label, angle).height);
            }
            return _results;
          }).call(this);
          if (!this.options.horizontal) {
            this.bottom -= Math.max.apply(Math, bottomOffsets);
          } else {
            this.left += Math.max.apply(Math, bottomOffsets);
          }
        }
        this.width = Math.max(1, this.right - this.left);
        this.height = Math.max(1, this.bottom - this.top);
        if (!this.options.horizontal) {
          this.dx = this.width / (this.xmax - this.xmin);
          this.dy = this.height / (this.ymax - this.ymin);
          this.dy2 = this.height / (this.ymax2 - this.ymin2);
          this.yStart = this.bottom;
          this.yEnd = this.top;
          this.xStart = this.left;
          this.xEnd = this.right;
          this.xSize = this.width;
          this.ySize = this.height;
        } else {
          this.dx = this.height / (this.xmax - this.xmin);
          this.dy = this.width / (this.ymax - this.ymin);
          this.dy2 = this.width / (this.ymax2 - this.ymin2);
          this.yStart = this.left;
          this.yEnd = this.right;
          this.xStart = this.top;
          this.xEnd = this.bottom;
          this.xSize = this.height;
          this.ySize = this.width;
        }
        if (this.calc) {
          return this.calc();
        }
      }
    };

    Grid.prototype.transY = function(y) {
      if (!this.options.horizontal) {
        return this.bottom - (y - this.ymin) * this.dy;
      } else {
        return this.left + (y - this.ymin) * this.dy;
      }
    };

    Grid.prototype.transY2 = function(y) {
      if (!this.options.horizontal) {
        return this.bottom - (y - this.ymin2) * this.dy2;
      } else {
        return this.left + (y - this.ymin2) * this.dy2;
      }
    };

    Grid.prototype.transX = function(x) {
      if (this.data.length === 1) {
        return (this.xStart + this.xEnd) / 2;
      } else {
        return this.xStart + (x - this.xmin) * this.dx;
      }
    };

    Grid.prototype.redraw = function() {
      this.raphael.clear();
      this._calc();
      this.drawGrid();
      this.drawGoals();
      this.drawEvents();
      if (this.draw) {
        return this.draw();
      }
    };

    Grid.prototype.measureText = function(text, angle) {
      var ret, tt;
      if (angle == null) {
        angle = 0;
      }
      tt = this.raphael.text(100, 100, text).attr('font-size', this.options.gridTextSize).attr('font-family', this.options.gridTextFamily).attr('font-weight', this.options.gridTextWeight).rotate(angle);
      ret = tt.getBBox();
      tt.remove();
      return ret;
    };

    Grid.prototype.yAxisFormat = function(label) {
      return this.yLabelFormat(label, 0);
    };

    Grid.prototype.yAxisFormat2 = function(label) {
      return this.yLabelFormat(label, 1000);
    };

    Grid.prototype.yLabelFormat = function(label, i) {
      if (typeof this.options.yLabelFormat === 'function') {
        return this.options.yLabelFormat(label, i);
      } else {
        if (this.options.nbYkeys2 === 0 || (i <= this.options.ykeys.length - this.options.nbYkeys2 - 1)) {
          return "" + this.options.preUnits + (Morris.commas(label)) + this.options.postUnits;
        } else {
          return "" + this.options.preUnits2 + (Morris.commas(label)) + this.options.postUnits2;
        }
      }
    };

    Grid.prototype.getYAxisLabelX = function() {
      if (this.options.yLabelAlign === 'right') {
        return this.left - this.options.padding / 2;
      } else {
        return this.options.padding / 2;
      }
    };

    Grid.prototype.drawGrid = function() {
      var basePos, basePos2, lineY, pos, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3, _ref4, _results;
      if (this.options.grid === false && ((_ref = this.options.axes) !== true && _ref !== 'both' && _ref !== 'y')) {
        return;
      }
      if (!this.options.horizontal) {
        basePos = this.getYAxisLabelX();
        basePos2 = this.right + this.options.padding;
      } else {
        basePos = this.getXAxisLabelY();
        basePos2 = this.top - (this.options.xAxisLabelTopPadding || this.options.padding / 2);
      }
      _ref1 = this.grid;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        lineY = _ref1[_i];
        pos = this.transY(lineY);
        if ((_ref2 = this.options.axes) === true || _ref2 === 'both' || _ref2 === 'y') {
          if (!this.options.horizontal) {
            this.drawYAxisLabel(basePos, pos, this.yAxisFormat(lineY));
          } else {
            this.drawXAxisLabel(pos, basePos, this.yAxisFormat(lineY));
          }
        }
        if (this.options.grid) {
          pos = Math.floor(pos) + 0.5;
          if (!this.options.horizontal) {
            this.drawGridLine("M" + this.xStart + "," + pos + "H" + this.xEnd);
          } else {
            this.drawGridLine("M" + pos + "," + this.xStart + "V" + this.xEnd);
          }
        }
      }
      if (this.options.nbYkeys2 > 0) {
        _ref3 = this.grid2;
        _results = [];
        for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
          lineY = _ref3[_j];
          pos = this.transY2(lineY);
          if ((_ref4 = this.options.axes) === true || _ref4 === 'both' || _ref4 === 'y') {
            if (!this.options.horizontal) {
              _results.push(this.drawYAxisLabel(basePos2, pos, this.yAxisFormat2(lineY)));
            } else {
              _results.push(this.drawXAxisLabel(pos, basePos2, this.yAxisFormat2(lineY)));
            }
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };

    Grid.prototype.drawGoals = function() {
      var color, goal, i, _i, _len, _ref, _results;
      _ref = this.options.goals;
      _results = [];
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        goal = _ref[i];
        color = this.options.goalLineColors[i % this.options.goalLineColors.length];
        _results.push(this.drawGoal(goal, color));
      }
      return _results;
    };

    Grid.prototype.drawEvents = function() {
      var color, event, i, _i, _len, _ref, _results;
      _ref = this.events;
      _results = [];
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        event = _ref[i];
        color = this.options.eventLineColors[i % this.options.eventLineColors.length];
        _results.push(this.drawEvent(event, color));
      }
      return _results;
    };

    Grid.prototype.drawGoal = function(goal, color) {
      var path, y;
      y = Math.floor(this.transY(goal)) + 0.5;
      if (!this.options.horizontal) {
        path = "M" + this.xStart + "," + y + "H" + this.xEnd;
      } else {
        path = "M" + y + "," + this.xStart + "V" + this.xEnd;
      }
      return this.raphael.path(path).attr('stroke', color).attr('stroke-width', this.options.goalStrokeWidth);
    };

    Grid.prototype.drawEvent = function(event, color) {
      var from, path, to, x;
      if (event instanceof Array) {
        from = event[0], to = event[1];
        from = Math.floor(this.transX(from)) + 0.5;
        to = Math.floor(this.transX(to)) + 0.5;
        if (!this.options.horizontal) {
          return this.raphael.rect(from, this.yEnd, to - from, this.yStart - this.yEnd).attr({
            fill: color,
            stroke: false
          }).toBack();
        } else {
          return this.raphael.rect(this.yStart, from, this.yEnd - this.yStart, to - from).attr({
            fill: color,
            stroke: false
          }).toBack();
        }
      } else {
        x = Math.floor(this.transX(event)) + 0.5;
        if (!this.options.horizontal) {
          path = "M" + x + "," + this.yStart + "V" + this.yEnd;
        } else {
          path = "M" + this.yStart + "," + x + "H" + this.yEnd;
        }
        return this.raphael.path(path).attr('stroke', color).attr('stroke-width', this.options.eventStrokeWidth);
      }
    };

    Grid.prototype.drawYAxisLabel = function(xPos, yPos, text) {
      var label;
      label = this.raphael.text(xPos, yPos, text).attr('font-size', this.options.gridTextSize).attr('font-family', this.options.gridTextFamily).attr('font-weight', this.options.gridTextWeight).attr('fill', this.options.gridTextColor);
      if (this.options.yLabelAlign === 'right') {
        return label.attr('text-anchor', 'end');
      } else {
        return label.attr('text-anchor', 'start');
      }
    };

    Grid.prototype.drawXAxisLabel = function(xPos, yPos, text) {
      return this.raphael.text(xPos, yPos, text).attr('font-size', this.options.gridTextSize).attr('font-family', this.options.gridTextFamily).attr('font-weight', this.options.gridTextWeight).attr('fill', this.options.gridTextColor);
    };

    Grid.prototype.drawGridLine = function(path) {
      return this.raphael.path(path).attr('stroke', this.options.gridLineColor).attr('stroke-width', this.options.gridStrokeWidth);
    };

    Grid.prototype.startRange = function(x) {
      this.hover.hide();
      this.selectFrom = x;
      return this.selectionRect.attr({
        x: x,
        width: 0
      }).show();
    };

    Grid.prototype.endRange = function(x) {
      var end, start;
      if (this.selectFrom) {
        start = Math.min(this.selectFrom, x);
        end = Math.max(this.selectFrom, x);
        this.options.rangeSelect.call(this.el, {
          start: this.data[this.hitTest(start)].x,
          end: this.data[this.hitTest(end)].x
        });
        return this.selectFrom = null;
      }
    };

    Grid.prototype.resizeHandler = function() {
      var height, width, _ref;
      this.timeoutId = null;
      _ref = Morris.dimensions(this.el), width = _ref.width, height = _ref.height;
      this.raphael.setSize(width, height);
      return this.redraw();
    };

    Grid.prototype.hasToShow = function(i) {
      return this.options.shown === true || this.options.shown[i] === true;
    };

    return Grid;

  })(Morris.EventEmitter);

  Morris.parseDate = function(date) {
    var isecs, m, msecs, n, o, offsetmins, p, q, r, ret, secs;
    if (typeof date === 'number') {
      return date;
    }
    m = date.match(/^(\d+) Q(\d)$/);
    n = date.match(/^(\d+)-(\d+)$/);
    o = date.match(/^(\d+)-(\d+)-(\d+)$/);
    p = date.match(/^(\d+) W(\d+)$/);
    q = date.match(/^(\d+)-(\d+)-(\d+)[ T](\d+):(\d+)(Z|([+-])(\d\d):?(\d\d))?$/);
    r = date.match(/^(\d+)-(\d+)-(\d+)[ T](\d+):(\d+):(\d+(\.\d+)?)(Z|([+-])(\d\d):?(\d\d))?$/);
    if (m) {
      return new Date(parseInt(m[1], 10), parseInt(m[2], 10) * 3 - 1, 1).getTime();
    } else if (n) {
      return new Date(parseInt(n[1], 10), parseInt(n[2], 10) - 1, 1).getTime();
    } else if (o) {
      return new Date(parseInt(o[1], 10), parseInt(o[2], 10) - 1, parseInt(o[3], 10)).getTime();
    } else if (p) {
      ret = new Date(parseInt(p[1], 10), 0, 1);
      if (ret.getDay() !== 4) {
        ret.setMonth(0, 1 + ((4 - ret.getDay()) + 7) % 7);
      }
      return ret.getTime() + parseInt(p[2], 10) * 604800000;
    } else if (q) {
      if (!q[6]) {
        return new Date(parseInt(q[1], 10), parseInt(q[2], 10) - 1, parseInt(q[3], 10), parseInt(q[4], 10), parseInt(q[5], 10)).getTime();
      } else {
        offsetmins = 0;
        if (q[6] !== 'Z') {
          offsetmins = parseInt(q[8], 10) * 60 + parseInt(q[9], 10);
          if (q[7] === '+') {
            offsetmins = 0 - offsetmins;
          }
        }
        return Date.UTC(parseInt(q[1], 10), parseInt(q[2], 10) - 1, parseInt(q[3], 10), parseInt(q[4], 10), parseInt(q[5], 10) + offsetmins);
      }
    } else if (r) {
      secs = parseFloat(r[6]);
      isecs = Math.floor(secs);
      msecs = Math.round((secs - isecs) * 1000);
      if (!r[8]) {
        return new Date(parseInt(r[1], 10), parseInt(r[2], 10) - 1, parseInt(r[3], 10), parseInt(r[4], 10), parseInt(r[5], 10), isecs, msecs).getTime();
      } else {
        offsetmins = 0;
        if (r[8] !== 'Z') {
          offsetmins = parseInt(r[10], 10) * 60 + parseInt(r[11], 10);
          if (r[9] === '+') {
            offsetmins = 0 - offsetmins;
          }
        }
        return Date.UTC(parseInt(r[1], 10), parseInt(r[2], 10) - 1, parseInt(r[3], 10), parseInt(r[4], 10), parseInt(r[5], 10) + offsetmins, isecs, msecs);
      }
    } else {
      return new Date(parseInt(date, 10), 0, 1).getTime();
    }
  };

  Morris.Hover = (function() {
    Hover.defaults = {
      "class": 'morris-hover morris-default-style'
    };

    function Hover(options) {
      if (options == null) {
        options = {};
      }
      this.options = Morris.extend({}, Morris.Hover.defaults, options);
      this.el = document.createElement('div');
      this.el.className = this.options["class"];
      this.el.style.display = 'none';
      (this.options.parent = this.options.parent[0] || this.options.parent).appendChild(this.el);
    }

    Hover.prototype.update = function(html, x, y, centre_y) {
      if (!html) {
        return this.hide();
      } else {
        this.html(html);
        this.show();
        return this.moveTo(x, y, centre_y);
      }
    };

    Hover.prototype.html = function(content) {
      return this.el.innerHTML = content;
    };

    Hover.prototype.moveTo = function(x, y, centre_y) {
      var hoverHeight, hoverWidth, left, parentHeight, parentWidth, rect, top, _ref;
      _ref = Morris.innerDimensions(this.options.parent), parentWidth = _ref.width, parentHeight = _ref.height;
      hoverWidth = this.el.offsetWidth;
      hoverHeight = this.el.offsetHeight;
      left = Math.min(Math.max(0, x - hoverWidth / 2), parentWidth - hoverWidth);
      if (y != null) {
        if (centre_y === true) {
          top = y - hoverHeight / 2;
          if (top < 0) {
            top = 0;
          }
        } else {
          top = y - hoverHeight - 10;
          if (top < 0) {
            top = y + 10;
            if (top + hoverHeight > parentHeight) {
              top = parentHeight / 2 - hoverHeight / 2;
            }
          }
        }
      } else {
        top = parentHeight / 2 - hoverHeight / 2;
      }
      rect = document.getElementById(this.options.parent.id).getBoundingClientRect();
      this.el.style.left = parseFloat(left + rect.left + window.scrollX) + "px";
      return this.el.style.top = parseFloat(parseInt(top) + rect.top + window.scrollY) + "px";
    };

    Hover.prototype.show = function() {
      return this.el.style.display = '';
    };

    Hover.prototype.hide = function() {
      return this.el.style.display = 'none';
    };

    return Hover;

  })();

  Morris.Line = (function(_super) {
    __extends(Line, _super);

    function Line(options) {
      this.hilight = __bind(this.hilight, this);
      this.onHoverOut = __bind(this.onHoverOut, this);
      this.onHoverMove = __bind(this.onHoverMove, this);
      this.onGridClick = __bind(this.onGridClick, this);
      if (!(this instanceof Morris.Line)) {
        return new Morris.Line(options);
      }
      Line.__super__.constructor.call(this, options);
    }

    Line.prototype.init = function() {
      if (this.options.hideHover !== 'always') {
        this.hover = new Morris.Hover({
          parent: this.el
        });
        this.on('hovermove', this.onHoverMove);
        this.on('hoverout', this.onHoverOut);
        return this.on('gridclick', this.onGridClick);
      }
    };

    Line.prototype.defaults = {
      lineWidth: 3,
      pointSize: 4,
      lineColors: ['#2f7df6', '#53a351', '#f6c244', '#cb444a', '#4aa0b5', '#222529'],
      pointStrokeWidths: [1],
      pointStrokeColors: ['#ffffff'],
      pointFillColors: [],
      smooth: true,
      shown: true,
      xLabels: 'auto',
      xLabelFormat: null,
      xLabelMargin: 24,
      verticalGrid: false,
      verticalGridHeight: 'full',
      verticalGridStartOffset: 0,
      hideHover: false,
      trendLine: false,
      trendLineWidth: 2,
      trendLineWeight: false,
      trendLineColors: ['#689bc3', '#a2b3bf', '#64b764']
    };

    Line.prototype.calc = function() {
      this.calcPoints();
      return this.generatePaths();
    };

    Line.prototype.calcPoints = function() {
      var i, ii, row, y, _i, _len, _ref, _results;
      _ref = this.data;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        row._x = this.transX(row.x);
        row._y = (function() {
          var _j, _len1, _ref1, _results1;
          _ref1 = row.y;
          _results1 = [];
          for (ii = _j = 0, _len1 = _ref1.length; _j < _len1; ii = ++_j) {
            y = _ref1[ii];
            if (ii < this.options.ykeys.length - this.options.nbYkeys2) {
              if (y != null) {
                _results1.push(this.transY(y));
              } else {
                _results1.push(y);
              }
            } else {
              _results1.push(void 0);
            }
          }
          return _results1;
        }).call(this);
        row._y2 = (function() {
          var _j, _len1, _ref1, _results1;
          _ref1 = row.y;
          _results1 = [];
          for (ii = _j = 0, _len1 = _ref1.length; _j < _len1; ii = ++_j) {
            y = _ref1[ii];
            if (ii >= this.options.ykeys.length - this.options.nbYkeys2) {
              if (y != null) {
                _results1.push(this.transY2(y));
              } else {
                _results1.push(null);
              }
            } else {
              _results1.push(void 0);
            }
          }
          return _results1;
        }).call(this);
        _results.push(row._ymax = Math.min.apply(Math, [this.bottom].concat((function() {
          var _j, _len1, _ref1, _results1;
          _ref1 = row._y;
          _results1 = [];
          for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
            y = _ref1[i];
            if ((y != null) && this.hasToShow(i)) {
              _results1.push(y);
            }
          }
          return _results1;
        }).call(this))));
      }
      return _results;
    };

    Line.prototype.hitTest = function(x) {
      var index, r, _i, _len, _ref;
      if (this.data.length === 0) {
        return null;
      }
      _ref = this.data.slice(1);
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        r = _ref[index];
        if (x < (r._x + this.data[index]._x) / 2) {
          break;
        }
      }
      return index;
    };

    Line.prototype.onGridClick = function(x, y) {
      var index;
      index = this.hitTest(x);
      return this.fire('click', index, this.data[index].src, x, y);
    };

    Line.prototype.onHoverMove = function(x, y) {
      var index;
      index = this.hitTest(x);
      return this.displayHoverForRow(index);
    };

    Line.prototype.onHoverOut = function() {
      if (this.options.hideHover !== false) {
        return this.displayHoverForRow(null);
      }
    };

    Line.prototype.displayHoverForRow = function(index) {
      var _ref;
      if (index != null) {
        (_ref = this.hover).update.apply(_ref, this.hoverContentForRow(index));
        return this.hilight(index);
      } else {
        this.hover.hide();
        return this.hilight();
      }
    };

    Line.prototype.hoverContentForRow = function(index) {
      var content, j, row, y, _i, _len, _ref;
      row = this.data[index];
      content = "";
      _ref = row.y;
      for (j = _i = 0, _len = _ref.length; _i < _len; j = ++_i) {
        y = _ref[j];
        if (this.options.labels[j] === false) {
          continue;
        }
        content = ("<div class='morris-hover-point' style='color: " + (this.colorFor(row, j, 'label')) + "'>\n  " + this.options.labels[j] + ":\n  " + (this.yLabelFormat(y, j)) + "\n</div>") + content;
      }
      content = ("<div class='morris-hover-row-label'>" + row.label + "</div>") + content;
      if (typeof this.options.hoverCallback === 'function') {
        content = this.options.hoverCallback(index, this.options, content, row.src);
      }
      return [content, row._x, row._ymax];
    };

    Line.prototype.generatePaths = function() {
      var coords, i, nb, r, smooth;
      return this.paths = (function() {
        var _i, _ref, _ref1, _results;
        _results = [];
        for (i = _i = 0, _ref = this.options.ykeys.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          smooth = typeof this.options.smooth === "boolean" ? this.options.smooth : (_ref1 = this.options.ykeys[i], __indexOf.call(this.options.smooth, _ref1) >= 0);
          nb = this.options.ykeys.length - this.options.nbYkeys2;
          if (i < nb) {
            coords = (function() {
              var _j, _len, _ref2, _results1;
              _ref2 = this.data;
              _results1 = [];
              for (_j = 0, _len = _ref2.length; _j < _len; _j++) {
                r = _ref2[_j];
                if (r._y[i] !== void 0) {
                  _results1.push({
                    x: r._x,
                    y: r._y[i]
                  });
                }
              }
              return _results1;
            }).call(this);
          } else {
            coords = (function() {
              var _j, _len, _ref2, _results1;
              _ref2 = this.data;
              _results1 = [];
              for (_j = 0, _len = _ref2.length; _j < _len; _j++) {
                r = _ref2[_j];
                if (r._y2 !== void 0) {
                  _results1.push({
                    x: r._x,
                    y: r._y2[i]
                  });
                }
              }
              return _results1;
            }).call(this);
          }
          if (coords.length > 1) {
            _results.push(Morris.Line.createPath(coords, smooth, this.bottom));
          } else {
            _results.push(null);
          }
        }
        return _results;
      }).call(this);
    };

    Line.prototype.draw = function() {
      var _ref;
      if ((_ref = this.options.axes) === true || _ref === 'both' || _ref === 'x') {
        this.drawXAxis();
      }
      this.drawSeries();
      if (this.options.hideHover === false) {
        return this.displayHoverForRow(this.data.length - 1);
      }
    };

    Line.prototype.drawXAxis = function() {
      var drawLabel, l, labels, lines, prevAngleMargin, prevLabelMargin, row, ypos, _i, _j, _len, _len1, _results,
        _this = this;
      ypos = this.bottom + this.options.padding / 2;
      prevLabelMargin = null;
      prevAngleMargin = null;
      drawLabel = function(labelText, xpos) {
        var label, labelBox, margin, offset, textBox;
        label = _this.drawXAxisLabel(_this.transX(xpos), ypos, labelText);
        textBox = label.getBBox();
        label.transform("r" + (-_this.options.xLabelAngle));
        labelBox = label.getBBox();
        label.transform("t0," + (labelBox.height / 2) + "...");
        if (_this.options.xLabelAngle !== 0) {
          offset = -0.5 * textBox.width * Math.cos(_this.options.xLabelAngle * Math.PI / 180.0);
          label.transform("t" + offset + ",0...");
        }
        labelBox = label.getBBox();
        if (((prevLabelMargin == null) || prevLabelMargin >= labelBox.x + labelBox.width || (prevAngleMargin != null) && prevAngleMargin >= labelBox.x) && labelBox.x >= 0 && (labelBox.x + labelBox.width) < Morris.dimensions(_this.el).width) {
          if (_this.options.xLabelAngle !== 0) {
            margin = 1.25 * _this.options.gridTextSize / Math.sin(_this.options.xLabelAngle * Math.PI / 180.0);
            prevAngleMargin = labelBox.x - margin;
          }
          prevLabelMargin = labelBox.x - _this.options.xLabelMargin;
          if (_this.options.verticalGrid === true) {
            return _this.drawVerticalGridLine(xpos);
          }
        } else {
          return label.remove();
        }
      };
      if (this.options.parseTime) {
        if (this.data.length === 1 && this.options.xLabels === 'auto') {
          labels = [[this.data[0].label, this.data[0].x]];
        } else {
          labels = Morris.labelSeries(this.xmin, this.xmax, this.width, this.options.xLabels, this.options.xLabelFormat);
        }
      } else if (this.options.customLabels) {
        labels = (function() {
          var _i, _len, _ref, _results;
          _ref = this.options.customLabels;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            row = _ref[_i];
            _results.push([row.label, row.x]);
          }
          return _results;
        }).call(this);
      } else {
        labels = (function() {
          var _i, _len, _ref, _results;
          _ref = this.data;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            row = _ref[_i];
            _results.push([row.label, row.x]);
          }
          return _results;
        }).call(this);
      }
      labels.reverse();
      for (_i = 0, _len = labels.length; _i < _len; _i++) {
        l = labels[_i];
        drawLabel(l[0], l[1]);
      }
      if (typeof this.options.verticalGrid === 'string') {
        lines = Morris.labelSeries(this.xmin, this.xmax, this.width, this.options.verticalGrid);
        _results = [];
        for (_j = 0, _len1 = lines.length; _j < _len1; _j++) {
          l = lines[_j];
          _results.push(this.drawVerticalGridLine(l[1]));
        }
        return _results;
      }
    };

    Line.prototype.drawVerticalGridLine = function(xpos) {
      var yEnd, yStart;
      xpos = Math.floor(this.transX(xpos)) + 0.5;
      yStart = this.yStart + this.options.verticalGridStartOffset;
      if (this.options.verticalGridHeight === 'full') {
        yEnd = this.yEnd;
      } else {
        yEnd = this.yStart - this.options.verticalGridHeight;
      }
      return this.drawGridLine("M" + xpos + "," + yStart + "V" + yEnd);
    };

    Line.prototype.drawSeries = function() {
      var i, _i, _j, _ref, _ref1, _results;
      this.seriesPoints = [];
      for (i = _i = _ref = this.options.ykeys.length - 1; _ref <= 0 ? _i <= 0 : _i >= 0; i = _ref <= 0 ? ++_i : --_i) {
        if (this.hasToShow(i)) {
          if (this.options.trendLine !== false && this.options.trendLine === true || this.options.trendLine[i] === true) {
            this._drawTrendLine(i);
          }
          this._drawLineFor(i);
        }
      }
      _results = [];
      for (i = _j = _ref1 = this.options.ykeys.length - 1; _ref1 <= 0 ? _j <= 0 : _j >= 0; i = _ref1 <= 0 ? ++_j : --_j) {
        if (this.hasToShow(i)) {
          _results.push(this._drawPointFor(i));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Line.prototype._drawPointFor = function(index) {
      var circle, row, _i, _len, _ref, _results;
      this.seriesPoints[index] = [];
      _ref = this.data;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        circle = null;
        if (row._y[index] != null) {
          circle = this.drawLinePoint(row._x, row._y[index], this.colorFor(row, index, 'point'), index);
          if (this.options.dataLabels) {
            this.drawDataLabel(row._x, row._y[index] - 10, this.yLabelFormat(row.y[index], 0));
          }
        }
        if (row._y2 != null) {
          if (row._y2[index] != null) {
            circle = this.drawLinePoint(row._x, row._y2[index], this.colorFor(row, index, 'point'), index);
            if (this.options.dataLabels) {
              this.drawDataLabel(row._x, row._y2[index] - 10, this.yLabelFormat(row.y[index], 1000));
            }
          }
        }
        _results.push(this.seriesPoints[index].push(circle));
      }
      return _results;
    };

    Line.prototype._drawLineFor = function(index) {
      var path;
      path = this.paths[index];
      if (path !== null) {
        return this.drawLinePath(path, this.colorFor(null, index, 'line'), index);
      }
    };

    Line.prototype._drawTrendLine = function(index) {
      var a, b, data, datapoints, i, path, sum_x, sum_xx, sum_xy, sum_y, val, weight, x, y, _i, _len, _ref;
      sum_x = 0;
      sum_y = 0;
      sum_xx = 0;
      sum_xy = 0;
      datapoints = 0;
      _ref = this.data;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        val = _ref[i];
        x = val.x;
        y = val.y[index];
        if (y != null) {
          if (this.options.trendLineWeight === false) {
            weight = 1;
          } else {
            weight = this.options.data[i][this.options.trendLineWeight];
          }
          datapoints += weight;
          sum_x += x * weight;
          sum_y += y * weight;
          sum_xx += x * x * weight;
          sum_xy += x * y * weight;
        }
      }
      a = (datapoints * sum_xy - sum_x * sum_y) / (datapoints * sum_xx - sum_x * sum_x);
      b = (sum_y / datapoints) - ((a * sum_x) / datapoints);
      data = [{}, {}];
      data[0].x = this.transX(this.data[0].x);
      data[0].y = this.transY(this.data[0].x * a + b);
      data[1].x = this.transX(this.data[this.data.length - 1].x);
      data[1].y = this.transY(this.data[this.data.length - 1].x * a + b);
      path = Morris.Line.createPath(data, false, this.bottom);
      return path = this.raphael.path(path).attr('stroke', this.colorFor(null, index, 'trendLine')).attr('stroke-width', this.options.trendLineWidth);
    };

    Line.createPath = function(coords, smooth, bottom) {
      var coord, g, grads, i, ix, lg, path, prevCoord, x1, x2, y1, y2, _i, _len;
      path = "";
      if (smooth) {
        grads = Morris.Line.gradients(coords);
      }
      prevCoord = {
        y: null
      };
      for (i = _i = 0, _len = coords.length; _i < _len; i = ++_i) {
        coord = coords[i];
        if (coord.y != null) {
          if (prevCoord.y != null) {
            if (smooth) {
              g = grads[i];
              lg = grads[i - 1];
              ix = (coord.x - prevCoord.x) / 4;
              x1 = prevCoord.x + ix;
              y1 = Math.min(bottom, prevCoord.y + ix * lg);
              x2 = coord.x - ix;
              y2 = Math.min(bottom, coord.y - ix * g);
              path += "C" + x1 + "," + y1 + "," + x2 + "," + y2 + "," + coord.x + "," + coord.y;
            } else {
              path += "L" + coord.x + "," + coord.y;
            }
          } else {
            if (!smooth || (grads[i] != null)) {
              path += "M" + coord.x + "," + coord.y;
            }
          }
        }
        prevCoord = coord;
      }
      return path;
    };

    Line.gradients = function(coords) {
      var coord, grad, i, nextCoord, prevCoord, _i, _len, _results;
      grad = function(a, b) {
        return (a.y - b.y) / (a.x - b.x);
      };
      _results = [];
      for (i = _i = 0, _len = coords.length; _i < _len; i = ++_i) {
        coord = coords[i];
        if (coord.y != null) {
          nextCoord = coords[i + 1] || {
            y: null
          };
          prevCoord = coords[i - 1] || {
            y: null
          };
          if ((prevCoord.y != null) && (nextCoord.y != null)) {
            _results.push(grad(prevCoord, nextCoord));
          } else if (prevCoord.y != null) {
            _results.push(grad(prevCoord, coord));
          } else if (nextCoord.y != null) {
            _results.push(grad(coord, nextCoord));
          } else {
            _results.push(null);
          }
        } else {
          _results.push(null);
        }
      }
      return _results;
    };

    Line.prototype.hilight = function(index) {
      var i, _i, _j, _ref, _ref1;
      if (this.prevHilight !== null && this.prevHilight !== index) {
        for (i = _i = 0, _ref = this.seriesPoints.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          if (this.hasToShow(i) && this.seriesPoints[i][this.prevHilight]) {
            this.seriesPoints[i][this.prevHilight].animate(this.pointShrinkSeries(i));
          }
        }
      }
      if (index !== null && this.prevHilight !== index) {
        for (i = _j = 0, _ref1 = this.seriesPoints.length - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
          if (this.hasToShow(i) && this.seriesPoints[i][index]) {
            this.seriesPoints[i][index].animate(this.pointGrowSeries(i));
          }
        }
      }
      return this.prevHilight = index;
    };

    Line.prototype.colorFor = function(row, sidx, type) {
      if (typeof this.options.lineColors === 'function') {
        return this.options.lineColors.call(this, row, sidx, type);
      } else if (type === 'point') {
        return this.options.pointFillColors[sidx % this.options.pointFillColors.length] || this.options.lineColors[sidx % this.options.lineColors.length];
      } else if (type === 'trendLine') {
        return this.options.trendLineColors[sidx % this.options.trendLineColors.length];
      } else {
        return this.options.lineColors[sidx % this.options.lineColors.length];
      }
    };

    Line.prototype.drawDataLabel = function(xPos, yPos, text) {
      var label;
      return label = this.raphael.text(xPos, yPos, text).attr('text-anchor', 'middle').attr('font-size', this.options.dataLabelsSize).attr('font-family', this.options.dataLabelsFamily).attr('font-weight', this.options.dataLabelsWeight).attr('fill', this.options.dataLabelsColor);
    };

    Line.prototype.drawLinePath = function(path, lineColor, lineIndex) {
      var average, rPath, straightDots, straightPath,
        _this = this;
      if (this.options.animate) {
        straightPath = path;
        straightPath = path.replace('A', ',');
        straightPath = straightPath.replace('M', '');
        straightPath = straightPath.replace('C', ',');
        straightDots = straightPath.split(',');
        average = (parseFloat(straightDots[1]) + parseFloat(straightDots[straightDots.length - 1])) / 2;
        straightPath = 'M' + straightDots[0] + ',' + average + ',' + straightDots[straightDots.length - 2] + ',' + average;
        rPath = this.raphael.path(straightPath).attr('stroke', lineColor).attr('stroke-width', this.lineWidthForSeries(lineIndex));
        if (this.options.cumulative) {
          return (function(rPath, path) {
            return rPath.animate({
              path: path
            }, 600, '<>');
          })(rPath, path);
        } else {
          return (function(rPath, path) {
            return rPath.animate({
              path: path
            }, 500, '<>');
          })(rPath, path);
        }
      } else {
        return this.raphael.path(path).attr('stroke', lineColor).attr('stroke-width', this.lineWidthForSeries(lineIndex));
      }
    };

    Line.prototype.drawLinePoint = function(xPos, yPos, pointColor, lineIndex) {
      return this.raphael.circle(xPos, yPos, this.pointSizeForSeries(lineIndex)).attr('fill', pointColor).attr('stroke-width', this.pointStrokeWidthForSeries(lineIndex)).attr('stroke', this.pointStrokeColorForSeries(lineIndex));
    };

    Line.prototype.pointStrokeWidthForSeries = function(index) {
      return this.options.pointStrokeWidths[index % this.options.pointStrokeWidths.length];
    };

    Line.prototype.pointStrokeColorForSeries = function(index) {
      return this.options.pointStrokeColors[index % this.options.pointStrokeColors.length];
    };

    Line.prototype.lineWidthForSeries = function(index) {
      if (this.options.lineWidth instanceof Array) {
        return this.options.lineWidth[index % this.options.lineWidth.length];
      } else {
        return this.options.lineWidth;
      }
    };

    Line.prototype.pointSizeForSeries = function(index) {
      if (this.options.pointSize instanceof Array) {
        return this.options.pointSize[index % this.options.pointSize.length];
      } else {
        return this.options.pointSize;
      }
    };

    Line.prototype.pointGrowSeries = function(index) {
      if (this.pointSizeForSeries(index) === 0) {
        return;
      }
      return Raphael.animation({
        r: this.pointSizeForSeries(index) + 3
      }, 25, 'linear');
    };

    Line.prototype.pointShrinkSeries = function(index) {
      return Raphael.animation({
        r: this.pointSizeForSeries(index)
      }, 25, 'linear');
    };

    return Line;

  })(Morris.Grid);

  Morris.labelSeries = function(dmin, dmax, pxwidth, specName, xLabelFormat) {
    var d, d0, ddensity, name, ret, s, spec, t, _i, _len, _ref;
    ddensity = 200 * (dmax - dmin) / pxwidth;
    d0 = new Date(dmin);
    spec = Morris.LABEL_SPECS[specName];
    if (spec === void 0) {
      _ref = Morris.AUTO_LABEL_ORDER;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        s = Morris.LABEL_SPECS[name];
        if (ddensity >= s.span) {
          spec = s;
          break;
        }
      }
    }
    if (spec === void 0) {
      spec = Morris.LABEL_SPECS["second"];
    }
    if (xLabelFormat) {
      spec = Morris.extend({}, spec, {
        fmt: xLabelFormat
      });
    }
    d = spec.start(d0);
    ret = [];
    while ((t = d.getTime()) <= dmax) {
      if (t >= dmin) {
        ret.push([spec.fmt(d), t]);
      }
      spec.incr(d);
    }
    return ret;
  };

  minutesSpecHelper = function(interval) {
    return {
      span: interval * 60 * 1000,
      start: function(d) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours());
      },
      fmt: function(d) {
        return "" + (Morris.pad2(d.getHours())) + ":" + (Morris.pad2(d.getMinutes()));
      },
      incr: function(d) {
        return d.setUTCMinutes(d.getUTCMinutes() + interval);
      }
    };
  };

  secondsSpecHelper = function(interval) {
    return {
      span: interval * 1000,
      start: function(d) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes());
      },
      fmt: function(d) {
        return "" + (Morris.pad2(d.getHours())) + ":" + (Morris.pad2(d.getMinutes())) + ":" + (Morris.pad2(d.getSeconds()));
      },
      incr: function(d) {
        return d.setUTCSeconds(d.getUTCSeconds() + interval);
      }
    };
  };

  Morris.LABEL_SPECS = {
    "decade": {
      span: 172800000000,
      start: function(d) {
        return new Date(d.getFullYear() - d.getFullYear() % 10, 0, 1);
      },
      fmt: function(d) {
        return "" + (d.getFullYear());
      },
      incr: function(d) {
        return d.setFullYear(d.getFullYear() + 10);
      }
    },
    "year": {
      span: 17280000000,
      start: function(d) {
        return new Date(d.getFullYear(), 0, 1);
      },
      fmt: function(d) {
        return "" + (d.getFullYear());
      },
      incr: function(d) {
        return d.setFullYear(d.getFullYear() + 1);
      }
    },
    "month": {
      span: 2419200000,
      start: function(d) {
        return new Date(d.getFullYear(), d.getMonth(), 1);
      },
      fmt: function(d) {
        return "" + (d.getFullYear()) + "-" + (Morris.pad2(d.getMonth() + 1));
      },
      incr: function(d) {
        return d.setMonth(d.getMonth() + 1);
      }
    },
    "week": {
      span: 604800000,
      start: function(d) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      },
      fmt: function(d) {
        return "" + (d.getFullYear()) + "-" + (Morris.pad2(d.getMonth() + 1)) + "-" + (Morris.pad2(d.getDate()));
      },
      incr: function(d) {
        return d.setDate(d.getDate() + 7);
      }
    },
    "day": {
      span: 86400000,
      start: function(d) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      },
      fmt: function(d) {
        return "" + (d.getFullYear()) + "-" + (Morris.pad2(d.getMonth() + 1)) + "-" + (Morris.pad2(d.getDate()));
      },
      incr: function(d) {
        return d.setDate(d.getDate() + 1);
      }
    },
    "hour": minutesSpecHelper(60),
    "30min": minutesSpecHelper(30),
    "15min": minutesSpecHelper(15),
    "10min": minutesSpecHelper(10),
    "5min": minutesSpecHelper(5),
    "minute": minutesSpecHelper(1),
    "30sec": secondsSpecHelper(30),
    "15sec": secondsSpecHelper(15),
    "10sec": secondsSpecHelper(10),
    "5sec": secondsSpecHelper(5),
    "second": secondsSpecHelper(1)
  };

  Morris.AUTO_LABEL_ORDER = ["decade", "year", "month", "week", "day", "hour", "30min", "15min", "10min", "5min", "minute", "30sec", "15sec", "10sec", "5sec", "second"];

  Morris.Area = (function(_super) {
    var areaDefaults;

    __extends(Area, _super);

    areaDefaults = {
      fillOpacity: 'auto',
      behaveLikeLine: false
    };

    function Area(options) {
      var areaOptions;
      if (!(this instanceof Morris.Area)) {
        return new Morris.Area(options);
      }
      areaOptions = Morris.extend({}, areaDefaults, options);
      this.cumulative = !areaOptions.behaveLikeLine;
      if (areaOptions.fillOpacity === 'auto') {
        areaOptions.fillOpacity = areaOptions.behaveLikeLine ? .8 : 1;
      }
      Area.__super__.constructor.call(this, areaOptions);
    }

    Area.prototype.calcPoints = function() {
      var row, total, y, _i, _len, _ref, _results;
      _ref = this.data;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        row._x = this.transX(row.x);
        total = 0;
        row._y = (function() {
          var _j, _len1, _ref1, _results1;
          _ref1 = row.y;
          _results1 = [];
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            y = _ref1[_j];
            if (this.options.behaveLikeLine) {
              _results1.push(this.transY(y));
            } else {
              total += y || 0;
              _results1.push(this.transY(total));
            }
          }
          return _results1;
        }).call(this);
        _results.push(row._ymax = Math.max.apply(Math, row._y));
      }
      return _results;
    };

    Area.prototype.drawSeries = function() {
      var i, range, _i, _j, _k, _len, _ref, _ref1, _results, _results1, _results2;
      this.seriesPoints = [];
      if (this.options.behaveLikeLine) {
        range = (function() {
          _results = [];
          for (var _i = 0, _ref = this.options.ykeys.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this);
      } else {
        range = (function() {
          _results1 = [];
          for (var _j = _ref1 = this.options.ykeys.length - 1; _ref1 <= 0 ? _j <= 0 : _j >= 0; _ref1 <= 0 ? _j++ : _j--){ _results1.push(_j); }
          return _results1;
        }).apply(this);
      }
      _results2 = [];
      for (_k = 0, _len = range.length; _k < _len; _k++) {
        i = range[_k];
        this._drawFillFor(i);
        this._drawLineFor(i);
        _results2.push(this._drawPointFor(i));
      }
      return _results2;
    };

    Area.prototype._drawFillFor = function(index) {
      var path;
      path = this.paths[index];
      if (path !== null) {
        path = path + ("L" + (this.transX(this.xmax)) + "," + this.bottom + "L" + (this.transX(this.xmin)) + "," + this.bottom + "Z");
        return this.drawFilledPath(path, this.fillForSeries(index));
      }
    };

    Area.prototype.fillForSeries = function(i) {
      var color;
      color = Raphael.rgb2hsl(this.colorFor(this.data[i], i, 'line'));
      return Raphael.hsl(color.h, this.options.behaveLikeLine ? color.s * 0.9 : color.s * 0.75, Math.min(0.98, this.options.behaveLikeLine ? color.l * 1.2 : color.l * 1.25));
    };

    Area.prototype.drawFilledPath = function(path, fill) {
      var average, rPath, straightDots, straightPath,
        _this = this;
      if (this.options.animate) {
        straightPath = path.replace('A', ',');
        straightPath = straightPath.replace('M', '');
        straightPath = straightPath.replace('C', ',');
        straightPath = straightPath.replace('L', ',');
        straightPath = straightPath.replace('L', ',');
        straightPath = straightPath.replace('Z', '');
        straightDots = straightPath.split(',');
        average = (parseFloat(straightDots[straightDots.length - 4]) + parseFloat(straightDots[straightDots.length - 2])) / 2;
        straightPath = 'M' + average + ',' + straightDots[straightDots.length - 1] + ',L' + straightDots[straightDots.length - 2] + ',' + straightDots[straightDots.length - 1] + 'Z';
        rPath = this.raphael.path(straightPath).attr('fill', fill).attr('fill-opacity', this.options.fillOpacity).attr('stroke', 'none');
        return (function(rPath, path) {
          return rPath.animate({
            path: path
          }, 500, '<>');
        })(rPath, path);
      } else {
        return this.raphael.path(path).attr('fill', fill).attr('fill-opacity', this.options.fillOpacity).attr('stroke', 'none');
      }
    };

    return Area;

  })(Morris.Line);

  Morris.Bar = (function(_super) {
    __extends(Bar, _super);

    function Bar(options) {
      this.onHoverOut = __bind(this.onHoverOut, this);
      this.onHoverMove = __bind(this.onHoverMove, this);
      this.onGridClick = __bind(this.onGridClick, this);
      if (!(this instanceof Morris.Bar)) {
        return new Morris.Bar(options);
      }
      Bar.__super__.constructor.call(this, Morris.extend({}, options, {
        parseTime: false
      }));
    }

    Bar.prototype.init = function() {
      this.cumulative = this.options.stacked;
      if (this.options.hideHover !== 'always') {
        this.hover = new Morris.Hover({
          parent: this.el
        });
        this.on('hovermove', this.onHoverMove);
        this.on('hoverout', this.onHoverOut);
        return this.on('gridclick', this.onGridClick);
      }
    };

    Bar.prototype.defaults = {
      barSizeRatio: 0.75,
      barGap: 3,
      barColors: ['#2f7df6', '#53a351', '#f6c244', '#cb444a', '#4aa0b5', '#222529'],
      barOpacity: 1.0,
      barHighlightOpacity: 1.0,
      highlightSpeed: 150,
      barRadius: [0, 0, 0, 0],
      xLabelMargin: 50,
      horizontal: false,
      stacked: false,
      shown: true,
      inBarValue: false,
      inBarValueTextColor: 'white',
      inBarValueMinTopMargin: 1,
      inBarValueRightMargin: 4
    };

    Bar.prototype.calc = function() {
      var _ref;
      this.calcBars();
      if (this.options.hideHover === false) {
        return (_ref = this.hover).update.apply(_ref, this.hoverContentForRow(this.data.length - 1));
      }
    };

    Bar.prototype.calcBars = function() {
      var idx, ii, row, y, _i, _len, _ref, _results;
      _ref = this.data;
      _results = [];
      for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
        row = _ref[idx];
        row._x = this.xStart + this.xSize * (idx + 0.5) / this.data.length;
        row._y = (function() {
          var _j, _len1, _ref1, _results1;
          _ref1 = row.y;
          _results1 = [];
          for (ii = _j = 0, _len1 = _ref1.length; _j < _len1; ii = ++_j) {
            y = _ref1[ii];
            if (ii < this.options.ykeys.length - this.options.nbYkeys2) {
              if (y != null) {
                _results1.push(this.transY(y));
              } else {
                _results1.push(null);
              }
            } else {
              _results1.push(void 0);
            }
          }
          return _results1;
        }).call(this);
        _results.push(row._y2 = (function() {
          var _j, _len1, _ref1, _results1;
          _ref1 = row.y;
          _results1 = [];
          for (ii = _j = 0, _len1 = _ref1.length; _j < _len1; ii = ++_j) {
            y = _ref1[ii];
            if (ii >= this.options.ykeys.length - this.options.nbYkeys2) {
              if (y != null) {
                _results1.push(this.transY2(y));
              } else {
                _results1.push(null);
              }
            } else {
              _results1.push(void 0);
            }
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    Bar.prototype.draw = function() {
      var _ref;
      if ((_ref = this.options.axes) === true || _ref === 'both' || _ref === 'x') {
        this.drawXAxis();
      }
      this.drawSeries();
      this.drawBarLine();
      return this.drawBarPoints();
    };

    Bar.prototype.drawBarLine = function() {
      var average, coord, coords, dim, g, grads, i, ii, ix, lg, nb, path, prevCoord, r, rPath, straightDots, straightPath, x1, x2, y1, y2, _i, _j, _len, _len1, _ref, _results,
        _this = this;
      nb = this.options.ykeys.length - this.options.nbYkeys2;
      _ref = this.options.ykeys.slice(nb, this.options.ykeys.length);
      _results = [];
      for (ii = _i = 0, _len = _ref.length; _i < _len; ii = _i += 1) {
        dim = _ref[ii];
        path = "";
        if (this.options.horizontal === !true) {
          coords = (function() {
            var _j, _len1, _ref1, _results1;
            _ref1 = this.data;
            _results1 = [];
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              r = _ref1[_j];
              if (r._y2[nb + ii] !== void 0) {
                _results1.push({
                  x: r._x,
                  y: r._y2[nb + ii]
                });
              }
            }
            return _results1;
          }).call(this);
        } else {
          coords = (function() {
            var _j, _len1, _ref1, _results1;
            _ref1 = this.data;
            _results1 = [];
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              r = _ref1[_j];
              if (r._y2[nb + ii] !== void 0) {
                _results1.push({
                  x: r._y2[nb + ii],
                  y: r._x
                });
              }
            }
            return _results1;
          }).call(this);
        }
        if (this.options.smooth) {
          grads = Morris.Line.gradients(coords);
        }
        prevCoord = {
          y: null
        };
        for (i = _j = 0, _len1 = coords.length; _j < _len1; i = ++_j) {
          coord = coords[i];
          if (coord.y != null) {
            if (prevCoord.y != null) {
              if (this.options.smooth && this.options.horizontal === !true) {
                g = grads[i];
                lg = grads[i - 1];
                ix = (coord.x - prevCoord.x) / 4;
                x1 = prevCoord.x + ix;
                y1 = Math.min(this.bottom, prevCoord.y + ix * lg);
                x2 = coord.x - ix;
                y2 = Math.min(this.bottom, coord.y - ix * g);
                path += "C" + x1 + "," + y1 + "," + x2 + "," + y2 + "," + coord.x + "," + coord.y;
              } else {
                path += "L" + coord.x + "," + coord.y;
              }
            } else {
              if (!this.options.smooth || (grads[i] != null)) {
                path += "M" + coord.x + "," + coord.y;
              }
            }
          }
          prevCoord = coord;
        }
        if (this.options.animate) {
          straightPath = path;
          straightPath = path.replace('A', ',');
          straightPath = straightPath.replace('M', '');
          straightPath = straightPath.replace('C', ',');
          straightDots = straightPath.split(',');
          average = (parseFloat(straightDots[1]) + parseFloat(straightDots[straightDots.length - 1])) / 2;
          straightPath = 'M' + straightDots[0] + ',' + average + ',' + straightDots[straightDots.length - 2] + ',' + average;
          rPath = this.raphael.path(straightPath).attr('stroke', this.options.barColors[nb + ii]).attr('stroke-width', 3);
          _results.push((function(rPath, path) {
            return rPath.animate({
              path: path
            }, 500, '<>');
          })(rPath, path));
        } else {
          _results.push(rPath = this.raphael.path(path).attr('stroke', this.options.barColors[nb + ii]).attr('stroke-width', 3));
        }
      }
      return _results;
    };

    Bar.prototype.drawBarPoints = function() {
      var dim, idx, ii, nb, row, _i, _len, _ref, _results;
      nb = this.options.ykeys.length - this.options.nbYkeys2;
      _ref = this.options.ykeys.slice(nb, this.options.ykeys.length);
      _results = [];
      for (ii = _i = 0, _len = _ref.length; _i < _len; ii = _i += 1) {
        dim = _ref[ii];
        _results.push((function() {
          var _j, _len1, _ref1, _results1;
          _ref1 = this.data;
          _results1 = [];
          for (idx = _j = 0, _len1 = _ref1.length; _j < _len1; idx = ++_j) {
            row = _ref1[idx];
            if (row._y2[nb + ii] != null) {
              if (this.options.horizontal === !true) {
                this.raphael.circle(row._x, row._y2[nb + ii], 4).attr('fill', this.options.barColors[nb + ii]).attr('stroke-width', 1).attr('stroke', '#ffffff');
              } else {
                this.raphael.circle(row._y2[nb + ii], row._x, 4).attr('fill', this.options.barColors[nb + ii]).attr('stroke-width', 1).attr('stroke', '#ffffff');
              }
              if (this.options.dataLabels) {
                if (this.options.horizontal === !true) {
                  _results1.push(this.drawDataLabel(row._x, row._y2[nb + ii] - 10, this.yLabelFormat(row.y[nb + ii])));
                } else {
                  _results1.push(this.drawDataLabelExt(row._y2[nb + ii] + 10, row._x, this.yLabelFormat(row.y[nb + ii]), 'start'));
                }
              } else {
                _results1.push(void 0);
              }
            } else {
              _results1.push(void 0);
            }
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    Bar.prototype.drawXAxis = function() {
      var angle, basePos, height, i, label, labelBox, margin, maxSize, offset, prevAngleMargin, prevLabelMargin, row, size, startPos, textBox, width, _i, _ref, _ref1, _results;
      if (!this.options.horizontal) {
        basePos = this.getXAxisLabelY();
      } else {
        basePos = this.getYAxisLabelX();
      }
      prevLabelMargin = null;
      prevAngleMargin = null;
      _results = [];
      for (i = _i = 0, _ref = this.data.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        row = this.data[this.data.length - 1 - i];
        if (!this.options.horizontal) {
          label = this.drawXAxisLabel(row._x, basePos, row.label);
        } else {
          label = this.drawYAxisLabel(basePos, row._x - 0.5 * this.options.gridTextSize, row.label);
        }
        if (!this.options.horizontal) {
          angle = this.options.xLabelAngle;
        } else {
          angle = 0;
        }
        textBox = label.getBBox();
        label.transform("r" + (-angle));
        labelBox = label.getBBox();
        label.transform("t0," + (labelBox.height / 2) + "...");
        if (angle !== 0) {
          offset = -0.5 * textBox.width * Math.cos(angle * Math.PI / 180.0);
          label.transform("t" + offset + ",0...");
        }
        _ref1 = Morris.dimensions(this.el), width = _ref1.width, height = _ref1.height;
        if (!this.options.horizontal) {
          startPos = labelBox.x;
          size = labelBox.width;
          maxSize = width;
        } else {
          startPos = labelBox.y;
          size = labelBox.height;
          maxSize = height;
        }
        if (((prevLabelMargin == null) || prevLabelMargin >= startPos + size || (prevAngleMargin != null) && prevAngleMargin >= startPos) && startPos >= 0 && (startPos + size) < maxSize) {
          if (angle !== 0) {
            margin = 1.25 * this.options.gridTextSize / Math.sin(angle * Math.PI / 180.0);
            prevAngleMargin = startPos - margin;
          }
          if (!this.options.horizontal) {
            _results.push(prevLabelMargin = startPos - this.options.xLabelMargin);
          } else {
            _results.push(prevLabelMargin = startPos);
          }
        } else {
          _results.push(label.remove());
        }
      }
      return _results;
    };

    Bar.prototype.getXAxisLabelY = function() {
      return this.bottom + (this.options.xAxisLabelTopPadding || this.options.padding / 2);
    };

    Bar.prototype.drawSeries = function() {
      var barMiddle, barWidth, bottom, depth, groupWidth, i, idx, lastTop, left, leftPadding, nb, numBars, row, sidx, size, spaceLeft, top, ypos, zeroPos, _i, _ref;
      this.seriesBars = [];
      groupWidth = this.xSize / this.options.data.length;
      if (this.options.stacked) {
        numBars = 1;
      } else {
        numBars = 0;
        for (i = _i = 0, _ref = this.options.ykeys.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          if (this.hasToShow(i)) {
            numBars += 1;
          }
        }
      }
      if (this.options.stacked === !true) {
        numBars = numBars - this.options.nbYkeys2;
      }
      barWidth = (groupWidth * this.options.barSizeRatio - this.options.barGap * (numBars - 1)) / numBars;
      if (this.options.barSize) {
        barWidth = Math.min(barWidth, this.options.barSize);
      }
      spaceLeft = groupWidth - barWidth * numBars - this.options.barGap * (numBars - 1);
      leftPadding = spaceLeft / 2;
      zeroPos = this.ymin <= 0 && this.ymax >= 0 ? this.transY(0) : null;
      return this.bars = (function() {
        var _j, _len, _ref1, _results;
        _ref1 = this.data;
        _results = [];
        for (idx = _j = 0, _len = _ref1.length; _j < _len; idx = ++_j) {
          row = _ref1[idx];
          this.seriesBars[idx] = [];
          lastTop = 0;
          nb = row._y.length - this.options.nbYkeys2;
          _results.push((function() {
            var _k, _len1, _ref2, _results1;
            _ref2 = row._y.slice(0, nb);
            _results1 = [];
            for (sidx = _k = 0, _len1 = _ref2.length; _k < _len1; sidx = ++_k) {
              ypos = _ref2[sidx];
              if (!this.hasToShow(sidx)) {
                continue;
              }
              if (ypos !== null) {
                if (zeroPos) {
                  top = Math.min(ypos, zeroPos);
                  bottom = Math.max(ypos, zeroPos);
                } else {
                  top = ypos;
                  bottom = this.bottom;
                }
                left = this.xStart + idx * groupWidth + leftPadding;
                if (!this.options.stacked) {
                  left += sidx * (barWidth + this.options.barGap);
                }
                size = bottom - top;
                if (this.options.verticalGridCondition && this.options.verticalGridCondition(row.x)) {
                  if (!this.options.horizontal) {
                    this.drawBar(this.xStart + idx * groupWidth, this.yEnd, groupWidth, this.ySize, this.options.verticalGridColor, this.options.verticalGridOpacity, this.options.barRadius);
                  } else {
                    this.drawBar(this.yStart, this.xStart + idx * groupWidth, this.ySize, groupWidth, this.options.verticalGridColor, this.options.verticalGridOpacity, this.options.barRadius);
                  }
                }
                if (this.options.stacked) {
                  top -= lastTop;
                }
                if (!this.options.horizontal) {
                  lastTop += size;
                  if (size === 0) {
                    size = 1;
                  }
                  this.seriesBars[idx][sidx] = this.drawBar(left, top, barWidth, size, this.colorFor(row, sidx, 'bar'), this.options.barOpacity, this.options.barRadius);
                  if (this.options.dataLabels) {
                    if (this.options.stacked || this.options.dataLabelsPosition === 'inside') {
                      depth = size / 2;
                    } else {
                      depth = -7;
                    }
                    if (size > this.options.dataLabelsSize || !this.options.stacked) {
                      _results1.push(this.drawDataLabel(left + barWidth / 2, top + depth, this.yLabelFormat(row.y[sidx], 0)));
                    } else {
                      _results1.push(void 0);
                    }
                  } else {
                    _results1.push(void 0);
                  }
                } else {
                  lastTop -= size;
                  if (size === 0) {
                    size = 1;
                  }
                  this.seriesBars[idx][sidx] = this.drawBar(top, left, size, barWidth, this.colorFor(row, sidx, 'bar'), this.options.barOpacity, this.options.barRadius);
                  if (this.options.dataLabels) {
                    if (this.options.stacked || this.options.dataLabelsPosition === 'inside') {
                      this.drawDataLabel(top + size / 2, left + barWidth / 2, this.yLabelFormat(row.y[sidx], 0));
                    } else {
                      this.drawDataLabel(top + size + 5, left + barWidth / 2, this.yLabelFormat(row.y[sidx], 0));
                    }
                  }
                  if (this.options.inBarValue && barWidth > this.options.gridTextSize + 2 * this.options.inBarValueMinTopMargin) {
                    barMiddle = left + 0.5 * barWidth;
                    _results1.push(this.raphael.text(bottom - this.options.inBarValueRightMargin, barMiddle, this.yLabelFormat(row.y[sidx], sidx)).attr('font-size', this.options.gridTextSize).attr('font-family', this.options.gridTextFamily).attr('font-weight', this.options.gridTextWeight).attr('fill', this.options.inBarValueTextColor).attr('text-anchor', 'end'));
                  } else {
                    _results1.push(void 0);
                  }
                }
              } else {
                _results1.push(null);
              }
            }
            return _results1;
          }).call(this));
        }
        return _results;
      }).call(this);
    };

    Bar.prototype.hilight = function(index) {
      var i, y, _i, _j, _len, _len1, _ref, _ref1;
      if (this.seriesBars && this.seriesBars[this.prevHilight] && this.prevHilight !== null && this.prevHilight !== index) {
        _ref = this.seriesBars[this.prevHilight];
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          y = _ref[i];
          if (y) {
            y.animate({
              'fill-opacity': this.options.barOpacity
            }, this.options.highlightSpeed);
          }
        }
      }
      if (this.seriesBars && this.seriesBars[index] && index !== null && this.prevHilight !== index) {
        _ref1 = this.seriesBars[index];
        for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
          y = _ref1[i];
          if (y) {
            y.animate({
              'fill-opacity': this.options.barHighlightOpacity
            }, this.options.highlightSpeed);
          }
        }
      }
      return this.prevHilight = index;
    };

    Bar.prototype.colorFor = function(row, sidx, type) {
      var r, s;
      if (typeof this.options.barColors === 'function') {
        r = {
          x: row.x,
          y: row.y[sidx],
          label: row.label,
          src: row.src
        };
        s = {
          index: sidx,
          key: this.options.ykeys[sidx],
          label: this.options.labels[sidx]
        };
        return this.options.barColors.call(this, r, s, type);
      } else {
        return this.options.barColors[sidx % this.options.barColors.length];
      }
    };

    Bar.prototype.hitTest = function(x, y) {
      var pos;
      if (this.data.length === 0) {
        return null;
      }
      if (!this.options.horizontal) {
        pos = x;
      } else {
        pos = y;
      }
      pos = Math.max(Math.min(pos, this.xEnd), this.xStart);
      return Math.min(this.data.length - 1, Math.floor((pos - this.xStart) / (this.xSize / this.data.length)));
    };

    Bar.prototype.onGridClick = function(x, y) {
      var index;
      index = this.hitTest(x, y);
      return this.fire('click', index, this.data[index].src, x, y);
    };

    Bar.prototype.onHoverMove = function(x, y) {
      var index, _ref;
      index = this.hitTest(x, y);
      this.hilight(index);
      if (index != null) {
        return (_ref = this.hover).update.apply(_ref, this.hoverContentForRow(index));
      } else {
        return this.hover.hide();
      }
    };

    Bar.prototype.onHoverOut = function() {
      this.hilight(-1);
      if (this.options.hideHover !== false) {
        return this.hover.hide();
      }
    };

    Bar.prototype.hoverContentForRow = function(index) {
      var content, inv, j, jj, row, x, y, _i, _j, _len, _len1, _ref;
      row = this.data[index];
      content = "<div class='morris-hover-row-label'>" + row.label + "</div>";
      inv = [];
      _ref = row.y;
      for (jj = _i = 0, _len = _ref.length; _i < _len; jj = ++_i) {
        y = _ref[jj];
        inv.unshift(y);
      }
      for (jj = _j = 0, _len1 = inv.length; _j < _len1; jj = ++_j) {
        y = inv[jj];
        j = row.y.length - 1 - jj;
        if (this.options.labels[j] === false) {
          continue;
        }
        content += "<div class='morris-hover-point' style='color: " + (this.colorFor(row, j, 'label')) + "'>\n  " + this.options.labels[j] + ":\n  " + (this.yLabelFormat(y, j)) + "\n</div>";
      }
      if (typeof this.options.hoverCallback === 'function') {
        content = this.options.hoverCallback(index, this.options, content, row.src);
      }
      if (!this.options.horizontal) {
        x = this.left + (index + 0.5) * this.width / this.data.length;
        return [content, x];
      } else {
        x = this.left + 0.5 * this.width;
        y = this.top + (index + 0.5) * this.height / this.data.length;
        return [content, x, y, true];
      }
    };

    Bar.prototype.drawDataLabel = function(xPos, yPos, text) {
      var label;
      return label = this.raphael.text(xPos, yPos, text).attr('text-anchor', 'middle').attr('font-size', this.options.dataLabelsSize).attr('font-family', this.options.dataLabelsFamily).attr('font-weight', this.options.dataLabelsWeight).attr('fill', this.options.dataLabelsColor);
    };

    Bar.prototype.drawDataLabelExt = function(xPos, yPos, text, anchor) {
      var label;
      return label = this.raphael.text(xPos, yPos, text).attr('text-anchor', anchor).attr('font-size', this.options.dataLabelsSize).attr('font-family', this.options.dataLabelsFamily).attr('font-weight', this.options.dataLabelsWeight).attr('fill', this.options.dataLabelsColor);
    };

    Bar.prototype.drawBar = function(xPos, yPos, width, height, barColor, opacity, radiusArray) {
      var maxRadius, path;
      maxRadius = Math.max.apply(Math, radiusArray);
      if (this.options.animate) {
        if (this.options.horizontal) {
          if (maxRadius === 0 || maxRadius > height) {
            path = this.raphael.rect(this.transY(0), yPos, 0, height).animate({
              x: xPos,
              width: width
            }, 500);
          } else {
            path = this.raphael.path(this.roundedRect(this.transY(0), yPos + height, width, 0, radiusArray).animate({
              y: yPos,
              height: height
            }, 500));
          }
        } else {
          if (maxRadius === 0 || maxRadius > height) {
            path = this.raphael.rect(xPos, this.transY(0), width, 0).animate({
              y: yPos,
              height: height
            }, 500);
          } else {
            path = this.raphael.path(this.roundedRect(xPos, this.transY(0), width, 0, radiusArray).animate({
              y: yPos,
              height: height
            }, 500));
          }
        }
      } else {
        if (maxRadius === 0 || maxRadius > height) {
          path = this.raphael.rect(xPos, yPos, width, height);
        } else {
          path = this.raphael.path(this.roundedRect(xPos, yPos, width, height, radiusArray));
        }
      }
      return path.attr('fill', barColor).attr('fill-opacity', opacity).attr('stroke', 'none');
    };

    Bar.prototype.roundedRect = function(x, y, w, h, r) {
      if (r == null) {
        r = [0, 0, 0, 0];
      }
      return ["M", x, r[0] + y, "Q", x, y, x + r[0], y, "L", x + w - r[1], y, "Q", x + w, y, x + w, y + r[1], "L", x + w, y + h - r[2], "Q", x + w, y + h, x + w - r[2], y + h, "L", x + r[3], y + h, "Q", x, y + h, x, y + h - r[3], "Z"];
    };

    return Bar;

  })(Morris.Grid);

  Morris.Donut = (function(_super) {
    __extends(Donut, _super);

    Donut.prototype.defaults = {
      colors: ['#2f7df6', '#53a351', '#f6c244', '#cb444a', '#4aa0b5', '#222529', '#44a1f8', '#81d453', '#f0bb40', '#eb3f25', '#b45184', '#5f5f5f'],
      backgroundColor: '#FFFFFF',
      labelColor: '#000000',
      formatter: Morris.commas,
      resize: false,
      dataLabels: true,
      dataLabelsPosition: 'outside',
      dataLabelsFamily: 'sans-serif',
      dataLabelsSize: 12,
      dataLabelsWeight: 'normal',
      dataLabelsColor: '#000',
      donutType: 'pie',
      animate: true
    };

    function Donut(options) {
      this.resizeHandler = __bind(this.resizeHandler, this);
      this.select = __bind(this.select, this);
      this.click = __bind(this.click, this);
      var _this = this;
      if (!(this instanceof Morris.Donut)) {
        return new Morris.Donut(options);
      }
      this.options = Morris.extend({}, this.defaults, options);
      if (typeof options.element === 'string') {
        this.el = document.getElementById(options.element);
      } else {
        this.el = options.element[0] || options.element;
      }
      if (this.el === null) {
        throw new Error("Graph placeholder not found.");
      }
      if (options.data === void 0 || options.data.length === 0) {
        return;
      }
      this.raphael = new Raphael(this.el);
      if (this.options.resize) {
        Morris.on(window, 'resize', function(evt) {
          if (_this.timeoutId != null) {
            window.clearTimeout(_this.timeoutId);
          }
          return _this.timeoutId = window.setTimeout(_this.resizeHandler, 100);
        });
      }
      this.setData(options.data);
    }

    Donut.prototype.redraw = function() {
      var C, cx, cy, height, i, idx, label_x, label_y, last, max_value, min, next, p_cos_p0, p_sin_p0, seg, total, value, w, width, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3, _results;
      this.raphael.clear();
      _ref = Morris.dimensions(this.el), width = _ref.width, height = _ref.height;
      cx = width / 2;
      cy = height / 2;
      w = (Math.min(cx, cy) - 10) / 3;
      total = 0;
      _ref1 = this.values;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        value = _ref1[_i];
        total += value;
      }
      min = 5 / (2 * w);
      C = 1.9999 * Math.PI - min * this.data.length;
      last = 0;
      idx = 0;
      this.segments = [];
      _ref2 = this.values;
      for (i = _j = 0, _len1 = _ref2.length; _j < _len1; i = ++_j) {
        value = _ref2[i];
        next = last + min + C * (value / total);
        seg = new Morris.DonutSegment(cx, cy, w * 2, w, last, next, this.data[i].color || this.options.colors[idx % this.options.colors.length], this.options.backgroundColor, idx, this.raphael, this.options);
        seg.render();
        this.segments.push(seg);
        seg.on('hover', this.select);
        seg.on('click', this.click);
        if (this.options.dataLabels && this.values.length > 1) {
          p_sin_p0 = Math.sin((last + next) / 2);
          p_cos_p0 = Math.cos((last + next) / 2);
          if (this.options.dataLabelsPosition === 'inside') {
            if (this.options.donutType === 'pie') {
              label_x = parseFloat(cx) + parseFloat(seg.raphael.height * 0.30 * p_sin_p0);
              label_y = parseFloat(cy) + parseFloat(seg.raphael.height * 0.30 * p_cos_p0);
            } else {
              label_x = parseFloat(cx) + parseFloat(seg.raphael.height * 0.37 * p_sin_p0);
              label_y = parseFloat(cy) + parseFloat(seg.raphael.height * 0.37 * p_cos_p0);
            }
          } else {
            label_x = parseFloat(cx) + parseFloat((seg.raphael.height - 9) * 0.5 * p_sin_p0);
            label_y = parseFloat(cy) + parseFloat((seg.raphael.height - 9) * 0.5 * p_cos_p0);
          }
          this.drawDataLabel(label_x, label_y, value);
        }
        last = next;
        idx += 1;
      }
      this.text1 = this.drawEmptyDonutLabel(cx, cy - 10, this.options.labelColor, 15, 800);
      this.text2 = this.drawEmptyDonutLabel(cx, cy + 10, this.options.labelColor, 14);
      max_value = Math.max.apply(Math, this.values);
      idx = 0;
      _ref3 = this.values;
      _results = [];
      for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
        value = _ref3[_k];
        if (value === max_value) {
          this.select(idx);
          break;
        }
        _results.push(idx += 1);
      }
      return _results;
    };

    Donut.prototype.setData = function(data) {
      var row;
      this.data = data;
      this.values = (function() {
        var _i, _len, _ref, _results;
        _ref = this.data;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          row = _ref[_i];
          _results.push(parseFloat(row.value));
        }
        return _results;
      }).call(this);
      return this.redraw();
    };

    Donut.prototype.drawDataLabel = function(xPos, yPos, text) {
      var label;
      return label = this.raphael.text(xPos, yPos, text).attr('text-anchor', 'middle').attr('font-size', this.options.dataLabelsSize).attr('font-family', this.options.dataLabelsFamily).attr('font-weight', this.options.dataLabelsWeight).attr('fill', this.options.dataLabelsColor);
    };

    Donut.prototype.click = function(idx) {
      return this.fire('click', idx, this.data[idx]);
    };

    Donut.prototype.select = function(idx) {
      var row, s, segment, _i, _len, _ref;
      _ref = this.segments;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        s = _ref[_i];
        s.deselect();
      }
      segment = this.segments[idx];
      segment.select();
      row = this.data[idx];
      if (this.options.donutType === 'donut') {
        return this.setLabels(row.label, this.options.formatter(row.value, row));
      }
    };

    Donut.prototype.setLabels = function(label1, label2) {
      var height, inner, maxHeightBottom, maxHeightTop, maxWidth, text1bbox, text1scale, text2bbox, text2scale, width, _ref;
      _ref = Morris.dimensions(this.el), width = _ref.width, height = _ref.height;
      inner = (Math.min(width / 2, height / 2) - 10) * 2 / 3;
      maxWidth = 1.8 * inner;
      maxHeightTop = inner / 2;
      maxHeightBottom = inner / 3;
      this.text1.attr({
        text: label1,
        transform: ''
      });
      text1bbox = this.text1.getBBox();
      text1scale = Math.min(maxWidth / text1bbox.width, maxHeightTop / text1bbox.height);
      this.text1.attr({
        transform: "S" + text1scale + "," + text1scale + "," + (text1bbox.x + text1bbox.width / 2) + "," + (text1bbox.y + text1bbox.height)
      });
      this.text2.attr({
        text: label2,
        transform: ''
      });
      text2bbox = this.text2.getBBox();
      text2scale = Math.min(maxWidth / text2bbox.width, maxHeightBottom / text2bbox.height);
      return this.text2.attr({
        transform: "S" + text2scale + "," + text2scale + "," + (text2bbox.x + text2bbox.width / 2) + "," + text2bbox.y
      });
    };

    Donut.prototype.drawEmptyDonutLabel = function(xPos, yPos, color, fontSize, fontWeight) {
      var text;
      text = this.raphael.text(xPos, yPos, '').attr('font-size', fontSize).attr('fill', color);
      if (fontWeight != null) {
        text.attr('font-weight', fontWeight);
      }
      return text;
    };

    Donut.prototype.resizeHandler = function() {
      var height, width, _ref;
      this.timeoutId = null;
      _ref = Morris.dimensions(this.el), width = _ref.width, height = _ref.height;
      this.raphael.setSize(width, height);
      return this.redraw();
    };

    return Donut;

  })(Morris.EventEmitter);

  Morris.DonutSegment = (function(_super) {
    __extends(DonutSegment, _super);

    function DonutSegment(cx, cy, inner, outer, p0, p1, color, backgroundColor, index, raphael, options) {
      this.cx = cx;
      this.cy = cy;
      this.inner = inner;
      this.outer = outer;
      this.color = color;
      this.backgroundColor = backgroundColor;
      this.index = index;
      this.raphael = raphael;
      this.options = options;
      this.deselect = __bind(this.deselect, this);
      this.select = __bind(this.select, this);
      this.sin_p0 = Math.sin(p0);
      this.cos_p0 = Math.cos(p0);
      this.sin_p1 = Math.sin(p1);
      this.cos_p1 = Math.cos(p1);
      this.is_long = (p1 - p0) > Math.PI ? 1 : 0;
      this.path = this.calcSegment(this.inner + 3, this.inner + this.outer - 5);
      this.selectedPath = this.calcSegment(this.inner + 3, this.inner + this.outer);
      this.hilight = this.calcArc(this.inner);
    }

    DonutSegment.prototype.calcArcPoints = function(r) {
      return [this.cx + r * this.sin_p0, this.cy + r * this.cos_p0, this.cx + r * this.sin_p1, this.cy + r * this.cos_p1];
    };

    DonutSegment.prototype.calcSegment = function(r1, r2) {
      var ix0, ix1, iy0, iy1, ox0, ox1, oy0, oy1, _ref, _ref1;
      _ref = this.calcArcPoints(r1), ix0 = _ref[0], iy0 = _ref[1], ix1 = _ref[2], iy1 = _ref[3];
      _ref1 = this.calcArcPoints(r2), ox0 = _ref1[0], oy0 = _ref1[1], ox1 = _ref1[2], oy1 = _ref1[3];
      if (this.options.donutType === 'pie') {
        return ("M" + ox0 + "," + oy0) + ("A" + r2 + "," + r2 + ",0," + this.is_long + ",0," + ox1 + "," + oy1) + ("L" + this.cx + "," + this.cy) + "Z";
      } else {
        return ("M" + ix0 + "," + iy0) + ("A" + r1 + "," + r1 + ",0," + this.is_long + ",0," + ix1 + "," + iy1) + ("L" + ox1 + "," + oy1) + ("A" + r2 + "," + r2 + ",0," + this.is_long + ",1," + ox0 + "," + oy0) + "Z";
      }
    };

    DonutSegment.prototype.calcArc = function(r) {
      var ix0, ix1, iy0, iy1, _ref;
      _ref = this.calcArcPoints(r), ix0 = _ref[0], iy0 = _ref[1], ix1 = _ref[2], iy1 = _ref[3];
      return ("M" + ix0 + "," + iy0) + ("A" + r + "," + r + ",0," + this.is_long + ",0," + ix1 + "," + iy1);
    };

    DonutSegment.prototype.render = function() {
      var _this = this;
      this.arc = this.drawDonutArc(this.hilight, this.color);
      return this.seg = this.drawDonutSegment(this.path, this.color, this.backgroundColor, function() {
        return _this.fire('hover', _this.index);
      }, function() {
        return _this.fire('click', _this.index);
      });
    };

    DonutSegment.prototype.drawDonutArc = function(path, color) {
      return this.raphael.path(path).attr({
        stroke: color,
        'stroke-width': 2,
        opacity: 0
      });
    };

    DonutSegment.prototype.drawDonutSegment = function(path, fillColor, strokeColor, hoverFunction, clickFunction) {
      var rPath, straightDots, straightPath,
        _this = this;
      if (this.options.animate && this.options.donutType === 'pie') {
        straightPath = path;
        straightPath = path.replace('A', ',');
        straightPath = straightPath.replace('M', '');
        straightPath = straightPath.replace('C', ',');
        straightPath = straightPath.replace('Z', '');
        straightDots = straightPath.split(',');
        if (this.options.donutType === 'pie') {
          straightPath = 'M' + straightDots[0] + ',' + straightDots[1] + ',' + straightDots[straightDots.length - 2] + ',' + straightDots[straightDots.length - 1] + ',' + straightDots[straightDots.length - 2] + ',' + straightDots[straightDots.length - 1] + 'Z';
        } else {
          straightPath = 'M' + straightDots[0] + ',' + straightDots[1] + ',' + straightDots[straightDots.length - 2] + ',' + straightDots[straightDots.length - 1] + 'Z';
        }
        rPath = this.raphael.path(straightPath).attr({
          fill: fillColor,
          stroke: strokeColor,
          'stroke-width': 3
        }).hover(hoverFunction).click(clickFunction);
        return (function(rPath, path) {
          return rPath.animate({
            path: path
          }, 500, '<>');
        })(rPath, path);
      } else {
        return this.raphael.path(path).attr({
          fill: fillColor,
          stroke: strokeColor,
          'stroke-width': 3
        }).hover(hoverFunction).click(clickFunction);
      }
    };

    DonutSegment.prototype.select = function() {
      if (this.options.donutType === 'donut') {
        if (!this.selected) {
          this.seg.animate({
            path: this.selectedPath
          }, 150, '<>');
          this.arc.animate({
            opacity: 1
          }, 150, '<>');
          return this.selected = true;
        }
      }
    };

    DonutSegment.prototype.deselect = function() {
      if (this.selected) {
        this.seg.animate({
          path: this.path
        }, 150, '<>');
        this.arc.animate({
          opacity: 0
        }, 150, '<>');
        return this.selected = false;
      }
    };

    return DonutSegment;

  })(Morris.EventEmitter);

}).call(this);
