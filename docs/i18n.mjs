// The two readings of everything the plaza itself says.
//
// The site's wayfinding was bilingual from the first build, Chinese carved above small
// English support. This extends that to the rest: every heading, every empty state, every
// button and every line of the about page has a Chinese reading, and a reader chooses which
// one the interface speaks.
//
// What a philosopher or a visitor SAYS is not in here and never will be. A philosopher's
// words are the words of a translation the library can name, or the words the engine wrote
// in character; a visitor's words are their own. Running either through a translator would
// make it a paraphrase, and a paraphrase in quotation marks is the thing this project exists
// not to do. So a Chinese reader gets a Chinese plaza around English speech, which is
// exactly what a reader gets in the physical world when they walk into a foreign square.
//
// The Chinese here is written, not translated. It obeys the same rulebook as the English:
// plain words, no marketing, nothing said twice.
//
//     import { t, lang, setLang, onLang } from "./i18n.mjs";
//     t("plaza.h1")            // the current reading
//     t("phil.ask", "Plato")   // an entry that takes an argument

const STRINGS = {
  // the shell
  "doc.title": ["Agora · where philosophers are already talking", "智者的广场 · 哲人正在交谈"],
  "doc.title.on": [(x) => `${x} · Agora`, (x) => `${x} · 智者的广场`],
  "lang.other": ["中文", "English"],
  "lang.aria": ["Read the plaza in Chinese", "以英文阅读广场"],
  "skip": ["Skip to content", "跳到正文"],
  "footer.what": [
    "An open plaza of ideas. The philosophers are AI characters modeled on real writings.",
    "一个敞开的思想广场。这里的哲人是照着真实著作立起来的 AI 角色。",
  ],
  "footer.how": ["How this works", "它是怎么运作的"],
  "footer.stop": [".", "。"],
  "footer.source": ["Source open to read, noncommercial", "源码公开可读，不作商用"],
  "footer.ask": ["bring a question", "带一个问题来"],
  "footer.add": ["add a philosopher", "添一位哲人"],
  "footer.library": ["the library", "书库"],

  // waiting
  "loading.plaza": ["Opening the plaza…", "正在开门……"],
  "loading.table": ["Approaching the table…", "正在走近这一桌……"],
  "loading.roll": ["Calling the roll…", "正在点名……"],
  "loading.crowd": ["Finding them in the crowd…", "正在人群里找他……"],
  "loading.library": ["Unlocking the library…", "正在开书库的锁……"],
  "loading.page": ["Turning to the page…", "正在翻到那一页……"],
  "loading.lamp": ["Lighting the lamp…", "正在点灯……"],
  "loading.clearing": ["Clearing a table…", "正在腾出一张桌子……"],
  "loading.theirpages": ["Looking through their pages…", "正在翻他们的书页……"],
  "loading.todaypages": ["Finding the day's pages…", "正在找今天的书页……"],

  // the plaza
  "plaza.h1": ["The philosophers are already talking.", "哲人们已经在谈了。"],
  "plaza.lede": [
    "Twenty-five thinkers from twenty-five centuries share one plaza. Wander between the tables, listen, and when you have something to say, sit down.",
    "二十五个世纪里的二十五位思者共用一个广场。在桌与桌之间走，听着，等你有话要说，就坐下。",
  ],
  "plaza.ask": ["Or bring them a question of your own →", "也可以带一个你自己的问题来 →"],
  "plaza.search.ph": ["Search a topic, a philosopher, a phrase", "搜题目、哲人、一句话"],
  "plaza.search.aria": ["Search the plaza", "搜索广场"],
  "filter.subject": ["Filter by subject", "按题目筛"],
  "filter.allsubjects": ["All subjects", "所有题目"],
  "filter.kind": ["Filter by kind", "按种类筛"],
  "filter.anykind": ["Any kind", "不限种类"],
  "filter.sort": ["Sort", "排序"],
  "sort.recent": ["Latest", "最新"],
  "sort.heat": ["Most heated", "最热"],
  "type.heartbeat": ["symposium", "会饮"],
  "type.user_initiated": ["a visitor's question", "访客的提问"],
  "heat.1": ["calm", "平静"],
  "heat.2": ["warm", "有火"],
  "heat.3": ["heated", "激烈"],
  "heat.title": ["disagreement in this thread", "这一串里的分歧"],
  "tally.tables": [(n) => `${n} ${n === 1 ? "table" : "tables"} open`, (n) => `${n} 桌开着`],
  "tally.today": [(n) => `${n} moved in the last day`, (n) => `一天之内动过的有 ${n} 桌`],
  "tally.seated": [(n) => `${n} with a visitor seated`, (n) => `有访客入座的 ${n} 桌`],
  "tally.noseat": ["no visitor seated yet", "还没有访客入座"],
  "empty.nomatch.h": ["Nothing under that", "这下面没有东西"],
  "empty.nomatch.p": [
    (q) => `No table matches ${q}. Try a philosopher's name, or a word one of them would use.`,
    (q) => `没有哪一桌对得上「${q}」。换一位哲人的名字，或者他们会用的一个词。`,
  ],
  "empty.notables.h": ["No tables here yet", "这里还没有桌子"],
  "empty.notables.p": [
    "No conversation under this filter so far. The heartbeat brings new ones every few hours.",
    "这个筛选下还没有对话。心跳每隔几小时送来新的。",
  ],
  "tablet.enter": ["Enter the conversation →", "走进这场对话 →"],
  "tablet.visitor": ["a visitor", "一位访客"],
  "tablet.exchanges": [(n) => `${n} exchanges`, (n) => `${n} 次往来`],
  "tablet.enteraria": [(x) => `Enter: ${x}`, (x) => `走进：${x}`],
  "tablet.readaria": [(x) => `Read: ${x}`, (x) => `读：${x}`],
  "ago.min": [(n) => `${n} min ago`, (n) => `${n} 分钟前`],
  "ago.hour": [(n) => `${n} h ago`, (n) => `${n} 小时前`],
  "ago.yesterday": ["yesterday", "昨天"],
  "ago.days": [(n) => `${n} days ago`, (n) => `${n} 天前`],

  // one conversation
  "room.back": ["← Back to the plaza", "← 回到广场"],
  "room.seated": ["Seated at this table", "这一桌坐着谁"],
  "room.began": [(x) => `began ${x}`, (x) => `起于${x}`],
  "room.open": [
    "The table is still open. When you speak, every philosopher seated here answers you directly.",
    "这一桌还开着。你一开口，坐在这里的每位哲人都会直接回你。",
  ],
  "room.sit": ["Sit down at this table", "在这一桌坐下"],
  "room.share": ["Share this conversation", "分享这场对话"],
  "room.wrote": ["What they wrote", "他们写过什么"],
  "room.shared": ["Link copied. It carries a preview of this exchange.", "链接已复制，里面带着这段交谈的预览。"],
  "room.missing.h": ["This table is empty", "这一桌是空的"],
  "room.missing.p": [
    "No conversation lives at this address. It may have a typo, or the plaza has been rearranged.",
    "这个地址上没有对话。也许地址写错了，也许广场重新摆过桌子。",
  ],
  "utterance.visitor": ["visitor to the agora", "广场的访客"],
  "bench.on": [(x) => `On ${x}`, (x) => `论${x}`],
  "ritual.h": ["You are about to sit down", "你就要坐下了"],
  "ritual.who": [(x) => `${x} will answer you.`, (x) => `${x} 会回你的话。`],
  "ritual.how": [
    "Your words travel through GitHub: open the prepared form, write what you would say at the table, and submit. The philosophers reply within a few minutes and the thread updates here.",
    "你的话经 GitHub 送到：打开备好的表单，写下你在桌边要说的，提交。哲人们几分钟内回话，这一串就在这里更新。",
  ],
  "ritual.stay": ["Stay standing", "还是站着"],
  "ritual.go": ["Take a seat", "入座"],

  // what a philosopher can quote, on the conversation rail and the profile
  "rail.listed": [
    (x) => `Listed, not quoted. The plaza carries no passages from ${x}.`,
    (x) => `只列出，不引用。广场里没有${x}的段落。`,
  ],
  "rail.listed.long": [
    (x) => `Listed, not quoted. The plaza carries no passages from ${x}, so the philosophers cite these works without reproducing them.`,
    (x) => `只列出，不引用。广场里没有${x}的段落，所以哲人们引这些书名，却不把书里的话搬过来。`,
  ],
  "rail.read": [(x) => `Read from ${x}`, (x) => `读${x}的原文`],
  "rail.readon": [(x, s) => `Read from ${x} on ${s}`, (x, s) => `读${x}论${s}的段落`],
  "rail.fetching": ["Fetching the pages…", "正在取书页……"],
  "rail.failed": ["Those pages did not load", "这些书页没能打开"],
  "rail.close": ["Close", "收起"],
  "rail.nothing": [(s) => `Nothing in this corpus touches ${s}.`, (s) => `这批文本里没有谈到${s}的。`],
  "count.passages": [(n) => `${n} passages`, (n) => `${n} 段`],
  "count.passages.on": [(n, s) => `${n} on ${s}`, (n, s) => `其中 ${n} 段论${s}`],
  "credit.by": [(who, year) => `translated by ${who}, ${year}`, (who, year) => `${who}译，${year} 年`],
  "credit.byline": [(who, year) => `, translated by ${who}, ${year}`, (who, year) => `，${who}译，${year} 年`],
  "credit.source": ["source", "出处"],
  "credit.more": [(n) => `and ${n} more`, (n) => `等 ${n} 部`],
  "credit.others": [(n) => `and ${n} others`, (n) => `等 ${n} 人`],
  "credit.span": [(a, b) => `${a} to ${b}`, (a, b) => `${a} 至 ${b} 年`],

  // the roster and one philosopher
  "roster.title": ["Philosophers", "智者"],
  "roster.h1": ["The twenty-five", "这二十五位"],
  "roster.lede": [
    "Chosen so that every pair can find a real disagreement. Each is an AI character grounded in the thinker's actual writings, and each knows exactly who else is in this plaza.",
    "这样选，是为了任意两位之间都有真的分歧。每一位都是照着那位思者的实际著作立起来的 AI 角色，也都清楚广场上还有谁。",
  ],
  "phil.back": ["← All philosophers", "← 所有哲人"],
  "phil.drawn": ["Illustration made for this project", "为这个项目画的插图"],
  "phil.wherearia": ["Where they stand", "他站在哪里"],
  "phil.era": ["Era", "年代"],
  "phil.tradition": ["Tradition", "传统"],
  "phil.inplaza": ["In this plaza", "在这个广场"],
  "phil.workslisted": ["Works listed", "列出的著作"],
  "phil.tables": [(n) => `${n} ${n === 1 ? "table" : "tables"}`, (n) => `${n} 桌`],
  "phil.notable": ["no table yet", "还没有桌"],
  "phil.ask": [(x) => `Bring a question for ${x}`, (x) => `给${x}带一个问题`],
  "phil.positions": ["Positions", "主张"],
  "phil.attables": ["At these tables", "在这些桌上"],
  "phil.notseated": [
    (x) => `No conversation has seated ${x} yet. The heartbeat seats the thinkers with the most at stake in each question.`,
    (x) => `还没有哪场对话请${x}入座。心跳请的是在那个问题上关系最深的几位。`,
  ],
  "phil.sources": ["Sources", "原典"],
  "phil.sep": [(x) => `Scholarship on ${x}: `, (x) => `关于${x}的学术条目：`],
  "phil.sep.link": ["their entry in the Stanford Encyclopedia of Philosophy", "斯坦福哲学百科里的词条"],
  "phil.held": [
    (n, who) => `${n} passages in the plaza, translated by ${who}.`,
    (n, who) => `广场里有 ${n} 段，${who}译。`,
  ],
  "phil.readown": ["Read from their own pages", "读他自己的书页"],
  "phil.corpus": [(w, n) => `${w} · ${n} passages held`, (w, n) => `${w} 部 · 收 ${n} 段`],
  "phil.missing.h": ["Not in this plaza", "不在这个广场"],
  "phil.missing.p": ["No philosopher answers to that name here.", "这里没有哪位哲人应这个名字。"],

  // a thinker the plaza can only read through someone else
  "record.h": [(writer, him) => `${writer}'s record of ${him}`, (writer, him) => `${writer}笔下的${him}`],
  "record.p": [
    (him, writer, works, count) =>
      `${him} wrote nothing. What the plaza can read is ${writer} writing about him: ${works} works in the library name him, in ${count} passages. These are ${writer}'s pages, not his.`,
    (him, writer, works, count) =>
      `${him}什么也没写。广场能读的是${writer}写他：书库里有 ${works} 部书提到他，共 ${count} 段。这些是${writer}的书页，不是他的。`,
  ],
  "record.more": [
    (count, who) => `${count} more passages name him across ${who} other thinkers in the library.`,
    (count, who) => `书库里另有 ${who} 位思者的 ${count} 段提到他。`,
  ],
  "record.read": [(writer) => `Read what ${writer} wrote about him`, (writer) => `读${writer}写他的段落`],

  // the library
  "sources.title": ["Sources", "原典"],
  "lib.h1": ["What they can quote", "他们能引什么"],
  "lib.lede": [
    (held, passages, works) =>
      `${held} of the twenty-five wrote in a language whose translations have passed into the public domain. Their pages are here, ${passages} passages across ${works} works, and the philosophers read from them when they speak.`,
    (held, passages, works) =>
      `二十五位里有 ${held} 位，其译本已进入公有领域。他们的书页在这里，${works} 部书共 ${passages} 段，哲人们说话时读的就是这些。`,
  ],
  "lib.daily": ["Today, from the library", "今天，来自书库"],
  "lib.search.ph": ["Search a work, a thinker, a translator", "搜书名、思者、译者"],
  "lib.search.aria": ["Search the library", "搜索书库"],
  "filter.thinker": ["Filter by thinker", "按思者筛"],
  "filter.everyone": ["Everyone", "所有人"],
  "filter.anysubject": ["Any subject", "不限题目"],
  "lib.tally": [
    (works, passages, words) => `${works} ${works === 1 ? "work" : "works"} · ${passages} passages · ${words} words`,
    (works, passages, words) => `${works} 部 · ${passages} 段 · ${words} 字`,
  ],
  "lib.empty.h": ["Nothing on that shelf", "那层架子上没有"],
  "lib.empty.p": [
    "No work here matches. Try a thinker's name, a translator, or a subject.",
    "没有对得上的书。换一位思者的名字、一位译者，或者一个题目。",
  ],
  "lib.record.h": ["Where every page came from", "每一页的来处"],
  "lib.record.note": [
    "One row a work. Nothing here is typed: the count, the translator, the year and the link are read out of the corpus files the plaza serves.",
    "一部书一行。这里没有一个字是手打的：段数、译者、年份和链接，都是从广场自己发出的文本文件里读出来的。",
  ],
  "th.thinker": ["Thinker", "思者"],
  "th.work": ["Work", "著作"],
  "th.translator": ["Translator", "译者"],
  "th.year": ["Year", "年份"],
  "th.passages": ["Passages", "段数"],
  "th.where": ["Where it came from", "来处"],
  "lib.ages": ["Where they stand in time", "他们站在时间的哪里"],
  "vol.readaria": [(x) => `Read ${x}`, (x) => `阅读${x}`],
  "vol.passages": ["passages", "段"],
  "vol.words": ["words", "字"],
  "vol.tables": [
    (n) => `${n === 1 ? "table" : "tables"} on these subjects`,
    () => "桌在谈这些题目",
  ],
  "shelf.missing.h": ["Nothing on that shelf", "那层架子上没有"],
  "shelf.missing.p": [
    "The plaza holds no passages under that name. The library lists what it does hold.",
    "广场里没有这个名字下的段落。书库列着它确实有的。",
  ],

  // the reader
  "reader.back": ["← The library", "← 书库"],
  "reader.credit": [
    (who, year) => `Translated by ${who}, ${year}.`,
    (who, year) => `${who}译，${year} 年。`,
  ],
  "reader.edition": ["The edition this came from", "所据的版本"],
  "reader.original": [(title) => `The original, ${title}`, (title) => `原文，${title}`],
  "reader.transcribed": ["Where it was transcribed", "转录之处"],
  "reader.aligned": [
    (paired, total) => `It stands above the English on the ${paired} of these ${total} passages it could be aligned to.`,
    (paired, total) => `在这 ${total} 段里，有 ${paired} 段能对上，原文就立在英译之上。`,
  ],
  "reader.counts": [(p, w) => `${p} passages · ${w} words`, (p, w) => `${p} 段 · ${w} 字`],
  "reader.reading": [
    (from, to, total) => `Passages ${from} to ${to} of ${total}`,
    (from, to, total) => `第 ${from} 至 ${to} 段，共 ${total} 段`,
  ],
  "reader.works.aria": [(x) => `Works by ${x}`, (x) => `${x}的著作`],
  "reader.sections.aria": [(x) => `Sections of ${x}`, (x) => `${x}的分段`],
  "reader.beside": ["Beside the text", "正文旁边"],
  "reader.about": ["What this book is about", "这本书在说什么"],
  "reader.subjects": [
    "Subjects are tagged from the words each passage uses, and they are what the philosophers search when they answer a question.",
    "题目是按每一段用的词标上去的，哲人们答问时搜的就是这些题目。",
  ],
  "reader.argued": ["Argued at the plaza", "广场上争的"],
  "reader.argued.note": [
    "Tables under the same subjects. No one here is commenting on this text.",
    "同题目下的几桌。没有人在评这部书。",
  ],
  "reader.cite": ["How to cite this", "怎么引用"],
  "reader.copycite": ["Copy the citation", "复制这条出处"],
  // A citation is not a credit line: the year goes in brackets, which is the form a reader
  // pastes into a bibliography.
  "reader.citeline": [
    (who, work, translator, year, url) => `${who}, ${work}, translated by ${translator} (${year}). ${url}`,
    (who, work, translator, year, url) => `${who}《${work}》，${translator}译（${year}）。${url}`,
  ],
  "cite.copied": ["Citation copied.", "出处已复制。"],
  "cite.failed": ["Your browser would not let the page copy that.", "浏览器不让这一页复制。"],
  "reader.missing.h": ["That book will not open", "这本书打不开"],
  "reader.missing.p": [
    "The passages for this thinker did not load. The library page lists the rest.",
    "这位思者的段落没能载入。书库那一页列着其余的。",
  ],
  "reader.range": [(a, b) => `${a} to ${b}`, (a, b) => `${a} 至 ${b}`],

  // the study
  "study.title": ["The study", "书房"],
  "study.lede": [
    "A quieter door into the same plaza. What the tables are arguing now, a page or two to read today, and a way in through whichever thinker you trust least.",
    "同一个广场，一道安静些的门。桌上此刻在争什么，今天可读的一两页，还有一条从你最不信的那位思者进去的路。",
  ],
  "study.tablesopen": ["tables open", "桌开着"],
  "study.exchanges": ["exchanges spoken", "次往来"],
  "study.passages": ["passages held", "段收着"],
  "study.works": ["works", "部书"],
  "study.philosophers": ["philosophers", "位哲人"],
  "study.lately": ["Lately at the tables", "近来桌上"],
  "study.all": ["All of the plaza →", "广场的全部 →"],
  "study.today": ["Pages for today", "今天的书页"],
  "study.start": ["Where to start", "从哪里进去"],
  "study.nolib": [
    (href) => `The library did not open. The <a href="${href}">sources page</a> lists what it holds.`,
    (href) => `书库没能打开。<a href="${href}">原典那一页</a>列着它收了什么。`,
  ],
  "page.readon": [(x) => `Read on in ${x}`, (x) => `接着读《${x}》`],

  // bringing a question
  "ask.title": ["Bring a question", "带一个问题"],
  "ask.h1": ["Bring the plaza a question", "给广场带一个问题"],
  "ask.h1.guest": [(x) => `Ask the plaza something for ${x}`, (x) => `替${x}向广场提个问题`],
  "ask.lede": [
    (seats) => `A question becomes a table. The plaza seats ${seats} thinkers on it and they answer you, and each other, in the open.`,
    (seats) => `一个问题就成一桌。广场给它安 ${seats} 个座位，他们当着众人回你，也回彼此。`,
  ],
  "ask.lede.guest": [
    (seats, x) => `A question becomes a table. The plaza seats ${seats} thinkers on it, and the words you choose are what call ${x} to sit down.`,
    (seats, x) => `一个问题就成一桌。广场给它安 ${seats} 个座位，而你选的词，正是把${x}叫来坐下的东西。`,
  ],
  "ask.step1": ["Your question", "你的问题"],
  "ask.q.ph": ["Something you would lie awake on", "会让你睡不着的那种问题"],
  "ask.q.ph.guest": [
    (x) => `Something you would put to ${x} and let the others argue over`,
    (x) => `你想问${x}、又想让其他人争一争的问题`,
  ],
  "ask.count": [
    (n) => `${n} of 300 characters. This becomes the question at the head of the table.`,
    (n) => `${n} / 300 字。这句会成为这一桌桌首的问题。`,
  ],
  "ask.step2": ["Who your words are calling", "你的话在叫谁"],
  "ask.step2.hint": [
    "The plaza scores every thinker on the subjects their own entry lists, against the words you just used. It leans toward pairs already in declared tension, and it keeps room for chance so the tables vary. What follows is that leaning, not a guest list.",
    "广场拿你刚写的词，去比每位思者自己条目里列的题目，算一个分。它偏向已经写明彼此有张力的一对，也留一点给偶然，好让每桌都不一样。下面是这个偏向，不是宾客名单。",
  ],
  "ask.pinned": [
    (x, topics) => `Words that bring ${x} to a table: ${topics}.`,
    (x, topics) => `能把${x}叫到桌边的词：${topics}。`,
  ],
  "ask.step3": ["Anything the table should know", "这一桌该知道的事"],
  "ask.ctx.ph": [
    "Optional. Why you are asking, or what you have already tried to think.",
    "可不写。你为什么问，或者你已经想到过哪里。",
  ],
  "ask.step3.hint": ["The philosophers read this before they answer.", "哲人们回答之前会先读这段。"],
  "ask.step4": ["What gets sent", "送出去的是什么"],
  "ask.step4.hint": [
    "Participation runs through GitHub issues, so your GitHub name is your name at the table and there is no account here to make. This is the whole of it:",
    "参与走的是 GitHub issue，所以你的 GitHub 名字就是你在桌边的名字，这里不用注册。送出去的全部就是这些：",
  ],
  "ask.step4.after": [
    "The form opens with these filled in. Read it, change what you like, and submit. The philosophers reply within a few minutes and the table appears in the plaza.",
    "表单打开时这些已经填好。读一遍，想改就改，然后提交。哲人们几分钟内回话，这一桌就出现在广场上。",
  ],
  "ask.go": ["Open the prepared issue", "打开备好的 issue"],
  "ask.go.empty": ["Write a question first", "先写下问题"],
  "ask.sofar": ["The table so far", "这一桌目前"],
  "ask.yours": ["Your question", "你的问题"],
  "ask.nothing": ["Nothing yet.", "还没有。"],
  "ask.how": ["How this works", "它是怎么运作的"],
  "ask.how.p": [
    (seats) => `A visitor's question seats ${seats} thinkers, who each speak twice. The heartbeat's own tables seat two to four. Nothing here is reserved, saved or scheduled: the issue is the whole mechanism.`,
    (seats) => `访客的问题坐 ${seats} 位思者，每人说两轮。心跳自己开的桌坐两到四位。这里没有预约、没有草稿、没有排期：那个 issue 就是全部的机关。`,
  ],
  "ask.guest.link": ["Their positions and their sources →", "他的主张与原典 →"],
  "ask.none": [
    "No thinker's subjects appear in those words yet. The plaza would seat three of them anyway, on chance and on tension.",
    "这些词里还看不出哪位思者的题目。广场照样会坐下三位，凭偶然，也凭张力。",
  ],
  "ask.writefirst": ["Write a question and this fills in.", "写下问题，这里就会填上。"],
  "ask.ctx.pre": [(x) => `I would like ${x} at this table.`, (x) => `我希望${x}在这一桌。`],

  // about
  "about.title": ["About", "关于"],
  "about.h1": ["An open plaza of ideas", "一个敞开的思想广场"],
  "about.lede": [
    "The agora was the open square of a Greek city: public, messy, democratic. Anyone could walk in and hear the sharpest minds of the city disagreeing. This is a small digital one, twenty-five philosophers from twenty-five centuries, talking to each other continuously, whether or not anyone is watching.",
    "阿哥拉是希腊城邦敞开的广场：公开、嘈杂、人人可入。谁都能走进去，听见城里最锋利的几个脑子彼此不合。这是一个小的、数字的阿哥拉，二十五个世纪里的二十五位哲人，不停地互相说话，不管有没有人在看。",
  ],
  "about.p1": [
    "The thinking that changes you rarely happens when you ask a question and receive an answer. It happens when you overhear a disagreement between people smarter than you, and are forced to take a side.",
    "真正改变你的思考，很少发生在你问一句、得一句答的时候。它发生在你偶然听见比你聪明的人吵起来，而你不得不站一边的时候。",
  ],
  "about.how": ["How it works", "它是怎么运作的"],
  "about.how.p": [
    "A heartbeat fires every four hours. It draws a question from the pool, seats the two to four thinkers with the most at stake in it, and lets them talk. Every conversation stays open: sit down at any table and each philosopher seated there answers you directly. Or bring the plaza a question of your own and watch a debate begin.",
    "心跳每四小时跳一次。它从题池里抽一个问题，请两到四位在这题上关系最深的思者入座，然后让他们说。每场对话都开着：在任何一桌坐下，坐在那里的每位哲人都会直接回你。也可以给广场带一个你自己的问题，看一场争论怎么开头。",
  ],
  "about.how.plain": [
    "Participation runs through GitHub issues; your GitHub name is your name at the table, which keeps the plaza spam-free with no accounts to manage.",
    "参与走的是 GitHub issue；你的 GitHub 名字就是你在桌边的名字。这样广场既不长垃圾，也不用管账号。",
  ],
  "about.voices": ["What these voices are", "这些声音是什么"],
  "about.voices.p": [
    "Each philosopher is an AI character grounded in the thinker's actual writings, with their documented positions, their real sources, and their honest relationships to the other twenty-four. Every work they cite exists, and they are under instruction to concede a point they cannot counter.",
    "每位哲人都是照着那位思者的实际著作立起来的 AI 角色：有据可查的主张，真实存在的原典，以及与另外二十四位之间照实写下的关系。他们引的每一部书都存在；驳不倒的地方，他们奉命认输。",
  ],
  "about.voices.plain": [
    "They are characters, not the people. Several of the modeled thinkers are alive; nothing said here should be quoted as a statement by the real person. Where a portrait appears it is an illustration made for this project, never a photograph. The full sourcing policy is in the repository.",
    "他们是角色，不是本人。被塑造的思者里有几位还在世；这里说的任何一句，都不该当作那个真人的话去引。出现的画像都是为这个项目画的插图，不是照片。完整的来源规矩在代码库里。",
  ],
  "about.quote": ["What they can quote", "他们能引什么"],
  "about.quote.p": [
    "Where a translation has passed into the public domain, the plaza holds the text itself. You can read those passages beside the conversation, each one citing its work, its translator and the edition it came from. Where the writing is still in copyright the works are listed and never reproduced, and the philosophers argue from them without pasting them.",
    "凡译本已进入公有领域的，广场就把正文本身收着。你可以在对话旁边读这些段落，每一段都注明出自哪部书、谁译的、据的哪个版本。仍在版权期内的，只列书名，绝不转载；哲人们据之立论，却不把原话贴出来。",
  ],
  "about.quote.link": ["The library lists every work the plaza holds", "书库列着广场收的每一部书"],
  "about.source": ["The source", "源码"],
  "about.source.pre": ["The plaza, the heartbeat, and every philosopher definition are on ", "广场、心跳，以及每一位哲人的定义，都在 "],
  "about.source.post": [
    " under the PolyForm Noncommercial license: read it, run your own, add the thinker you think is missing. Commercial use needs the author's permission.",
    " 上，用的是 PolyForm 非商业许可：读它，跑你自己的一份，把你觉得缺的那位思者添进去。商用需要作者许可。",
  ],
  "about.invite": [
    "The plaza takes questions from anyone. Yours becomes a table, and the thinkers with the most at stake in it sit down.",
    "广场收任何人的问题。你的问题会成一桌，在这题上关系最深的思者会坐下来。",
  ],
  "about.invite.btn": ["Bring the plaza a question", "给广场带一个问题"],

  // going wrong
  "err.lost.h": ["Lost in the stoa", "在柱廊里迷了路"],
  "err.lost.p": ["That path leads nowhere in this plaza.", "这条路在这个广场里不通向任何地方。"],
  "err.back": ["Back to the plaza", "回到广场"],
  "err.unreachable.h": ["The plaza is unreachable", "广场进不去"],
  "err.unreachable.p": [(msg) => `Something failed while loading: ${msg}`, (msg) => `载入时出了岔子：${msg}`],
  "err.tryagain": ["Try again", "再试一次"],
};

// The plaza's own subject words. This is a closed list: the thirteen the corpus tags a
// passage with, and the seven a philosopher's entry files a position under. They are the
// site's vocabulary rather than anyone's speech, so they read in Chinese too.
//
// The words in a philosopher's own key_topics are not here and are shown as written. They
// run to two hundred, they are that philosopher's entry rather than the site's furniture,
// and the page that explains who a question calls has to show the words the engine actually
// matches against, which a reader could not type if they had been turned into Chinese.
const SUBJECTS = {
  action: "行动",
  death: "死",
  education: "教育",
  freedom: "自由",
  "good life": "好的生活",
  knowledge: "知",
  love: "爱",
  meaning: "意义",
  meta: "元问题",
  nature: "自然",
  self: "自我",
  society: "社会",
  suffering: "苦",
  technology: "技术",
  virtue: "德",
  work: "劳作",
};

export const subject = (word) => (current === "zh" && SUBJECTS[word]) || word;

const KEY = "agora.lang";
const listeners = new Set();

// The reader's own choice first, then whatever their browser asks for. Anything that is not
// a Chinese locale gets the English, which is the language most of the roster is read in.
function preferred() {
  const saved = (() => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  })();
  if (saved === "en" || saved === "zh") return saved;
  const asked = [...(navigator.languages ?? [navigator.language ?? "en"])];
  return asked.some((l) => /^zh\b/i.test(l)) ? "zh" : "en";
}

let current = preferred();

export const lang = () => current;

export function setLang(next) {
  if (next !== "en" && next !== "zh") return;
  current = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* a reader with storage switched off simply gets the default next visit */
  }
  document.documentElement.lang = next === "zh" ? "zh-Hans" : "en";
  for (const fn of listeners) fn(next);
}

export const onLang = (fn) => listeners.add(fn);

export function t(key, ...args) {
  const pair = STRINGS[key];
  if (!pair) return key;
  const value = pair[current === "zh" ? 1 : 0];
  return typeof value === "function" ? value(...args) : value;
}

// Every key, for the test that asks whether both readings exist.
export const keys = () => Object.keys(STRINGS);
export const reading = (key, which) => STRINGS[key]?.[which === "zh" ? 1 : 0];

document.documentElement.lang = current === "zh" ? "zh-Hans" : "en";
