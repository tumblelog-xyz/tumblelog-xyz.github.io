/* webmention.js

Simple thing for embedding webmentions from webmention.io into a page, client-side.

(c)2018 fluffy (http://beesbuzz.biz)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Usage:

1. Copy this file to your website and put it somewhere sensible
2. Put a <div id="webmentions"></div> where you want your webmentions to be
   embedded
3. Do a <script href="/path/to/webmention.js"></script> somewhere on your page

You can also pass in some arguments, for example:

    <script href="webmention.js" data-id="webmention-container">

Accepted arguments:

* data-page-url - use this reference URL instead of the current browser location
* data-id - use this container ID instead of "webmentions"
* data-wordcount - truncate the reply to this many words (adding an ellipsis to
    the end of the last word)

This is a quick hack that could be a lot better.

GitHub repo (for latest released versions, issue tracking, etc.):

    http://github.com/PlaidWeb/Publ-site

(look in the static/ subdirectory)

*/


(function() {
    var refurl = document.currentScript.getAttribute('data-page-url') || window.location.href;
    var containerID = document.currentScript.getAttribute('data-id') || "webmentions";
    var textMaxWords = document.currentScript.getAttribute('data-wordcount');

    var reactTitle = {
        'in-reply-to': 'replied',
        'like-of': 'liked',
        'repost-of': 'reposted',
        'bookmark-of': 'bookmarked',
        'mention-of': 'mentioned',
        'rsvp': 'RSVPed'
    };

    var reactEmoji = {
        'in-reply-to': '💬',
        'like-of': '❤️',
        'repost-of': '🔄',
        'bookmark-of': '⭐️',
        'mention-of': '💬',
        'rsvp': '📅'
    };

    function reactImage(r) {
        var who = (r.author && r.author.name ? r.author.name : r.url.split('/')[2]);
        var response = reactTitle[r['wm-property']] || 'reacted';
        var html = '<a class="reaction" title="' + who + ' ' + response + '" href="' + r.url + '">';
        if (r.author && r.author.photo) {
            html += '<img src="' + r.author.photo + '">';
        }
        html += (reactEmoji[r['wm-property']] || '📔️') + '</a>';

        return html;
    }

    function formatComments(comments) {
        var html = '<h2>' + comments.length + ' Response' + (comments.length > 1 ? 's' : '') +
            '</h2><ul class="comments">';
        comments.forEach(function(c) {
            html += '<li>';

            html += reactImage(c);

            html += ' <a class="source" href="' + c.url + '">';
            if (c.author && c.author.name) {
                html += c.author.name;
            } else {
                html += c.url.split('/')[2];
            }
            html += '</a>: ';

            var linkclass, linktext;
            if (c.name) {
                linkclass = "name";
                linktext = c.name;
            } else if (!c.name) {
                linkclass = "name";
                linktext = "(mention)";
            }

            html += '<span class="' + linkclass + '" href="' + c.url + '">' + linktext + '</span>';
            if (c.content  && c.content != c.name) {
                html += '<div class="content" href="' + c.url + '">' + c.content + '</div>';            
            }
            html += '</li>';
        });
        html += '</ul>';

        return html;
    }

    function formatReactions(reacts) {
        var html = '<h2>' + reacts.length + ' Reaction' + (reacts.length > 1 ? 's' : '') +
            '</h2><ul class="reacts">';

        reacts.forEach(function(r) {
            html += reactImage(r);
        })

        return html;
    }

    function getData(url, callback) {
        if (fetch) {
            fetch(url).then(function(response) {
                if (response.status >= 200 && response.status < 300) {
                    return Promise.resolve(response);
                } else {
                    return Promise.reject(new Error(response.statusText));
                }
            }).then(function(response) {
                return response.json();
            }).then(callback).catch(function(error) {
                console.log("Request failed", error);
            });
        } else {
            var oReq = new XMLHttpRequest();
            oReq.onload = function(data) {
                callback(JSON.parse(data));
            }
            oReq.onerror = function(error) {
                console.log("Request failed", error);
            }
        }
    }

    window.addEventListener("load", function() {
        var container = document.getElementById(containerID);

        var pageurl = refurl.substr(refurl.indexOf('//'));

        var apiURL = 'https://webmention.io/api/mentions.jf2?target[]=' +
            encodeURIComponent('http:' + pageurl) +
            '&target[]=' + encodeURIComponent('https:' + pageurl);
            apiURL="https://mention.tech/listmentions?target=https%3A%2F%2Ftumblelog.xyz&json=on";

        getData(apiURL, function(json) {
            html = '';

            var comments = [];
            var collects = [];

            var mapping = {
                "in-reply-to": comments,
                "like-of": collects,
                "repost-of": collects,
                "bookmark-of": comments,
                "mention-of": comments
            };

            json.children.forEach(function(c) {
                var store = mapping[c['wm-property']] || comments;
                if (store) store.push(c);
            });

            // format the comment-type things
            if (comments.length > 0) {
                html += formatComments(comments);
            }

            // format the other reactions
            if (collects.length > 0) {
                html += formatReactions(collects);
            }

            container.innerHTML = html;
        });
    });

})();
