(function(global2, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("moment"), require("loglevel"), require("uuid")) : typeof define === "function" && define.amd ? define(["exports", "moment", "loglevel", "uuid"], factory) : (global2 = typeof globalThis !== "undefined" ? globalThis : global2 || self, factory(global2.ftrack = {}, global2.moment, global2.log, global2.uuid));
})(this, function(exports, moment, loglevel, uuid) {
  "use strict";
  function _interopDefaultLegacy(e) {
    return e && typeof e === "object" && "default" in e ? e : { "default": e };
  }
  var moment__default = /* @__PURE__ */ _interopDefaultLegacy(moment);
  var loglevel__default = /* @__PURE__ */ _interopDefaultLegacy(loglevel);
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  function createBaseFor$1(fromRight) {
    return function(object, iteratee, keysFunc) {
      var index = -1, iterable = Object(object), props = keysFunc(object), length = props.length;
      while (length--) {
        var key = props[fromRight ? length : ++index];
        if (iteratee(iterable[key], key, iterable) === false) {
          break;
        }
      }
      return object;
    };
  }
  var _createBaseFor = createBaseFor$1;
  var createBaseFor = _createBaseFor;
  var baseFor$1 = createBaseFor();
  var _baseFor = baseFor$1;
  function identity$2(value) {
    return value;
  }
  var identity_1 = identity$2;
  var identity$1 = identity_1;
  function castFunction$1(value) {
    return typeof value == "function" ? value : identity$1;
  }
  var _castFunction = castFunction$1;
  function baseTimes$1(n, iteratee) {
    var index = -1, result = Array(n);
    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }
  var _baseTimes = baseTimes$1;
  var freeGlobal$1 = typeof commonjsGlobal == "object" && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
  var _freeGlobal = freeGlobal$1;
  var freeGlobal = _freeGlobal;
  var freeSelf = typeof self == "object" && self && self.Object === Object && self;
  var root$8 = freeGlobal || freeSelf || Function("return this")();
  var _root = root$8;
  var root$7 = _root;
  var Symbol$5 = root$7.Symbol;
  var _Symbol = Symbol$5;
  var Symbol$4 = _Symbol;
  var objectProto$d = Object.prototype;
  var hasOwnProperty$a = objectProto$d.hasOwnProperty;
  var nativeObjectToString$1 = objectProto$d.toString;
  var symToStringTag$1 = Symbol$4 ? Symbol$4.toStringTag : void 0;
  function getRawTag$1(value) {
    var isOwn = hasOwnProperty$a.call(value, symToStringTag$1), tag = value[symToStringTag$1];
    try {
      value[symToStringTag$1] = void 0;
      var unmasked = true;
    } catch (e) {
    }
    var result = nativeObjectToString$1.call(value);
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag$1] = tag;
      } else {
        delete value[symToStringTag$1];
      }
    }
    return result;
  }
  var _getRawTag = getRawTag$1;
  var objectProto$c = Object.prototype;
  var nativeObjectToString = objectProto$c.toString;
  function objectToString$1(value) {
    return nativeObjectToString.call(value);
  }
  var _objectToString = objectToString$1;
  var Symbol$3 = _Symbol, getRawTag = _getRawTag, objectToString = _objectToString;
  var nullTag = "[object Null]", undefinedTag = "[object Undefined]";
  var symToStringTag = Symbol$3 ? Symbol$3.toStringTag : void 0;
  function baseGetTag$7(value) {
    if (value == null) {
      return value === void 0 ? undefinedTag : nullTag;
    }
    return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
  }
  var _baseGetTag = baseGetTag$7;
  function isObjectLike$7(value) {
    return value != null && typeof value == "object";
  }
  var isObjectLike_1 = isObjectLike$7;
  var baseGetTag$6 = _baseGetTag, isObjectLike$6 = isObjectLike_1;
  var argsTag$2 = "[object Arguments]";
  function baseIsArguments$1(value) {
    return isObjectLike$6(value) && baseGetTag$6(value) == argsTag$2;
  }
  var _baseIsArguments = baseIsArguments$1;
  var baseIsArguments = _baseIsArguments, isObjectLike$5 = isObjectLike_1;
  var objectProto$b = Object.prototype;
  var hasOwnProperty$9 = objectProto$b.hasOwnProperty;
  var propertyIsEnumerable$1 = objectProto$b.propertyIsEnumerable;
  var isArguments$2 = baseIsArguments(function() {
    return arguments;
  }()) ? baseIsArguments : function(value) {
    return isObjectLike$5(value) && hasOwnProperty$9.call(value, "callee") && !propertyIsEnumerable$1.call(value, "callee");
  };
  var isArguments_1 = isArguments$2;
  var isArray$9 = Array.isArray;
  var isArray_1 = isArray$9;
  var isBuffer$2 = { exports: {} };
  function stubFalse() {
    return false;
  }
  var stubFalse_1 = stubFalse;
  (function(module2, exports2) {
    var root2 = _root, stubFalse2 = stubFalse_1;
    var freeExports = exports2 && !exports2.nodeType && exports2;
    var freeModule = freeExports && true && module2 && !module2.nodeType && module2;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var Buffer = moduleExports ? root2.Buffer : void 0;
    var nativeIsBuffer = Buffer ? Buffer.isBuffer : void 0;
    var isBuffer2 = nativeIsBuffer || stubFalse2;
    module2.exports = isBuffer2;
  })(isBuffer$2, isBuffer$2.exports);
  var MAX_SAFE_INTEGER$1 = 9007199254740991;
  var reIsUint = /^(?:0|[1-9]\d*)$/;
  function isIndex$2(value, length) {
    var type = typeof value;
    length = length == null ? MAX_SAFE_INTEGER$1 : length;
    return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
  }
  var _isIndex = isIndex$2;
  var MAX_SAFE_INTEGER = 9007199254740991;
  function isLength$3(value) {
    return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
  }
  var isLength_1 = isLength$3;
  var baseGetTag$5 = _baseGetTag, isLength$2 = isLength_1, isObjectLike$4 = isObjectLike_1;
  var argsTag$1 = "[object Arguments]", arrayTag$1 = "[object Array]", boolTag$1 = "[object Boolean]", dateTag$1 = "[object Date]", errorTag$1 = "[object Error]", funcTag$1 = "[object Function]", mapTag$2 = "[object Map]", numberTag$1 = "[object Number]", objectTag$3 = "[object Object]", regexpTag$1 = "[object RegExp]", setTag$2 = "[object Set]", stringTag$2 = "[object String]", weakMapTag$1 = "[object WeakMap]";
  var arrayBufferTag$1 = "[object ArrayBuffer]", dataViewTag$2 = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag$1] = typedArrayTags[arrayTag$1] = typedArrayTags[arrayBufferTag$1] = typedArrayTags[boolTag$1] = typedArrayTags[dataViewTag$2] = typedArrayTags[dateTag$1] = typedArrayTags[errorTag$1] = typedArrayTags[funcTag$1] = typedArrayTags[mapTag$2] = typedArrayTags[numberTag$1] = typedArrayTags[objectTag$3] = typedArrayTags[regexpTag$1] = typedArrayTags[setTag$2] = typedArrayTags[stringTag$2] = typedArrayTags[weakMapTag$1] = false;
  function baseIsTypedArray$1(value) {
    return isObjectLike$4(value) && isLength$2(value.length) && !!typedArrayTags[baseGetTag$5(value)];
  }
  var _baseIsTypedArray = baseIsTypedArray$1;
  function baseUnary$1(func) {
    return function(value) {
      return func(value);
    };
  }
  var _baseUnary = baseUnary$1;
  var _nodeUtil = { exports: {} };
  (function(module2, exports2) {
    var freeGlobal2 = _freeGlobal;
    var freeExports = exports2 && !exports2.nodeType && exports2;
    var freeModule = freeExports && true && module2 && !module2.nodeType && module2;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var freeProcess = moduleExports && freeGlobal2.process;
    var nodeUtil2 = function() {
      try {
        var types = freeModule && freeModule.require && freeModule.require("util").types;
        if (types) {
          return types;
        }
        return freeProcess && freeProcess.binding && freeProcess.binding("util");
      } catch (e) {
      }
    }();
    module2.exports = nodeUtil2;
  })(_nodeUtil, _nodeUtil.exports);
  var baseIsTypedArray = _baseIsTypedArray, baseUnary = _baseUnary, nodeUtil = _nodeUtil.exports;
  var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
  var isTypedArray$2 = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
  var isTypedArray_1 = isTypedArray$2;
  var baseTimes = _baseTimes, isArguments$1 = isArguments_1, isArray$8 = isArray_1, isBuffer$1 = isBuffer$2.exports, isIndex$1 = _isIndex, isTypedArray$1 = isTypedArray_1;
  var objectProto$a = Object.prototype;
  var hasOwnProperty$8 = objectProto$a.hasOwnProperty;
  function arrayLikeKeys$2(value, inherited) {
    var isArr = isArray$8(value), isArg = !isArr && isArguments$1(value), isBuff = !isArr && !isArg && isBuffer$1(value), isType = !isArr && !isArg && !isBuff && isTypedArray$1(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
    for (var key in value) {
      if ((inherited || hasOwnProperty$8.call(value, key)) && !(skipIndexes && (key == "length" || isBuff && (key == "offset" || key == "parent") || isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || isIndex$1(key, length)))) {
        result.push(key);
      }
    }
    return result;
  }
  var _arrayLikeKeys = arrayLikeKeys$2;
  function isObject$5(value) {
    var type = typeof value;
    return value != null && (type == "object" || type == "function");
  }
  var isObject_1 = isObject$5;
  var objectProto$9 = Object.prototype;
  function isPrototype$2(value) {
    var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto$9;
    return value === proto;
  }
  var _isPrototype = isPrototype$2;
  function nativeKeysIn$1(object) {
    var result = [];
    if (object != null) {
      for (var key in Object(object)) {
        result.push(key);
      }
    }
    return result;
  }
  var _nativeKeysIn = nativeKeysIn$1;
  var isObject$4 = isObject_1, isPrototype$1 = _isPrototype, nativeKeysIn = _nativeKeysIn;
  var objectProto$8 = Object.prototype;
  var hasOwnProperty$7 = objectProto$8.hasOwnProperty;
  function baseKeysIn$1(object) {
    if (!isObject$4(object)) {
      return nativeKeysIn(object);
    }
    var isProto = isPrototype$1(object), result = [];
    for (var key in object) {
      if (!(key == "constructor" && (isProto || !hasOwnProperty$7.call(object, key)))) {
        result.push(key);
      }
    }
    return result;
  }
  var _baseKeysIn = baseKeysIn$1;
  var baseGetTag$4 = _baseGetTag, isObject$3 = isObject_1;
  var asyncTag = "[object AsyncFunction]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", proxyTag = "[object Proxy]";
  function isFunction$2(value) {
    if (!isObject$3(value)) {
      return false;
    }
    var tag = baseGetTag$4(value);
    return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
  }
  var isFunction_1 = isFunction$2;
  var isFunction$1 = isFunction_1, isLength$1 = isLength_1;
  function isArrayLike$3(value) {
    return value != null && isLength$1(value.length) && !isFunction$1(value);
  }
  var isArrayLike_1 = isArrayLike$3;
  var arrayLikeKeys$1 = _arrayLikeKeys, baseKeysIn = _baseKeysIn, isArrayLike$2 = isArrayLike_1;
  function keysIn$1(object) {
    return isArrayLike$2(object) ? arrayLikeKeys$1(object, true) : baseKeysIn(object);
  }
  var keysIn_1 = keysIn$1;
  var baseFor = _baseFor, castFunction = _castFunction, keysIn = keysIn_1;
  function forIn(object, iteratee) {
    return object == null ? object : baseFor(object, castFunction(iteratee), keysIn);
  }
  var forIn_1 = forIn;
  var baseGetTag$3 = _baseGetTag, isArray$7 = isArray_1, isObjectLike$3 = isObjectLike_1;
  var stringTag$1 = "[object String]";
  function isString(value) {
    return typeof value == "string" || !isArray$7(value) && isObjectLike$3(value) && baseGetTag$3(value) == stringTag$1;
  }
  var isString_1 = isString;
  function overArg$2(func, transform) {
    return function(arg) {
      return func(transform(arg));
    };
  }
  var _overArg = overArg$2;
  var overArg$1 = _overArg;
  var getPrototype$1 = overArg$1(Object.getPrototypeOf, Object);
  var _getPrototype = getPrototype$1;
  var baseGetTag$2 = _baseGetTag, getPrototype = _getPrototype, isObjectLike$2 = isObjectLike_1;
  var objectTag$2 = "[object Object]";
  var funcProto$2 = Function.prototype, objectProto$7 = Object.prototype;
  var funcToString$2 = funcProto$2.toString;
  var hasOwnProperty$6 = objectProto$7.hasOwnProperty;
  var objectCtorString = funcToString$2.call(Object);
  function isPlainObject(value) {
    if (!isObjectLike$2(value) || baseGetTag$2(value) != objectTag$2) {
      return false;
    }
    var proto = getPrototype(value);
    if (proto === null) {
      return true;
    }
    var Ctor = hasOwnProperty$6.call(proto, "constructor") && proto.constructor;
    return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString$2.call(Ctor) == objectCtorString;
  }
  var isPlainObject_1 = isPlainObject;
  function listCacheClear$1() {
    this.__data__ = [];
    this.size = 0;
  }
  var _listCacheClear = listCacheClear$1;
  function eq$2(value, other) {
    return value === other || value !== value && other !== other;
  }
  var eq_1 = eq$2;
  var eq$1 = eq_1;
  function assocIndexOf$4(array, key) {
    var length = array.length;
    while (length--) {
      if (eq$1(array[length][0], key)) {
        return length;
      }
    }
    return -1;
  }
  var _assocIndexOf = assocIndexOf$4;
  var assocIndexOf$3 = _assocIndexOf;
  var arrayProto = Array.prototype;
  var splice = arrayProto.splice;
  function listCacheDelete$1(key) {
    var data = this.__data__, index = assocIndexOf$3(data, key);
    if (index < 0) {
      return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    --this.size;
    return true;
  }
  var _listCacheDelete = listCacheDelete$1;
  var assocIndexOf$2 = _assocIndexOf;
  function listCacheGet$1(key) {
    var data = this.__data__, index = assocIndexOf$2(data, key);
    return index < 0 ? void 0 : data[index][1];
  }
  var _listCacheGet = listCacheGet$1;
  var assocIndexOf$1 = _assocIndexOf;
  function listCacheHas$1(key) {
    return assocIndexOf$1(this.__data__, key) > -1;
  }
  var _listCacheHas = listCacheHas$1;
  var assocIndexOf = _assocIndexOf;
  function listCacheSet$1(key, value) {
    var data = this.__data__, index = assocIndexOf(data, key);
    if (index < 0) {
      ++this.size;
      data.push([key, value]);
    } else {
      data[index][1] = value;
    }
    return this;
  }
  var _listCacheSet = listCacheSet$1;
  var listCacheClear = _listCacheClear, listCacheDelete = _listCacheDelete, listCacheGet = _listCacheGet, listCacheHas = _listCacheHas, listCacheSet = _listCacheSet;
  function ListCache$4(entries) {
    var index = -1, length = entries == null ? 0 : entries.length;
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  ListCache$4.prototype.clear = listCacheClear;
  ListCache$4.prototype["delete"] = listCacheDelete;
  ListCache$4.prototype.get = listCacheGet;
  ListCache$4.prototype.has = listCacheHas;
  ListCache$4.prototype.set = listCacheSet;
  var _ListCache = ListCache$4;
  var ListCache$3 = _ListCache;
  function stackClear$1() {
    this.__data__ = new ListCache$3();
    this.size = 0;
  }
  var _stackClear = stackClear$1;
  function stackDelete$1(key) {
    var data = this.__data__, result = data["delete"](key);
    this.size = data.size;
    return result;
  }
  var _stackDelete = stackDelete$1;
  function stackGet$1(key) {
    return this.__data__.get(key);
  }
  var _stackGet = stackGet$1;
  function stackHas$1(key) {
    return this.__data__.has(key);
  }
  var _stackHas = stackHas$1;
  var root$6 = _root;
  var coreJsData$1 = root$6["__core-js_shared__"];
  var _coreJsData = coreJsData$1;
  var coreJsData = _coreJsData;
  var maskSrcKey = function() {
    var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
    return uid ? "Symbol(src)_1." + uid : "";
  }();
  function isMasked$1(func) {
    return !!maskSrcKey && maskSrcKey in func;
  }
  var _isMasked = isMasked$1;
  var funcProto$1 = Function.prototype;
  var funcToString$1 = funcProto$1.toString;
  function toSource$2(func) {
    if (func != null) {
      try {
        return funcToString$1.call(func);
      } catch (e) {
      }
      try {
        return func + "";
      } catch (e) {
      }
    }
    return "";
  }
  var _toSource = toSource$2;
  var isFunction = isFunction_1, isMasked = _isMasked, isObject$2 = isObject_1, toSource$1 = _toSource;
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
  var reIsHostCtor = /^\[object .+?Constructor\]$/;
  var funcProto = Function.prototype, objectProto$6 = Object.prototype;
  var funcToString = funcProto.toString;
  var hasOwnProperty$5 = objectProto$6.hasOwnProperty;
  var reIsNative = RegExp("^" + funcToString.call(hasOwnProperty$5).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");
  function baseIsNative$1(value) {
    if (!isObject$2(value) || isMasked(value)) {
      return false;
    }
    var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
    return pattern.test(toSource$1(value));
  }
  var _baseIsNative = baseIsNative$1;
  function getValue$1(object, key) {
    return object == null ? void 0 : object[key];
  }
  var _getValue = getValue$1;
  var baseIsNative = _baseIsNative, getValue = _getValue;
  function getNative$6(object, key) {
    var value = getValue(object, key);
    return baseIsNative(value) ? value : void 0;
  }
  var _getNative = getNative$6;
  var getNative$5 = _getNative, root$5 = _root;
  var Map$3 = getNative$5(root$5, "Map");
  var _Map = Map$3;
  var getNative$4 = _getNative;
  var nativeCreate$4 = getNative$4(Object, "create");
  var _nativeCreate = nativeCreate$4;
  var nativeCreate$3 = _nativeCreate;
  function hashClear$1() {
    this.__data__ = nativeCreate$3 ? nativeCreate$3(null) : {};
    this.size = 0;
  }
  var _hashClear = hashClear$1;
  function hashDelete$1(key) {
    var result = this.has(key) && delete this.__data__[key];
    this.size -= result ? 1 : 0;
    return result;
  }
  var _hashDelete = hashDelete$1;
  var nativeCreate$2 = _nativeCreate;
  var HASH_UNDEFINED$2 = "__lodash_hash_undefined__";
  var objectProto$5 = Object.prototype;
  var hasOwnProperty$4 = objectProto$5.hasOwnProperty;
  function hashGet$1(key) {
    var data = this.__data__;
    if (nativeCreate$2) {
      var result = data[key];
      return result === HASH_UNDEFINED$2 ? void 0 : result;
    }
    return hasOwnProperty$4.call(data, key) ? data[key] : void 0;
  }
  var _hashGet = hashGet$1;
  var nativeCreate$1 = _nativeCreate;
  var objectProto$4 = Object.prototype;
  var hasOwnProperty$3 = objectProto$4.hasOwnProperty;
  function hashHas$1(key) {
    var data = this.__data__;
    return nativeCreate$1 ? data[key] !== void 0 : hasOwnProperty$3.call(data, key);
  }
  var _hashHas = hashHas$1;
  var nativeCreate = _nativeCreate;
  var HASH_UNDEFINED$1 = "__lodash_hash_undefined__";
  function hashSet$1(key, value) {
    var data = this.__data__;
    this.size += this.has(key) ? 0 : 1;
    data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED$1 : value;
    return this;
  }
  var _hashSet = hashSet$1;
  var hashClear = _hashClear, hashDelete = _hashDelete, hashGet = _hashGet, hashHas = _hashHas, hashSet = _hashSet;
  function Hash$1(entries) {
    var index = -1, length = entries == null ? 0 : entries.length;
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  Hash$1.prototype.clear = hashClear;
  Hash$1.prototype["delete"] = hashDelete;
  Hash$1.prototype.get = hashGet;
  Hash$1.prototype.has = hashHas;
  Hash$1.prototype.set = hashSet;
  var _Hash = Hash$1;
  var Hash = _Hash, ListCache$2 = _ListCache, Map$2 = _Map;
  function mapCacheClear$1() {
    this.size = 0;
    this.__data__ = {
      "hash": new Hash(),
      "map": new (Map$2 || ListCache$2)(),
      "string": new Hash()
    };
  }
  var _mapCacheClear = mapCacheClear$1;
  function isKeyable$1(value) {
    var type = typeof value;
    return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
  }
  var _isKeyable = isKeyable$1;
  var isKeyable = _isKeyable;
  function getMapData$4(map, key) {
    var data = map.__data__;
    return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
  }
  var _getMapData = getMapData$4;
  var getMapData$3 = _getMapData;
  function mapCacheDelete$1(key) {
    var result = getMapData$3(this, key)["delete"](key);
    this.size -= result ? 1 : 0;
    return result;
  }
  var _mapCacheDelete = mapCacheDelete$1;
  var getMapData$2 = _getMapData;
  function mapCacheGet$1(key) {
    return getMapData$2(this, key).get(key);
  }
  var _mapCacheGet = mapCacheGet$1;
  var getMapData$1 = _getMapData;
  function mapCacheHas$1(key) {
    return getMapData$1(this, key).has(key);
  }
  var _mapCacheHas = mapCacheHas$1;
  var getMapData = _getMapData;
  function mapCacheSet$1(key, value) {
    var data = getMapData(this, key), size = data.size;
    data.set(key, value);
    this.size += data.size == size ? 0 : 1;
    return this;
  }
  var _mapCacheSet = mapCacheSet$1;
  var mapCacheClear = _mapCacheClear, mapCacheDelete = _mapCacheDelete, mapCacheGet = _mapCacheGet, mapCacheHas = _mapCacheHas, mapCacheSet = _mapCacheSet;
  function MapCache$3(entries) {
    var index = -1, length = entries == null ? 0 : entries.length;
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  MapCache$3.prototype.clear = mapCacheClear;
  MapCache$3.prototype["delete"] = mapCacheDelete;
  MapCache$3.prototype.get = mapCacheGet;
  MapCache$3.prototype.has = mapCacheHas;
  MapCache$3.prototype.set = mapCacheSet;
  var _MapCache = MapCache$3;
  var ListCache$1 = _ListCache, Map$1 = _Map, MapCache$2 = _MapCache;
  var LARGE_ARRAY_SIZE = 200;
  function stackSet$1(key, value) {
    var data = this.__data__;
    if (data instanceof ListCache$1) {
      var pairs = data.__data__;
      if (!Map$1 || pairs.length < LARGE_ARRAY_SIZE - 1) {
        pairs.push([key, value]);
        this.size = ++data.size;
        return this;
      }
      data = this.__data__ = new MapCache$2(pairs);
    }
    data.set(key, value);
    this.size = data.size;
    return this;
  }
  var _stackSet = stackSet$1;
  var ListCache = _ListCache, stackClear = _stackClear, stackDelete = _stackDelete, stackGet = _stackGet, stackHas = _stackHas, stackSet = _stackSet;
  function Stack$2(entries) {
    var data = this.__data__ = new ListCache(entries);
    this.size = data.size;
  }
  Stack$2.prototype.clear = stackClear;
  Stack$2.prototype["delete"] = stackDelete;
  Stack$2.prototype.get = stackGet;
  Stack$2.prototype.has = stackHas;
  Stack$2.prototype.set = stackSet;
  var _Stack = Stack$2;
  var HASH_UNDEFINED = "__lodash_hash_undefined__";
  function setCacheAdd$1(value) {
    this.__data__.set(value, HASH_UNDEFINED);
    return this;
  }
  var _setCacheAdd = setCacheAdd$1;
  function setCacheHas$1(value) {
    return this.__data__.has(value);
  }
  var _setCacheHas = setCacheHas$1;
  var MapCache$1 = _MapCache, setCacheAdd = _setCacheAdd, setCacheHas = _setCacheHas;
  function SetCache$1(values) {
    var index = -1, length = values == null ? 0 : values.length;
    this.__data__ = new MapCache$1();
    while (++index < length) {
      this.add(values[index]);
    }
  }
  SetCache$1.prototype.add = SetCache$1.prototype.push = setCacheAdd;
  SetCache$1.prototype.has = setCacheHas;
  var _SetCache = SetCache$1;
  function arraySome$1(array, predicate) {
    var index = -1, length = array == null ? 0 : array.length;
    while (++index < length) {
      if (predicate(array[index], index, array)) {
        return true;
      }
    }
    return false;
  }
  var _arraySome = arraySome$1;
  function cacheHas$1(cache, key) {
    return cache.has(key);
  }
  var _cacheHas = cacheHas$1;
  var SetCache = _SetCache, arraySome = _arraySome, cacheHas = _cacheHas;
  var COMPARE_PARTIAL_FLAG$5 = 1, COMPARE_UNORDERED_FLAG$3 = 2;
  function equalArrays$2(array, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG$5, arrLength = array.length, othLength = other.length;
    if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
      return false;
    }
    var arrStacked = stack.get(array);
    var othStacked = stack.get(other);
    if (arrStacked && othStacked) {
      return arrStacked == other && othStacked == array;
    }
    var index = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG$3 ? new SetCache() : void 0;
    stack.set(array, other);
    stack.set(other, array);
    while (++index < arrLength) {
      var arrValue = array[index], othValue = other[index];
      if (customizer) {
        var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
      }
      if (compared !== void 0) {
        if (compared) {
          continue;
        }
        result = false;
        break;
      }
      if (seen) {
        if (!arraySome(other, function(othValue2, othIndex) {
          if (!cacheHas(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
            return seen.push(othIndex);
          }
        })) {
          result = false;
          break;
        }
      } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
        result = false;
        break;
      }
    }
    stack["delete"](array);
    stack["delete"](other);
    return result;
  }
  var _equalArrays = equalArrays$2;
  var root$4 = _root;
  var Uint8Array$1 = root$4.Uint8Array;
  var _Uint8Array = Uint8Array$1;
  function mapToArray$1(map) {
    var index = -1, result = Array(map.size);
    map.forEach(function(value, key) {
      result[++index] = [key, value];
    });
    return result;
  }
  var _mapToArray = mapToArray$1;
  function setToArray$1(set) {
    var index = -1, result = Array(set.size);
    set.forEach(function(value) {
      result[++index] = value;
    });
    return result;
  }
  var _setToArray = setToArray$1;
  var Symbol$2 = _Symbol, Uint8Array = _Uint8Array, eq = eq_1, equalArrays$1 = _equalArrays, mapToArray = _mapToArray, setToArray = _setToArray;
  var COMPARE_PARTIAL_FLAG$4 = 1, COMPARE_UNORDERED_FLAG$2 = 2;
  var boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", mapTag$1 = "[object Map]", numberTag = "[object Number]", regexpTag = "[object RegExp]", setTag$1 = "[object Set]", stringTag = "[object String]", symbolTag$1 = "[object Symbol]";
  var arrayBufferTag = "[object ArrayBuffer]", dataViewTag$1 = "[object DataView]";
  var symbolProto$1 = Symbol$2 ? Symbol$2.prototype : void 0, symbolValueOf = symbolProto$1 ? symbolProto$1.valueOf : void 0;
  function equalByTag$1(object, other, tag, bitmask, customizer, equalFunc, stack) {
    switch (tag) {
      case dataViewTag$1:
        if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
          return false;
        }
        object = object.buffer;
        other = other.buffer;
      case arrayBufferTag:
        if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
          return false;
        }
        return true;
      case boolTag:
      case dateTag:
      case numberTag:
        return eq(+object, +other);
      case errorTag:
        return object.name == other.name && object.message == other.message;
      case regexpTag:
      case stringTag:
        return object == other + "";
      case mapTag$1:
        var convert = mapToArray;
      case setTag$1:
        var isPartial = bitmask & COMPARE_PARTIAL_FLAG$4;
        convert || (convert = setToArray);
        if (object.size != other.size && !isPartial) {
          return false;
        }
        var stacked = stack.get(object);
        if (stacked) {
          return stacked == other;
        }
        bitmask |= COMPARE_UNORDERED_FLAG$2;
        stack.set(object, other);
        var result = equalArrays$1(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
        stack["delete"](object);
        return result;
      case symbolTag$1:
        if (symbolValueOf) {
          return symbolValueOf.call(object) == symbolValueOf.call(other);
        }
    }
    return false;
  }
  var _equalByTag = equalByTag$1;
  function arrayPush$1(array, values) {
    var index = -1, length = values.length, offset = array.length;
    while (++index < length) {
      array[offset + index] = values[index];
    }
    return array;
  }
  var _arrayPush = arrayPush$1;
  var arrayPush = _arrayPush, isArray$6 = isArray_1;
  function baseGetAllKeys$1(object, keysFunc, symbolsFunc) {
    var result = keysFunc(object);
    return isArray$6(object) ? result : arrayPush(result, symbolsFunc(object));
  }
  var _baseGetAllKeys = baseGetAllKeys$1;
  function arrayFilter$1(array, predicate) {
    var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
    while (++index < length) {
      var value = array[index];
      if (predicate(value, index, array)) {
        result[resIndex++] = value;
      }
    }
    return result;
  }
  var _arrayFilter = arrayFilter$1;
  function stubArray$1() {
    return [];
  }
  var stubArray_1 = stubArray$1;
  var arrayFilter = _arrayFilter, stubArray = stubArray_1;
  var objectProto$3 = Object.prototype;
  var propertyIsEnumerable = objectProto$3.propertyIsEnumerable;
  var nativeGetSymbols = Object.getOwnPropertySymbols;
  var getSymbols$1 = !nativeGetSymbols ? stubArray : function(object) {
    if (object == null) {
      return [];
    }
    object = Object(object);
    return arrayFilter(nativeGetSymbols(object), function(symbol) {
      return propertyIsEnumerable.call(object, symbol);
    });
  };
  var _getSymbols = getSymbols$1;
  var overArg = _overArg;
  var nativeKeys$1 = overArg(Object.keys, Object);
  var _nativeKeys = nativeKeys$1;
  var isPrototype = _isPrototype, nativeKeys = _nativeKeys;
  var objectProto$2 = Object.prototype;
  var hasOwnProperty$2 = objectProto$2.hasOwnProperty;
  function baseKeys$1(object) {
    if (!isPrototype(object)) {
      return nativeKeys(object);
    }
    var result = [];
    for (var key in Object(object)) {
      if (hasOwnProperty$2.call(object, key) && key != "constructor") {
        result.push(key);
      }
    }
    return result;
  }
  var _baseKeys = baseKeys$1;
  var arrayLikeKeys = _arrayLikeKeys, baseKeys = _baseKeys, isArrayLike$1 = isArrayLike_1;
  function keys$3(object) {
    return isArrayLike$1(object) ? arrayLikeKeys(object) : baseKeys(object);
  }
  var keys_1 = keys$3;
  var baseGetAllKeys = _baseGetAllKeys, getSymbols = _getSymbols, keys$2 = keys_1;
  function getAllKeys$1(object) {
    return baseGetAllKeys(object, keys$2, getSymbols);
  }
  var _getAllKeys = getAllKeys$1;
  var getAllKeys = _getAllKeys;
  var COMPARE_PARTIAL_FLAG$3 = 1;
  var objectProto$1 = Object.prototype;
  var hasOwnProperty$1 = objectProto$1.hasOwnProperty;
  function equalObjects$1(object, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG$3, objProps = getAllKeys(object), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
    if (objLength != othLength && !isPartial) {
      return false;
    }
    var index = objLength;
    while (index--) {
      var key = objProps[index];
      if (!(isPartial ? key in other : hasOwnProperty$1.call(other, key))) {
        return false;
      }
    }
    var objStacked = stack.get(object);
    var othStacked = stack.get(other);
    if (objStacked && othStacked) {
      return objStacked == other && othStacked == object;
    }
    var result = true;
    stack.set(object, other);
    stack.set(other, object);
    var skipCtor = isPartial;
    while (++index < objLength) {
      key = objProps[index];
      var objValue = object[key], othValue = other[key];
      if (customizer) {
        var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
      }
      if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
        result = false;
        break;
      }
      skipCtor || (skipCtor = key == "constructor");
    }
    if (result && !skipCtor) {
      var objCtor = object.constructor, othCtor = other.constructor;
      if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
        result = false;
      }
    }
    stack["delete"](object);
    stack["delete"](other);
    return result;
  }
  var _equalObjects = equalObjects$1;
  var getNative$3 = _getNative, root$3 = _root;
  var DataView$1 = getNative$3(root$3, "DataView");
  var _DataView = DataView$1;
  var getNative$2 = _getNative, root$2 = _root;
  var Promise$2 = getNative$2(root$2, "Promise");
  var _Promise = Promise$2;
  var getNative$1 = _getNative, root$1 = _root;
  var Set$1 = getNative$1(root$1, "Set");
  var _Set = Set$1;
  var getNative = _getNative, root = _root;
  var WeakMap$1 = getNative(root, "WeakMap");
  var _WeakMap = WeakMap$1;
  var DataView = _DataView, Map = _Map, Promise$1 = _Promise, Set = _Set, WeakMap = _WeakMap, baseGetTag$1 = _baseGetTag, toSource = _toSource;
  var mapTag = "[object Map]", objectTag$1 = "[object Object]", promiseTag = "[object Promise]", setTag = "[object Set]", weakMapTag = "[object WeakMap]";
  var dataViewTag = "[object DataView]";
  var dataViewCtorString = toSource(DataView), mapCtorString = toSource(Map), promiseCtorString = toSource(Promise$1), setCtorString = toSource(Set), weakMapCtorString = toSource(WeakMap);
  var getTag$1 = baseGetTag$1;
  if (DataView && getTag$1(new DataView(new ArrayBuffer(1))) != dataViewTag || Map && getTag$1(new Map()) != mapTag || Promise$1 && getTag$1(Promise$1.resolve()) != promiseTag || Set && getTag$1(new Set()) != setTag || WeakMap && getTag$1(new WeakMap()) != weakMapTag) {
    getTag$1 = function(value) {
      var result = baseGetTag$1(value), Ctor = result == objectTag$1 ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : "";
      if (ctorString) {
        switch (ctorString) {
          case dataViewCtorString:
            return dataViewTag;
          case mapCtorString:
            return mapTag;
          case promiseCtorString:
            return promiseTag;
          case setCtorString:
            return setTag;
          case weakMapCtorString:
            return weakMapTag;
        }
      }
      return result;
    };
  }
  var _getTag = getTag$1;
  var Stack$1 = _Stack, equalArrays = _equalArrays, equalByTag = _equalByTag, equalObjects = _equalObjects, getTag = _getTag, isArray$5 = isArray_1, isBuffer = isBuffer$2.exports, isTypedArray = isTypedArray_1;
  var COMPARE_PARTIAL_FLAG$2 = 1;
  var argsTag = "[object Arguments]", arrayTag = "[object Array]", objectTag = "[object Object]";
  var objectProto = Object.prototype;
  var hasOwnProperty = objectProto.hasOwnProperty;
  function baseIsEqualDeep$1(object, other, bitmask, customizer, equalFunc, stack) {
    var objIsArr = isArray$5(object), othIsArr = isArray$5(other), objTag = objIsArr ? arrayTag : getTag(object), othTag = othIsArr ? arrayTag : getTag(other);
    objTag = objTag == argsTag ? objectTag : objTag;
    othTag = othTag == argsTag ? objectTag : othTag;
    var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
    if (isSameTag && isBuffer(object)) {
      if (!isBuffer(other)) {
        return false;
      }
      objIsArr = true;
      objIsObj = false;
    }
    if (isSameTag && !objIsObj) {
      stack || (stack = new Stack$1());
      return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
    }
    if (!(bitmask & COMPARE_PARTIAL_FLAG$2)) {
      var objIsWrapped = objIsObj && hasOwnProperty.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");
      if (objIsWrapped || othIsWrapped) {
        var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
        stack || (stack = new Stack$1());
        return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
      }
    }
    if (!isSameTag) {
      return false;
    }
    stack || (stack = new Stack$1());
    return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
  }
  var _baseIsEqualDeep = baseIsEqualDeep$1;
  var baseIsEqualDeep = _baseIsEqualDeep, isObjectLike$1 = isObjectLike_1;
  function baseIsEqual$2(value, other, bitmask, customizer, stack) {
    if (value === other) {
      return true;
    }
    if (value == null || other == null || !isObjectLike$1(value) && !isObjectLike$1(other)) {
      return value !== value && other !== other;
    }
    return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual$2, stack);
  }
  var _baseIsEqual = baseIsEqual$2;
  var Stack = _Stack, baseIsEqual$1 = _baseIsEqual;
  var COMPARE_PARTIAL_FLAG$1 = 1, COMPARE_UNORDERED_FLAG$1 = 2;
  function baseIsMatch$1(object, source, matchData, customizer) {
    var index = matchData.length, length = index, noCustomizer = !customizer;
    if (object == null) {
      return !length;
    }
    object = Object(object);
    while (index--) {
      var data = matchData[index];
      if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
        return false;
      }
    }
    while (++index < length) {
      data = matchData[index];
      var key = data[0], objValue = object[key], srcValue = data[1];
      if (noCustomizer && data[2]) {
        if (objValue === void 0 && !(key in object)) {
          return false;
        }
      } else {
        var stack = new Stack();
        if (customizer) {
          var result = customizer(objValue, srcValue, key, object, source, stack);
        }
        if (!(result === void 0 ? baseIsEqual$1(srcValue, objValue, COMPARE_PARTIAL_FLAG$1 | COMPARE_UNORDERED_FLAG$1, customizer, stack) : result)) {
          return false;
        }
      }
    }
    return true;
  }
  var _baseIsMatch = baseIsMatch$1;
  var isObject$1 = isObject_1;
  function isStrictComparable$2(value) {
    return value === value && !isObject$1(value);
  }
  var _isStrictComparable = isStrictComparable$2;
  var isStrictComparable$1 = _isStrictComparable, keys$1 = keys_1;
  function getMatchData$1(object) {
    var result = keys$1(object), length = result.length;
    while (length--) {
      var key = result[length], value = object[key];
      result[length] = [key, value, isStrictComparable$1(value)];
    }
    return result;
  }
  var _getMatchData = getMatchData$1;
  function matchesStrictComparable$2(key, srcValue) {
    return function(object) {
      if (object == null) {
        return false;
      }
      return object[key] === srcValue && (srcValue !== void 0 || key in Object(object));
    };
  }
  var _matchesStrictComparable = matchesStrictComparable$2;
  var baseIsMatch = _baseIsMatch, getMatchData = _getMatchData, matchesStrictComparable$1 = _matchesStrictComparable;
  function baseMatches$1(source) {
    var matchData = getMatchData(source);
    if (matchData.length == 1 && matchData[0][2]) {
      return matchesStrictComparable$1(matchData[0][0], matchData[0][1]);
    }
    return function(object) {
      return object === source || baseIsMatch(object, source, matchData);
    };
  }
  var _baseMatches = baseMatches$1;
  var baseGetTag = _baseGetTag, isObjectLike = isObjectLike_1;
  var symbolTag = "[object Symbol]";
  function isSymbol$4(value) {
    return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
  }
  var isSymbol_1 = isSymbol$4;
  var isArray$4 = isArray_1, isSymbol$3 = isSymbol_1;
  var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, reIsPlainProp = /^\w*$/;
  function isKey$3(value, object) {
    if (isArray$4(value)) {
      return false;
    }
    var type = typeof value;
    if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol$3(value)) {
      return true;
    }
    return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
  }
  var _isKey = isKey$3;
  var MapCache = _MapCache;
  var FUNC_ERROR_TEXT = "Expected a function";
  function memoize$1(func, resolver) {
    if (typeof func != "function" || resolver != null && typeof resolver != "function") {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    var memoized = function() {
      var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
      if (cache.has(key)) {
        return cache.get(key);
      }
      var result = func.apply(this, args);
      memoized.cache = cache.set(key, result) || cache;
      return result;
    };
    memoized.cache = new (memoize$1.Cache || MapCache)();
    return memoized;
  }
  memoize$1.Cache = MapCache;
  var memoize_1 = memoize$1;
  var memoize = memoize_1;
  var MAX_MEMOIZE_SIZE = 500;
  function memoizeCapped$1(func) {
    var result = memoize(func, function(key) {
      if (cache.size === MAX_MEMOIZE_SIZE) {
        cache.clear();
      }
      return key;
    });
    var cache = result.cache;
    return result;
  }
  var _memoizeCapped = memoizeCapped$1;
  var memoizeCapped = _memoizeCapped;
  var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
  var reEscapeChar = /\\(\\)?/g;
  var stringToPath$1 = memoizeCapped(function(string) {
    var result = [];
    if (string.charCodeAt(0) === 46) {
      result.push("");
    }
    string.replace(rePropName, function(match, number, quote2, subString) {
      result.push(quote2 ? subString.replace(reEscapeChar, "$1") : number || match);
    });
    return result;
  });
  var _stringToPath = stringToPath$1;
  function arrayMap$1(array, iteratee) {
    var index = -1, length = array == null ? 0 : array.length, result = Array(length);
    while (++index < length) {
      result[index] = iteratee(array[index], index, array);
    }
    return result;
  }
  var _arrayMap = arrayMap$1;
  var Symbol$1 = _Symbol, arrayMap = _arrayMap, isArray$3 = isArray_1, isSymbol$2 = isSymbol_1;
  var INFINITY$2 = 1 / 0;
  var symbolProto = Symbol$1 ? Symbol$1.prototype : void 0, symbolToString = symbolProto ? symbolProto.toString : void 0;
  function baseToString$1(value) {
    if (typeof value == "string") {
      return value;
    }
    if (isArray$3(value)) {
      return arrayMap(value, baseToString$1) + "";
    }
    if (isSymbol$2(value)) {
      return symbolToString ? symbolToString.call(value) : "";
    }
    var result = value + "";
    return result == "0" && 1 / value == -INFINITY$2 ? "-0" : result;
  }
  var _baseToString = baseToString$1;
  var baseToString = _baseToString;
  function toString$1(value) {
    return value == null ? "" : baseToString(value);
  }
  var toString_1 = toString$1;
  var isArray$2 = isArray_1, isKey$2 = _isKey, stringToPath = _stringToPath, toString = toString_1;
  function castPath$2(value, object) {
    if (isArray$2(value)) {
      return value;
    }
    return isKey$2(value, object) ? [value] : stringToPath(toString(value));
  }
  var _castPath = castPath$2;
  var isSymbol$1 = isSymbol_1;
  var INFINITY$1 = 1 / 0;
  function toKey$4(value) {
    if (typeof value == "string" || isSymbol$1(value)) {
      return value;
    }
    var result = value + "";
    return result == "0" && 1 / value == -INFINITY$1 ? "-0" : result;
  }
  var _toKey = toKey$4;
  var castPath$1 = _castPath, toKey$3 = _toKey;
  function baseGet$2(object, path) {
    path = castPath$1(path, object);
    var index = 0, length = path.length;
    while (object != null && index < length) {
      object = object[toKey$3(path[index++])];
    }
    return index && index == length ? object : void 0;
  }
  var _baseGet = baseGet$2;
  var baseGet$1 = _baseGet;
  function get$1(object, path, defaultValue) {
    var result = object == null ? void 0 : baseGet$1(object, path);
    return result === void 0 ? defaultValue : result;
  }
  var get_1 = get$1;
  function baseHasIn$1(object, key) {
    return object != null && key in Object(object);
  }
  var _baseHasIn = baseHasIn$1;
  var castPath = _castPath, isArguments = isArguments_1, isArray$1 = isArray_1, isIndex = _isIndex, isLength = isLength_1, toKey$2 = _toKey;
  function hasPath$1(object, path, hasFunc) {
    path = castPath(path, object);
    var index = -1, length = path.length, result = false;
    while (++index < length) {
      var key = toKey$2(path[index]);
      if (!(result = object != null && hasFunc(object, key))) {
        break;
      }
      object = object[key];
    }
    if (result || ++index != length) {
      return result;
    }
    length = object == null ? 0 : object.length;
    return !!length && isLength(length) && isIndex(key, length) && (isArray$1(object) || isArguments(object));
  }
  var _hasPath = hasPath$1;
  var baseHasIn = _baseHasIn, hasPath = _hasPath;
  function hasIn$1(object, path) {
    return object != null && hasPath(object, path, baseHasIn);
  }
  var hasIn_1 = hasIn$1;
  var baseIsEqual = _baseIsEqual, get = get_1, hasIn = hasIn_1, isKey$1 = _isKey, isStrictComparable = _isStrictComparable, matchesStrictComparable = _matchesStrictComparable, toKey$1 = _toKey;
  var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
  function baseMatchesProperty$1(path, srcValue) {
    if (isKey$1(path) && isStrictComparable(srcValue)) {
      return matchesStrictComparable(toKey$1(path), srcValue);
    }
    return function(object) {
      var objValue = get(object, path);
      return objValue === void 0 && objValue === srcValue ? hasIn(object, path) : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
    };
  }
  var _baseMatchesProperty = baseMatchesProperty$1;
  function baseProperty$1(key) {
    return function(object) {
      return object == null ? void 0 : object[key];
    };
  }
  var _baseProperty = baseProperty$1;
  var baseGet = _baseGet;
  function basePropertyDeep$1(path) {
    return function(object) {
      return baseGet(object, path);
    };
  }
  var _basePropertyDeep = basePropertyDeep$1;
  var baseProperty = _baseProperty, basePropertyDeep = _basePropertyDeep, isKey = _isKey, toKey = _toKey;
  function property$1(path) {
    return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
  }
  var property_1 = property$1;
  var baseMatches = _baseMatches, baseMatchesProperty = _baseMatchesProperty, identity = identity_1, isArray = isArray_1, property = property_1;
  function baseIteratee$2(value) {
    if (typeof value == "function") {
      return value;
    }
    if (value == null) {
      return identity;
    }
    if (typeof value == "object") {
      return isArray(value) ? baseMatchesProperty(value[0], value[1]) : baseMatches(value);
    }
    return property(value);
  }
  var _baseIteratee = baseIteratee$2;
  var baseIteratee$1 = _baseIteratee, isArrayLike = isArrayLike_1, keys = keys_1;
  function createFind$1(findIndexFunc) {
    return function(collection, predicate, fromIndex) {
      var iterable = Object(collection);
      if (!isArrayLike(collection)) {
        var iteratee = baseIteratee$1(predicate);
        collection = keys(collection);
        predicate = function(key) {
          return iteratee(iterable[key], key, iterable);
        };
      }
      var index = findIndexFunc(collection, predicate, fromIndex);
      return index > -1 ? iterable[iteratee ? collection[index] : index] : void 0;
    };
  }
  var _createFind = createFind$1;
  function baseFindIndex$1(array, predicate, fromIndex, fromRight) {
    var length = array.length, index = fromIndex + (fromRight ? 1 : -1);
    while (fromRight ? index-- : ++index < length) {
      if (predicate(array[index], index, array)) {
        return index;
      }
    }
    return -1;
  }
  var _baseFindIndex = baseFindIndex$1;
  var reWhitespace = /\s/;
  function trimmedEndIndex$1(string) {
    var index = string.length;
    while (index-- && reWhitespace.test(string.charAt(index))) {
    }
    return index;
  }
  var _trimmedEndIndex = trimmedEndIndex$1;
  var trimmedEndIndex = _trimmedEndIndex;
  var reTrimStart = /^\s+/;
  function baseTrim$1(string) {
    return string ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, "") : string;
  }
  var _baseTrim = baseTrim$1;
  var baseTrim = _baseTrim, isObject = isObject_1, isSymbol = isSymbol_1;
  var NAN = 0 / 0;
  var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
  var reIsBinary = /^0b[01]+$/i;
  var reIsOctal = /^0o[0-7]+$/i;
  var freeParseInt = parseInt;
  function toNumber$1(value) {
    if (typeof value == "number") {
      return value;
    }
    if (isSymbol(value)) {
      return NAN;
    }
    if (isObject(value)) {
      var other = typeof value.valueOf == "function" ? value.valueOf() : value;
      value = isObject(other) ? other + "" : other;
    }
    if (typeof value != "string") {
      return value === 0 ? value : +value;
    }
    value = baseTrim(value);
    var isBinary = reIsBinary.test(value);
    return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
  }
  var toNumber_1 = toNumber$1;
  var toNumber = toNumber_1;
  var INFINITY = 1 / 0, MAX_INTEGER = 17976931348623157e292;
  function toFinite$1(value) {
    if (!value) {
      return value === 0 ? value : 0;
    }
    value = toNumber(value);
    if (value === INFINITY || value === -INFINITY) {
      var sign = value < 0 ? -1 : 1;
      return sign * MAX_INTEGER;
    }
    return value === value ? value : 0;
  }
  var toFinite_1 = toFinite$1;
  var toFinite = toFinite_1;
  function toInteger$1(value) {
    var result = toFinite(value), remainder = result % 1;
    return result === result ? remainder ? result - remainder : result : 0;
  }
  var toInteger_1 = toInteger$1;
  var baseFindIndex = _baseFindIndex, baseIteratee = _baseIteratee, toInteger = toInteger_1;
  var nativeMax = Math.max;
  function findIndex$1(array, predicate, fromIndex) {
    var length = array == null ? 0 : array.length;
    if (!length) {
      return -1;
    }
    var index = fromIndex == null ? 0 : toInteger(fromIndex);
    if (index < 0) {
      index = nativeMax(length + index, 0);
    }
    return baseFindIndex(array, baseIteratee(predicate), index);
  }
  var findIndex_1 = findIndex$1;
  var createFind = _createFind, findIndex = findIndex_1;
  var find = createFind(findIndex);
  var find_1 = find;
  var socket_ioWebsocketOnly = { exports: {} };
  /*! Socket.IO.js build:0.9.17, development. Copyright(c) 2011 LearnBoost <dev@learnboost.com> MIT Licensed */
  (function(module) {
    const that = typeof window === "undefined" ? {} : window;
    var io = module.exports;
    (function() {
      (function(exports2, global2) {
        var io2 = exports2;
        io2.version = "0.9.17";
        io2.protocol = 1;
        io2.transports = [];
        io2.j = [];
        io2.sockets = {};
        io2.connect = function(host, details) {
          var uri = io2.util.parseUri(host), uuri, socket;
          if (global2 && global2.location) {
            uri.protocol = uri.protocol || global2.location.protocol.slice(0, -1);
            uri.host = uri.host || (global2.document ? global2.document.domain : global2.location.hostname);
            uri.port = uri.port || global2.location.port;
          }
          uuri = io2.util.uniqueUri(uri);
          var options = {
            host: uri.host,
            secure: uri.protocol == "https",
            port: uri.port || (uri.protocol == "https" ? 443 : 80),
            query: uri.query || ""
          };
          io2.util.merge(options, details);
          if (options["force new connection"] || !io2.sockets[uuri]) {
            socket = new io2.Socket(options);
          }
          if (!options["force new connection"] && socket) {
            io2.sockets[uuri] = socket;
          }
          socket = socket || io2.sockets[uuri];
          return socket.of(uri.path.length > 1 ? uri.path : "");
        };
      })(module.exports, that);
      (function(exports2, global2) {
        var util = exports2.util = {};
        var re = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
        var parts = [
          "source",
          "protocol",
          "authority",
          "userInfo",
          "user",
          "password",
          "host",
          "port",
          "relative",
          "path",
          "directory",
          "file",
          "query",
          "anchor"
        ];
        util.parseUri = function(str2) {
          var m = re.exec(str2 || ""), uri = {}, i = 14;
          while (i--) {
            uri[parts[i]] = m[i] || "";
          }
          return uri;
        };
        util.uniqueUri = function(uri) {
          var protocol = uri.protocol, host = uri.host, port = uri.port;
          if ("document" in global2) {
            host = host || document.domain;
            port = port || (protocol == "https" && document.location.protocol !== "https:" ? 443 : document.location.port);
          } else {
            host = host || "localhost";
            if (!port && protocol == "https") {
              port = 443;
            }
          }
          return (protocol || "http") + "://" + host + ":" + (port || 80);
        };
        util.query = function(base, addition) {
          var query = util.chunkQuery(base || ""), components = [];
          util.merge(query, util.chunkQuery(addition || ""));
          for (var part in query) {
            if (query.hasOwnProperty(part)) {
              components.push(part + "=" + query[part]);
            }
          }
          return components.length ? "?" + components.join("&") : "";
        };
        util.chunkQuery = function(qs) {
          var query = {}, params = qs.split("&"), i = 0, l = params.length, kv;
          for (; i < l; ++i) {
            kv = params[i].split("=");
            if (kv[0]) {
              query[kv[0]] = kv[1];
            }
          }
          return query;
        };
        var pageLoaded = false;
        util.load = function(fn) {
          if ("document" in global2 && document.readyState === "complete" || pageLoaded) {
            return fn();
          }
          util.on(global2, "load", fn, false);
        };
        util.on = function(element, event, fn, capture) {
          if (element.attachEvent) {
            element.attachEvent("on" + event, fn);
          } else if (element.addEventListener) {
            element.addEventListener(event, fn, capture);
          }
        };
        util.request = function(xdomain) {
          if (xdomain && typeof XDomainRequest != "undefined" && !util.ua.hasCORS) {
            return new XDomainRequest();
          }
          if (typeof XMLHttpRequest != "undefined" && (!xdomain || util.ua.hasCORS)) {
            return new XMLHttpRequest();
          }
          if (!xdomain) {
            try {
              return new window[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
            } catch (e) {
            }
          }
          return null;
        };
        if (typeof window != "undefined") {
          util.load(function() {
            pageLoaded = true;
          });
        }
        util.defer = function(fn) {
          if (!util.ua.webkit || typeof importScripts != "undefined") {
            return fn();
          }
          util.load(function() {
            setTimeout(fn, 100);
          });
        };
        util.merge = function merge(target, additional, deep, lastseen) {
          var seen = lastseen || [], depth = typeof deep == "undefined" ? 2 : deep, prop;
          for (prop in additional) {
            if (additional.hasOwnProperty(prop) && util.indexOf(seen, prop) < 0) {
              if (typeof target[prop] !== "object" || !depth) {
                target[prop] = additional[prop];
                seen.push(additional[prop]);
              } else {
                util.merge(target[prop], additional[prop], depth - 1, seen);
              }
            }
          }
          return target;
        };
        util.mixin = function(ctor, ctor2) {
          util.merge(ctor.prototype, ctor2.prototype);
        };
        util.inherit = function(ctor, ctor2) {
          function f2() {
          }
          f2.prototype = ctor2.prototype;
          ctor.prototype = new f2();
        };
        util.isArray = Array.isArray || function(obj) {
          return Object.prototype.toString.call(obj) === "[object Array]";
        };
        util.intersect = function(arr, arr2) {
          var ret = [], longest = arr.length > arr2.length ? arr : arr2, shortest = arr.length > arr2.length ? arr2 : arr;
          for (var i = 0, l = shortest.length; i < l; i++) {
            if (~util.indexOf(longest, shortest[i]))
              ret.push(shortest[i]);
          }
          return ret;
        };
        util.indexOf = function(arr, o, i) {
          for (var j2 = arr.length, i = i < 0 ? i + j2 < 0 ? 0 : i + j2 : i || 0; i < j2 && arr[i] !== o; i++) {
          }
          return j2 <= i ? -1 : i;
        };
        util.toArray = function(enu) {
          var arr = [];
          for (var i = 0, l = enu.length; i < l; i++)
            arr.push(enu[i]);
          return arr;
        };
        util.ua = {};
        util.ua.hasCORS = typeof XMLHttpRequest != "undefined" && function() {
          try {
            var a = new XMLHttpRequest();
          } catch (e) {
            return false;
          }
          return a.withCredentials != void 0;
        }();
        util.ua.webkit = typeof navigator != "undefined" && /webkit/i.test(navigator.userAgent);
        util.ua.iDevice = typeof navigator != "undefined" && /iPad|iPhone|iPod/i.test(navigator.userAgent);
      })(typeof io != "undefined" ? io : module.exports, that);
      (function(exports2, io2) {
        exports2.EventEmitter = EventEmitter;
        function EventEmitter() {
        }
        EventEmitter.prototype.on = function(name, fn) {
          if (!this.$events) {
            this.$events = {};
          }
          if (!this.$events[name]) {
            this.$events[name] = fn;
          } else if (io2.util.isArray(this.$events[name])) {
            this.$events[name].push(fn);
          } else {
            this.$events[name] = [this.$events[name], fn];
          }
          return this;
        };
        EventEmitter.prototype.addListener = EventEmitter.prototype.on;
        EventEmitter.prototype.once = function(name, fn) {
          var self2 = this;
          function on() {
            self2.removeListener(name, on);
            fn.apply(this, arguments);
          }
          on.listener = fn;
          this.on(name, on);
          return this;
        };
        EventEmitter.prototype.removeListener = function(name, fn) {
          if (this.$events && this.$events[name]) {
            var list = this.$events[name];
            if (io2.util.isArray(list)) {
              var pos = -1;
              for (var i = 0, l = list.length; i < l; i++) {
                if (list[i] === fn || list[i].listener && list[i].listener === fn) {
                  pos = i;
                  break;
                }
              }
              if (pos < 0) {
                return this;
              }
              list.splice(pos, 1);
              if (!list.length) {
                delete this.$events[name];
              }
            } else if (list === fn || list.listener && list.listener === fn) {
              delete this.$events[name];
            }
          }
          return this;
        };
        EventEmitter.prototype.removeAllListeners = function(name) {
          if (name === void 0) {
            this.$events = {};
            return this;
          }
          if (this.$events && this.$events[name]) {
            this.$events[name] = null;
          }
          return this;
        };
        EventEmitter.prototype.listeners = function(name) {
          if (!this.$events) {
            this.$events = {};
          }
          if (!this.$events[name]) {
            this.$events[name] = [];
          }
          if (!io2.util.isArray(this.$events[name])) {
            this.$events[name] = [this.$events[name]];
          }
          return this.$events[name];
        };
        EventEmitter.prototype.emit = function(name) {
          if (!this.$events) {
            return false;
          }
          var handler = this.$events[name];
          if (!handler) {
            return false;
          }
          var args = Array.prototype.slice.call(arguments, 1);
          if (typeof handler == "function") {
            handler.apply(this, args);
          } else if (io2.util.isArray(handler)) {
            var listeners = handler.slice();
            for (var i = 0, l = listeners.length; i < l; i++) {
              listeners[i].apply(this, args);
            }
          } else {
            return false;
          }
          return true;
        };
      })(typeof io != "undefined" ? io : module.exports, typeof io != "undefined" ? io : module.parent.exports);
      (function(exports, nativeJSON) {
        if (nativeJSON && nativeJSON.parse) {
          return exports.JSON = {
            parse: nativeJSON.parse,
            stringify: nativeJSON.stringify
          };
        }
        var JSON = exports.JSON = {};
        function f(n) {
          return n < 10 ? "0" + n : n;
        }
        function date(d, key) {
          return isFinite(d.valueOf()) ? d.getUTCFullYear() + "-" + f(d.getUTCMonth() + 1) + "-" + f(d.getUTCDate()) + "T" + f(d.getUTCHours()) + ":" + f(d.getUTCMinutes()) + ":" + f(d.getUTCSeconds()) + "Z" : null;
        }
        var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, gap, indent, meta = {
          "\b": "\\b",
          "	": "\\t",
          "\n": "\\n",
          "\f": "\\f",
          "\r": "\\r",
          '"': '\\"',
          "\\": "\\\\"
        }, rep;
        function quote(string) {
          escapable.lastIndex = 0;
          return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
            var c = meta[a];
            return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
          }) + '"' : '"' + string + '"';
        }
        function str(key, holder) {
          var i, k, v, length, mind = gap, partial, value = holder[key];
          if (value instanceof Date) {
            value = date(key);
          }
          if (typeof rep === "function") {
            value = rep.call(holder, key, value);
          }
          switch (typeof value) {
            case "string":
              return quote(value);
            case "number":
              return isFinite(value) ? String(value) : "null";
            case "boolean":
            case "null":
              return String(value);
            case "object":
              if (!value) {
                return "null";
              }
              gap += indent;
              partial = [];
              if (Object.prototype.toString.apply(value) === "[object Array]") {
                length = value.length;
                for (i = 0; i < length; i += 1) {
                  partial[i] = str(i, value) || "null";
                }
                v = partial.length === 0 ? "[]" : gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : "[" + partial.join(",") + "]";
                gap = mind;
                return v;
              }
              if (rep && typeof rep === "object") {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                  if (typeof rep[i] === "string") {
                    k = rep[i];
                    v = str(k, value);
                    if (v) {
                      partial.push(quote(k) + (gap ? ": " : ":") + v);
                    }
                  }
                }
              } else {
                for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                    v = str(k, value);
                    if (v) {
                      partial.push(quote(k) + (gap ? ": " : ":") + v);
                    }
                  }
                }
              }
              v = partial.length === 0 ? "{}" : gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : "{" + partial.join(",") + "}";
              gap = mind;
              return v;
          }
        }
        JSON.stringify = function(value, replacer, space) {
          var i;
          gap = "";
          indent = "";
          if (typeof space === "number") {
            for (i = 0; i < space; i += 1) {
              indent += " ";
            }
          } else if (typeof space === "string") {
            indent = space;
          }
          rep = replacer;
          if (replacer && typeof replacer !== "function" && (typeof replacer !== "object" || typeof replacer.length !== "number")) {
            throw new Error("JSON.stringify");
          }
          return str("", { "": value });
        };
        JSON.parse = function(text, reviver) {
          var j;
          function walk(holder, key) {
            var k, v, value = holder[key];
            if (value && typeof value === "object") {
              for (k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                  v = walk(value, k);
                  if (v !== void 0) {
                    value[k] = v;
                  } else {
                    delete value[k];
                  }
                }
              }
            }
            return reviver.call(holder, key, value);
          }
          text = String(text);
          cx.lastIndex = 0;
          if (cx.test(text)) {
            text = text.replace(cx, function(a) {
              return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
            });
          }
          if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
            j = eval("(" + text + ")");
            return typeof reviver === "function" ? walk({ "": j }, "") : j;
          }
          throw new SyntaxError("JSON.parse");
        };
      })(typeof io != "undefined" ? io : module.exports, typeof JSON !== "undefined" ? JSON : void 0);
      (function(exports2, io2) {
        var parser = exports2.parser = {};
        var packets = parser.packets = [
          "disconnect",
          "connect",
          "heartbeat",
          "message",
          "json",
          "event",
          "ack",
          "error",
          "noop"
        ];
        var reasons = parser.reasons = [
          "transport not supported",
          "client not handshaken",
          "unauthorized"
        ];
        var advice = parser.advice = ["reconnect"];
        var JSON2 = io2.JSON, indexOf = io2.util.indexOf;
        parser.encodePacket = function(packet) {
          var type = indexOf(packets, packet.type), id = packet.id || "", endpoint = packet.endpoint || "", ack = packet.ack, data = null;
          switch (packet.type) {
            case "error":
              var reason = packet.reason ? indexOf(reasons, packet.reason) : "", adv = packet.advice ? indexOf(advice, packet.advice) : "";
              if (reason !== "" || adv !== "")
                data = reason + (adv !== "" ? "+" + adv : "");
              break;
            case "message":
              if (packet.data !== "")
                data = packet.data;
              break;
            case "event":
              var ev = { name: packet.name };
              if (packet.args && packet.args.length) {
                ev.args = packet.args;
              }
              data = JSON2.stringify(ev);
              break;
            case "json":
              data = JSON2.stringify(packet.data);
              break;
            case "connect":
              if (packet.qs)
                data = packet.qs;
              break;
            case "ack":
              data = packet.ackId + (packet.args && packet.args.length ? "+" + JSON2.stringify(packet.args) : "");
              break;
          }
          var encoded = [type, id + (ack == "data" ? "+" : ""), endpoint];
          if (data !== null && data !== void 0)
            encoded.push(data);
          return encoded.join(":");
        };
        parser.encodePayload = function(packets2) {
          var decoded = "";
          if (packets2.length == 1)
            return packets2[0];
          for (var i = 0, l = packets2.length; i < l; i++) {
            var packet = packets2[i];
            decoded += "\uFFFD" + packet.length + "\uFFFD" + packets2[i];
          }
          return decoded;
        };
        var regexp = /([^:]+):([0-9]+)?(\+)?:([^:]+)?:?([\s\S]*)?/;
        parser.decodePacket = function(data) {
          var pieces = data.match(regexp);
          if (!pieces)
            return {};
          var id = pieces[2] || "", data = pieces[5] || "", packet = {
            type: packets[pieces[1]],
            endpoint: pieces[4] || ""
          };
          if (id) {
            packet.id = id;
            if (pieces[3])
              packet.ack = "data";
            else
              packet.ack = true;
          }
          switch (packet.type) {
            case "error":
              var pieces = data.split("+");
              packet.reason = reasons[pieces[0]] || "";
              packet.advice = advice[pieces[1]] || "";
              break;
            case "message":
              packet.data = data || "";
              break;
            case "event":
              try {
                var opts = JSON2.parse(data);
                packet.name = opts.name;
                packet.args = opts.args;
              } catch (e) {
              }
              packet.args = packet.args || [];
              break;
            case "json":
              try {
                packet.data = JSON2.parse(data);
              } catch (e) {
              }
              break;
            case "connect":
              packet.qs = data || "";
              break;
            case "ack":
              var pieces = data.match(/^([0-9]+)(\+)?(.*)/);
              if (pieces) {
                packet.ackId = pieces[1];
                packet.args = [];
                if (pieces[3]) {
                  try {
                    packet.args = pieces[3] ? JSON2.parse(pieces[3]) : [];
                  } catch (e) {
                  }
                }
              }
              break;
          }
          return packet;
        };
        parser.decodePayload = function(data) {
          if (data.charAt(0) == "\uFFFD") {
            var ret = [];
            for (var i = 1, length = ""; i < data.length; i++) {
              if (data.charAt(i) == "\uFFFD") {
                ret.push(parser.decodePacket(data.substr(i + 1).substr(0, length)));
                i += Number(length) + 1;
                length = "";
              } else {
                length += data.charAt(i);
              }
            }
            return ret;
          } else {
            return [parser.decodePacket(data)];
          }
        };
      })(typeof io != "undefined" ? io : module.exports, typeof io != "undefined" ? io : module.parent.exports);
      (function(exports2, io2) {
        exports2.Transport = Transport;
        function Transport(socket, sessid) {
          this.socket = socket;
          this.sessid = sessid;
        }
        io2.util.mixin(Transport, io2.EventEmitter);
        Transport.prototype.heartbeats = function() {
          return true;
        };
        Transport.prototype.onData = function(data) {
          this.clearCloseTimeout();
          if (this.socket.connected || this.socket.connecting || this.socket.reconnecting) {
            this.setCloseTimeout();
          }
          if (data !== "") {
            var msgs = io2.parser.decodePayload(data);
            if (msgs && msgs.length) {
              for (var i = 0, l = msgs.length; i < l; i++) {
                this.onPacket(msgs[i]);
              }
            }
          }
          return this;
        };
        Transport.prototype.onPacket = function(packet) {
          this.socket.setHeartbeatTimeout();
          if (packet.type == "heartbeat") {
            return this.onHeartbeat();
          }
          if (packet.type == "connect" && packet.endpoint == "") {
            this.onConnect();
          }
          if (packet.type == "error" && packet.advice == "reconnect") {
            this.isOpen = false;
          }
          this.socket.onPacket(packet);
          return this;
        };
        Transport.prototype.setCloseTimeout = function() {
          if (!this.closeTimeout) {
            var self2 = this;
            this.closeTimeout = setTimeout(function() {
              self2.onDisconnect();
            }, this.socket.closeTimeout);
          }
        };
        Transport.prototype.onDisconnect = function() {
          if (this.isOpen)
            this.close();
          this.clearTimeouts();
          this.socket.onDisconnect();
          return this;
        };
        Transport.prototype.onConnect = function() {
          this.socket.onConnect();
          return this;
        };
        Transport.prototype.clearCloseTimeout = function() {
          if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.closeTimeout = null;
          }
        };
        Transport.prototype.clearTimeouts = function() {
          this.clearCloseTimeout();
          if (this.reopenTimeout) {
            clearTimeout(this.reopenTimeout);
          }
        };
        Transport.prototype.packet = function(packet) {
          this.send(io2.parser.encodePacket(packet));
        };
        Transport.prototype.onHeartbeat = function(heartbeat) {
          this.packet({ type: "heartbeat" });
        };
        Transport.prototype.onOpen = function() {
          this.isOpen = true;
          this.clearCloseTimeout();
          this.socket.onOpen();
        };
        Transport.prototype.onClose = function() {
          this.isOpen = false;
          this.socket.onClose();
          this.onDisconnect();
        };
        Transport.prototype.prepareUrl = function() {
          var options = this.socket.options;
          return this.scheme() + "://" + options.host + ":" + options.port + "/" + options.resource + "/" + io2.protocol + "/" + this.name + "/" + this.sessid;
        };
        Transport.prototype.ready = function(socket, fn) {
          fn.call(this);
        };
      })(typeof io != "undefined" ? io : module.exports, typeof io != "undefined" ? io : module.parent.exports);
      (function(exports2, io2, global2) {
        exports2.Socket = Socket;
        function Socket(options) {
          this.options = {
            port: 80,
            secure: false,
            document: "document" in global2 ? document : false,
            resource: "socket.io",
            transports: io2.transports,
            "connect timeout": 1e4,
            "try multiple transports": true,
            reconnect: true,
            "reconnection delay": 500,
            "reconnection limit": Infinity,
            "reopen delay": 3e3,
            "max reconnection attempts": 10,
            "sync disconnect on unload": false,
            "auto connect": true,
            "flash policy port": 10843,
            manualFlush: false
          };
          io2.util.merge(this.options, options);
          this.connected = false;
          this.open = false;
          this.connecting = false;
          this.reconnecting = false;
          this.namespaces = {};
          this.buffer = [];
          this.doBuffer = false;
          if (this.options["sync disconnect on unload"] && (!this.isXDomain() || io2.util.ua.hasCORS)) {
            var self2 = this;
            io2.util.on(global2, "beforeunload", function() {
              self2.disconnectSync();
            }, false);
          }
          if (this.options["auto connect"]) {
            this.connect();
          }
        }
        io2.util.mixin(Socket, io2.EventEmitter);
        Socket.prototype.of = function(name) {
          if (!this.namespaces[name]) {
            this.namespaces[name] = new io2.SocketNamespace(this, name);
            if (name !== "") {
              this.namespaces[name].packet({ type: "connect" });
            }
          }
          return this.namespaces[name];
        };
        Socket.prototype.publish = function() {
          this.emit.apply(this, arguments);
          var nsp;
          for (var i in this.namespaces) {
            if (this.namespaces.hasOwnProperty(i)) {
              nsp = this.of(i);
              nsp.$emit.apply(nsp, arguments);
            }
          }
        };
        function empty() {
        }
        Socket.prototype.handshake = function(fn) {
          var self2 = this, options = this.options;
          function complete(data) {
            if (data instanceof Error) {
              self2.connecting = false;
              self2.onError(data.message);
            } else {
              fn.apply(null, data.split(":"));
            }
          }
          var url = [
            "http" + (options.secure ? "s" : "") + ":/",
            options.host + ":" + options.port,
            options.resource,
            io2.protocol,
            io2.util.query(this.options.query, "t=" + +new Date())
          ].join("/");
          if (this.isXDomain() && !io2.util.ua.hasCORS) {
            var insertAt = document.getElementsByTagName("script")[0], script = document.createElement("script");
            script.src = url + "&jsonp=" + io2.j.length;
            insertAt.parentNode.insertBefore(script, insertAt);
            io2.j.push(function(data) {
              complete(data);
              script.parentNode.removeChild(script);
            });
          } else {
            var xhr = io2.util.request();
            xhr.open("GET", url, true);
            if (this.isXDomain()) {
              xhr.withCredentials = true;
            }
            xhr.onreadystatechange = function() {
              if (xhr.readyState == 4) {
                xhr.onreadystatechange = empty;
                if (xhr.status == 200) {
                  complete(xhr.responseText);
                } else if (xhr.status == 403) {
                  self2.onError(xhr.responseText);
                } else {
                  self2.connecting = false;
                  !self2.reconnecting && self2.onError(xhr.responseText);
                }
              }
            };
            xhr.send(null);
          }
        };
        Socket.prototype.getTransport = function(override) {
          var transports = override || this.transports;
          for (var i = 0, transport; transport = transports[i]; i++) {
            if (io2.Transport[transport] && io2.Transport[transport].check(this) && (!this.isXDomain() || io2.Transport[transport].xdomainCheck(this))) {
              return new io2.Transport[transport](this, this.sessionid);
            }
          }
          return null;
        };
        Socket.prototype.connect = function(fn) {
          if (this.connecting) {
            return this;
          }
          var self2 = this;
          self2.connecting = true;
          this.handshake(function(sid, heartbeat, close, transports) {
            self2.sessionid = sid;
            self2.closeTimeout = close * 1e3;
            self2.heartbeatTimeout = heartbeat * 1e3;
            if (!self2.transports)
              self2.transports = self2.origTransports = transports ? io2.util.intersect(transports.split(","), self2.options.transports) : self2.options.transports;
            self2.setHeartbeatTimeout();
            function connect(transports2) {
              if (self2.transport)
                self2.transport.clearTimeouts();
              self2.transport = self2.getTransport(transports2);
              if (!self2.transport)
                return self2.publish("connect_failed");
              self2.transport.ready(self2, function() {
                self2.connecting = true;
                self2.publish("connecting", self2.transport.name);
                self2.transport.open();
                if (self2.options["connect timeout"]) {
                  self2.connectTimeoutTimer = setTimeout(function() {
                    if (!self2.connected) {
                      self2.connecting = false;
                      if (self2.options["try multiple transports"]) {
                        var remaining = self2.transports;
                        while (remaining.length > 0 && remaining.splice(0, 1)[0] != self2.transport.name) {
                        }
                        if (remaining.length) {
                          connect(remaining);
                        } else {
                          self2.publish("connect_failed");
                        }
                      }
                    }
                  }, self2.options["connect timeout"]);
                }
              });
            }
            connect(self2.transports);
            self2.once("connect", function() {
              clearTimeout(self2.connectTimeoutTimer);
              fn && typeof fn == "function" && fn();
            });
          });
          return this;
        };
        Socket.prototype.setHeartbeatTimeout = function() {
          clearTimeout(this.heartbeatTimeoutTimer);
          if (this.transport && !this.transport.heartbeats())
            return;
          var self2 = this;
          this.heartbeatTimeoutTimer = setTimeout(function() {
            self2.transport.onClose();
          }, this.heartbeatTimeout);
        };
        Socket.prototype.packet = function(data) {
          if (this.connected && !this.doBuffer) {
            this.transport.packet(data);
          } else {
            this.buffer.push(data);
          }
          return this;
        };
        Socket.prototype.setBuffer = function(v) {
          this.doBuffer = v;
          if (!v && this.connected && this.buffer.length) {
            if (!this.options["manualFlush"]) {
              this.flushBuffer();
            }
          }
        };
        Socket.prototype.flushBuffer = function() {
          this.transport.payload(this.buffer);
          this.buffer = [];
        };
        Socket.prototype.disconnect = function() {
          if (this.connected || this.connecting) {
            if (this.open) {
              this.of("").packet({ type: "disconnect" });
            }
            this.onDisconnect("booted");
          }
          return this;
        };
        Socket.prototype.disconnectSync = function() {
          var xhr = io2.util.request();
          var uri = [
            "http" + (this.options.secure ? "s" : "") + ":/",
            this.options.host + ":" + this.options.port,
            this.options.resource,
            io2.protocol,
            "",
            this.sessionid
          ].join("/") + "/?disconnect=1";
          xhr.open("GET", uri, false);
          xhr.send(null);
          this.onDisconnect("booted");
        };
        Socket.prototype.isXDomain = function() {
          var port = global2.location.port || (global2.location.protocol == "https:" ? 443 : 80);
          return this.options.host !== global2.location.hostname || this.options.port != port;
        };
        Socket.prototype.onConnect = function() {
          if (!this.connected) {
            this.connected = true;
            this.connecting = false;
            if (!this.doBuffer) {
              this.setBuffer(false);
            }
            this.emit("connect");
          }
        };
        Socket.prototype.onOpen = function() {
          this.open = true;
        };
        Socket.prototype.onClose = function() {
          this.open = false;
          clearTimeout(this.heartbeatTimeoutTimer);
        };
        Socket.prototype.onPacket = function(packet) {
          this.of(packet.endpoint).onPacket(packet);
        };
        Socket.prototype.onError = function(err) {
          if (err && err.advice) {
            if (err.advice === "reconnect" && (this.connected || this.connecting)) {
              this.disconnect();
              if (this.options.reconnect) {
                this.reconnect();
              }
            }
          }
          this.publish("error", err && err.reason ? err.reason : err);
        };
        Socket.prototype.onDisconnect = function(reason) {
          var wasConnected = this.connected, wasConnecting = this.connecting;
          this.connected = false;
          this.connecting = false;
          this.open = false;
          if (wasConnected || wasConnecting) {
            this.transport.close();
            this.transport.clearTimeouts();
            if (wasConnected) {
              this.publish("disconnect", reason);
              if (reason != "booted" && this.options.reconnect && !this.reconnecting) {
                this.reconnect();
              }
            }
          }
        };
        Socket.prototype.reconnect = function() {
          this.reconnecting = true;
          this.reconnectionAttempts = 0;
          this.reconnectionDelay = this.options["reconnection delay"];
          var self2 = this, maxAttempts = this.options["max reconnection attempts"], tryMultiple = this.options["try multiple transports"], limit = this.options["reconnection limit"];
          function reset() {
            if (self2.connected) {
              for (var i in self2.namespaces) {
                if (self2.namespaces.hasOwnProperty(i) && i !== "") {
                  self2.namespaces[i].packet({ type: "connect" });
                }
              }
              self2.publish("reconnect", self2.transport.name, self2.reconnectionAttempts);
            }
            clearTimeout(self2.reconnectionTimer);
            self2.removeListener("connect_failed", maybeReconnect);
            self2.removeListener("connect", maybeReconnect);
            self2.reconnecting = false;
            delete self2.reconnectionAttempts;
            delete self2.reconnectionDelay;
            delete self2.reconnectionTimer;
            delete self2.redoTransports;
            self2.options["try multiple transports"] = tryMultiple;
          }
          function maybeReconnect() {
            if (!self2.reconnecting) {
              return;
            }
            if (self2.connected) {
              return reset();
            }
            if (self2.connecting && self2.reconnecting) {
              return self2.reconnectionTimer = setTimeout(maybeReconnect, 1e3);
            }
            if (self2.reconnectionAttempts++ >= maxAttempts) {
              if (!self2.redoTransports) {
                self2.on("connect_failed", maybeReconnect);
                self2.options["try multiple transports"] = true;
                self2.transports = self2.origTransports;
                self2.transport = self2.getTransport();
                self2.redoTransports = true;
                self2.connect();
              } else {
                self2.publish("reconnect_failed");
                reset();
              }
            } else {
              if (self2.reconnectionDelay < limit) {
                self2.reconnectionDelay *= 2;
              }
              self2.connect();
              self2.publish("reconnecting", self2.reconnectionDelay, self2.reconnectionAttempts);
              self2.reconnectionTimer = setTimeout(maybeReconnect, self2.reconnectionDelay);
            }
          }
          this.options["try multiple transports"] = false;
          this.reconnectionTimer = setTimeout(maybeReconnect, this.reconnectionDelay);
          this.on("connect", maybeReconnect);
        };
      })(typeof io != "undefined" ? io : module.exports, typeof io != "undefined" ? io : module.parent.exports, that);
      (function(exports2, io2) {
        exports2.SocketNamespace = SocketNamespace;
        function SocketNamespace(socket, name) {
          this.socket = socket;
          this.name = name || "";
          this.flags = {};
          this.json = new Flag(this, "json");
          this.ackPackets = 0;
          this.acks = {};
        }
        io2.util.mixin(SocketNamespace, io2.EventEmitter);
        SocketNamespace.prototype.$emit = io2.EventEmitter.prototype.emit;
        SocketNamespace.prototype.of = function() {
          return this.socket.of.apply(this.socket, arguments);
        };
        SocketNamespace.prototype.packet = function(packet) {
          packet.endpoint = this.name;
          this.socket.packet(packet);
          this.flags = {};
          return this;
        };
        SocketNamespace.prototype.send = function(data, fn) {
          var packet = {
            type: this.flags.json ? "json" : "message",
            data
          };
          if (typeof fn == "function") {
            packet.id = ++this.ackPackets;
            packet.ack = true;
            this.acks[packet.id] = fn;
          }
          return this.packet(packet);
        };
        SocketNamespace.prototype.emit = function(name) {
          var args = Array.prototype.slice.call(arguments, 1), lastArg = args[args.length - 1], packet = {
            type: "event",
            name
          };
          if (typeof lastArg == "function") {
            packet.id = ++this.ackPackets;
            packet.ack = "data";
            this.acks[packet.id] = lastArg;
            args = args.slice(0, args.length - 1);
          }
          packet.args = args;
          return this.packet(packet);
        };
        SocketNamespace.prototype.disconnect = function() {
          if (this.name === "") {
            this.socket.disconnect();
          } else {
            this.packet({ type: "disconnect" });
            this.$emit("disconnect");
          }
          return this;
        };
        SocketNamespace.prototype.onPacket = function(packet) {
          var self2 = this;
          function ack() {
            self2.packet({
              type: "ack",
              args: io2.util.toArray(arguments),
              ackId: packet.id
            });
          }
          switch (packet.type) {
            case "connect":
              this.$emit("connect");
              break;
            case "disconnect":
              if (this.name === "") {
                this.socket.onDisconnect(packet.reason || "booted");
              } else {
                this.$emit("disconnect", packet.reason);
              }
              break;
            case "message":
            case "json":
              var params = ["message", packet.data];
              if (packet.ack == "data") {
                params.push(ack);
              } else if (packet.ack) {
                this.packet({ type: "ack", ackId: packet.id });
              }
              this.$emit.apply(this, params);
              break;
            case "event":
              var params = [packet.name].concat(packet.args);
              if (packet.ack == "data")
                params.push(ack);
              this.$emit.apply(this, params);
              break;
            case "ack":
              if (this.acks[packet.ackId]) {
                this.acks[packet.ackId].apply(this, packet.args);
                delete this.acks[packet.ackId];
              }
              break;
            case "error":
              if (packet.advice) {
                this.socket.onError(packet);
              } else {
                if (packet.reason == "unauthorized") {
                  this.$emit("connect_failed", packet.reason);
                } else {
                  this.$emit("error", packet.reason);
                }
              }
              break;
          }
        };
        function Flag(nsp, name) {
          this.namespace = nsp;
          this.name = name;
        }
        Flag.prototype.send = function() {
          this.namespace.flags[this.name] = true;
          this.namespace.send.apply(this.namespace, arguments);
        };
        Flag.prototype.emit = function() {
          this.namespace.flags[this.name] = true;
          this.namespace.emit.apply(this.namespace, arguments);
        };
      })(typeof io != "undefined" ? io : module.exports, typeof io != "undefined" ? io : module.parent.exports);
      (function(exports2, io2, global2) {
        exports2.websocket = WS;
        function WS(socket) {
          io2.Transport.apply(this, arguments);
        }
        io2.util.inherit(WS, io2.Transport);
        WS.prototype.name = "websocket";
        WS.prototype.open = function() {
          var query = io2.util.query(this.socket.options.query), self2 = this, Socket;
          if (!Socket) {
            Socket = global2.MozWebSocket || global2.WebSocket;
          }
          this.websocket = new Socket(this.prepareUrl() + query);
          this.websocket.onopen = function() {
            self2.onOpen();
            self2.socket.setBuffer(false);
          };
          this.websocket.onmessage = function(ev) {
            self2.onData(ev.data);
          };
          this.websocket.onclose = function() {
            self2.onClose();
            self2.socket.setBuffer(true);
          };
          this.websocket.onerror = function(e) {
            self2.onError(e);
          };
          return this;
        };
        if (io2.util.ua.iDevice) {
          WS.prototype.send = function(data) {
            var self2 = this;
            setTimeout(function() {
              self2.websocket.send(data);
            }, 0);
            return this;
          };
        } else {
          WS.prototype.send = function(data) {
            this.websocket.send(data);
            return this;
          };
        }
        WS.prototype.payload = function(arr) {
          for (var i = 0, l = arr.length; i < l; i++) {
            this.packet(arr[i]);
          }
          return this;
        };
        WS.prototype.close = function() {
          this.websocket.close();
          return this;
        };
        WS.prototype.onError = function(e) {
          this.socket.onError(e);
        };
        WS.prototype.scheme = function() {
          return this.socket.options.secure ? "wss" : "ws";
        };
        WS.check = function() {
          return "WebSocket" in global2 && !("__addTask" in WebSocket) || "MozWebSocket" in global2;
        };
        WS.xdomainCheck = function() {
          return true;
        };
        io2.transports.push("websocket");
      })(typeof io != "undefined" ? io.Transport : module.exports, typeof io != "undefined" ? io : module.parent.exports, that);
    })();
  })(socket_ioWebsocketOnly);
  var io = socket_ioWebsocketOnly.exports;
  class Event {
    constructor(topic, data, options = {}) {
      this._data = Object.assign({
        topic,
        data,
        target: "",
        inReplyToEvent: null
      }, options, {
        id: uuid.v4(),
        sent: null
      });
    }
    getData() {
      return this._data;
    }
    addSource(source) {
      this._data.source = source;
    }
  }
  function errorFactory(name) {
    function CustomError(message, errorCode) {
      this.name = name;
      this.message = message;
      this.errorCode = errorCode;
      this.stack = new Error().stack;
    }
    CustomError.prototype = new Error();
    return CustomError;
  }
  const ServerError = errorFactory("ServerError");
  const ServerPermissionDeniedError = errorFactory("ServerPermissionDeniedError");
  const ServerValidationError = errorFactory("ServerValidationError");
  const EventServerReplyTimeoutError = errorFactory("EventServerReplyTimeoutError");
  const EventServerConnectionTimeoutError = errorFactory("EventServerConnectionTimeoutError");
  const NotUniqueError = errorFactory("NotUniqueError");
  const CreateComponentError = errorFactory("CreateComponentError");
  const AbortError = errorFactory("AbortError");
  const exports$3 = {
    ServerError,
    ServerPermissionDeniedError,
    ServerValidationError,
    EventServerReplyTimeoutError,
    EventServerConnectionTimeoutError,
    NotUniqueError,
    CreateComponentError,
    AbortError
  };
  function encodeUriParameters(data) {
    return Object.keys(data).map((key) => [key, data[key]].map(encodeURIComponent).join("=")).join("&");
  }
  class EventHub {
    constructor(serverUrl, apiUser, apiKey, { applicationId = "ftrack.api.javascript" } = {}) {
      this.logger = loglevel__default["default"].getLogger("ftrack_api:EventHub");
      this._applicationId = applicationId;
      this._apiUser = apiUser;
      this._apiKey = apiKey;
      const portRegex = new RegExp("\\:\\d+$");
      if (serverUrl.match(portRegex)) {
        this._serverUrl = serverUrl;
      } else {
        const port = serverUrl.lastIndexOf("https", 0) === 0 ? "443" : "80";
        this._serverUrl = `${serverUrl}:${port}`;
      }
      this._id = uuid.v4();
      this._replyCallbacks = {};
      this._unsentEvents = [];
      this._subscribers = [];
      this._socketIo = null;
      this._handle = this._handle.bind(this);
      this._handleReply = this._handleReply.bind(this);
      this._onSocketConnected = this._onSocketConnected.bind(this);
    }
    connect() {
      this._socketIo = io.connect(this._serverUrl, {
        "max reconnection attempts": Infinity,
        "reconnection limit": 1e4,
        "reconnection delay": 5e3,
        transports: ["websocket"],
        query: encodeUriParameters({
          api_user: this._apiUser,
          api_key: this._apiKey
        })
      });
      this._socketIo.on("connect", this._onSocketConnected);
      this._socketIo.on("ftrack.event", this._handle);
    }
    isConnected() {
      return this._socketIo && this._socketIo.socket.connected || false;
    }
    _onSocketConnected() {
      this.logger.debug("Connected to event server.");
      try {
        this.subscribe("topic=ftrack.meta.reply", this._handleReply, {
          id: this._id
        });
      } catch (error) {
        if (error instanceof NotUniqueError) {
          this.logger.debug("Already subscribed to replies.");
        } else {
          throw error;
        }
      }
      for (const subscriber of this._subscribers) {
        this._notifyServerAboutSubscriber(subscriber);
      }
      const callbacks = this._unsentEvents;
      if (callbacks.length) {
        this._unsentEvents = [];
        this.logger.debug(`Publishing ${callbacks.length} unsent events.`);
        for (const callback of callbacks) {
          this._runWhenConnected(callback);
        }
      }
    }
    publish(event, { onReply = null, timeout = 10 } = {}) {
      event.addSource({
        id: this._id,
        applicationId: this._applicationId,
        user: {
          username: this._apiUser
        }
      });
      const eventData = Object.assign({}, event.getData());
      const eventId = eventData.id;
      const onConnected = new Promise((resolve, reject) => {
        this._runWhenConnected(resolve);
        if (timeout) {
          setTimeout(() => {
            const error = new EventServerConnectionTimeoutError("Unable to connect to event server within timeout.");
            reject(error);
          }, timeout * 1e3);
        }
      });
      const onPublish = onConnected.then(() => {
        if (onReply) {
          this._replyCallbacks[eventId] = onReply;
        }
        this.logger.debug("Publishing event.", eventData);
        this._socketIo.emit("ftrack.event", eventData);
        return Promise.resolve(eventId);
      });
      return onPublish;
    }
    publishAndWaitForReply(event, { timeout = 30 }) {
      const response = new Promise((resolve, reject) => {
        const onReply = (replyEvent) => {
          resolve(replyEvent);
          this._removeReplyCallback(event.id);
        };
        this.publish(event, { timeout, onReply });
        if (timeout) {
          setTimeout(() => {
            const error = new EventServerReplyTimeoutError("No reply event received within timeout.");
            reject(error);
            this._removeReplyCallback(event.id);
          }, timeout * 1e3);
        }
      });
      return response;
    }
    _removeReplyCallback(eventId) {
      if (this._replyCallbacks[eventId]) {
        delete this._replyCallbacks[eventId];
      }
    }
    _runWhenConnected(callback) {
      if (!this.isConnected()) {
        this.logger.debug("Event hub is not connected, event is delayed.");
        this._unsentEvents.push(callback);
        this._socketIo.socket.reconnect();
      } else {
        callback();
      }
    }
    subscribe(subscription, callback, metadata = {}) {
      const subscriber = this._addSubscriber(subscription, callback, metadata);
      this._notifyServerAboutSubscriber(subscriber);
      return subscriber.metadata.id;
    }
    _getExpressionTopic(subscription) {
      const regex = new RegExp(`^topic[ ]?=[ '"]?([\\w-,./*@+]+)['"]?$`);
      const matches = subscription.trim().match(regex);
      if (matches && matches.length === 2) {
        return matches[1];
      }
      throw new Error('Only subscriptions on the format "topic=value" are supported.');
    }
    _addSubscriber(subscription, callback, metadata = {}) {
      this._getExpressionTopic(subscription);
      if (!metadata.id) {
        metadata.id = uuid.v4();
      }
      const existingSubscriber = this.getSubscriberByIdentifier(metadata.id);
      if (existingSubscriber) {
        throw new NotUniqueError(`Subscriber with identifier "${metadata.id}" already exists.`);
      }
      const subscriber = {
        subscription,
        callback,
        metadata
      };
      this._subscribers.push(subscriber);
      return subscriber;
    }
    _notifyServerAboutSubscriber(subscriber) {
      const subscribeEvent = new Event("ftrack.meta.subscribe", {
        subscriber: subscriber.metadata,
        subscription: subscriber.subscription
      });
      this.publish(subscribeEvent);
    }
    getSubscriberByIdentifier(identifier) {
      for (const subscriber of this._subscribers.slice()) {
        if (subscriber.metadata.id === identifier) {
          return subscriber;
        }
      }
      return null;
    }
    _IsSubscriberInterestedIn(subscriber, event) {
      const topic = this._getExpressionTopic(subscriber.subscription);
      if (topic === event.topic) {
        return true;
      }
      return false;
    }
    _handle(event) {
      this.logger.debug("Event received", event);
      for (const subscriber of this._subscribers) {
        if (!this._IsSubscriberInterestedIn(subscriber, event)) {
          continue;
        }
        let response = null;
        try {
          response = subscriber.callback(event);
        } catch (error) {
          this.logger.error("Error calling subscriber for event.", error, subscriber, event);
        }
        if (response != null) {
          this.publishReply(event, response, subscriber.metadata);
        }
      }
    }
    _handleReply(event) {
      this.logger.debug("Reply received", event);
      const onReplyCallback = this._replyCallbacks[event.inReplyToEvent];
      if (onReplyCallback) {
        onReplyCallback(event);
      }
    }
    publishReply(sourceEvent, data, source = null) {
      const replyEvent = new Event("ftrack.meta.reply", data);
      replyEvent._data.target = `id=${sourceEvent.source.id}`;
      replyEvent._data.inReplyToEvent = sourceEvent.id;
      if (source) {
        replyEvent._data.source = source;
      }
      return this.publish(replyEvent);
    }
  }
  function createOperation(type, data) {
    const operation = { action: "create", entity_type: type };
    operation.entity_data = Object.assign({}, data, { __entity_type__: type });
    return operation;
  }
  function queryOperation(expression) {
    return { action: "query", expression };
  }
  function searchOperation({
    expression,
    entityType,
    terms,
    contextId,
    objectTypeIds
  }) {
    return {
      action: "search",
      expression,
      entity_type: entityType,
      terms,
      context_id: contextId,
      object_type_ids: objectTypeIds
    };
  }
  function updateOperation(type, keys2, data) {
    const operation = {
      action: "update",
      entity_type: type,
      entity_key: keys2
    };
    operation.entity_data = Object.assign({}, data, { __entity_type__: type });
    return operation;
  }
  function deleteOperation(type, keys2) {
    const operation = {
      action: "delete",
      entity_type: type,
      entity_key: keys2
    };
    return operation;
  }
  const exports$2 = {
    query: queryOperation,
    create: createOperation,
    update: updateOperation,
    delete: deleteOperation,
    search: searchOperation
  };
  const SERVER_LOCATION_ID = "3a372bde-05bc-11e4-8908-20c9d081909b";
  function normalizeString(value) {
    let result = value;
    try {
      result = value.normalize();
    } catch (error) {
      loglevel__default["default"].warn("Failed to normalize string", value, error);
    }
    return result;
  }
  const logger = loglevel__default["default"].getLogger("ftrack_api");
  const ENCODE_DATETIME_FORMAT = "YYYY-MM-DDTHH:mm:ss";
  function splitFileExtension(fileName) {
    let basename = fileName || "";
    let extension = fileName.slice((Math.max(0, fileName.lastIndexOf(".")) || Infinity) + 1) || "";
    if (extension.length) {
      extension = `.${extension}`;
      basename = fileName.slice(0, -1 * extension.length) || "";
    }
    return [basename, extension];
  }
  class Session {
    constructor(serverUrl, apiUser, apiKey, {
      autoConnectEventHub = false,
      serverInformationValues = null,
      eventHubOptions = {},
      clientToken = null,
      apiEndpoint = "/api"
    } = {}) {
      if (!serverUrl || !apiUser || !apiKey) {
        throw new Error("Invalid arguments, please construct Session with *serverUrl*, *apiUser* and *apiKey*.");
      }
      this.apiUser = apiUser;
      this.apiKey = apiKey;
      this.serverUrl = serverUrl;
      this.apiEndpoint = apiEndpoint;
      this.eventHub = new EventHub(serverUrl, apiUser, apiKey, eventHubOptions);
      if (autoConnectEventHub) {
        this.eventHub.connect();
      }
      if (clientToken) {
        this.clientToken = clientToken;
      } else {
        this.clientToken = `ftrack-javascript-api--${uuid.v4()}`;
      }
      if (serverInformationValues && !serverInformationValues.includes("is_timezone_support_enabled")) {
        serverInformationValues.push("is_timezone_support_enabled");
      }
      const operations = [
        {
          action: "query_server_information",
          values: serverInformationValues
        },
        { action: "query_schemas" }
      ];
      this.initialized = false;
      this.initializing = this.call(operations).then((responses) => {
        this.serverInformation = responses[0];
        this.schemas = responses[1];
        this.serverVersion = this.serverInformation.version;
        this.initialized = true;
        return Promise.resolve(this);
      });
    }
    getPrimaryKeyAttributes(entityType) {
      const schema = find_1(this.schemas, (item) => item.id === entityType);
      if (!schema || !schema.primary_key) {
        logger.warn("Primary key could not be found for: ", entityType);
        return null;
      }
      return schema.primary_key;
    }
    getIdentifyingKey(entity) {
      const primaryKeys = this.getPrimaryKeyAttributes(entity.__entity_type__);
      if (primaryKeys) {
        return [
          entity.__entity_type__,
          ...primaryKeys.map((attribute) => entity[attribute])
        ].join(",");
      }
      return null;
    }
    encode(data) {
      if (data && data.constructor === Array) {
        return data.map((item) => this.encode(item));
      }
      if (data && data.constructor === Object) {
        const out = {};
        forIn_1(data, (value, key) => {
          out[key] = this.encode(value);
        });
        return out;
      }
      if (data && data._isAMomentObject) {
        if (this.serverInformation && this.serverInformation.is_timezone_support_enabled) {
          return {
            __type__: "datetime",
            value: data.utc().format(ENCODE_DATETIME_FORMAT)
          };
        }
        return {
          __type__: "datetime",
          value: data.local().format(ENCODE_DATETIME_FORMAT)
        };
      }
      return data;
    }
    getErrorFromResponse(response) {
      let ErrorClass;
      if (response.exception === "AbortError") {
        ErrorClass = AbortError;
      } else if (response.exception === "ValidationError") {
        ErrorClass = ServerValidationError;
      } else if (response.exception === "FTAuthenticationError" || response.exception === "PermissionError") {
        ErrorClass = ServerPermissionDeniedError;
      } else {
        ErrorClass = ServerError;
      }
      const error = new ErrorClass(response.content, response.error_code);
      return error;
    }
    decode(data, identityMap = {}) {
      if (data == null) {
        return data;
      } else if (isArray_1(data)) {
        return this._decodeArray(data, identityMap);
      } else if (isPlainObject_1(data)) {
        if (data.__entity_type__) {
          return this._mergeEntity(data, identityMap);
        } else if (data.__type__ === "datetime") {
          return this._decodeDateTime(data);
        }
        return this._decodePlainObject(data, identityMap);
      }
      return data;
    }
    _decodeDateTime(data) {
      if (this.serverInformation && this.serverInformation.is_timezone_support_enabled) {
        return moment__default["default"].utc(data.value);
      }
      return moment__default["default"](data.value);
    }
    _decodePlainObject(object, identityMap) {
      return Object.keys(object).reduce((previous, key) => {
        previous[key] = this.decode(object[key], identityMap);
        return previous;
      }, {});
    }
    _decodeArray(collection, identityMap) {
      return collection.map((item) => this.decode(item, identityMap));
    }
    _mergeEntity(entity, identityMap) {
      const identifier = this.getIdentifyingKey(entity);
      if (!identifier) {
        logger.warn("Identifier could not be determined for: ", identifier);
        return entity;
      }
      if (!identityMap[identifier]) {
        identityMap[identifier] = {};
      }
      const mergedEntity = identityMap[identifier];
      forIn_1(entity, (value, key) => {
        mergedEntity[key] = this.decode(value, identityMap);
      });
      return mergedEntity;
    }
    encodeOperations(operations) {
      return JSON.stringify(this.encode(operations));
    }
    call(operations, { abortController } = {}) {
      const url = `${this.serverUrl}${this.apiEndpoint}`;
      let request = new Promise((resolve) => {
        if (this.initializing && !this.initialized) {
          this.initializing.then(() => {
            resolve();
          });
        } else {
          resolve();
        }
      });
      request = request.then(() => fetch(url, {
        method: "post",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "ftrack-api-key": this.apiKey,
          "ftrack-user": this.apiUser,
          "ftrack-Clienttoken": this.clientToken
        },
        body: this.encodeOperations(operations),
        signal: abortController && abortController.signal
      }));
      request = request.catch((reason) => {
        logger.warn("Failed to perform request. ", reason);
        if (reason.name === "AbortError") {
          return Promise.resolve({
            exception: "AbortError",
            content: reason.message
          });
        }
        return Promise.resolve({
          exception: "NetworkError",
          content: reason.message
        });
      });
      request = request.then((response) => response.json && response.json() || response);
      request = request.then((data) => {
        if (this.initialized) {
          return this.decode(data);
        }
        return data;
      });
      request = request.catch((reason) => {
        logger.warn("Server reported error in unexpected format. ", reason);
        return Promise.resolve({
          exception: "MalformedResponseError",
          content: reason.message,
          error: reason
        });
      });
      request = request.then((response) => {
        if (response.exception) {
          return Promise.reject(this.getErrorFromResponse(response));
        }
        return Promise.resolve(response);
      });
      return request;
    }
    ensure(entityType, data, identifyingKeys = []) {
      let keys2 = identifyingKeys;
      logger.info("Ensuring entity with data using identifying keys: ", entityType, data, identifyingKeys);
      if (!keys2.length) {
        keys2 = Object.keys(data);
      }
      if (!keys2.length) {
        throw new Error(`Could not determine any identifying data to check against when ensuring ${entityType} with data ${data}. Identifying keys: ${identifyingKeys}`);
      }
      const primaryKeys = this.getPrimaryKeyAttributes(entityType);
      let expression = `select ${primaryKeys.join(", ")} from ${entityType} where`;
      const criteria = keys2.map((identifyingKey) => {
        let value = data[identifyingKey];
        if (isString_1(value)) {
          value = `"${value}"`;
        } else if (value && value._isAMomentObject) {
          value = moment__default["default"](value).utc().format(ENCODE_DATETIME_FORMAT);
          value = `"${value}"`;
        }
        return `${identifyingKey} is ${value}`;
      });
      expression = `${expression} ${criteria.join(" and ")}`;
      return this.query(expression).then((response) => {
        if (response.data.length === 0) {
          return this.create(entityType, data).then(({ data: responseData }) => Promise.resolve(responseData));
        }
        if (response.data.length !== 1) {
          throw new Error(`Expected single or no item to be found but got multiple when ensuring ${entityType} with data ${data}. Identifying keys: ${identifyingKeys}`);
        }
        const updateEntity = response.data[0];
        let updated = false;
        Object.keys(data).forEach((key) => {
          if (data[key] !== updateEntity[key]) {
            updateEntity[key] = data[key];
            updated = true;
          }
        });
        if (updated) {
          return this.update(entityType, primaryKeys.map((key) => updateEntity[key]), Object.keys(data).reduce((accumulator, key) => {
            if (primaryKeys.indexOf(key) === -1) {
              accumulator[key] = data[key];
            }
            return accumulator;
          }, {})).then(({ data: responseData }) => Promise.resolve(responseData));
        }
        return Promise.resolve(response.data[0]);
      });
    }
    getSchema(schemaId) {
      for (const index in this.schemas) {
        if (this.schemas[index].id === schemaId) {
          return this.schemas[index];
        }
      }
      return null;
    }
    query(expression, { abortController } = {}) {
      logger.debug("Query", expression);
      const operation = queryOperation(expression);
      let request = this.call([operation], abortController);
      request = request.then((responses) => {
        const response = responses[0];
        return response;
      });
      return request;
    }
    search({ expression, entityType, terms = [], contextId, objectTypeIds }, { abortController } = {}) {
      logger.debug("Search", {
        expression,
        entityType,
        terms,
        contextId,
        objectTypeIds
      });
      const operation = searchOperation({
        expression,
        entityType,
        terms,
        contextId,
        objectTypeIds
      });
      let request = this.call([operation], abortController);
      request = request.then((responses) => {
        const response = responses[0];
        return response;
      });
      return request;
    }
    create(type, data) {
      logger.debug("Create", type, data);
      let request = this.call([createOperation(type, data)]);
      request = request.then((responses) => {
        const response = responses[0];
        return response;
      });
      return request;
    }
    update(type, keys2, data) {
      logger.debug("Update", type, keys2, data);
      let request = this.call([updateOperation(type, keys2, data)]);
      request = request.then((responses) => {
        const response = responses[0];
        return response;
      });
      return request;
    }
    delete(type, id) {
      logger.debug("Delete", type, id);
      let request = this.call([deleteOperation(type, id)]);
      request = request.then((responses) => {
        const response = responses[0];
        return response;
      });
      return request;
    }
    getComponentUrl(componentId) {
      if (!componentId) {
        return null;
      }
      const params = {
        id: componentId,
        username: this.apiUser,
        apiKey: this.apiKey
      };
      return `${this.serverUrl}/component/get?${encodeUriParameters(params)}`;
    }
    thumbnailUrl(componentId, { size = 300 } = {}) {
      if (!componentId) {
        return `${this.serverUrl}/img/thumbnail2.png`;
      }
      const params = {
        id: componentId,
        size,
        username: this.apiUser,
        apiKey: this.apiKey
      };
      return `${this.serverUrl}/component/thumbnail?${encodeUriParameters(params)}`;
    }
    createComponent(file, options = {}) {
      const normalizedFileName = normalizeString(file.name);
      const fileNameParts = splitFileExtension(normalizedFileName);
      const defaultProgress = (progress) => progress;
      const defaultAbort = () => {
      };
      const data = options.data || {};
      const onProgress = options.onProgress || defaultProgress;
      const xhr = options.xhr || new XMLHttpRequest();
      const onAborted = options.onAborted || defaultAbort;
      const fileType = data.file_type || fileNameParts[1];
      const fileName = data.name || fileNameParts[0];
      const fileSize = data.size || file.size;
      const componentId = data.id || uuid.v4();
      const componentLocationId = uuid.v4();
      let url;
      let headers;
      const updateOnProgressCallback = (oEvent) => {
        if (oEvent.lengthComputable) {
          onProgress(parseInt(oEvent.loaded / oEvent.total * 100, 10));
        }
      };
      logger.debug("Registering component and fetching upload metadata.");
      const component = Object.assign(data, {
        id: componentId,
        name: fileName,
        file_type: fileType,
        size: fileSize
      });
      const componentLocation = {
        id: componentLocationId,
        component_id: componentId,
        resource_identifier: componentId,
        location_id: SERVER_LOCATION_ID
      };
      const componentAndLocationPromise = this.call([
        createOperation("FileComponent", component),
        createOperation("ComponentLocation", componentLocation),
        {
          action: "get_upload_metadata",
          file_name: `${fileName}${fileType}`,
          file_size: fileSize,
          component_id: componentId
        }
      ]).then((response) => {
        url = response[2].url;
        headers = response[2].headers;
        return response;
      });
      return componentAndLocationPromise.then(() => {
        logger.debug(`Uploading file to: ${url}`);
        return new Promise((resolve, reject) => {
          xhr.upload.addEventListener("progress", updateOnProgressCallback);
          xhr.open("PUT", url, true);
          xhr.onabort = () => {
            onAborted();
            this.delete("FileComponent", [componentId]).then(() => {
              reject(new CreateComponentError("Upload aborted by client", "UPLOAD_ABORTED"));
            });
          };
          for (const key in headers) {
            if (headers.hasOwnProperty(key) && key !== "Content-Length") {
              xhr.setRequestHeader(key, headers[key]);
            }
          }
          xhr.onload = () => {
            if (xhr.status >= 400) {
              reject(new CreateComponentError(`Failed to upload file: ${xhr.status}`));
            }
            resolve(xhr.response);
          };
          xhr.onerror = () => {
            this.delete("FileComponent", [componentId]).then(() => {
              reject(new CreateComponentError(`Failed to upload file: ${xhr.status}`));
            });
          };
          xhr.send(file);
        }).then(() => componentAndLocationPromise);
      });
    }
  }
  function getStatuses(session, projectSchemaId, entityType, typeId = null) {
    let response;
    const taskWorkflowAttributes = [
      "_task_workflow.statuses.name",
      "_task_workflow.statuses.color",
      "_task_workflow.statuses.sort"
    ];
    const versionWorkflowAttributes = [
      "_version_workflow.statuses.name",
      "_version_workflow.statuses.color",
      "_version_workflow.statuses.sort"
    ];
    const overridesAttributes = [
      "_overrides.type_id",
      "_overrides.workflow_schema.statuses.name",
      "_overrides.workflow_schema.statuses.sort",
      "_overrides.workflow_schema.statuses.color"
    ];
    const schemasAttributes = [
      "_schemas.type_id",
      "_schemas.statuses.task_status.name",
      "_schemas.statuses.task_status.color",
      "_schemas.statuses.task_status.sort"
    ];
    let groupedAttributes;
    if (entityType === "Task" && typeId !== null) {
      groupedAttributes = [taskWorkflowAttributes, overridesAttributes];
    } else if (entityType === "Task") {
      groupedAttributes = [taskWorkflowAttributes];
    } else if (entityType === "AssetVersion") {
      groupedAttributes = [versionWorkflowAttributes];
    } else {
      groupedAttributes = [schemasAttributes];
    }
    const operations = groupedAttributes.map((select) => exports$2.query(`select ${select.join(", ")} from ProjectSchema where id is ${projectSchemaId}`));
    response = session.call(operations);
    response = response.then((results) => {
      const data = results[0].data[0];
      let statuses = [];
      if (entityType === "Task") {
        statuses = null;
        if (typeId !== null && data._overrides.length > 0) {
          for (const index in data._overrides) {
            if (data._overrides[index].type_id === typeId) {
              statuses = data._overrides[index].workflow_schema.statuses;
              break;
            }
          }
        }
        if (statuses === null) {
          statuses = data._task_workflow.statuses;
        }
      } else if (entityType === "AssetVersion") {
        statuses = data._version_workflow.statuses;
      } else {
        const schema = session.getSchema(entityType);
        if (schema && schema.alias_for && schema.alias_for.id === "Task") {
          const objectTypeId = schema.alias_for.classifiers.object_typeid;
          for (const index in data._schemas) {
            if (data._schemas[index].type_id === objectTypeId) {
              statuses = data._schemas[index].statuses.map((status) => status.task_status);
            }
          }
        }
      }
      return Promise.resolve(statuses);
    });
    return response;
  }
  const exports$1 = {
    getStatuses
  };
  exports.Event = Event;
  exports.EventHub = EventHub;
  exports.SERVER_LOCATION_ID = SERVER_LOCATION_ID;
  exports.Session = Session;
  exports.error = exports$3;
  exports.operation = exports$2;
  exports.projectSchema = exports$1;
  Object.defineProperty(exports, "__esModule", { value: true });
  exports[Symbol.toStringTag] = "Module";
});
//# sourceMappingURL=ftrack-javascript-api.umd.js.map
