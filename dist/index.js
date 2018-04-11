const strUtils	= require('coredigix-string');const assert	= require('assert');const objUtils	= {	path		: objPath,	seek		: _objSeek,	clone		: function(obj){ return cloner.shallow.copy(obj); },	deepClone	: function(obj){ return cloner.deep.copy(obj); },	merge		: function(){ return cloner.shallow.merge.apply(cloner.shallow, arguments); },	deepMerge	: function(){ return cloner.deep.merge.apply(cloner.deep, arguments); },	isPlainObj	: isPlainObj,	isEmpty		: isEmpty};var cloner = (function (O) {'use strict';  // (C) Andrea Giammarchi - Mit Style  var    // constants    VALUE   = 'value',    PROTO   = '__proto__', // to avoid jshint complains    // shortcuts    isArray = Array.isArray,    create  = O.create,    dP      = O.defineProperty,    dPs     = O.defineProperties,    gOPD    = O.getOwnPropertyDescriptor,    gOPN    = O.getOwnPropertyNames,    gOPS    = O.getOwnPropertySymbols ||              function (o) { return Array.prototype; },    gPO     = O.getPrototypeOf ||              function (o) { return o[PROTO]; },    hOP     = O.prototype.hasOwnProperty,    oKs     = (typeof Reflect !== typeof oK) &&              Reflect.ownKeys ||              function (o) { return gOPS(o).concat(gOPN(o)); },    set     = function (descriptors, key, descriptor) {      if (key in descriptors) dP(descriptors, key, {        configurable: true,        enumerable: true,        value: descriptor      });      else descriptors[key] = descriptor;    },    // used to avoid recursions in deep copy    index   = -1,    known   = null,    blown   = null,    clean   = function () { known = blown = null; },    // utilities    New = function (source, descriptors) {      var out = isArray(source) ? [] : create(gPO(source));      return descriptors ? Object.defineProperties(out, descriptors) : out;    },    // deep copy and merge    deepCopy = function deepCopy(source) {      var result = New(source);      known = [source];      blown = [result];      deepDefine(result, source);      clean();      return result;    },    deepMerge = function (target) {      known = [];      blown = [];      for (var i = 1; i < arguments.length; i++) {        known[i - 1] = arguments[i];        blown[i - 1] = target;      }      merge.apply(true, arguments);      clean();      return target;    },    // shallow copy and merge    shallowCopy = function shallowCopy(source) {      clean();      for (var        key,        descriptors = {},        keys = oKs(source),        i = keys.length; i--;        set(descriptors, key, gOPD(source, key))      ) key = keys[i];      return New(source, descriptors);    },    shallowMerge = function () {      clean();      return merge.apply(false, arguments);    },    // internal methods    isObject = function isObject(value) {      /*jshint eqnull: true */      return value != null && typeof value === 'object';    },    shouldCopy = function shouldCopy(value) {      /*jshint eqnull: true */      index = -1;      if (isObject(value)) {        if (known == null) return true;        index = known.indexOf(value);        if (index < 0) return 0 < known.push(value);      }      return false;    },    deepDefine = function deepDefine(target, source) {      for (var        key, descriptor,        descriptors = {},        keys = oKs(source),        i = keys.length; i--;      ) {        key = keys[i];        descriptor = gOPD(source, key);        if (VALUE in descriptor) deepValue(descriptor);        set(descriptors, key, descriptor);      }      dPs(target, descriptors);    },    deepValue = function deepValue(descriptor) {      var value = descriptor[VALUE];      if (shouldCopy(value)) {        descriptor[VALUE] = New(value);        deepDefine(descriptor[VALUE], value);        blown[known.indexOf(value)] = descriptor[VALUE];      } else if (-1 < index && index in blown) {        descriptor[VALUE] = blown[index];      }    },    merge = function merge(target) {      for (var        source,        keys, key,        value, tvalue,        descriptor,        deep = this.valueOf(),        descriptors = {},        i, a = 1;        a < arguments.length; a++      ) {        source = arguments[a];        keys = oKs(source);        for (i = 0; i < keys.length; i++) {          key = keys[i];          descriptor = gOPD(source, key);          if (hOP.call(target, key)) {            if (VALUE in descriptor) {              value = descriptor[VALUE];              if (shouldCopy(value)) {                descriptor = gOPD(target, key);                if (VALUE in descriptor) {                  tvalue = descriptor[VALUE];                  if (isObject(tvalue)) {                    merge.call(deep, tvalue, value);                  }                }              }            }          } else {            if (deep && VALUE in descriptor) {              deepValue(descriptor);            }          }          set(descriptors, key, descriptor);        }      }      return dPs(target, descriptors);    }  ;  return {    deep: {      copy: deepCopy,      merge: deepMerge    },    shallow: {      copy: shallowCopy,      merge: shallowMerge    }  };}(Object));/** * Go Through object * * $$.path( * 		input	: obj, // object to go through * 		path	: 'a.b.c' | ['a', 'b', 'c'], * 		childkey: 'childrenKey' | ['childrenK1', ...], * 		template: obj or array, // default to {} * 		upsert	: true | false, // create path if not exists, implicitly true if template is set * ); * * @return { *       get found	: true if the path exists *       get exists	: alias to .found *        *       get value	: objectValue,// first found value *       set value	: set value to first found object * * 		 get values	: list of found values, case of multiple possible values * 		 set values : set value to multiple possible values *          *       get isCreated	: true|false // if the object is created by this api *       create()	// create the path if not created * * 		// if path do not exists, get the subPath that exists *       currentPath 		: current path (=path if upsert or created) *       get currentValue	: max found object *       set currentValue * } * * path examples: * 		'a.b.c.d' * 		'a.0.4.78c.ll' * 		'key.ke\\.y2.key3'	// we can escape period with . * * 		['a', 'b', 'c', 'd'] * 		['a', 0, 4, '78c', 'll'] * 		['key', 'ke.y2', 'key3'] * * $$.hasPath(inputObj, path) */function objPath(options){	// control	assert(arguments.length === 1, 'Needs exactly one argument.');	assert(options.hasOwnProperty('input'), 'options.input required');	assert(options.hasOwnProperty('path'), 'options.path required');	// vars	var input	= options.input,		path	= options.path,		childkey= options.childkey || null,		template= options.template || null,		upsert	= options.upsert || template != null;	// path	if(typeof path === 'string')		path	= strUtils.split(path, '.');	else if(		Array.isArray(path)		&& path.every(ele => typeof ele === 'string' || typeof ele === 'number')	){}	else throw new Error('uncorrect path.');	var currentNode		= input,		parentNode		= null,		parentObj		= null,		attrKey,		tmpValue,		pos				= 0,		len				= path.length,		resolved;	// path	function seekPath(){		// chilkey and template			if(				childkey !== null				&& upsert === true				&& !(					options.template					&& options.template.hasOwnProperty(childkey)				)			)				throw new Error('When "childkey" and "template" or "upsert" are set, "childkey" is required inside "template"');		for(; pos < len; ++pos){			attrKey		= path[pos];			parentNode	= currentNode;			// get the parentObj			if(childkey === null)				parentObj	= parentNode;			else {				if(!parentNode[childkey]){					if(upsert === true)						parentNode[childkey] = (template === null? {} : objUtils.deepClone(template[childkey]));					else break;				}				parentObj	= parentNode[childkey];			}			// get the next child			if(Array.isArray(parentObj)){				if(isNaN(attrKey))					throw new Error('Illegal attribute "' + attrKey +'" for an array');				if(typeof attrKey === 'string')					attrKey	= parseInt(attrKey);				if(attrKey < 0){					attrKey	+= parentObj.length;					if(attrKey < 0) throw new Error('Array out of bound');				}				else if(attrKey > parentObj.length && upsert === false)					break;			}			// else if(parentObj.hasOwnProperty(attrKey) === false){			// 	break;			// }			// create child if not exists			if(parentObj[attrKey])				currentNode	= parentObj[attrKey]			else if(upsert === true)				currentNode	= parentObj[attrKey] = (template === null ? {} : objUtils.deepClone(template));			else break;		}		resolved	= pos >= path.length;	}	// get the maximum accessible path	seekPath();	// result	var result	= {		build	: function(){			upsert	= true;			return seekPath();		},		get value(){ return currentNode },		set value(vl){			if(resolved) parentObj[attrKey]	= vl;			else throw new Error('Path not resolved');		},		get resolved(){ return resolved },		get exists(){ return resolved },		get path(){ return resolved ? path : path.slice(0, pos); }	};	return result;}/** is plein object */function isPlainObj(obj){	return typeof obj === 'object'			&& obj !== null			&& obj.constructor === Object;}/** isEmpty */function isEmpty(obj){	if(Reflect.has(obj, 'length'))		return obj.length === 0;	else {		for(var i in obj)			return false;		return true;	}}/** * execute a callBack function on all tree nodes without using a recursive function * usefull when the operation on each node do not depends on the result on the child nodes * (could depends on parents results or not) * @param {Object} input tree object * @param {function} cb the callback to execute on each node * @param {String|undefined} childKey usefull when the tree has mode2, see modes in examples * * Mode1: * ================= * in this mode, the tree has the next form * input= { * 		attr1 : { * 			attr11: ... * 			attr12: ... * 		}, * 		attr2 : [ * 			'value21', * 			{ * 				attr211: ... * 			} * 		] * } * in this case, each attribute is a node * * Mode2: * ======================== * in this case, the tree has this form * { * 		attr1: { * 			property11: ... * 			property12: * 			children: [ * 				{}, * 				'', * 				{ * 					children: {} * 				} * 			] * 		}, * 		attr2 : { * 			property21 : ... * 			property22 : ... * 			children : { * 				key1: {}, * 				key2: 'value', * 				key3: { * 					children: {} * 				} * 			} * 		} * } * in this mode, each node has properties, nodes are foldred inside the property "children" * so in this case we specify "childkey" to "children" * * * if cb is undefined, the function steel will returns a compiled version of the tree, * the returned object has those utilities * { * 		 * } */function _objSeek(input, cb, childKey){	var nodeMap, avoidCycle, iterationCb, inputMeta, parentNode, parentNodeMeta, childNodes, nodeMeta, i, len;	assert(typeof input === 'object' && input !== null, 'Illegal arguments');	assert(typeof cb === 'function', 'cb must be function');	assert(childKey === undefined || typeof childKey === 'string', 'childKey must be string');	// compile version	var compileArr = [];	// iteration cb	var iterationCb = (key => {		node	= childNodes[key];		nodeMeta	= {			key			: key,			node		: node,			parent		: parentNode,			parentMeta	: parentNodeMeta,			path		: partialPath.concat(i)		};		// store in compiled array		compileArr.push(nodeMeta);		// not plain object		if(typeof node !== 'object' || node === null){}		// cycle		else if(avoidCycle.has(node))			nodeMeta.cycle	= true;		// new		else {			avoidCycle.add(node); // avoid cyclic			// set as the next for the prev			nodeMap.get(lastNode).next	= nodeMeta; // set as next to prev			// save currentNode metadata			nodeMap.set(node, nodeMeta);			lastNode	= node;		}		// callBack		if(cb !== undefined && cb(nodeMeta) === false)			throw 'skiped';	});	// compile and execute	try{		lastNode		= input;		inputMeta	=  {			path	: [],			key		: null,			node	: lastNode		};		// exec cb on the root obj		if(cb !== undefined && cb(inputMeta) === false) throw 'skiped';		// node metadata		nodeMap			= new WeakMap();		avoidCycle		= new WeakSet();		nodeMap.set(input, inputMeta);		avoidCycle.add(input);		parentNodeMeta	= inputMeta;		compileArr.push(inputMeta);		rootLoop: do {			parentNode	= parentNodeMeta.node;			partialPath	= parentNodeMeta.path;			if(childKey === undefined){ // form 1				// partialPath	= parentNodeMeta.path;				childNodes	= parentNode;			} else { // form 2				if(Reflect.has(parentNode, childKey) === false)					continue;				childNodes	= parentNode[childKey];				// partialPath	= parentNodeMeta.path.concat(childKey);			}			// get child nodes			if(Array.isArray(childNodes)){				for(i=0, len = childNodes.length; i < len; ++i)					iterationCb(i);			} else {				for(i in childNodes)					iterationCb(i);			}		} while((parentNodeMeta = parentNodeMeta.next) !== undefined);	} catch (err) {		if(err === 'skiped')			compileArr = false;		else throw err;	}	// return compiled version of the tree	return compileArr;}module.exports	= objUtils;