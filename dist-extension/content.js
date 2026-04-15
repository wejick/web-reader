(function(){"use strict";var Y={exports:{}},he;function Le(){return he||(he=1,(function(o){function s(e,t){if(t&&t.documentElement)e=t,t=arguments[2];else if(!e||!e.documentElement)throw new Error("First argument to Readability constructor should be a document object.");if(t=t||{},this._doc=e,this._docJSDOMParser=this._doc.firstChild.__JSDOMParser__,this._articleTitle=null,this._articleByline=null,this._articleDir=null,this._articleSiteName=null,this._attempts=[],this._metadata={},this._debug=!!t.debug,this._maxElemsToParse=t.maxElemsToParse||this.DEFAULT_MAX_ELEMS_TO_PARSE,this._nbTopCandidates=t.nbTopCandidates||this.DEFAULT_N_TOP_CANDIDATES,this._charThreshold=t.charThreshold||this.DEFAULT_CHAR_THRESHOLD,this._classesToPreserve=this.CLASSES_TO_PRESERVE.concat(t.classesToPreserve||[]),this._keepClasses=!!t.keepClasses,this._serializer=t.serializer||function(i){return i.innerHTML},this._disableJSONLD=!!t.disableJSONLD,this._allowedVideoRegex=t.allowedVideoRegex||this.REGEXPS.videos,this._linkDensityModifier=t.linkDensityModifier||0,this._flags=this.FLAG_STRIP_UNLIKELYS|this.FLAG_WEIGHT_CLASSES|this.FLAG_CLEAN_CONDITIONALLY,this._debug){let i=function(r){if(r.nodeType==r.TEXT_NODE)return`${r.nodeName} ("${r.textContent}")`;let l=Array.from(r.attributes||[],function(n){return`${n.name}="${n.value}"`}).join(" ");return`<${r.localName} ${l}>`};this.log=function(){if(typeof console<"u"){let l=Array.from(arguments,n=>n&&n.nodeType==this.ELEMENT_NODE?i(n):n);l.unshift("Reader: (Readability)"),console.log(...l)}else if(typeof dump<"u"){var r=Array.prototype.map.call(arguments,function(l){return l&&l.nodeName?i(l):l}).join(" ");dump("Reader: (Readability) "+r+`
`)}}}else this.log=function(){}}s.prototype={FLAG_STRIP_UNLIKELYS:1,FLAG_WEIGHT_CLASSES:2,FLAG_CLEAN_CONDITIONALLY:4,ELEMENT_NODE:1,TEXT_NODE:3,DEFAULT_MAX_ELEMS_TO_PARSE:0,DEFAULT_N_TOP_CANDIDATES:5,DEFAULT_TAGS_TO_SCORE:"section,h2,h3,h4,h5,h6,p,td,pre".toUpperCase().split(","),DEFAULT_CHAR_THRESHOLD:500,REGEXPS:{unlikelyCandidates:/-ad-|ai2html|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|footer|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i,okMaybeItsACandidate:/and|article|body|column|content|main|shadow/i,positive:/article|body|content|entry|hentry|h-entry|main|page|pagination|post|text|blog|story/i,negative:/-ad-|hidden|^hid$| hid$| hid |^hid |banner|combx|comment|com-|contact|footer|gdpr|masthead|media|meta|outbrain|promo|related|scroll|share|shoutbox|sidebar|skyscraper|sponsor|shopping|tags|widget/i,extraneous:/print|archive|comment|discuss|e[\-]?mail|share|reply|all|login|sign|single|utility/i,byline:/byline|author|dateline|writtenby|p-author/i,replaceFonts:/<(\/?)font[^>]*>/gi,normalize:/\s{2,}/g,videos:/\/\/(www\.)?((dailymotion|youtube|youtube-nocookie|player\.vimeo|v\.qq)\.com|(archive|upload\.wikimedia)\.org|player\.twitch\.tv)/i,shareElements:/(\b|_)(share|sharedaddy)(\b|_)/i,nextLink:/(next|weiter|continue|>([^\|]|$)|»([^\|]|$))/i,prevLink:/(prev|earl|old|new|<|«)/i,tokenize:/\W+/g,whitespace:/^\s*$/,hasContent:/\S$/,hashUrl:/^#.+/,srcsetUrl:/(\S+)(\s+[\d.]+[xw])?(\s*(?:,|$))/g,b64DataUrl:/^data:\s*([^\s;,]+)\s*;\s*base64\s*,/i,commas:/\u002C|\u060C|\uFE50|\uFE10|\uFE11|\u2E41|\u2E34|\u2E32|\uFF0C/g,jsonLdArticleTypes:/^Article|AdvertiserContentArticle|NewsArticle|AnalysisNewsArticle|AskPublicNewsArticle|BackgroundNewsArticle|OpinionNewsArticle|ReportageNewsArticle|ReviewNewsArticle|Report|SatiricalArticle|ScholarlyArticle|MedicalScholarlyArticle|SocialMediaPosting|BlogPosting|LiveBlogPosting|DiscussionForumPosting|TechArticle|APIReference$/,adWords:/^(ad(vertising|vertisement)?|pub(licité)?|werb(ung)?|广告|Реклама|Anuncio)$/iu,loadingWords:/^((loading|正在加载|Загрузка|chargement|cargando)(…|\.\.\.)?)$/iu},UNLIKELY_ROLES:["menu","menubar","complementary","navigation","alert","alertdialog","dialog"],DIV_TO_P_ELEMS:new Set(["BLOCKQUOTE","DL","DIV","IMG","OL","P","PRE","TABLE","UL"]),ALTER_TO_DIV_EXCEPTIONS:["DIV","ARTICLE","SECTION","P","OL","UL"],PRESENTATIONAL_ATTRIBUTES:["align","background","bgcolor","border","cellpadding","cellspacing","frame","hspace","rules","style","valign","vspace"],DEPRECATED_SIZE_ATTRIBUTE_ELEMS:["TABLE","TH","TD","HR","PRE"],PHRASING_ELEMS:["ABBR","AUDIO","B","BDO","BR","BUTTON","CITE","CODE","DATA","DATALIST","DFN","EM","EMBED","I","IMG","INPUT","KBD","LABEL","MARK","MATH","METER","NOSCRIPT","OBJECT","OUTPUT","PROGRESS","Q","RUBY","SAMP","SCRIPT","SELECT","SMALL","SPAN","STRONG","SUB","SUP","TEXTAREA","TIME","VAR","WBR"],CLASSES_TO_PRESERVE:["page"],HTML_ESCAPE_MAP:{lt:"<",gt:">",amp:"&",quot:'"',apos:"'"},_postProcessContent(e){this._fixRelativeUris(e),this._simplifyNestedElements(e),this._keepClasses||this._cleanClasses(e)},_removeNodes(e,t){if(this._docJSDOMParser&&e._isLiveNodeList)throw new Error("Do not pass live node lists to _removeNodes");for(var i=e.length-1;i>=0;i--){var r=e[i],l=r.parentNode;l&&(!t||t.call(this,r,i,e))&&l.removeChild(r)}},_replaceNodeTags(e,t){if(this._docJSDOMParser&&e._isLiveNodeList)throw new Error("Do not pass live node lists to _replaceNodeTags");for(const i of e)this._setNodeTag(i,t)},_forEachNode(e,t){Array.prototype.forEach.call(e,t,this)},_findNode(e,t){return Array.prototype.find.call(e,t,this)},_someNode(e,t){return Array.prototype.some.call(e,t,this)},_everyNode(e,t){return Array.prototype.every.call(e,t,this)},_getAllNodesWithTag(e,t){return e.querySelectorAll?e.querySelectorAll(t.join(",")):[].concat.apply([],t.map(function(i){var r=e.getElementsByTagName(i);return Array.isArray(r)?r:Array.from(r)}))},_cleanClasses(e){var t=this._classesToPreserve,i=(e.getAttribute("class")||"").split(/\s+/).filter(r=>t.includes(r)).join(" ");for(i?e.setAttribute("class",i):e.removeAttribute("class"),e=e.firstElementChild;e;e=e.nextElementSibling)this._cleanClasses(e)},_isUrl(e){try{return new URL(e),!0}catch{return!1}},_fixRelativeUris(e){var t=this._doc.baseURI,i=this._doc.documentURI;function r(a){if(t==i&&a.charAt(0)=="#")return a;try{return new URL(a,t).href}catch{}return a}var l=this._getAllNodesWithTag(e,["a"]);this._forEachNode(l,function(a){var h=a.getAttribute("href");if(h)if(h.indexOf("javascript:")===0)if(a.childNodes.length===1&&a.childNodes[0].nodeType===this.TEXT_NODE){var d=this._doc.createTextNode(a.textContent);a.parentNode.replaceChild(d,a)}else{for(var c=this._doc.createElement("span");a.firstChild;)c.appendChild(a.firstChild);a.parentNode.replaceChild(c,a)}else a.setAttribute("href",r(h))});var n=this._getAllNodesWithTag(e,["img","picture","figure","video","audio","source"]);this._forEachNode(n,function(a){var h=a.getAttribute("src"),d=a.getAttribute("poster"),c=a.getAttribute("srcset");if(h&&a.setAttribute("src",r(h)),d&&a.setAttribute("poster",r(d)),c){var g=c.replace(this.REGEXPS.srcsetUrl,function(v,m,N,_){return r(m)+(N||"")+_});a.setAttribute("srcset",g)}})},_simplifyNestedElements(e){for(var t=e;t;){if(t.parentNode&&["DIV","SECTION"].includes(t.tagName)&&!(t.id&&t.id.startsWith("readability"))){if(this._isElementWithoutContent(t)){t=this._removeAndGetNext(t);continue}else if(this._hasSingleTagInsideElement(t,"DIV")||this._hasSingleTagInsideElement(t,"SECTION")){for(var i=t.children[0],r=0;r<t.attributes.length;r++)i.setAttributeNode(t.attributes[r].cloneNode());t.parentNode.replaceChild(i,t),t=i;continue}}t=this._getNextNode(t)}},_getArticleTitle(){var e=this._doc,t="",i="";try{t=i=e.title.trim(),typeof t!="string"&&(t=i=this._getInnerText(e.getElementsByTagName("title")[0]))}catch{}var r=!1;function l(g){return g.split(/\s+/).length}if(/ [\|\-\\\/>»] /.test(t)){r=/ [\\\/>»] /.test(t);let g=Array.from(i.matchAll(/ [\|\-\\\/>»] /gi));t=i.substring(0,g.pop().index),l(t)<3&&(t=i.replace(/^[^\|\-\\\/>»]*[\|\-\\\/>»]/gi,""))}else if(t.includes(": ")){var n=this._getAllNodesWithTag(e,["h1","h2"]),a=t.trim(),h=this._someNode(n,function(g){return g.textContent.trim()===a});h||(t=i.substring(i.lastIndexOf(":")+1),l(t)<3?t=i.substring(i.indexOf(":")+1):l(i.substr(0,i.indexOf(":")))>5&&(t=i))}else if(t.length>150||t.length<15){var d=e.getElementsByTagName("h1");d.length===1&&(t=this._getInnerText(d[0]))}t=t.trim().replace(this.REGEXPS.normalize," ");var c=l(t);return c<=4&&(!r||c!=l(i.replace(/[\|\-\\\/>»]+/g,""))-1)&&(t=i),t},_prepDocument(){var e=this._doc;this._removeNodes(this._getAllNodesWithTag(e,["style"])),e.body&&this._replaceBrs(e.body),this._replaceNodeTags(this._getAllNodesWithTag(e,["font"]),"SPAN")},_nextNode(e){for(var t=e;t&&t.nodeType!=this.ELEMENT_NODE&&this.REGEXPS.whitespace.test(t.textContent);)t=t.nextSibling;return t},_replaceBrs(e){this._forEachNode(this._getAllNodesWithTag(e,["br"]),function(t){for(var i=t.nextSibling,r=!1;(i=this._nextNode(i))&&i.tagName=="BR";){r=!0;var l=i.nextSibling;i.remove(),i=l}if(r){var n=this._doc.createElement("p");for(t.parentNode.replaceChild(n,t),i=n.nextSibling;i;){if(i.tagName=="BR"){var a=this._nextNode(i.nextSibling);if(a&&a.tagName=="BR")break}if(!this._isPhrasingContent(i))break;var h=i.nextSibling;n.appendChild(i),i=h}for(;n.lastChild&&this._isWhitespace(n.lastChild);)n.lastChild.remove();n.parentNode.tagName==="P"&&this._setNodeTag(n.parentNode,"DIV")}})},_setNodeTag(e,t){if(this.log("_setNodeTag",e,t),this._docJSDOMParser)return e.localName=t.toLowerCase(),e.tagName=t.toUpperCase(),e;for(var i=e.ownerDocument.createElement(t);e.firstChild;)i.appendChild(e.firstChild);e.parentNode.replaceChild(i,e),e.readability&&(i.readability=e.readability);for(var r=0;r<e.attributes.length;r++)i.setAttributeNode(e.attributes[r].cloneNode());return i},_prepArticle(e){this._cleanStyles(e),this._markDataTables(e),this._fixLazyImages(e),this._cleanConditionally(e,"form"),this._cleanConditionally(e,"fieldset"),this._clean(e,"object"),this._clean(e,"embed"),this._clean(e,"footer"),this._clean(e,"link"),this._clean(e,"aside");var t=this.DEFAULT_CHAR_THRESHOLD;this._forEachNode(e.children,function(i){this._cleanMatchedNodes(i,function(r,l){return this.REGEXPS.shareElements.test(l)&&r.textContent.length<t})}),this._clean(e,"iframe"),this._clean(e,"input"),this._clean(e,"textarea"),this._clean(e,"select"),this._clean(e,"button"),this._cleanHeaders(e),this._cleanConditionally(e,"table"),this._cleanConditionally(e,"ul"),this._cleanConditionally(e,"div"),this._replaceNodeTags(this._getAllNodesWithTag(e,["h1"]),"h2"),this._removeNodes(this._getAllNodesWithTag(e,["p"]),function(i){var r=this._getAllNodesWithTag(i,["img","embed","object","iframe"]).length;return r===0&&!this._getInnerText(i,!1)}),this._forEachNode(this._getAllNodesWithTag(e,["br"]),function(i){var r=this._nextNode(i.nextSibling);r&&r.tagName=="P"&&i.remove()}),this._forEachNode(this._getAllNodesWithTag(e,["table"]),function(i){var r=this._hasSingleTagInsideElement(i,"TBODY")?i.firstElementChild:i;if(this._hasSingleTagInsideElement(r,"TR")){var l=r.firstElementChild;if(this._hasSingleTagInsideElement(l,"TD")){var n=l.firstElementChild;n=this._setNodeTag(n,this._everyNode(n.childNodes,this._isPhrasingContent)?"P":"DIV"),i.parentNode.replaceChild(n,i)}}})},_initializeNode(e){switch(e.readability={contentScore:0},e.tagName){case"DIV":e.readability.contentScore+=5;break;case"PRE":case"TD":case"BLOCKQUOTE":e.readability.contentScore+=3;break;case"ADDRESS":case"OL":case"UL":case"DL":case"DD":case"DT":case"LI":case"FORM":e.readability.contentScore-=3;break;case"H1":case"H2":case"H3":case"H4":case"H5":case"H6":case"TH":e.readability.contentScore-=5;break}e.readability.contentScore+=this._getClassWeight(e)},_removeAndGetNext(e){var t=this._getNextNode(e,!0);return e.remove(),t},_getNextNode(e,t){if(!t&&e.firstElementChild)return e.firstElementChild;if(e.nextElementSibling)return e.nextElementSibling;do e=e.parentNode;while(e&&!e.nextElementSibling);return e&&e.nextElementSibling},_textSimilarity(e,t){var i=e.toLowerCase().split(this.REGEXPS.tokenize).filter(Boolean),r=t.toLowerCase().split(this.REGEXPS.tokenize).filter(Boolean);if(!i.length||!r.length)return 0;var l=r.filter(a=>!i.includes(a)),n=l.join(" ").length/r.join(" ").length;return 1-n},_isValidByline(e,t){var i=e.getAttribute("rel"),r=e.getAttribute("itemprop"),l=e.textContent.trim().length;return(i==="author"||r&&r.includes("author")||this.REGEXPS.byline.test(t))&&!!l&&l<100},_getNodeAncestors(e,t){t=t||0;for(var i=0,r=[];e.parentNode&&(r.push(e.parentNode),!(t&&++i===t));)e=e.parentNode;return r},_grabArticle(e){this.log("**** grabArticle ****");var t=this._doc,i=e!==null;if(e=e||this._doc.body,!e)return this.log("No body found in document. Abort."),null;for(var r=e.innerHTML;;){this.log("Starting grabArticle loop");var l=this._flagIsActive(this.FLAG_STRIP_UNLIKELYS),n=[],a=this._doc.documentElement;let xe=!0;for(;a;){a.tagName==="HTML"&&(this._articleLang=a.getAttribute("lang"));var h=a.className+" "+a.id;if(!this._isProbablyVisible(a)){this.log("Removing hidden node - "+h),a=this._removeAndGetNext(a);continue}if(a.getAttribute("aria-modal")=="true"&&a.getAttribute("role")=="dialog"){a=this._removeAndGetNext(a);continue}if(!this._articleByline&&!this._metadata.byline&&this._isValidByline(a,h)){for(var d=this._getNextNode(a,!0),c=this._getNextNode(a),g=null;c&&c!=d;){var v=c.getAttribute("itemprop");if(v&&v.includes("name")){g=c;break}else c=this._getNextNode(c)}this._articleByline=(g??a).textContent.trim(),a=this._removeAndGetNext(a);continue}if(xe&&this._headerDuplicatesTitle(a)){this.log("Removing header: ",a.textContent.trim(),this._articleTitle.trim()),xe=!1,a=this._removeAndGetNext(a);continue}if(l){if(this.REGEXPS.unlikelyCandidates.test(h)&&!this.REGEXPS.okMaybeItsACandidate.test(h)&&!this._hasAncestorTag(a,"table")&&!this._hasAncestorTag(a,"code")&&a.tagName!=="BODY"&&a.tagName!=="A"){this.log("Removing unlikely candidate - "+h),a=this._removeAndGetNext(a);continue}if(this.UNLIKELY_ROLES.includes(a.getAttribute("role"))){this.log("Removing content with role "+a.getAttribute("role")+" - "+h),a=this._removeAndGetNext(a);continue}}if((a.tagName==="DIV"||a.tagName==="SECTION"||a.tagName==="HEADER"||a.tagName==="H1"||a.tagName==="H2"||a.tagName==="H3"||a.tagName==="H4"||a.tagName==="H5"||a.tagName==="H6")&&this._isElementWithoutContent(a)){a=this._removeAndGetNext(a);continue}if(this.DEFAULT_TAGS_TO_SCORE.includes(a.tagName)&&n.push(a),a.tagName==="DIV"){for(var m=null,N=a.firstChild;N;){var _=N.nextSibling;if(this._isPhrasingContent(N))m!==null?m.appendChild(N):this._isWhitespace(N)||(m=t.createElement("p"),a.replaceChild(m,N),m.appendChild(N));else if(m!==null){for(;m.lastChild&&this._isWhitespace(m.lastChild);)m.lastChild.remove();m=null}N=_}if(this._hasSingleTagInsideElement(a,"P")&&this._getLinkDensity(a)<.25){var L=a.children[0];a.parentNode.replaceChild(L,a),a=L,n.push(a)}else this._hasChildBlockElement(a)||(a=this._setNodeTag(a,"P"),n.push(a))}a=this._getNextNode(a)}var k=[];this._forEachNode(n,function(P){if(!(!P.parentNode||typeof P.parentNode.tagName>"u")){var D=this._getInnerText(P);if(!(D.length<25)){var Se=this._getNodeAncestors(P,5);if(Se.length!==0){var q=0;q+=1,q+=D.split(this.REGEXPS.commas).length,q+=Math.min(Math.floor(D.length/100),3),this._forEachNode(Se,function(B,le){if(!(!B.tagName||!B.parentNode||typeof B.parentNode.tagName>"u")){if(typeof B.readability>"u"&&(this._initializeNode(B),k.push(B)),le===0)var oe=1;else le===1?oe=2:oe=le*3;B.readability.contentScore+=q/oe}})}}}});for(var A=[],M=0,U=k.length;M<U;M+=1){var x=k[M],W=x.readability.contentScore*(1-this._getLinkDensity(x));x.readability.contentScore=W,this.log("Candidate:",x,"with score "+W);for(var O=0;O<this._nbTopCandidates;O++){var $=A[O];if(!$||W>$.readability.contentScore){A.splice(O,0,x),A.length>this._nbTopCandidates&&A.pop();break}}}var f=A[0]||null,G=!1,p;if(f===null||f.tagName==="BODY"){for(f=t.createElement("DIV"),G=!0;e.firstChild;)this.log("Moving child out:",e.firstChild),f.appendChild(e.firstChild);e.appendChild(f),this._initializeNode(f)}else if(f){for(var y=[],X=1;X<A.length;X++)A[X].readability.contentScore/f.readability.contentScore>=.75&&y.push(this._getNodeAncestors(A[X]));var ee=3;if(y.length>=ee)for(p=f.parentNode;p.tagName!=="BODY";){for(var te=0,ie=0;ie<y.length&&te<ee;ie++)te+=Number(y[ie].includes(p));if(te>=ee){f=p;break}p=p.parentNode}f.readability||this._initializeNode(f),p=f.parentNode;for(var re=f.readability.contentScore,tt=re/3;p.tagName!=="BODY";){if(!p.readability){p=p.parentNode;continue}var _e=p.readability.contentScore;if(_e<tt)break;if(_e>re){f=p;break}re=p.readability.contentScore,p=p.parentNode}for(p=f.parentNode;p.tagName!="BODY"&&p.children.length==1;)f=p,p=f.parentNode;f.readability||this._initializeNode(f)}var T=t.createElement("DIV");i&&(T.id="readability-content");var it=Math.max(10,f.readability.contentScore*.2);p=f.parentNode;for(var ne=p.children,j=0,ye=ne.length;j<ye;j++){var b=ne[j],F=!1;if(this.log("Looking at sibling node:",b,b.readability?"with score "+b.readability.contentScore:""),this.log("Sibling has score",b.readability?b.readability.contentScore:"Unknown"),b===f)F=!0;else{var Ee=0;if(b.className===f.className&&f.className!==""&&(Ee+=f.readability.contentScore*.2),b.readability&&b.readability.contentScore+Ee>=it)F=!0;else if(b.nodeName==="P"){var Ne=this._getLinkDensity(b),Te=this._getInnerText(b),ae=Te.length;(ae>80&&Ne<.25||ae<80&&ae>0&&Ne===0&&Te.search(/\.( |$)/)!==-1)&&(F=!0)}}F&&(this.log("Appending node:",b),this.ALTER_TO_DIV_EXCEPTIONS.includes(b.nodeName)||(this.log("Altering sibling:",b,"to div."),b=this._setNodeTag(b,"DIV")),T.appendChild(b),ne=p.children,j-=1,ye-=1)}if(this._debug&&this.log("Article content pre-prep: "+T.innerHTML),this._prepArticle(T),this._debug&&this.log("Article content post-prep: "+T.innerHTML),G)f.id="readability-page-1",f.className="page";else{var z=t.createElement("DIV");for(z.id="readability-page-1",z.className="page";T.firstChild;)z.appendChild(T.firstChild);T.appendChild(z)}this._debug&&this.log("Article content after paging: "+T.innerHTML);var se=!0,Ae=this._getInnerText(T,!0).length;if(Ae<this._charThreshold)if(se=!1,e.innerHTML=r,this._attempts.push({articleContent:T,textLength:Ae}),this._flagIsActive(this.FLAG_STRIP_UNLIKELYS))this._removeFlag(this.FLAG_STRIP_UNLIKELYS);else if(this._flagIsActive(this.FLAG_WEIGHT_CLASSES))this._removeFlag(this.FLAG_WEIGHT_CLASSES);else if(this._flagIsActive(this.FLAG_CLEAN_CONDITIONALLY))this._removeFlag(this.FLAG_CLEAN_CONDITIONALLY);else{if(this._attempts.sort(function(P,D){return D.textLength-P.textLength}),!this._attempts[0].textLength)return null;T=this._attempts[0].articleContent,se=!0}if(se){var rt=[p,f].concat(this._getNodeAncestors(p));return this._someNode(rt,function(P){if(!P.tagName)return!1;var D=P.getAttribute("dir");return D?(this._articleDir=D,!0):!1}),T}}},_unescapeHtmlEntities(e){if(!e)return e;var t=this.HTML_ESCAPE_MAP;return e.replace(/&(quot|amp|apos|lt|gt);/g,function(i,r){return t[r]}).replace(/&#(?:x([0-9a-f]+)|([0-9]+));/gi,function(i,r,l){var n=parseInt(r||l,r?16:10);return(n==0||n>1114111||n>=55296&&n<=57343)&&(n=65533),String.fromCodePoint(n)})},_getJSONLD(e){var t=this._getAllNodesWithTag(e,["script"]),i;return this._forEachNode(t,function(r){if(!i&&r.getAttribute("type")==="application/ld+json")try{var l=r.textContent.replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g,""),n=JSON.parse(l);if(Array.isArray(n)&&(n=n.find(v=>v["@type"]&&v["@type"].match(this.REGEXPS.jsonLdArticleTypes)),!n))return;var a=/^https?\:\/\/schema\.org\/?$/,h=typeof n["@context"]=="string"&&n["@context"].match(a)||typeof n["@context"]=="object"&&typeof n["@context"]["@vocab"]=="string"&&n["@context"]["@vocab"].match(a);if(!h||(!n["@type"]&&Array.isArray(n["@graph"])&&(n=n["@graph"].find(v=>(v["@type"]||"").match(this.REGEXPS.jsonLdArticleTypes))),!n||!n["@type"]||!n["@type"].match(this.REGEXPS.jsonLdArticleTypes)))return;if(i={},typeof n.name=="string"&&typeof n.headline=="string"&&n.name!==n.headline){var d=this._getArticleTitle(),c=this._textSimilarity(n.name,d)>.75,g=this._textSimilarity(n.headline,d)>.75;g&&!c?i.title=n.headline:i.title=n.name}else typeof n.name=="string"?i.title=n.name.trim():typeof n.headline=="string"&&(i.title=n.headline.trim());n.author&&(typeof n.author.name=="string"?i.byline=n.author.name.trim():Array.isArray(n.author)&&n.author[0]&&typeof n.author[0].name=="string"&&(i.byline=n.author.filter(function(v){return v&&typeof v.name=="string"}).map(function(v){return v.name.trim()}).join(", "))),typeof n.description=="string"&&(i.excerpt=n.description.trim()),n.publisher&&typeof n.publisher.name=="string"&&(i.siteName=n.publisher.name.trim()),typeof n.datePublished=="string"&&(i.datePublished=n.datePublished.trim())}catch(v){this.log(v.message)}}),i||{}},_getArticleMetadata(e){var t={},i={},r=this._doc.getElementsByTagName("meta"),l=/\s*(article|dc|dcterm|og|twitter)\s*:\s*(author|creator|description|published_time|title|site_name)\s*/gi,n=/^\s*(?:(dc|dcterm|og|twitter|parsely|weibo:(article|webpage))\s*[-\.:]\s*)?(author|creator|pub-date|description|title|site_name)\s*$/i;this._forEachNode(r,function(h){var d=h.getAttribute("name"),c=h.getAttribute("property"),g=h.getAttribute("content");if(g){var v=null,m=null;c&&(v=c.match(l),v&&(m=v[0].toLowerCase().replace(/\s/g,""),i[m]=g.trim())),!v&&d&&n.test(d)&&(m=d,g&&(m=m.toLowerCase().replace(/\s/g,"").replace(/\./g,":"),i[m]=g.trim()))}}),t.title=e.title||i["dc:title"]||i["dcterm:title"]||i["og:title"]||i["weibo:article:title"]||i["weibo:webpage:title"]||i.title||i["twitter:title"]||i["parsely-title"],t.title||(t.title=this._getArticleTitle());const a=typeof i["article:author"]=="string"&&!this._isUrl(i["article:author"])?i["article:author"]:void 0;return t.byline=e.byline||i["dc:creator"]||i["dcterm:creator"]||i.author||i["parsely-author"]||a,t.excerpt=e.excerpt||i["dc:description"]||i["dcterm:description"]||i["og:description"]||i["weibo:article:description"]||i["weibo:webpage:description"]||i.description||i["twitter:description"],t.siteName=e.siteName||i["og:site_name"],t.publishedTime=e.datePublished||i["article:published_time"]||i["parsely-pub-date"]||null,t.title=this._unescapeHtmlEntities(t.title),t.byline=this._unescapeHtmlEntities(t.byline),t.excerpt=this._unescapeHtmlEntities(t.excerpt),t.siteName=this._unescapeHtmlEntities(t.siteName),t.publishedTime=this._unescapeHtmlEntities(t.publishedTime),t},_isSingleImage(e){for(;e;){if(e.tagName==="IMG")return!0;if(e.children.length!==1||e.textContent.trim()!=="")return!1;e=e.children[0]}return!1},_unwrapNoscriptImages(e){var t=Array.from(e.getElementsByTagName("img"));this._forEachNode(t,function(r){for(var l=0;l<r.attributes.length;l++){var n=r.attributes[l];switch(n.name){case"src":case"srcset":case"data-src":case"data-srcset":return}if(/\.(jpg|jpeg|png|webp)/i.test(n.value))return}r.remove()});var i=Array.from(e.getElementsByTagName("noscript"));this._forEachNode(i,function(r){if(this._isSingleImage(r)){var l=e.createElement("div");l.innerHTML=r.innerHTML;var n=r.previousElementSibling;if(n&&this._isSingleImage(n)){var a=n;a.tagName!=="IMG"&&(a=n.getElementsByTagName("img")[0]);for(var h=l.getElementsByTagName("img")[0],d=0;d<a.attributes.length;d++){var c=a.attributes[d];if(c.value!==""&&(c.name==="src"||c.name==="srcset"||/\.(jpg|jpeg|png|webp)/i.test(c.value))){if(h.getAttribute(c.name)===c.value)continue;var g=c.name;h.hasAttribute(g)&&(g="data-old-"+g),h.setAttribute(g,c.value)}}r.parentNode.replaceChild(l.firstElementChild,n)}}})},_removeScripts(e){this._removeNodes(this._getAllNodesWithTag(e,["script","noscript"]))},_hasSingleTagInsideElement(e,t){return e.children.length!=1||e.children[0].tagName!==t?!1:!this._someNode(e.childNodes,function(i){return i.nodeType===this.TEXT_NODE&&this.REGEXPS.hasContent.test(i.textContent)})},_isElementWithoutContent(e){return e.nodeType===this.ELEMENT_NODE&&!e.textContent.trim().length&&(!e.children.length||e.children.length==e.getElementsByTagName("br").length+e.getElementsByTagName("hr").length)},_hasChildBlockElement(e){return this._someNode(e.childNodes,function(t){return this.DIV_TO_P_ELEMS.has(t.tagName)||this._hasChildBlockElement(t)})},_isPhrasingContent(e){return e.nodeType===this.TEXT_NODE||this.PHRASING_ELEMS.includes(e.tagName)||(e.tagName==="A"||e.tagName==="DEL"||e.tagName==="INS")&&this._everyNode(e.childNodes,this._isPhrasingContent)},_isWhitespace(e){return e.nodeType===this.TEXT_NODE&&e.textContent.trim().length===0||e.nodeType===this.ELEMENT_NODE&&e.tagName==="BR"},_getInnerText(e,t){t=typeof t>"u"?!0:t;var i=e.textContent.trim();return t?i.replace(this.REGEXPS.normalize," "):i},_getCharCount(e,t){return t=t||",",this._getInnerText(e).split(t).length-1},_cleanStyles(e){if(!(!e||e.tagName.toLowerCase()==="svg")){for(var t=0;t<this.PRESENTATIONAL_ATTRIBUTES.length;t++)e.removeAttribute(this.PRESENTATIONAL_ATTRIBUTES[t]);this.DEPRECATED_SIZE_ATTRIBUTE_ELEMS.includes(e.tagName)&&(e.removeAttribute("width"),e.removeAttribute("height"));for(var i=e.firstElementChild;i!==null;)this._cleanStyles(i),i=i.nextElementSibling}},_getLinkDensity(e){var t=this._getInnerText(e).length;if(t===0)return 0;var i=0;return this._forEachNode(e.getElementsByTagName("a"),function(r){var l=r.getAttribute("href"),n=l&&this.REGEXPS.hashUrl.test(l)?.3:1;i+=this._getInnerText(r).length*n}),i/t},_getClassWeight(e){if(!this._flagIsActive(this.FLAG_WEIGHT_CLASSES))return 0;var t=0;return typeof e.className=="string"&&e.className!==""&&(this.REGEXPS.negative.test(e.className)&&(t-=25),this.REGEXPS.positive.test(e.className)&&(t+=25)),typeof e.id=="string"&&e.id!==""&&(this.REGEXPS.negative.test(e.id)&&(t-=25),this.REGEXPS.positive.test(e.id)&&(t+=25)),t},_clean(e,t){var i=["object","embed","iframe"].includes(t);this._removeNodes(this._getAllNodesWithTag(e,[t]),function(r){if(i){for(var l=0;l<r.attributes.length;l++)if(this._allowedVideoRegex.test(r.attributes[l].value))return!1;if(r.tagName==="object"&&this._allowedVideoRegex.test(r.innerHTML))return!1}return!0})},_hasAncestorTag(e,t,i,r){i=i||3,t=t.toUpperCase();for(var l=0;e.parentNode;){if(i>0&&l>i)return!1;if(e.parentNode.tagName===t&&(!r||r(e.parentNode)))return!0;e=e.parentNode,l++}return!1},_getRowAndColumnCount(e){for(var t=0,i=0,r=e.getElementsByTagName("tr"),l=0;l<r.length;l++){var n=r[l].getAttribute("rowspan")||0;n&&(n=parseInt(n,10)),t+=n||1;for(var a=0,h=r[l].getElementsByTagName("td"),d=0;d<h.length;d++){var c=h[d].getAttribute("colspan")||0;c&&(c=parseInt(c,10)),a+=c||1}i=Math.max(i,a)}return{rows:t,columns:i}},_markDataTables(e){for(var t=e.getElementsByTagName("table"),i=0;i<t.length;i++){var r=t[i],l=r.getAttribute("role");if(l=="presentation"){r._readabilityDataTable=!1;continue}var n=r.getAttribute("datatable");if(n=="0"){r._readabilityDataTable=!1;continue}var a=r.getAttribute("summary");if(a){r._readabilityDataTable=!0;continue}var h=r.getElementsByTagName("caption")[0];if(h&&h.childNodes.length){r._readabilityDataTable=!0;continue}var d=["col","colgroup","tfoot","thead","th"],c=function(v){return!!r.getElementsByTagName(v)[0]};if(d.some(c)){this.log("Data table because found data-y descendant"),r._readabilityDataTable=!0;continue}if(r.getElementsByTagName("table")[0]){r._readabilityDataTable=!1;continue}var g=this._getRowAndColumnCount(r);if(g.columns==1||g.rows==1){r._readabilityDataTable=!1;continue}if(g.rows>=10||g.columns>4){r._readabilityDataTable=!0;continue}r._readabilityDataTable=g.rows*g.columns>10}},_fixLazyImages(e){this._forEachNode(this._getAllNodesWithTag(e,["img","picture","figure"]),function(t){if(t.src&&this.REGEXPS.b64DataUrl.test(t.src)){var i=this.REGEXPS.b64DataUrl.exec(t.src);if(i[1]==="image/svg+xml")return;for(var r=!1,l=0;l<t.attributes.length;l++){var n=t.attributes[l];if(n.name!=="src"&&/\.(jpg|jpeg|png|webp)/i.test(n.value)){r=!0;break}}if(r){var a=i[0].length,h=t.src.length-a;h<133&&t.removeAttribute("src")}}if(!((t.src||t.srcset&&t.srcset!="null")&&!t.className.toLowerCase().includes("lazy"))){for(var d=0;d<t.attributes.length;d++)if(n=t.attributes[d],!(n.name==="src"||n.name==="srcset"||n.name==="alt")){var c=null;if(/\.(jpg|jpeg|png|webp)\s+\d/.test(n.value)?c="srcset":/^\s*\S+\.(jpg|jpeg|png|webp)\S*\s*$/.test(n.value)&&(c="src"),c){if(t.tagName==="IMG"||t.tagName==="PICTURE")t.setAttribute(c,n.value);else if(t.tagName==="FIGURE"&&!this._getAllNodesWithTag(t,["img","picture"]).length){var g=this._doc.createElement("img");g.setAttribute(c,n.value),t.appendChild(g)}}}}})},_getTextDensity(e,t){var i=this._getInnerText(e,!0).length;if(i===0)return 0;var r=0,l=this._getAllNodesWithTag(e,t);return this._forEachNode(l,n=>r+=this._getInnerText(n,!0).length),r/i},_cleanConditionally(e,t){this._flagIsActive(this.FLAG_CLEAN_CONDITIONALLY)&&this._removeNodes(this._getAllNodesWithTag(e,[t]),function(i){var r=function(p){return p._readabilityDataTable},l=t==="ul"||t==="ol";if(!l){var n=0,a=this._getAllNodesWithTag(i,["ul","ol"]);this._forEachNode(a,p=>n+=this._getInnerText(p).length),l=n/this._getInnerText(i).length>.9}if(t==="table"&&r(i)||this._hasAncestorTag(i,"table",-1,r)||this._hasAncestorTag(i,"code")||[...i.getElementsByTagName("table")].some(p=>p._readabilityDataTable))return!1;var h=this._getClassWeight(i);this.log("Cleaning Conditionally",i);var d=0;if(h+d<0)return!0;if(this._getCharCount(i,",")<10){for(var c=i.getElementsByTagName("p").length,g=i.getElementsByTagName("img").length,v=i.getElementsByTagName("li").length-100,m=i.getElementsByTagName("input").length,N=this._getTextDensity(i,["h1","h2","h3","h4","h5","h6"]),_=0,L=this._getAllNodesWithTag(i,["object","embed","iframe"]),k=0;k<L.length;k++){for(var A=0;A<L[k].attributes.length;A++)if(this._allowedVideoRegex.test(L[k].attributes[A].value))return!1;if(L[k].tagName==="object"&&this._allowedVideoRegex.test(L[k].innerHTML))return!1;_++}var M=this._getInnerText(i);if(this.REGEXPS.adWords.test(M)||this.REGEXPS.loadingWords.test(M))return!0;var U=M.length,x=this._getLinkDensity(i),W=["SPAN","LI","TD"].concat(Array.from(this.DIV_TO_P_ELEMS)),O=this._getTextDensity(i,W),$=this._hasAncestorTag(i,"figure"),f=(()=>{const y=[];return!$&&g>1&&c/g<.5&&y.push(`Bad p to img ratio (img=${g}, p=${c})`),!l&&v>c&&y.push(`Too many li's outside of a list. (li=${v} > p=${c})`),m>Math.floor(c/3)&&y.push(`Too many inputs per p. (input=${m}, p=${c})`),!l&&!$&&N<.9&&U<25&&(g===0||g>2)&&x>0&&y.push(`Suspiciously short. (headingDensity=${N}, img=${g}, linkDensity=${x})`),!l&&h<25&&x>.2+this._linkDensityModifier&&y.push(`Low weight and a little linky. (linkDensity=${x})`),h>=25&&x>.5+this._linkDensityModifier&&y.push(`High weight and mostly links. (linkDensity=${x})`),(_===1&&U<75||_>1)&&y.push(`Suspicious embed. (embedCount=${_}, contentLength=${U})`),g===0&&O===0&&y.push(`No useful content. (img=${g}, textDensity=${O})`),y.length?(this.log("Checks failed",y),!0):!1})();if(l&&f){for(var G=0;G<i.children.length;G++)if(i.children[G].children.length>1)return f;let y=i.getElementsByTagName("li").length;if(g==y)return!1}return f}return!1})},_cleanMatchedNodes(e,t){for(var i=this._getNextNode(e,!0),r=this._getNextNode(e);r&&r!=i;)t.call(this,r,r.className+" "+r.id)?r=this._removeAndGetNext(r):r=this._getNextNode(r)},_cleanHeaders(e){let t=this._getAllNodesWithTag(e,["h1","h2"]);this._removeNodes(t,function(i){let r=this._getClassWeight(i)<0;return r&&this.log("Removing header with low class weight:",i),r})},_headerDuplicatesTitle(e){if(e.tagName!="H1"&&e.tagName!="H2")return!1;var t=this._getInnerText(e,!1);return this.log("Evaluating similarity of header:",t,this._articleTitle),this._textSimilarity(this._articleTitle,t)>.75},_flagIsActive(e){return(this._flags&e)>0},_removeFlag(e){this._flags=this._flags&~e},_isProbablyVisible(e){return(!e.style||e.style.display!="none")&&(!e.style||e.style.visibility!="hidden")&&!e.hasAttribute("hidden")&&(!e.hasAttribute("aria-hidden")||e.getAttribute("aria-hidden")!="true"||e.className&&e.className.includes&&e.className.includes("fallback-image"))},parse(){if(this._maxElemsToParse>0){var e=this._doc.getElementsByTagName("*").length;if(e>this._maxElemsToParse)throw new Error("Aborting parsing document; "+e+" elements found")}this._unwrapNoscriptImages(this._doc);var t=this._disableJSONLD?{}:this._getJSONLD(this._doc);this._removeScripts(this._doc),this._prepDocument();var i=this._getArticleMetadata(t);this._metadata=i,this._articleTitle=i.title;var r=this._grabArticle();if(!r)return null;if(this.log("Grabbed: "+r.innerHTML),this._postProcessContent(r),!i.excerpt){var l=r.getElementsByTagName("p");l.length&&(i.excerpt=l[0].textContent.trim())}var n=r.textContent;return{title:this._articleTitle,byline:i.byline||this._articleByline,dir:this._articleDir,lang:this._articleLang,content:this._serializer(r),textContent:n,length:n.length,excerpt:i.excerpt,siteName:i.siteName||this._articleSiteName,publishedTime:i.publishedTime}}},o.exports=s})(Y)),Y.exports}var K={exports:{}},ce;function we(){return ce||(ce=1,(function(o){var s={unlikelyCandidates:/-ad-|ai2html|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|footer|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i,okMaybeItsACandidate:/and|article|body|column|content|main|shadow/i};function e(i){return(!i.style||i.style.display!="none")&&!i.hasAttribute("hidden")&&(!i.hasAttribute("aria-hidden")||i.getAttribute("aria-hidden")!="true"||i.className&&i.className.includes&&i.className.includes("fallback-image"))}function t(i,r={}){typeof r=="function"&&(r={visibilityChecker:r});var l={minScore:20,minContentLength:140,visibilityChecker:e};r=Object.assign(l,r);var n=i.querySelectorAll("p, pre, article"),a=i.querySelectorAll("div > br");if(a.length){var h=new Set(n);[].forEach.call(a,function(c){h.add(c.parentNode)}),n=Array.from(h)}var d=0;return[].some.call(n,function(c){if(!r.visibilityChecker(c))return!1;var g=c.className+" "+c.id;if(s.unlikelyCandidates.test(g)&&!s.okMaybeItsACandidate.test(g)||c.matches("li p"))return!1;var v=c.textContent.trim().length;return v<r.minContentLength?!1:(d+=Math.sqrt(v-r.minContentLength),d>r.minScore)})}o.exports=t})(K)),K.exports}var J,ue;function ke(){if(ue)return J;ue=1;var o=Le(),s=we();return J={Readability:o,isProbablyReaderable:s},J}var Re=ke();const Pe=['[aria-hidden="true"]','[role="complementary"]','[role="banner"]','[role="navigation"]',".share",".social",".sharing",".newsletter",".subscribe",".cookie",".consent",".related-posts",".related-articles",".sidebar",".widget",".ad",".advertisement",".adsbygoogle",".comments","#comments"].join(",");function Ie(o){o.querySelectorAll("img").forEach(s=>{if(!s.getAttribute("src")||s.src.includes("data:image")){const e=s.dataset.src||s.dataset.lazySrc||s.dataset.original;e&&s.setAttribute("src",e)}if(!s.getAttribute("src")&&s.getAttribute("srcset")){const e=s.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0];e&&s.setAttribute("src",e)}}),o.querySelectorAll("[style]").forEach(s=>{const e=s.style;(e.display==="none"||e.visibility==="hidden"||e.opacity==="0")&&s.remove()}),o.querySelectorAll("[hidden]").forEach(s=>s.remove()),o.querySelectorAll(Pe).forEach(s=>{s.closest('article, [role="main"], main')?s.textContent.trim().length<200&&s.remove():s.remove()})}function De(o){var i;const s=document.createElement("div");s.innerHTML=o,s.querySelectorAll("p, div, span").forEach(r=>{!r.textContent.trim()&&!r.querySelector("img, figure, video, iframe, svg")&&r.remove()});const e=document.createTreeWalker(s,NodeFilter.SHOW_TEXT);let t;for(;t=e.nextNode();)/^\s*(Advertisement|Sponsored|ADVERTISEMENT)\s*$/.test(t.textContent)&&((i=t.parentElement)==null||i.remove());return s.innerHTML}function Ce(o,s){var l;const e=new DOMParser().parseFromString(o,"text/html");e.querySelectorAll("base").forEach(n=>n.remove());const t=e.createElement("base");t.href=s,(l=e.head)==null||l.prepend(t),Ie(e);const r=new Re.Readability(e,{keepClasses:!1,debug:!1}).parse();if(!r)throw new Error("This page could not be parsed as a readable article. Try loading a news article or blog post.");return{title:r.title??"",content:De(r.content??""),textContent:r.textContent??"",excerpt:r.excerpt??"",byline:r.byline??"",siteName:r.siteName??""}}const Me=/[.?!;]|,\s+(?:and|but|or|nor|for|yet|so)\b/g;function de(o,s){const e=new RegExp(Me.source,"g");let t=-1,i;for(;(i=e.exec(o))!==null;){const r=i.index+i[0].length;if(r<=s)t=r;else break}return t}function Oe(o,s=300){const e=o.replace(/\s+/g," ").trim();if(!e)return[];let t;try{t=e.split(new RegExp("(?<=[.!?])\\s+"))}catch{t=e.split(/[.!?]\s+/)}const i=t.map(n=>n.trim()).filter(Boolean),r=[];let l="";for(;i.length>0;){const n=i.shift(),a=l?`${l} ${n}`:n;if(a.length<=s){l=a;continue}if(l){const h=s-l.length-1,d=h>0?de(n,h):-1;if(d!==-1){l=`${l} ${n.slice(0,d).trimEnd()}`,r.push(l),l="";const c=n.slice(d).trimStart();c&&i.unshift(c)}else r.push(l),l="",i.unshift(n)}else{if(n.length<=s){l=n;continue}const h=de(n,s);if(h!==-1){r.push(n.slice(0,h).trimEnd());const d=n.slice(h).trimStart();d&&i.unshift(d)}else r.push(n)}}return l&&r.push(l),r}async function Be(o,s,e){if(s.provider==="openai")return He(o,s,e);if(s.provider==="elevenlabs")return Ge(o,s,e);throw new Error(`Unknown TTS provider: ${s.provider}`)}async function He(o,s,e){var l,n;const t=(l=s.openaiKey)==null?void 0:l.trim();if(!t)throw new Error("OpenAI API key is not set. Open Settings to add it.");const i=await fetch("https://api.openai.com/v1/audio/speech",{method:"POST",signal:e,headers:{Authorization:`Bearer ${t}`,"Content-Type":"application/json"},body:JSON.stringify({model:s.model||"tts-1",voice:s.voice||"alloy",input:o,response_format:"mp3"})});if(!i.ok){const a=await i.json().catch(()=>({}));throw new Error(((n=a==null?void 0:a.error)==null?void 0:n.message)??`OpenAI TTS error: HTTP ${i.status}`)}const r=await i.blob();return URL.createObjectURL(r)}async function Ge(o,s,e){var n,a;const t=(n=s.elevenlabsKey)==null?void 0:n.trim();if(!t)throw new Error("ElevenLabs API key is not set. Open Settings to add it.");const i=s.voice||"21m00Tcm4TlvDq8ikWAM",r=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${i}/stream`,{method:"POST",signal:e,headers:{"xi-api-key":t,"Content-Type":"application/json",Accept:"audio/mpeg"},body:JSON.stringify({text:o,model_id:s.model||"eleven_multilingual_v2",voice_settings:{stability:.5,similarity_boost:.75}})});if(!r.ok){const h=await r.json().catch(()=>({}));throw new Error(((a=h==null?void 0:h.detail)==null?void 0:a.message)??(h==null?void 0:h.detail)??`ElevenLabs TTS error: HTTP ${r.status}`)}const l=await r.blob();return URL.createObjectURL(l)}class Ue{constructor(s,e,t,i={}){this._audio=s,this._chunks=e,this._settings=t,this._cbs=i,this._index=0,this._paused=!1,this._stopped=!1,this._gen=0,this._fetches=new Map,this._urls=new Map,this._abortCtrl=new AbortController,this._prefetchDepth=1}async play(){var s,e;if(this._chunks.length===0){(e=(s=this._cbs).onError)==null||e.call(s,"No text chunks to play.");return}this._stopped=!1,this._paused=!1,this._index=0;for(let t=0;t<=this._prefetchDepth&&t<this._chunks.length;t++)this._prefetch(t);await this._playChunk(0)}pause(){this._paused=!0,this._audio.pause()}resume(){this._paused&&(this._paused=!1,this._audio.play().catch(()=>{}))}stop(){var s,e;this._stopped=!0,this._paused=!1,this._audio.pause(),this._audio.src="",this._abortCtrl.abort();for(const t of this._urls.values())URL.revokeObjectURL(t);this._urls.clear(),this._fetches.clear(),(e=(s=this._cbs).onProgress)==null||e.call(s,0,this._chunks.length)}get isPaused(){return this._paused}get isStopped(){return this._stopped}get currentIndex(){return this._index}get totalChunks(){return this._chunks.length}seekTo(s){if(s<0||s>=this._chunks.length)return;const e=this._paused;this._gen++,this._paused=!1,this._stopped=!1,this._audio.pause(),this._audio.src="";for(let t=s;t<=s+this._prefetchDepth&&t<this._chunks.length;t++)this._prefetch(t);e&&(this._paused=!0),this._playChunk(s)}_prefetch(s){if(s>=this._chunks.length||this._fetches.has(s))return;const e=Be(this._chunks[s],this._settings,this._abortCtrl.signal).then(t=>(this._urls.set(s,t),t));this._fetches.set(s,e)}async _playChunk(s){var l,n,a,h,d,c,g,v,m,N;const e=this._gen;if(this._stopped)return;if(s>=this._chunks.length){(n=(l=this._cbs).onProgress)==null||n.call(l,this._chunks.length,this._chunks.length),(h=(a=this._cbs).onEnd)==null||h.call(a);return}(c=(d=this._cbs).onProgress)==null||c.call(d,s,this._chunks.length),this._prefetch(s);let t;try{t=await this._fetches.get(s)}catch(_){if(this._stopped||this._gen!==e||_.name==="AbortError")return;(v=(g=this._cbs).onError)==null||v.call(g,`Chunk ${s+1} failed: ${_.message}`),await this._advance(s);return}if(this._stopped||this._gen!==e)return;this._index=s,(N=(m=this._cbs).onChunkStart)==null||N.call(m,s,this._chunks.length),this._audio.src=t;const i=async()=>{this._audio.removeEventListener("ended",i),this._audio.removeEventListener("error",r),URL.revokeObjectURL(t),this._urls.delete(s),this._fetches.delete(s),this._gen===e&&await this._advance(s)},r=async()=>{var _,L;this._audio.removeEventListener("ended",i),this._audio.removeEventListener("error",r),URL.revokeObjectURL(t),this._urls.delete(s),this._fetches.delete(s),this._gen===e&&((L=(_=this._cbs).onError)==null||L.call(_,`Audio playback error on chunk ${s+1}, skipping.`),await this._advance(s))};if(this._audio.addEventListener("ended",i),this._audio.addEventListener("error",r),!this._paused)try{await this._audio.play()}catch(_){if(_.name==="AbortError"||_.name==="NotAllowedError"){this._audio.removeEventListener("ended",i),this._audio.removeEventListener("error",r);return}this._audio.removeEventListener("ended",i),this._audio.removeEventListener("error",r),await this._advance(s)}}async _advance(s){if(this._stopped||this._paused)return;const e=s+1;this._prefetch(e+this._prefetchDepth),await this._playChunk(e)}}const We=`/* ------------------------------------------------------------------ */
/* Reset                                                                */
/* ------------------------------------------------------------------ */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ------------------------------------------------------------------ */
/* Design tokens                                                        */
/* ------------------------------------------------------------------ */
:host {
  --bg:           #ffffff;
  --surface:      #f8fafc;
  --surface-2:    #f1f5f9;
  --text:         #0f172a;
  --text-muted:   #64748b;
  --accent:       #7c3aed;
  --accent-hover: #6d28d9;
  --accent-text:  #ffffff;
  --border:       #e2e8f0;
  --highlight-bg: #fef08a;
  --error-bg:     #fee2e2;
  --error-text:   #991b1b;
  --radius:       4px;

  all: initial;
  display: block;
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  z-index: 2147483647;
  box-shadow: -2px 0 16px rgba(0, 0, 0, 0.15);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

@media (prefers-color-scheme: dark) {
  :host {
    --bg:           #0f172a;
    --surface:      #1e293b;
    --surface-2:    #334155;
    --text:         #f1f5f9;
    --text-muted:   #94a3b8;
    --border:       #334155;
    --highlight-bg: #78350f;
    --error-bg:     #450a0a;
    --error-text:   #fca5a5;
  }
}

/* ------------------------------------------------------------------ */
/* Panel shell                                                          */
/* ------------------------------------------------------------------ */
#panel {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg);
  color: var(--text);
  overflow: hidden;
}

/* ------------------------------------------------------------------ */
/* Header                                                               */
/* ------------------------------------------------------------------ */
#panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  user-select: none;
}

#panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.2px;
}

#panel-actions {
  display: flex;
  gap: 2px;
}

#panel-actions button {
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  padding: 4px 7px;
  transition: all 0.12s;
}

#panel-actions button:hover {
  background: var(--surface-2);
  border-color: var(--border);
  color: var(--text);
}

/* ------------------------------------------------------------------ */
/* Scrollable content area                                              */
/* ------------------------------------------------------------------ */
#panel-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  scroll-behavior: smooth;
}

/* ------------------------------------------------------------------ */
/* Loading state                                                        */
/* ------------------------------------------------------------------ */
#loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 20px;
  color: var(--text-muted);
  font-size: 13px;
}

.spinner {
  width: 22px;
  height: 22px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ------------------------------------------------------------------ */
/* Error banner                                                         */
/* ------------------------------------------------------------------ */
#error {
  margin: 16px;
  padding: 12px 14px;
  background: var(--error-bg);
  color: var(--error-text);
  border-radius: var(--radius);
  font-size: 13px;
  line-height: 1.5;
}

/* ------------------------------------------------------------------ */
/* Article view                                                         */
/* ------------------------------------------------------------------ */
#article-view {
  padding: 20px 18px 16px;
}

#article-title {
  font-size: 19px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text);
  margin-bottom: 6px;
}

#article-byline {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 18px;
}

#article-body {
  font-size: 14px;
  line-height: 1.75;
  color: var(--text);
}

#article-body p               { margin-bottom: 1em; }
#article-body h1,
#article-body h2,
#article-body h3,
#article-body h4              { margin: 1.4em 0 0.5em; line-height: 1.3; }
#article-body h2              { font-size: 16px; }
#article-body h3              { font-size: 14px; }
#article-body a               { color: var(--accent); }
#article-body img             { max-width: 100%; height: auto; border-radius: var(--radius); margin: 4px 0; }
#article-body blockquote      { border-left: 3px solid var(--accent); margin: 1em 0; padding: 3px 12px; color: var(--text-muted); font-style: italic; }
#article-body pre             { background: var(--surface); border-radius: var(--radius); padding: 10px 12px; overflow-x: auto; margin-bottom: 1em; }
#article-body code            { background: var(--surface); border-radius: 3px; padding: 1px 4px; font-family: 'Menlo', 'Consolas', monospace; font-size: 12px; }
#article-body pre code        { background: none; padding: 0; }
#article-body ul,
#article-body ol              { padding-left: 1.4em; margin-bottom: 1em; }
#article-body li              { margin-bottom: 0.3em; }

/* Active TTS chunk highlight */
mark.wr-highlight {
  background: var(--highlight-bg);
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
}

/* ------------------------------------------------------------------ */
/* Player bar                                                           */
/* ------------------------------------------------------------------ */
#player-bar {
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: 9px 12px 11px;
  flex-shrink: 0;
}

#progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

#progress-track {
  flex: 1;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

#progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  transition: width 0.2s;
  width: 0%;
}

#progress-label {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  min-width: 34px;
  text-align: right;
}

#controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

#controls button {
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  cursor: pointer;
  font-size: 13px;
  padding: 5px 11px;
  transition: all 0.12s;
  min-width: 36px;
}

#controls button:hover {
  background: var(--surface-2);
  border-color: var(--text-muted);
}

#btn-play {
  background: var(--accent) !important;
  border-color: var(--accent) !important;
  color: var(--accent-text) !important;
  padding: 5px 16px !important;
}

#btn-play:hover { background: var(--accent-hover) !important; border-color: var(--accent-hover) !important; }

/* ------------------------------------------------------------------ */
/* Settings panel (overlays content area)                              */
/* ------------------------------------------------------------------ */
#settings-panel {
  position: absolute;
  inset: 0;
  background: var(--bg);
  overflow-y: auto;
  z-index: 10;
  padding: 16px 18px;
}

#settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

#settings-header h3 {
  font-size: 14px;
  font-weight: 600;
}

#btn-settings-close {
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 13px;
  padding: 3px 7px;
  transition: all 0.12s;
}

#btn-settings-close:hover {
  background: var(--surface-2);
  border-color: var(--border);
  color: var(--text);
}

.setting-group {
  margin-bottom: 13px;
}

.setting-group label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 5px;
}

.setting-group select,
.setting-group input {
  width: 100%;
  padding: 7px 9px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 13px;
  outline: none;
  transition: border-color 0.12s;
}

.setting-group select:focus,
.setting-group input:focus { border-color: var(--accent); }

.btn-save {
  width: 100%;
  margin-top: 4px;
  padding: 8px;
  background: var(--accent);
  color: var(--accent-text);
  border: none;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s;
}

.btn-save:hover { background: var(--accent-hover); }

/* ------------------------------------------------------------------ */
/* Toast notification                                                   */
/* ------------------------------------------------------------------ */
.wr-toast {
  position: absolute;
  bottom: 72px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  color: #f1f5f9;
  padding: 7px 14px;
  border-radius: 20px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 20;
  pointer-events: none;
  animation: toast-in 0.2s ease;
}

@media (prefers-color-scheme: dark) {
  .wr-toast { background: #f1f5f9; color: #0f172a; }
}

@keyframes toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(6px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* ------------------------------------------------------------------ */
/* Utilities                                                            */
/* ------------------------------------------------------------------ */
.hidden { display: none !important; }
`,Q="web-reader-settings",$e={provider:"openai",model:"tts-1",voice:"alloy",openaiKey:"",elevenlabsKey:"",chunkMaxLen:300},ge={openai:{models:[{value:"tts-1",label:"TTS-1 (faster)"},{value:"tts-1-hd",label:"TTS-1 HD (quality)"}],voices:[{value:"alloy",label:"Alloy"},{value:"echo",label:"Echo"},{value:"fable",label:"Fable"},{value:"onyx",label:"Onyx"},{value:"nova",label:"Nova"},{value:"shimmer",label:"Shimmer"}]},elevenlabs:{models:[{value:"eleven_multilingual_v2",label:"Multilingual v2"},{value:"eleven_flash_v2_5",label:"Flash v2.5 (fast)"}],voices:[{value:"21m00Tcm4TlvDq8ikWAM",label:"Rachel"},{value:"AZnzlk1XvdvUeBnXmlld",label:"Domi"},{value:"EXAVITQu4vr4xnSDxMaL",label:"Bella"},{value:"ErXwobaYiN019PkySvjV",label:"Antoni"},{value:"MF3mGyEYCl7XYWbV9V6O",label:"Elli"},{value:"TxGEqnHWrfWFTfGW9XjX",label:"Josh"},{value:"VR6AewLTigWG4xSOukaG",label:"Arnold"},{value:"pNInz6obpgDQGcFmaJgB",label:"Adam"},{value:"yoZ06aMxZJJ28mfd3POQ",label:"Sam"}]}};function fe(){return new Promise(o=>{chrome.storage.local.get(Q,s=>{o({...$e,...s[Q]??{}})})})}function Xe(o){return new Promise(s=>{chrome.storage.local.set({[Q]:o},s)})}let R=null,C=null,E=null,w=[],I=0,S=null;chrome.runtime.onMessage.addListener((o,s,e)=>{if(o.action==="read")return qe().then(()=>e({ok:!0})),!0});const Fe=`
<div id="panel-header">
  <span id="panel-title">Web Reader</span>
  <div id="panel-actions">
    <button id="btn-settings" title="Settings">&#9881;</button>
    <button id="btn-close"    title="Close panel">&#10005;</button>
  </div>
</div>

<div id="panel-content">
  <div id="loading" class="hidden">
    <div class="spinner"></div>
    <span>Extracting article&hellip;</span>
  </div>
  <div id="error" class="hidden"></div>
  <div id="article-view" class="hidden">
    <h1 id="article-title"></h1>
    <div id="article-byline"></div>
    <div id="article-body"></div>
  </div>

  <!-- Settings overlay (absolute, covers content area) -->
  <div id="settings-panel" class="hidden">
    <div id="settings-header">
      <h3>Settings</h3>
      <button id="btn-settings-close">&#10005;</button>
    </div>
    <div class="setting-group">
      <label>TTS Provider</label>
      <select id="s-provider">
        <option value="openai">OpenAI</option>
        <option value="elevenlabs">ElevenLabs</option>
      </select>
    </div>
    <div class="setting-group">
      <label>Model</label>
      <select id="s-model"></select>
    </div>
    <div class="setting-group">
      <label>Voice</label>
      <select id="s-voice"></select>
    </div>
    <div class="setting-group">
      <label>OpenAI API Key</label>
      <input id="s-openai-key" type="password" placeholder="sk-&hellip;" autocomplete="off">
    </div>
    <div class="setting-group" id="s-el-group">
      <label>ElevenLabs API Key</label>
      <input id="s-el-key" type="password" placeholder="&hellip;" autocomplete="off">
    </div>
    <button class="btn-save" id="btn-save-settings">Save</button>
  </div>
</div>

<div id="player-bar" class="hidden">
  <div id="progress-row">
    <div id="progress-track"><div id="progress-fill"></div></div>
    <span id="progress-label">0 / 0</span>
  </div>
  <div id="controls">
    <button id="btn-prev"  title="Previous chunk">&#9198;</button>
    <button id="btn-play"  title="Play / Pause">&#9654;</button>
    <button id="btn-stop"  title="Stop">&#9632;</button>
    <button id="btn-next"  title="Next chunk">&#9197;</button>
  </div>
</div>

<audio id="tts-audio" preload="auto"></audio>
`;function Ve(){if(R)return;R=document.createElement("div"),R.id="web-reader-ext-host",C=R.attachShadow({mode:"open"});const o=document.createElement("style");o.textContent=We,C.appendChild(o);const s=document.createElement("div");s.id="panel",s.innerHTML=Fe,C.appendChild(s),document.documentElement.appendChild(R),ze()}function je(){V(),R==null||R.remove(),R=null,C=null,E=null}function u(o){return C.querySelector(o)}function ze(){u("#btn-close").addEventListener("click",je),u("#btn-settings").addEventListener("click",Ze),u("#btn-settings-close").addEventListener("click",ve),u("#btn-save-settings").addEventListener("click",et),u("#btn-play").addEventListener("click",Ye),u("#btn-stop").addEventListener("click",Ke),u("#btn-prev").addEventListener("click",()=>pe(I-1)),u("#btn-next").addEventListener("click",()=>pe(I+1)),u("#s-provider").addEventListener("change",()=>me())}async function qe(){Ve(),u("#loading").classList.remove("hidden"),u("#error").classList.add("hidden"),u("#article-view").classList.add("hidden"),u("#player-bar").classList.add("hidden"),u("#settings-panel").classList.add("hidden"),V(),S=await fe();let o;try{o=Ce(document.documentElement.outerHTML,location.href)}catch(s){u("#loading").classList.add("hidden"),u("#error").textContent=s.message,u("#error").classList.remove("hidden");return}u("#loading").classList.add("hidden"),u("#article-title").textContent=o.title??"",u("#article-byline").textContent=o.byline??"",u("#article-body").innerHTML=o.content??"",u("#article-view").classList.remove("hidden"),u("#player-bar").classList.remove("hidden"),w=Oe(o.textContent??"",S.chunkMaxLen),I=0,H(0,w.length)}function Ye(){if(w.length){if(!E||E.isStopped){Je(I);return}E.isPaused?(E.resume(),u("#btn-play").innerHTML="&#9646;&#9646;"):(E.pause(),u("#btn-play").innerHTML="&#9654;")}}function Ke(){V(),I=0,H(0,w.length),u("#btn-play").innerHTML="&#9654;",Z()}function V(){E&&(E.stop(),E=null)}function pe(o){o<0||o>=w.length||(I=o,E&&!E.isStopped?E.seekTo(o):H(o,w.length))}function Je(o=0){V();const s=u("#tts-audio");E=new Ue(s,w,S,{onChunkStart:e=>{I=e,H(e,w.length),Qe(e),u("#btn-play").innerHTML="&#9646;&#9646;"},onProgress:(e,t)=>H(e,t),onEnd:()=>{I=0,H(0,w.length),u("#btn-play").innerHTML="&#9654;",Z()},onError:e=>be(e)}),o===0?E.play():(E.play().then(()=>{}),E.seekTo(o))}function H(o,s){const e=s>0?(o+1)/s*100:0;u("#progress-fill").style.width=`${e}%`,u("#progress-label").textContent=s>0?`${o+1} / ${s}`:"0 / 0"}function Qe(o){var l,n;Z();const s=u("#article-body"),e=(l=w[o])==null?void 0:l.trim();if(!e||!s)return;const t=e.slice(0,25),i=document.createTreeWalker(s,NodeFilter.SHOW_TEXT);let r;for(;r=i.nextNode();){const a=r.textContent.indexOf(t);if(a!==-1){if(a+e.length<=r.textContent.length){const h=document.createRange();h.setStart(r,a),h.setEnd(r,a+e.length);const d=document.createElement("mark");d.className="wr-highlight";try{h.surroundContents(d),d.scrollIntoView({behavior:"smooth",block:"center"});return}catch{}}(n=r.parentElement)==null||n.scrollIntoView({behavior:"smooth",block:"center"});return}}}function Z(){C.querySelectorAll("mark.wr-highlight").forEach(o=>{const s=o.parentNode;for(;o.firstChild;)s.insertBefore(o.firstChild,o);s.removeChild(o),s.normalize()})}async function Ze(){S=await fe(),u("#s-provider").value=S.provider,u("#s-openai-key").value=S.openaiKey??"",u("#s-el-key").value=S.elevenlabsKey??"",me(),u("#s-model").value=S.model,u("#s-voice").value=S.voice,u("#settings-panel").classList.remove("hidden")}function ve(){u("#settings-panel").classList.add("hidden")}function me(){const o=u("#s-provider").value,s=ge[o]??ge.openai;u("#s-model").innerHTML=s.models.map(e=>`<option value="${e.value}">${e.label}</option>`).join(""),u("#s-voice").innerHTML=s.voices.map(e=>`<option value="${e.value}">${e.label}</option>`).join(""),u("#s-el-group").style.display=o==="elevenlabs"?"":"none"}async function et(){const o={...S,provider:u("#s-provider").value,model:u("#s-model").value,voice:u("#s-voice").value,openaiKey:u("#s-openai-key").value.trim(),elevenlabsKey:u("#s-el-key").value.trim()};await Xe(o),S=o,ve(),be("Settings saved")}function be(o){C.querySelectorAll(".wr-toast").forEach(e=>e.remove());const s=document.createElement("div");s.className="wr-toast",s.textContent=o,u("#panel").appendChild(s),setTimeout(()=>s.remove(),3e3)}})();
