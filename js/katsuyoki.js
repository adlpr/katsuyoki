// DOM objects
var word = document.getElementById("word");
var pos = document.getElementById("pos");
var subPos = document.getElementById("pos-sub");
var result = document.getElementById("result");

// initialize table templates
// horizontal
var table = document.createElement('table');
table.className = 'table hidden-xs-down visible-sm-up';
var thead = document.createElement('thead');
// var caption = document.createElement('caption');
// table.appendChild(caption);
var theadTr = document.createElement('tr');
for (const heading of ["未然","連用","終止","連体","已然","命令"]) {
  th = document.createElement('th');
  th.appendChild(document.createTextNode(heading));
  theadTr.appendChild(th);
}
thead.appendChild(theadTr);
table.appendChild(thead);
var tbody = document.createElement('tbody');
table.appendChild(tbody);
result.appendChild(table);
// vertical
var tableVert = document.createElement('table');
tableVert.className = 'table table-vertical visible-xs-down hidden-sm-up';
result.appendChild(tableVert);

// Generate suggestions list
var suggestionsList = [];
for (const wordSubPos in suggestions) {
  suggestionsList = suggestionsList.concat(
    Object.keys(suggestions[wordSubPos]).map(function(word) {
      return [word, wordSubPos];
    })
  );
};

// Awesomplete instantiation + options
new Awesomplete(word, {
  list: suggestionsList,
  minChars: 1,
  maxItems: 16,
  data: function (item, input) {
  	return item[0] + "〔" + item[1] + "〕";
  },
  filter: function (text, input) {
  	return Awesomplete.FILTER_CONTAINS(text.slice(0, text.indexOf("〔")), input);
  },
  replace: function (text) {
  	this.input.value = text.slice(0, text.indexOf("〔"));
    var wordSubPos = text.slice(text.indexOf("〔") + 1, text.length - 1);
    var wordPos = "特殊";
    for (const mapPos in subPosMap) {
      if (subPosMap[mapPos].includes(wordSubPos)) {
        wordPos = mapPos;
        break;
      }
    }
    // change values of POS dropdowns
    pos.value = wordPos;
    repopulateDropdowns();
    subPos.value = wordSubPos;
    // make preferred replacement if applicable
    if ((wordSubPos in suggestions) && (this.input.value in suggestions[wordSubPos]))
      this.input.value = suggestions[wordSubPos][this.input.value];
    // suppress autofill
    suppressDropdownAutofill = true;
    // attempt inflection
    inflect();
  }
});


// Dynamic part-of-speech dropdowns
var subPosMap = {
  "動詞" : ["四段", "上一段", "下一段", "上二段", "下二段", "変格"],
  "形容詞" : ["ク", "シク"],
  "形容動詞" : ["ナリ", "タリ"],
  "特殊" : ["き","ず","た","さう","しも","ぢゃ","です","なふ","なむ","まい","まし","らし","さうな・げな","さんす・しゃんす","しゃる","ましじ","無変化"]
};
function repopulateDropdowns() {
  // empty subPos
  while (subPos.firstChild) subPos.removeChild(subPos.firstChild);
  // // 
  // if (subPosMap[pos.value].length == 0)
  //   subPos.disabled = true;
  // else {
  //   subPos.disabled = false;
  for (const subPosOption of subPosMap[pos.value]) {
    let o = document.createElement("option");
    o.value = subPosOption;
    o.text = subPosOption;
    subPos.appendChild(o);
  }
  // }
  inflect();
}
pos.onchange = repopulateDropdowns;
repopulateDropdowns();


var suppressDropdownAutofill = false;

function dropdownAutofill(w) {
  // console.log(suppressDropdownAutofill)
  if (!suppressDropdownAutofill) {
    // best guess of class based on word ending
    var w = word.value;
    
    var guessPos = "";
    var guessSubPos = "";
    
    if (w.match(/[乾干]$/)) {
      var guessPos = "動詞";
      var guessSubPos = "上二段";
    }
    else if (w.match(/[出寝得消経綜]$/)) {
      var guessPos = "動詞";
      var guessSubPos = "下二段";
    }
    else if (w.match(/[来為]$/)) {
      var guessPos = "動詞";
      var guessSubPos = "変格";
    }
    else if (w.endsWith("候")) {
      var guessPos = "特殊";
      var guessSubPos = "さう";
    }
    else if (w.match(/[うくぐすずつづぬふぶぷむゆるん]$/))
      var guessPos = "動詞";
    else if (w.endsWith("し"))
      var guessPos = "形容詞";
    else if (w.endsWith("じ")) {
      var guessPos = "形容詞";
      var guessSubPos = "シク";
    }
    else if (w.match(/.+なり$/)) {
      var guessPos = "形容動詞";
      var guessSubPos = "ナリ";
    }
    else if (w.match(/.+たり$/)) {
      var guessPos = "形容動詞";
      var guessSubPos = "タリ";
    }
    
    if (guessPos != "" && guessPos != pos.value) {
      pos.value = guessPos;
      repopulateDropdowns();
      if (guessSubPos != "")
        subPos.value = guessSubPos;
    }
    inflect();
  }
  else suppressDropdownAutofill = false;
}


// parse inputs, attempt inflection, and generate result table or message
var msg_empty = "言葉入り給へ。";
var msg_invalid = "活用されず。";
var msg_error = "エラーが発生しました。";
function inflect() {
  var w = word.value;
  if (w != "") {
    // add furigana if available
    if (w in furiganaMap) w = furiganaMap[w];
    // add furigana for single-kanji verbs even if full word not available
    let singleKanjiVerb = w.match(/^(.*)([乾候出寝干得来消為経綜])$/);
    if (singleKanjiVerb) {
      let verb = singleKanjiVerb[2];
      // console.log(verb);
      if (verb in furiganaMap)
        w = singleKanjiVerb[1] + furiganaMap[verb];
    }
    // begin inflection
    var inflected = [];
    switch (pos.value) {
      case "動詞":
        switch (subPos.value) {
          case "四段":
            // 飽く - 飽 - か／き／く／く／け／け
            var match = w.match(/^(.*)([うくぐすずつづぬふぶぷむゆるん])(\)?)$/)
            if (match) {
              let gokan = match[1] + "|";
              let kana = match[2];
              let end = match[3];
              inflected.push({
                '未' : gokan + changeVowel(kana, 'あ') + end,
                '用' : gokan + changeVowel(kana, 'い') + end,
                '終' : gokan + changeVowel(kana, 'う') + end,
                '体' : gokan + changeVowel(kana, 'う') + end,
                '已' : gokan + changeVowel(kana, 'え') + end,
                '命' : gokan + changeVowel(kana, 'え') + end,
              });
            }
            break;
          case "上一段":
            // 着る - (着) - き／き／きる／きる／きれ／きよ
            var match = w.match(/^(.*[いきぎしじちぢにひびぴみりゐ]\)?)る$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                '未' : gokan,
                '用' : gokan,
                '終' : gokan + 'る',
                '体' : gokan + 'る',
                '已' : gokan + 'れ',
                '命' : gokan + 'よ',
              });
            }
            break;
          case "下一段":
            // 蹴る 	(蹴) 	け／け／ける／ける／けれ／けよ
            var match = w.match(/^(.*[えけげせぜてでねへべぺめれゑ]\)?)る$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                '未' : gokan,
                '用' : gokan,
                '終' : gokan + 'る',
                '体' : gokan + 'る',
                '已' : gokan + 'れ',
                '命' : gokan + 'よ',
              });
            }
            break;
          case "上二段":
            // 起く 	起 	き／き／く／くる／くれ／きよ
            var match = w.match(/^(.*)([うくぐすずつづぬふぶぷむゆるん])(\)?)$/)
            if (match) {
              let gokan = match[1] + "|";
              let kana = match[2];
              let end = match[3];
              inflected.push({
                '未' : gokan + changeVowel(kana, 'い') + end,
                '用' : gokan + changeVowel(kana, 'い') + end,
                '終' : gokan + changeVowel(kana, 'う') + end,
                '体' : gokan + changeVowel(kana, 'う') + end + 'る',
                '已' : gokan + changeVowel(kana, 'う') + end + 'れ',
                '命' : gokan + changeVowel(kana, 'い') + end + 'よ',
              });
            }
            break;
          case "下二段":
            // 受く 	受 	け／け／く／くる／くれ／けよ
            var match = w.match(/^(.*)([うくぐすずつづぬふぶぷむゆるん])(\)?)$/)
            if (match) {
              let gokan = match[1] + "|";
              let kana = match[2];
              let end = match[3];
              inflected.push({
                '未' : gokan + changeVowel(kana, 'え') + end,
                '用' : gokan + changeVowel(kana, 'え') + end,
                '終' : gokan + changeVowel(kana, 'う') + end,
                '体' : gokan + changeVowel(kana, 'う') + end + 'る',
                '已' : gokan + changeVowel(kana, 'う') + end + 'れ',
                '命' : gokan + changeVowel(kana, 'え') + end + 'よ',
              });
            }
            break;
          case "変格":
            var match = w.match(/^(.*)([くすずぬり])(\)?)$/)
            if (match) {
              let gokan = match[1] + "|";
              let kana = match[2];
              let end = match[3];
              switch (kana) {
                case "く":
                  // 来 	(来) 	こ 	き 	く 	くる 	くれ 	こ/こよ
                  inflected.push({
                    '未' : gokan + changeVowel(kana, 'お') + end,
                    '用' : gokan + changeVowel(kana, 'い') + end,
                    '終' : gokan + kana + end,
                    '体' : gokan + kana + end + 'る',
                    '已' : gokan + kana + end + 'れ',
                    '命' : gokan + changeVowel(kana, 'お') + end + '<br/>' +
                           gokan + changeVowel(kana, 'お') + end + 'よ',
                  });
                  break;
                case "す":
                  // 為 	(為) 	せ 	し 	す 	する 	すれ 	せよ
                  inflected.push({
                    '未' : gokan + changeVowel(kana, 'え') + end,
                    '用' : gokan + changeVowel(kana, 'い') + end,
                    '終' : gokan + changeVowel(kana, 'う') + end,
                    '体' : gokan + changeVowel(kana, 'う') + end + 'る',
                    '已' : gokan + changeVowel(kana, 'う') + end + 'れ',
                    '命' : gokan + changeVowel(kana, 'え') + end + 'よ',
                  });
                  break;
                case "ず":
                  inflected.push({
                    '未' : gokan + changeVowel(kana, 'え') + end,
                    '用' : gokan + changeVowel(kana, 'い') + end,
                    '終' : gokan + changeVowel(kana, 'う') + end,
                    '体' : gokan + changeVowel(kana, 'う') + end + 'る',
                    '已' : gokan + changeVowel(kana, 'う') + end + 'れ',
                    '命' : gokan + changeVowel(kana, 'え') + end + 'よ',
                  });
                  break;
                case "ぬ":
                  // 死ぬ 	死 	な 	に 	ぬ 	ぬる 	ぬれ 	ね
                  inflected.push({
                    '未' : gokan + changeVowel(kana, 'あ') + end,
                    '用' : gokan + changeVowel(kana, 'い') + end,
                    '終' : gokan + changeVowel(kana, 'う') + end,
                    '体' : gokan + changeVowel(kana, 'う') + end + 'る',
                    '已' : gokan + changeVowel(kana, 'う') + end + 'れ',
                    '命' : gokan + changeVowel(kana, 'え') + end,
                  });
                  break;
                case "り":
                  // 有り 	有 	ら 	り 	り 	る 	れ 	れ
                  inflected.push({
                    '未' : gokan + changeVowel(kana, 'あ') + end,
                    '用' : gokan + changeVowel(kana, 'い') + end,
                    '終' : gokan + changeVowel(kana, 'い') + end,
                    '体' : gokan + changeVowel(kana, 'う') + end,
                    '已' : gokan + changeVowel(kana, 'え') + end,
                    '命' : gokan + changeVowel(kana, 'え') + end,
                  });
                  break;
              }
            }
            break;
          default:
            printMessage(msg_error);
            break;
        }
        break;
      case "形容詞":
        switch (subPos.value) {
          case "ク":
            // ク	｛（く）・から／く・かり／し・かり／き・かる／けれ・かれ／かれ｝
            var match = w.match(/^(.+)し$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                '未' : gokan + "く",
                '用' : gokan + "く",
                '終' : gokan + "し",
                '体' : gokan + "き",
                '已' : gokan + "けれ",
              });
              inflected.push({
                '未' : gokan + "から",
                '用' : gokan + "かり",
                // '終' : gokan + "かり",
                '体' : gokan + "かる",
                // '已' : gokan + "かれ",
                '命' : gokan + "かれ",
              });
            }
            break;
          case "シク":
            // シク	｛（しく）・しから／しく・しかり／し／しき・しかる／しけれ／しかれ｝
            // シク	｛（じく）・じから／じく・じかり／じ／じき・じかる／じけれ／じかれ｝
            var match = w.match(/^(.+[しじ])$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                '未' : gokan + "く",
                '用' : gokan + "く",
                '終' : gokan,
                '体' : gokan + "き",
                '已' : gokan + "けれ",
              });
              inflected.push({
                '未' : gokan + "から",
                '用' : gokan + "かり",
                // '終' : gokan + "かり",
                '体' : gokan + "かる",
                // '已' : gokan + "かれ",
                '命' : gokan + "かれ",
              });
            }
            break;
          default:
            printMessage(msg_error);
            break;
        }
        break;
      case "形容動詞":
        switch (subPos.value) {
          case "ナリ":
            // 静かなり 	静か 	なら  	なり/に 	なり  	なる  	なれ  	なれ
            var match = w.match(/^(.*)なり$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                '未' : gokan + "なら",
                '用' : gokan + "なり<br/>" + gokan + "に",
                '終' : gokan + "なり",
                '体' : gokan + "なる",
                '已' : gokan + "なれ",
                '命' : gokan + "なれ",
              });
            }
            break;
          case "タリ":
            // 堂々たり 	堂々 	たら  	たり/と 	たり  	たる  	たれ  	たれ
            var match = w.match(/^(.*)たり$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                '未' : gokan + "たら",
                '用' : gokan + "たり<br/>" + gokan + "と",
                '終' : gokan + "たり",
                '体' : gokan + "たる",
                '已' : gokan + "たれ",
                '命' : gokan + "たれ",
              });
            }
            break;
          default:
            printMessage(msg_error);
            break;
        }
        break;
      case "特殊":
        switch (subPos.value) {
          case "き":
            // き    ｛(せ)／○／き／し／しか／○｝
            var match = w.match(/^(.*)き$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                '未' : gokan + "せ",
                // '用' : gokan + "",
                '終' : gokan + "き",
                '体' : gokan + "し",
                '已' : gokan + "しか",
                // '命' : gokan + "",
              });
            }
            break;
          case "ず":
            // ず    ｛-,ざら／に,ず,ざり／-,ず／ぬ,ざる／ね,ざれ／ -,ざれ｝
            var match = w.match(/^(.*)ず$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                // '未' : gokan + "",
                '用' : gokan + "に",
                // '終' : gokan + "",
                '体' : gokan + "ぬ",
                '已' : gokan + "ね",
                // '命' : gokan + "",
              });
              inflected.push({
                '未' : gokan + "ざら",
                '用' : gokan + "ず<br/>" + gokan + "ざり",
                '終' : gokan + "ず",
                '体' : gokan + "ざる",
                '已' : gokan + "ざれ",
                '命' : gokan + "ざれ",
              });
            }
            break;
          case "た":
            // た    ｛たら／たり／た／た／たれ／○｝
            var match = w.match(/^(.*)た$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                '未' : gokan + "たら",
                '用' : gokan + "たり",
                '終' : gokan + "た",
                '体' : gokan + "た",
                '已' : gokan + "たれ",
                // '命' : gokan + "",
              });
            }
            break;
          case "さう":
            // 候(さう) ｛さう／さう／さう／さう／さうへ／さうへ｝
            var match = w.match(/^(.*)(候|さう)$/)
            if (match) {
              let gokan = match[1] + "|";
              let sau = match[2];
              inflected.push({
                '未' : gokan + sau,
                '用' : gokan + sau,
                '終' : gokan + sau,
                '体' : gokan + sau,
                '已' : gokan + sau + "へ",
                '命' : gokan + sau + "へ",
              });
            }
            break;
          case "しも":
            // さしも   ｛さしも／さしも／さしも／さしも／さしめ／さしめ｝
            // しも   ｛しも／しも／しも／しも／しめ／しめ｝
            var match = w.match(/^(.*)しも$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                '未' : gokan + "しも",
                '用' : gokan + "しも",
                '終' : gokan + "しも",
                '体' : gokan + "しも",
                '已' : gokan + "しめ",
                '命' : gokan + "しめ",
              });
            }
            break;
          case "ぢゃ":
            // ぢゃ   ｛ぢゃろ・ぢゃら／ぢゃっ・で／ぢゃ／ぢゃ・ぢゃる／○／○｝
            var match = w.match(/^(.*)ぢゃ$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                '未' : gokan + "ぢゃろ<br/>" + gokan + "ぢゃら",
                '用' : gokan + "ぢゃっ<br/>" + gokan + "で",
                '終' : gokan + "ぢゃ",
                '体' : gokan + "ぢゃ<br/>" + gokan + "ぢゃる",
                // '已' : gokan + "",
                // '命' : gokan + "",
              });
            }
            break;
          case "です":
            // です   ｛でせ／でし／です／○／○／○｝
            var match = w.match(/^(.*)です$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                '未' : gokan + "でせ",
                '用' : gokan + "でし",
                '終' : gokan + "です",
                // '体' : gokan + "",
                // '已' : gokan + "",
                // '命' : gokan + "",
              });
            }
            break;
          case "なふ":
            // なふ   ｛なは／○／なふ／なへ（のへ）／なへ／○｝
            var match = w.match(/^(.*)なふ$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                '未' : gokan + "なは",
                // '用' : gokan + "",
                '終' : gokan + "なふ",
                '体' : gokan + "なへ<br/>" + gokan + "のへ",
                '已' : gokan + "なへ",
                // '命' : gokan + "",
              });
            }
            break;
          case "なむ":
            // なむ   ｛○／○／なむ／なむ／なめ／○｝
            var match = w.match(/^(.*)なむ$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                // '未' : gokan + "",
                // '用' : gokan + "",
                '終' : gokan + "なむ",
                '体' : gokan + "なむ",
                '已' : gokan + "なめ",
                // '命' : gokan + "",
              });
            }
            break;
          case "まい":
            // まい   ｛○／○／まい／まい／まいけれ／○｝
            var match = w.match(/^(.*)なむ$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                // '未' : gokan + "",
                // '用' : gokan + "",
                '終' : gokan + "まい",
                '体' : gokan + "まい",
                '已' : gokan + "まいけれ",
                // '命' : gokan + "",
              });
            }
            break;
          case "まし":
            // まし   ｛ましか,ませ／○／まし／まし／ましか／○｝
            var match = w.match(/^(.*)なむ$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                '未' : gokan + "ましか<br/>" + gokan + "ませ",
                // '用' : gokan + "",
                '終' : gokan + "まし",
                '体' : gokan + "まし",
                '已' : gokan + "ましか",
                // '命' : gokan + "",
              });
            }
            break;
          case "らし":
            // らし    ｛○／○／らし／らし・らしき／らし／○｝
            // けらし   ｛○／○／けらし／けらし・けらしき／けらし／○｝
            var match = w.match(/^(.*)らし$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                // '未' : gokan + "",
                // '用' : gokan + "",
                '終' : gokan + "らし",
                '体' : gokan + "らし<br/>" + gokan + "らしき",
                '已' : gokan + "らし",
                // '命' : gokan + "",
              });
            }
            break;
          case "さうな・げな":
            // げな    ｛○／げに／げな／げな／げなれ／○｝
            // さうな   ｛○／さうに／さうな／さうな／さうなれ／○｝
            var match = w.match(/^(.*(?:さう|げ))な$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                // '未' : gokan + "",
                '用' : gokan + "に",
                '終' : gokan + "な",
                '体' : gokan + "な",
                '已' : gokan + "なれ",
                // '命' : gokan + "",
              });
            }
            break;
          case "さんす・しゃんす":
            // さんす  ｛さんせ／さんし／さんす／さんす／さんすれ／さんせ｝
            // しゃんす  ｛しゃんせ／しゃんし／しゃんす／しゃんす／しゃんすれ／しゃんせ｝
            // さしゃんす ｛さしゃんせ／さしゃんし／さしゃんす／さしゃんす／さしゃんすれ／さしゃんせ｝
            var match = w.match(/^(.*ん)す$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                '未' : gokan + "せ",
                '用' : gokan + "し",
                '終' : gokan + "す",
                '体' : gokan + "す",
                '已' : gokan + "すれ",
                '命' : gokan + "せ",
              });
            }
            break;
          case "しゃる":
            // さっしゃる ｛ら・れ・ろ／り・っ・れ・い／る／る／れ・るれ／れ・い・れい｝
            var match = w.match(/^(.*しゃ)る$/)
            if (match) {
              let gokan = match[1] + "|";
              inflected.push({
                '未' : gokan + "ら<br/>" + gokan + "れ<br/>" + gokan + "ろ",
                '用' : gokan + "り<br/>" + gokan + "っ<br/>" + gokan + "れ<br/>" + gokan + "い",
                '終' : gokan + "る",
                '体' : gokan + "る",
                '已' : gokan + "れ<br/>" + gokan + "るれ",
                '命' : gokan + "れ<br/>" + gokan + "い<br/>" + gokan + "れい",
              });
            }
            break;
          case "ましじ":
            // ましじ  ｛○／○／ましじ／ましじき／○／○｝
            var match = w.match(/^(.*)ましじ$/)
            if (match) {
              let gokan = match[1] + "|ましじ";
              inflected.push({
                // '未' : gokan + "",
                // '用' : gokan + "",
                '終' : gokan,
                '体' : gokan + "き",
                // '已' : gokan + "",
                // '命' : gokan + "",
              });
            }
            break;
          case "無変化":
            // う      ｛う／○／う／う／○／○｝
            // じ   ｛○／○／じ／じ／じ／○｝  
            // す  ｛○／○／す／す／○／○｝
            // なも   ｛○／○／なも／なも／○／○｝
            // も   ｛○／○／も／も／○／○｝
            // べい  ｛○／○／べい／べい／○／○｝
            // らう  ｛○／○／らう／らう／○／○｝
            var match = w.match(/^(.*(?:[すも]|べい|らう))$/)
            if (match) {
              let gokan = match[1];
              inflected.push({
                // '未' : gokan + "",
                // '用' : gokan + "",
                '終' : gokan,
                '体' : gokan,
                // '已' : gokan + "",
                // '命' : gokan + "",
              });
            }
            var match = w.match(/^(.*う)$/)
            if (match) {
              let gokan = match[1];
              inflected.push({
                '未' : gokan,
                // '用' : gokan + "",
                '終' : gokan,
                '体' : gokan,
                // '已' : gokan + "",
                // '命' : gokan + "",
              });
            }
            var match = w.match(/^(.*じ)$/)
            if (match) {
              let gokan = match[1];
              inflected.push({
                // '未' : gokan,
                '用' : gokan,
                '終' : gokan,
                '体' : gokan,
                // '已' : gokan + "",
                // '命' : gokan + "",
              });
            }
            break;
          default:
            printMessage(msg_error);
            break;
        }
        break;
      default:
        printMessage(msg_error);
        break;
    }
    if (inflected.length > 0)
      printTable(inflected);
    else
      printMessage(msg_invalid);
  }
  else
    printMessage(msg_empty);
}


function changeVowel(kana, vowel) {
  // take a consonant sound from a kana (hiragana only) and add given vowel
  if (!["あ","い","う","え","お"].includes(vowel))
    return undefined;
  else if (["あ","い","う","え","お"].includes(kana))
    return vowel;
  else
    return vowelConsKanaMap[vowel][getConsonant(kana)];
}

function getConsonant(kana) {
  if (["か","き","く","け","こ"].includes(kana)) return "k";
  if (["が","ぎ","ぐ","げ","ご"].includes(kana)) return "g";
  if (["さ","し","す","せ","そ"].includes(kana)) return "s";
  if (["ざ","じ","ず","ぜ","ぞ"].includes(kana)) return "z";
  if (["た","ち","つ","て","と"].includes(kana)) return "t";
  if (["だ","ぢ","づ","で","ど"].includes(kana)) return "d";
  if (["な","に","ぬ","ね","の"].includes(kana)) return "n";
  if (["は","ひ","ふ","へ","ほ"].includes(kana)) return "h";
  if (["ば","び","ぶ","べ","ぼ"].includes(kana)) return "b";
  if (["ぱ","ぴ","ぷ","ぺ","ぽ"].includes(kana)) return "p";
  if (["ま","み","む","め","も"].includes(kana)) return "m";
  if (kana == "ん") return "nn";
  if (["や","ゆ","𛀁","よ"].includes(kana)) return "y";
  if (["ら","り","る","れ","ろ"].includes(kana)) return "r";
  if (["わ","ゐ","ゑ","を"].includes(kana)) return "w";
  return undefined;
}


// print inflection table
// accepts list of objects (rows) containing inflected forms.
function printTable(inflected) {
  // clear caption
  // caption.innerHTML = "";
  
  // empty tbody area
  while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
  
  // horizontal table
  for (const row of inflected) {
    let tr = document.createElement('tr');
    for (const kei of ["未","用","終","体","已","命"]) {
      let td = document.createElement('td');
      if (!(kei in row) || row[kei] == "")
        row[kei] = "◯";
      td.innerHTML = convertFuriganaMarkup(row[kei]);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  
  // vertical table
  while (tableVert.firstChild) tableVert.removeChild(tableVert.firstChild);
  for (const kei of ["未","用","終","体","已","命"]) {
    let tr = document.createElement('tr');
    let th = document.createElement('th');
    th.appendChild(document.createTextNode(kei));
    tr.appendChild(th);
    for (const row of inflected) {
      let td = document.createElement('td');
      if (!(kei in row) || row[kei] == "")
        row[kei] = "◯";
      td.innerHTML = convertFuriganaMarkup(row[kei]);
      tr.appendChild(td);
    }
    tableVert.appendChild(tr);
  }
}

function convertFuriganaMarkup(string) {
  string = string.replace(/\|([^\)<]*)(\)?)([^<]+)(<|$)/g, '<span class="inflected">$1</span>$2<span class="inflected">$3</span>$4');
  string = string.replace(/(<span class="inflected"><\/span>|\|$)/g, '');
  string = string.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<ruby>$1<rp>（</rp><rt>$2</rt><rp>）</rp></ruby>');
  return string
}


function printMessage(text) {
  // empty tbody area
  while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
  while (tableVert.firstChild) tableVert.removeChild(tableVert.firstChild);
  // make span with dimmed text
  // horizontal
  let tr = document.createElement('tr');
  let td = document.createElement('td');
  td.className = 'dimmed';
  td.colSpan = '6';
  td.innerHTML = text;
  tr.appendChild(td);
  tbody.appendChild(tr);
  // vertical
  let trVert = document.createElement('tr');
  let tdVert = document.createElement('td');
  tdVert.className = 'dimmed';
  tdVert.innerHTML = text;
  trVert.appendChild(tdVert);
  tableVert.appendChild(trVert);
}

window.onkeyup = inflect;
word.onchange = dropdownAutofill;
subPos.onchange = inflect;

inflect();
