import fs from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { authorSvg, coverSvg } from "@/lib/cover-art";
import { nowIso, slugify } from "@/lib/format";

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function daysAhead(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString();
}

export function seedContent(db: DatabaseSync) {
  const mediaDir = path.join(process.cwd(), "data", "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  const now = nowIso();

  const authors = [
    {
      id: "author_laila",
      name: "ليلى عبد الرحمن",
      bio: "تكتب للأطفال ولمن يحب الخيال الهادئ. قضت سنوات في ورش القراءة، وتفضّل الجملة القصيرة التي تترك مكانًا للخيال.",
    },
    {
      id: "author_sami",
      name: "سامي النجار",
      bio: "يحكي عن الأحياء والطرق والخرائط. شخصياته تمشي كثيرًا، وتجد القصة في منعطف لم تكن تقصده.",
    },
    {
      id: "author_huda",
      name: "هدى القاسم",
      bio: "تكتب القصص القصيرة وحواديت ما قبل النوم. تحب الإيقاع البطيء، والمطر، والنوافذ المواربة.",
    },
    {
      id: "author_kareem",
      name: "كريم فواز",
      bio: "يصنع قصصًا تتعلم فيها الشخصية شيئًا من غير أن تتحول الحكاية إلى درس جاف.",
    },
    {
      id: "author_noura",
      name: "نورا الحسن",
      bio: "تكتب عن البيوت والمطابخ والزيارات. عندها العائلة مكان للقصة، لا خلفية لها.",
    },
  ];

  const categories = [
    { id: "cat_kids", name: "قصص للأطفال", description: "حكايات قصيرة تُقرأ معًا، بلغة واضحة وصور هادئة.", icon: "leaf", color: "#D7E3D4", order: 1, featured: 1 },
    { id: "cat_short", name: "قصص قصيرة", description: "نصوص موجزة تُقرأ في جلسة واحدة.", icon: "book", color: "#F3E4E1", order: 2, featured: 1 },
    { id: "cat_novels", name: "روايات", description: "بدايات روايات يمكن الدخول إليها بهدوء.", icon: "book", color: "#D5E0E8", order: 3, featured: 0 },
    { id: "cat_bed", name: "قصص قبل النوم", description: "نبرة منخفضة، ونهاية لا تترك الباب مفتوحًا على قلق.", icon: "moon", color: "#EEDCEE", order: 4, featured: 1 },
    { id: "cat_learn", name: "قصص تعليمية", description: "معرفة صغيرة داخل حكاية، من غير صوت الموعظة.", icon: "star", color: "#F4EFE6", order: 5, featured: 0 },
    { id: "cat_fantasy", name: "قصص خيالية", description: "عوالم قريبة من البيت: أدراج، سجاد، ومكتبات تتأخر في الإغلاق.", icon: "spark", color: "#E8E0D4", order: 6, featured: 1 },
    { id: "cat_adv", name: "مغامرات", description: "طرق، خرائط، وصناديق تُفتح ببطء.", icon: "compass", color: "#E6E2DE", order: 7, featured: 0 },
    { id: "cat_family", name: "قصص عائلية", description: "جدات، مطابخ، وأسئلة تُسأل على مائدة الجمعة.", icon: "family", color: "#F3E4E1", order: 8, featured: 0 },
  ];

  const stories = [
    {
      id: "story_pen",
      title: "القلم الذي اختار قصة",
      author: "author_laila",
      short: "قلم قديم في درج المعلمة يرفض أن يكتب تمرينًا، ويصرّ أن يكتب حكاية عن طفل ينتظر دوره.",
      full: "في درج المكتب قلم قصير لم يعد أحد يستخدمه. حين أمسكت به ليلى كتب جملة واحدة ثم توقف: أريد قصة، لا تمرينًا.\n\nأخذته معها إلى الحديقة. كلما رأت عصفورًا أو بابًا أحمر أضاف القلم سطرًا. وفي آخر النهار صارت الحكاية عن طفل ينتظر دوره بهدوء، لأن الانتظار أيضًا يمكن أن يكون بداية.",
      categories: ["cat_kids", "cat_fantasy"],
      tags: ["أقلام", "خيال", "أطفال"],
      age: [4, 8],
      type: "قصة قصيرة",
      genre: "خيال لطيف",
      minutes: 6,
      featured: 1,
      pick: 1,
      priority: 80,
      days: 2,
      narrator: "",
      series: "",
      episode: null,
    },
    {
      id: "story_cloud",
      title: "نافذة الغيم",
      author: "author_huda",
      short: "قبل النوم تفتح سارة النافذة قليلًا، وتحكي للغيم ما حدث في يومها بصوت منخفض.",
      full: "لم تكن سارة تحب إغلاق الستارة بالكامل. تترك شبرًا للغيم، وتعدّ له ثلاثة أشياء حصلت اليوم: ضحكة، خطأ صغير، وشيء لذيذ.\n\nالغيم لا يجيب، وهذا جزء من الاتفاق. حين تفرغ القائمة يمرّ بطيئًا، وتفهم أن اليوم انتهى من غير أن يضيع.",
      categories: ["cat_bed", "cat_kids"],
      tags: ["نوم", "غيم", "ليل"],
      age: [3, 7],
      type: "قصة قبل النوم",
      genre: "هدوء",
      minutes: 5,
      featured: 1,
      pick: 0,
      priority: 60,
      days: 4,
      narrator: "هدى القاسم",
      series: "",
      episode: null,
    },
    {
      id: "story_map",
      title: "خريطة الحيّ",
      author: "author_sami",
      short: "يرسم سامي خريطة للحي لا تشبه خرائط المدرسة: فيها المقعد المكسور، والقط، والمنعطف الذي يغيّر المزاج.",
      full: "طلب المعلم خريطة للطريق من البيت إلى المدرسة. رسم سامي الشارع، ثم أضاف أشياء لا تُقاس بالمسطرة: المكان الذي يبطئ فيه المطر، والباب الأخضر الذي تفوح منه رائحة خبز.\n\nضحكت المعلمة أولًا، ثم علّقت الخريطة. صار الأطفال يمشون في اليوم التالي وهم يبحثون عن التفاصيل التي كانت موجودة طول الوقت.",
      categories: ["cat_adv", "cat_kids"],
      tags: ["خرائط", "حي", "مشي"],
      age: [6, 10],
      type: "مغامرة",
      genre: "مكان",
      minutes: 8,
      featured: 0,
      pick: 1,
      priority: 70,
      days: 6,
      narrator: "",
      series: "",
      episode: null,
    },
    {
      id: "story_grandma",
      title: "سؤال الجدة",
      author: "author_noura",
      short: "تسأل الجدة سؤالًا واحدًا كل جمعة، والجواب يغيّر شكل المائدة أكثر من الطعام.",
      full: "السؤال لا يتكرر. مرة كان: ما الشيء الذي تودّ أن يعرفه أحد عنك من غير أن تقوله؟ صمت الجميع وقتًا كافيًا ليبرد الشاي.\n\nثم تكلمت البنت الصغيرة عن رسمة أخفتها. لم تصبح الجلسة أسهل، لكنها أصبحت أصدق. ومنذ ذلك الأسبوع صارت المائدة تبدأ بالسؤال لا بالخبز.",
      categories: ["cat_family"],
      tags: ["جدة", "عائلة", "جمعة"],
      age: [7, 12],
      type: "قصة عائلية",
      genre: "بيت",
      minutes: 7,
      featured: 0,
      pick: 0,
      priority: 40,
      days: 9,
      narrator: "",
      series: "",
      episode: null,
    },
    {
      id: "story_river",
      title: "النهر الذي تعلم الصبر",
      author: "author_kareem",
      short: "يريد النهر أن يصل إلى البحر اليوم، فيتعلم من الحجر أن السرعة ليست الطريقة الوحيدة.",
      full: "كان النهر يضيق حين يعترضه حجر. يدور، ويغضب، ويعود. قال له الحجر: أنا هنا منذ وقت طويل، وأنت تصل دائمًا، لكن ليس في اللحظة التي تختارها.\n\nفي اليوم التالي صار النهر يترك رغوة صغيرة عند كل حجر، كأنه يسلّم. ولم يتأخر عن البحر. فقط وصل وهو أقل ضجيجًا.",
      categories: ["cat_learn", "cat_kids"],
      tags: ["نهر", "صبر", "طبيعة"],
      age: [5, 9],
      type: "قصة تعليمية",
      genre: "طبيعة",
      minutes: 6,
      featured: 0,
      pick: 0,
      priority: 50,
      days: 12,
      narrator: "",
      series: "",
      episode: null,
    },
    {
      id: "story_library",
      title: "مكتبة منتصف الليل",
      author: "author_laila",
      short: "تبقى مكتبة الحي مضاءة بعد الإغلاق لساعة واحدة، ولا يدخلها إلا من يحمل سؤالًا لا يعرف كيف يسأله.",
      full: "وجد كريم ورقة على الباب: إن ضاع منك اسم الكتاب، تعال حين تسكت الشوارع. دخل والمكتبة خالية إلا من أمينة تعرف الرفوف بأسمائها.\n\nلم يختر كتابًا. جلس ووصف الشعور: شيء بين الخوف والفضول. أخرجت له ثلاثة كتب رفيعة وقالت: ابدأ بالذي لا يطلب منك أن تكون شجاعًا فورًا.",
      categories: ["cat_fantasy", "cat_short"],
      tags: ["مكتبة", "ليل", "كتب"],
      age: [9, 14],
      type: "قصة قصيرة",
      genre: "خيال هادئ",
      minutes: 11,
      featured: 1,
      pick: 1,
      priority: 90,
      days: 3,
      narrator: "",
      series: "",
      episode: null,
    },
    {
      id: "story_letter",
      title: "رسالة لم تُرسل",
      author: "author_huda",
      short: "تكتب هدى رسالة إلى صديقة انتقلت إلى مدينة أخرى، ثم تتركها في الدرج لأن الجملة الأخيرة لم تنضج.",
      full: "الرسالة قصيرة عن الشباك والمطر وكرسي المطبخ. الجملة الأخيرة كانت ستقول: أشتاق إليك. بدت أكبر من الورقة.\n\nفي الصباح أضافت سطرًا أصغر: المقعد الذي تجلسين عليه ما زال يصرّ. أرسلتها. الوصول لم يكن المهم. المهم أن الجملة وجدت حجمها.",
      categories: ["cat_short"],
      tags: ["رسائل", "صداقة", "مدن"],
      age: [13, 18],
      type: "قصة قصيرة",
      genre: "وجدان",
      minutes: 9,
      featured: 0,
      pick: 0,
      priority: 55,
      days: 8,
      narrator: "",
      series: "",
      episode: null,
    },
    {
      id: "story_jasmine",
      title: "بيت الياسمين",
      author: "author_noura",
      short: "تعود عائلة إلى بيت قديم تفوح منه رائحة ياسمين، وتكتشف أن الغرف تحفظ نبرات الصوت أكثر من الأثاث.",
      full: "الباب احتاج كتفين. الداخل كان أضيق مما تذكره الأم، وأوسع مما توقعته الابنة. في المطبخ علبة شاي لم تُفتح، وعلى الجدار علامة قلم عند طول طفل.\n\nهذه بداية رواية عن العودة: ليس إلى الماضي كما كان، بل إلى بيت يمكن ترتيب غرفه من جديد. الفصل الأول ينتهي حين يقررون النوم فيه ليلة واحدة فقط، ويعرف القارئ أنهم سيبقون.",
      categories: ["cat_novels", "cat_family"],
      tags: ["بيت", "عودة", "ياسمين"],
      age: [14, 99],
      type: "رواية",
      genre: "عائلي",
      minutes: 25,
      featured: 1,
      pick: 0,
      priority: 75,
      days: 15,
      narrator: "",
      series: "بيت الياسمين",
      episode: 1,
    },
    {
      id: "story_box",
      title: "سرّ الصندوق الأزرق",
      author: "author_sami",
      short: "صندوق أزرق تحت السرير لا يُقفل بمفتاح، بل بسؤال يجب أن يُجاب عنه بصوت عالٍ.",
      full: "وجد مازن الصندوق بعد أن تدحرجت كرة تحت السرير. على الغطاء جملة: قل شيئًا لم تقله اليوم. جرّب «أنا جائع» فلم ينفتح.\n\nقال بعد تردد: خفت أن أضيع في الرحلة ولم أخبر أحدًا. انفتح الصندوق على خريطة صغيرة للحي، مرسومة بخط أبيه. المغامرة لم تكن بعيدًا. كانت تحت السرير، وتنتظر جملة صادقة.",
      categories: ["cat_adv", "cat_kids"],
      tags: ["صندوق", "سر", "خريطة"],
      age: [6, 10],
      type: "مغامرة",
      genre: "اكتشاف",
      minutes: 8,
      featured: 0,
      pick: 0,
      priority: 45,
      days: 11,
      narrator: "",
      series: "",
      episode: null,
    },
    {
      id: "story_rain",
      title: "أغنية المطر",
      author: "author_huda",
      short: "حين يبدأ المطر، تخفض الجدة الراديو وتترك النافذة تؤدي الأغنية بدلًا منه.",
      full: "تعرف الجدة أن بعض الليالي لا تحتاج حكاية طويلة. تطفئ المصباح القريب، وتُبقي مصباح الممر. المطر يرتب الإيقاع، والطفل يعدّ أربع قطرات ثم ينام في الخامسة.\n\nإذا توقف المطر فجأة تكمل الجدة النغمة بهمهمة قصيرة. لا كلمات. فقط ما يكفي حتى يعود النوم إلى مكانه.",
      categories: ["cat_bed"],
      tags: ["مطر", "نوم", "جدة"],
      age: [3, 6],
      type: "قصة قبل النوم",
      genre: "هدوء",
      minutes: 4,
      featured: 0,
      pick: 1,
      priority: 65,
      days: 1,
      narrator: "هدى القاسم",
      series: "",
      episode: null,
    },
    {
      id: "story_carpet",
      title: "عالم تحت السجادة",
      author: "author_laila",
      short: "يرفع طفل طرف السجادة فيجد ممرًا ضيقًا يؤدي إلى غرفة تُحفظ فيها الأشياء الضائعة اللطيفة.",
      full: "ليست كل الأشياء الضائعة حزينة. تحت السجادة غرفة للجوارب التي اختارت السفر، وللأقلام التي ملت من الخط المستقيم.\n\nيقضي الطفل عصره هناك ويعود قبل المغرب. لا يحضر معه إلا فكرة: بعض الضياع مرتب، ويمكن زيارته من غير أن نخاف.",
      categories: ["cat_fantasy", "cat_kids"],
      tags: ["سجادة", "خيال", "بيت"],
      age: [5, 9],
      type: "قصة خيالية",
      genre: "خيال لطيف",
      minutes: 7,
      featured: 0,
      pick: 0,
      priority: 35,
      days: 18,
      narrator: "",
      series: "تحت السجادة",
      episode: 1,
    },
    {
      id: "story_sketch",
      title: "دفتر الرسوم",
      author: "author_kareem",
      short: "دفتر رسم يتسع لخطأ واحد كل يوم، والخطأ هو الذي يعلّم الصفحة التالية.",
      full: "اشترطت المعلمة أن يبقى الخطأ ظاهرًا. لا ممحاة. في اليوم الأول رسمت سلمى دائرة تشبه البيضة، وغضبت. في اليوم الثالث صارت البيضة طائرًا لأن الخط المائل لم يُمسح.\n\nفي آخر الأسبوع فهمت أن الدفتر ليس للحكم على الرسم. هو مكان ترى فيه كيف تغيّر رأيها. وهذا يكفي لقصة عن التعلم.",
      categories: ["cat_learn", "cat_kids"],
      tags: ["رسم", "تعلم", "دفتر"],
      age: [5, 8],
      type: "قصة تعليمية",
      genre: "معرفة",
      minutes: 6,
      featured: 0,
      pick: 0,
      priority: 30,
      days: 20,
      narrator: "",
      series: "",
      episode: null,
    },
    {
      id: "story_sea",
      title: "الطريق إلى البحر",
      author: "author_sami",
      short: "ثلاثة أصدقاء يمشون إلى البحر من غير هاتف، ويعتمدون على رائحة الملح وعلى بائع يصف المنعطف الأخير.",
      full: "الاتفاق كان أن يسألوا شخصًا واحدًا فقط إذا تاهوا. سألوا بائع بطيخ. قال: إذا صارت الظلال أقصر منكم، فأنتم قريبون. لم تكن جملة خريطة، لكنها ضبطت المزاج.\n\nوصلوا والبحر أهدأ مما في الصور. جلسوا من غير أن يصوروا. القصة عن المشي، وعن أن الوصول يمكن أن يكون أقل ضجيجًا من الطريق.",
      categories: ["cat_adv"],
      tags: ["بحر", "أصدقاء", "طريق"],
      age: [8, 12],
      type: "مغامرة",
      genre: "رحلة",
      minutes: 10,
      featured: 1,
      pick: 0,
      priority: 48,
      days: 7,
      narrator: "",
      series: "",
      episode: null,
    },
    {
      id: "story_kitchen",
      title: "حكاية مطبخ الجمعة",
      author: "author_noura",
      short: "في مطبخ الجمعة لكل شخص مهمة صغيرة، والقصة تحدث بين تقطيع البصل وترتيب الملاعق.",
      full: "الأم تمسك القدر، والأب يغسل النعناع، والابنة ترتب الملاعق بعدد الضيوف ثم تزيد واحدة لمن قد يأتي بلا دعوة. هذه الزيادة عادة قديمة.\n\nيصل الضيف الزائد فعلًا: جارة تحمل طبقًا ولا تعرف أين تضعه. يُفسح لها مكان. المطبخ يعلّم العائلة أن الضيافة قرار يُتخذ قبل أن يُقرع الباب.",
      categories: ["cat_family", "cat_short"],
      tags: ["مطبخ", "جمعة", "ضيافة"],
      age: [6, 12],
      type: "قصة عائلية",
      genre: "بيت",
      minutes: 8,
      featured: 0,
      pick: 0,
      priority: 42,
      days: 14,
      narrator: "",
      series: "",
      episode: null,
    },
    {
      id: "story_light",
      title: "الضوء في آخر الدرج",
      author: "author_huda",
      short: "درج عمارة قديمة مصباحه الأخير يخفت ثم يعود، وساكن الطابق الثالث يقرر أن يفهم الإيقاع بدل أن يشتكي منه.",
      full: "المصباح لا ينطفئ تمامًا. يخفت حين يصعد أحد بسرعة، ويصفو إذا صعد ببطء. راقب الساكن ذلك أسبوعًا وكتب ملاحظة على ورقة صغيرة ألصقها قرب المفتاح: الدرج يحب الخطى الهادئة.\n\nلم تُصلح القصة الكهرباء. غيّرت طريقة الصعود. وأحيانًا هذا ما تفعله القصة القصيرة: لا تبدل المبنى، تبدل الإيقاع.",
      categories: ["cat_short"],
      tags: ["درج", "ليل", "مدينة"],
      age: [12, 18],
      type: "قصة قصيرة",
      genre: "مدينة",
      minutes: 9,
      featured: 0,
      pick: 1,
      priority: 58,
      days: 5,
      narrator: "",
      series: "",
      episode: null,
    },
    {
      id: "story_moon",
      title: "القمر يقرأ معي",
      author: "author_laila",
      short: "طفل يترك الكتاب مفتوحًا على النافذة، ويتخيل أن القمر يقرأ الصفحة التي تعب منها.",
      full: "الصفحة كانت طويلة. أغلق الطفل عينًا واحدة وطلب من القمر أن يكمل الفقرة. في الصباح وجد إشارة صغيرة من خياله: الورقة تحركت مع الهواء، وكأن القراءة استمرت.\n\nتعود الحكاية كل مساء بجملة واحدة جديدة. ليست معجزة. هي اتفاق لطيف بين قارئ متعب وضوء لا يستعجل.",
      categories: ["cat_bed", "cat_kids"],
      tags: ["قمر", "قراءة", "نوم"],
      age: [3, 7],
      type: "قصة قبل النوم",
      genre: "هدوء",
      minutes: 5,
      featured: 1,
      pick: 1,
      priority: 85,
      days: 2,
      narrator: "ليلى عبد الرحمن",
      series: "",
      episode: null,
    },
    {
      id: "story_key",
      title: "مفتاح الباب الصغير",
      author: "author_kareem",
      short: "مسودة عن مفتاح لا يفتح بابًا، بل يذكّر صاحبه بالغرفة التي أراد ترتيبها.",
      full: "هذه المسودة ما زالت تبحث عن جملتها الأخيرة. المفتاح موجود، والباب رُسم، لكن الغرفة من الداخل لم تتضح.",
      categories: ["cat_learn"],
      tags: ["مسودة", "مفتاح"],
      age: [7, 11],
      type: "قصة تعليمية",
      genre: "معرفة",
      minutes: 4,
      featured: 0,
      pick: 0,
      priority: 10,
      days: 1,
      narrator: "",
      series: "",
      episode: null,
      published: 0,
    },
    {
      id: "story_tomorrow",
      title: "رسالة الغد",
      author: "author_huda",
      short: "حكاية مجدولة تصل إلى المكتبة في موعدها، عن رسالة تُكتب اليوم وتُقرأ غدًا.",
      full: "تكتب سلمى رسالة وتضعها في مغلف مكتوب عليه: تُفتح غدًا. القصة عن الفرق بين ما نريد قوله الآن وما نحتاج أن يهدأه الليل.",
      categories: ["cat_short"],
      tags: ["رسالة", "انتظار"],
      age: [12, 18],
      type: "قصة قصيرة",
      genre: "وجدان",
      minutes: 6,
      featured: 0,
      pick: 0,
      priority: 20,
      days: 0,
      narrator: "",
      series: "",
      episode: null,
      schedule: daysAhead(3),
    },
  ];

  const related: [string, string][] = [
    ["story_pen", "story_carpet"],
    ["story_pen", "story_sketch"],
    ["story_cloud", "story_rain"],
    ["story_cloud", "story_moon"],
    ["story_map", "story_box"],
    ["story_map", "story_sea"],
    ["story_grandma", "story_kitchen"],
    ["story_grandma", "story_jasmine"],
    ["story_river", "story_sketch"],
    ["story_library", "story_light"],
    ["story_library", "story_pen"],
    ["story_letter", "story_light"],
    ["story_jasmine", "story_grandma"],
    ["story_box", "story_map"],
    ["story_rain", "story_moon"],
    ["story_carpet", "story_pen"],
    ["story_sea", "story_map"],
    ["story_kitchen", "story_grandma"],
    ["story_moon", "story_cloud"],
  ];

  db.exec("BEGIN");
  try {
    authors.forEach((author, index) => {
      const mediaId = `media_${author.id}`;
      const filename = `${mediaId}.svg`;
      fs.writeFileSync(path.join(mediaDir, filename), authorSvg(index));
      db.prepare(
        `INSERT INTO media (id, filename, mime, bytes, width, height, alt, created_at)
         VALUES (?, ?, 'image/svg+xml', ?, 400, 400, ?, ?)`,
      ).run(mediaId, filename, Buffer.byteLength(authorSvg(index)), author.name, now);
      const slug = slugify(author.name);
      db.prepare(
        `INSERT INTO authors (id, name, slug, bio, image_id, featured, is_demo, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      ).run(author.id, author.name, slug, author.bio, mediaId, index < 3 ? 1 : 0, now, now);
    });

    categories.forEach((category) => {
      db.prepare(
        `INSERT INTO categories
         (id, name, slug, description, image_id, icon, color, sort_order, published, show_on_home, show_in_nav, featured, is_demo, created_at, updated_at)
         VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 1, 1, 1, ?, 1, ?, ?)`,
      ).run(
        category.id,
        category.name,
        slugify(category.name),
        category.description,
        category.icon,
        category.color,
        category.order,
        category.featured,
        now,
        now,
      );
    });

    stories.forEach((story, index) => {
      const mediaId = `media_${story.id}`;
      const svg = coverSvg(index);
      const filename = `${mediaId}.svg`;
      fs.writeFileSync(path.join(mediaDir, filename), svg);
      db.prepare(
        `INSERT INTO media (id, filename, mime, bytes, width, height, alt, created_at)
         VALUES (?, ?, 'image/svg+xml', ?, 800, 1067, ?, ?)`,
      ).run(mediaId, filename, Buffer.byteLength(svg), story.title, now);
      const published = story.published === 0 ? 0 : 1;
      const publishAt = story.schedule ?? (published ? daysAgo(story.days) : null);
      db.prepare(
        `INSERT INTO stories (
          id, title, slug, short_description, full_description, author_id, cover_id,
          age_min, age_max, story_type, genre, reading_minutes, featured, editor_pick,
          published, publish_at, priority, view_count, favorite_count, admin_notes,
          display_order, narrator, series_name, episode_number, external_source,
          audio_url, video_url, is_demo, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, NULL, NULL, NULL, 1, ?, ?)`,
      ).run(
        story.id,
        story.title,
        slugify(story.title),
        story.short,
        story.full,
        story.author,
        mediaId,
        story.age[0],
        story.age[1],
        story.type,
        story.genre,
        story.minutes,
        story.featured,
        story.pick,
        published,
        publishAt,
        story.priority,
        "محتوى تجريبي يمكن حذفه من قائمة القصص.",
        index + 1,
        story.narrator || null,
        story.series || null,
        story.episode,
        daysAgo(story.days + 1),
        now,
      );
      story.categories.forEach((categoryId, categoryIndex) => {
        db.prepare(
          `INSERT INTO story_categories (story_id, category_id, is_primary) VALUES (?, ?, ?)`,
        ).run(story.id, categoryId, categoryIndex === 0 ? 1 : 0);
      });
      story.tags.forEach((tag) => {
        const tagId = `tag_${slugify(tag)}`;
        db.prepare(`INSERT OR IGNORE INTO tags (id, name, slug) VALUES (?, ?, ?)`).run(tagId, tag, slugify(tag));
        db.prepare(`INSERT OR IGNORE INTO story_tags (story_id, tag_id) VALUES (?, ?)`).run(story.id, tagId);
      });
    });

    related.forEach(([left, right]) => {
      db.prepare(`INSERT OR IGNORE INTO story_related (story_id, related_id) VALUES (?, ?)`).run(left, right);
    });

    const sections = [
      {
        id: "section_hero",
        type: "hero",
        title: "ترحيب",
        subtitle: "",
        mode: "manual",
        count: 1,
        layout: "grid",
        accent: "#EEDCEE",
        order: 1,
        config: {
          kicker: "منصة اكتشاف القصص",
          heroTitle: "مكان مريح تكتشف فيه قصتك القادمة.",
          heroText: "تصفّح التصنيفات، ابحث بعنوان أو مؤلف، أو ابدأ بما يبرزه يراع اليوم.",
          heroStoryId: "story_library",
        },
      },
      {
        id: "section_categories",
        type: "categories",
        title: "استكشف التصنيفات",
        subtitle: "ابدأ من نوع الحكاية.",
        mode: "automatic",
        count: 8,
        layout: "grid",
        accent: "",
        order: 2,
        config: {},
      },
      {
        id: "section_recommended",
        type: "recommended",
        title: "مقترحة لك",
        subtitle: "قصص قريبة مما قرأت وحفظت، أو مختارات دافئة إن كنت هنا أول مرة.",
        mode: "automatic",
        count: 8,
        layout: "grid",
        accent: "#E8E0D4",
        order: 3,
        config: {},
      },
      {
        id: "section_popular",
        type: "popular",
        title: "الأكثر رواجًا",
        subtitle: "مرتبة حسب المشاهدات والحفظ وأولوية التحرير.",
        mode: "automatic",
        count: 8,
        layout: "carousel",
        accent: "#D5E0E8",
        order: 4,
        config: {},
      },
      {
        id: "section_recent",
        type: "recent",
        title: "وصل حديثًا",
        subtitle: "أضيفت حديثًا إلى المكتبة.",
        mode: "automatic",
        count: 8,
        layout: "grid",
        accent: "#F4EFE6",
        order: 5,
        config: {},
      },
      {
        id: "section_picks",
        type: "picks",
        title: "اختيارات يراع",
        subtitle: "اختارها فريق يراع بهدوء.",
        mode: "automatic",
        count: 5,
        layout: "spotlight",
        accent: "#EEDCEE",
        order: 6,
        config: {},
      },
      {
        id: "section_featured",
        type: "featured",
        title: "قصص مميزة",
        subtitle: "قصص نضعها في الواجهة.",
        mode: "automatic",
        count: 4,
        layout: "grid",
        accent: "#F3E4E1",
        order: 7,
        config: {},
      },
      {
        id: "section_authors",
        type: "authors",
        title: "المؤلفون",
        subtitle: "من يكتب هذه القصص.",
        mode: "automatic",
        count: 5,
        layout: "grid",
        accent: "#D7E3D4",
        order: 8,
        config: {},
      },
    ];

    sections.forEach((section) => {
      db.prepare(
        `INSERT INTO homepage_sections
         (id, type, title, subtitle, enabled, sort_order, mode, item_count, layout, accent, category_id, config_json, visible_from, visible_until, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, NULL, ?, NULL, NULL, ?, ?)`,
      ).run(
        section.id,
        section.type,
        section.title,
        section.subtitle,
        section.order,
        section.mode,
        section.count,
        section.layout,
        section.accent || null,
        JSON.stringify(section.config),
        now,
        now,
      );
    });

    const settings: Record<string, string> = {
      seeded: "1",
      site_name: "يراع",
      site_description: "مكان مريح تكتشف فيه قصتك القادمة.",
      contact_email: "hello@yaraa.local",
      contact_note: "للاقتراحات والملاحظات",
      logo_id: "",
      seo_title: "يراع — اكتشاف القصص والروايات",
      seo_description: "يراع منصة عربية لاكتشاف القصص والروايات: تصنيفات واضحة، بحث سهل، ومختارات تساعدك على اختيار القصة التالية.",
      social_image_id: "",
      instagram: "",
      social_links: "[]",
      default_item_count: "12",
      density: "comfortable",
      view_weight: "1",
      favorite_weight: "4",
      priority_weight: "10",
      rec_w_category: "5",
      rec_w_tag: "3",
      rec_w_author: "4",
      rec_w_genre: "3",
      rec_w_age: "2",
      rec_w_popularity: "3",
      rec_w_recency: "2",
      rec_w_featured: "4",
      rec_w_priority: "3",
      recent_days: "45",
    };

    Object.entries(settings).forEach(([key, value]) => {
      db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(key, value);
    });

    db.prepare(
      `INSERT INTO activity (id, actor_id, action, entity_type, entity_id, summary, created_at)
       VALUES (?, NULL, 'seed', 'site', 'yaraa', 'أُضيف المحتوى التجريبي الأولي.', ?)`,
    ).run(crypto.randomUUID(), now);

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
